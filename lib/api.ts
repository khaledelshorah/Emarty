import { supabase } from './supabase';
import { ContractError } from './errors';
import { monthRange } from './format';
import { ACTIVE_STATUS, NON_COUNTED_DUE_STATUSES } from '@/constants/status';
import type {
  Apartment, ApartmentDetail, DashboardStats, DueRow, ExpenseCategory, ExpenseRow, PaymentRow,
} from '@/types/domain';

type Raw = Record<string, any>;

/** يقرأ أول عمود موجود من القائمة. غيابه تماماً = اختلاف في العقد، فنرفض بدل عرض صفر مضلل. */
function pick(row: Raw, keys: string[], where: string): any {
  for (const k of keys) if (k in row) return row[k];
  throw new ContractError(`العمود ${keys[0]} غير موجود في ${where}. راجع عقد قاعدة البيانات في README.`);
}

const num = (v: unknown) => Number(v ?? 0);
const one = (rel: any) => (Array.isArray(rel) ? rel[0] : rel) ?? null;

function toDue(r: Raw): DueRow {
  const where = 'v_due_balances';
  return {
    due_id: String(pick(r, ['due_id', 'id'], where)),
    apartment_number: num(pick(r, ['apartment_number'], where)),
    period: String(pick(r, ['period'], where)),
    amount: num(pick(r, ['amount', 'total_amount', 'due_amount'], where)),
    paid_amount: num(pick(r, ['paid_amount'], where)),
    remaining: num(pick(r, ['remaining'], where)),
    status: String(pick(r, ['status'], where)),
    is_overdue: Boolean(r.is_overdue),
  };
}

function toPayment(r: Raw): PaymentRow {
  const where = 'payments';
  return {
    id: String(pick(r, ['id'], where)),
    apartment_number: num(pick(r, ['apartment_number'], where)),
    amount: num(pick(r, ['amount'], where)),
    paid_at: String(pick(r, ['paid_at'], where)),
    payment_method: r.payment_method ?? null,
    status: String(pick(r, ['status'], where)),
    notes: r.notes ?? null,
  };
}

function toExpense(r: Raw): ExpenseRow {
  const where = 'expenses';
  return {
    id: String(pick(r, ['id'], where)),
    description: String(r.description ?? ''),
    amount: num(pick(r, ['amount'], where)),
    date: String(pick(r, ['date', 'expense_date'], where)),
    supplier: r.supplier ?? null,
    status: String(pick(r, ['status'], where)),
    apartment_number: r.apartment_number ?? null,
  };
}

/** قاعدة العمارة: 12 دوراً فقط، شقة واحدة لكل دور، رقم الشقة = رقم الدور. */
export function checkBuildingIntegrity(apts: { apartment_number: number; floor_number: number }[]): string[] {
  const issues: string[] = [];
  if (apts.length !== 12) issues.push(`عدد الشقق ${apts.length} بدل 12.`);
  const seen = new Set<number>();
  for (const a of apts) {
    if (a.apartment_number < 1 || a.apartment_number > 12) issues.push(`الشقة رقم ${a.apartment_number} خارج النطاق 1–12.`);
    if (seen.has(a.apartment_number)) issues.push(`الشقة رقم ${a.apartment_number} مكررة.`);
    seen.add(a.apartment_number);
    if (a.floor_number !== a.apartment_number) issues.push(`الشقة ${a.apartment_number} في الدور ${a.floor_number} (يجب أن يتطابقا).`);
  }
  for (let n = 1; n <= 12; n++) if (!seen.has(n)) issues.push(`الشقة رقم ${n} غير موجودة.`);
  return Array.from(new Set(issues));
}

export async function getApartments(): Promise<Apartment[]> {
  const [aptRes, dueRes] = await Promise.all([
    supabase
      .from('apartments')
      .select('apartment_number,floor_number,status,owners(full_name),tenants(full_name)')
      .order('apartment_number', { ascending: true }),
    supabase.from('v_due_balances').select('*'),
  ]);
  if (aptRes.error) throw aptRes.error;
  if (dueRes.error) throw dueRes.error;

  const totals = new Map<number, { balance: number; overdue: number }>();
  for (const d of (dueRes.data ?? []).map(toDue)) {
    if (NON_COUNTED_DUE_STATUSES.includes(d.status)) continue;
    const t = totals.get(d.apartment_number) ?? { balance: 0, overdue: 0 };
    t.balance += d.remaining;
    if (d.is_overdue) t.overdue += d.remaining;
    totals.set(d.apartment_number, t);
  }

  return (aptRes.data ?? []).map((row: Raw) => ({
    apartment_number: row.apartment_number,
    floor_number: row.floor_number,
    status: row.status,
    owner_name: one(row.owners)?.full_name ?? null,
    tenant_name: one(row.tenants)?.full_name ?? null,
    balance_due: totals.get(row.apartment_number)?.balance ?? 0,
    overdue_amount: totals.get(row.apartment_number)?.overdue ?? 0,
  }));
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { start, next } = monthRange();
  const [fund, dues, apartments, expenses, payments] = await Promise.all([
    supabase.from('v_fund_balance').select('*').maybeSingle(),
    supabase.from('v_due_balances').select('*'),
    supabase.from('apartments').select('apartment_number,floor_number,status'),
    supabase.from('expenses').select('amount').eq('status', ACTIVE_STATUS).gte('date', start).lt('date', next),
    supabase.from('payments').select('amount').eq('status', ACTIVE_STATUS).gte('paid_at', start).lt('paid_at', next),
  ]);
  // أي خطأ يوقف العرض بالكامل: عرض صفر بدل الخطأ في بيانات مالية أسوأ من عدم العرض.
  for (const r of [fund, dues, apartments, expenses, payments]) if (r.error) throw r.error;

  let fundBalance = 0;
  if (fund.data) {
    fundBalance = num(pick(fund.data as Raw, ['balance', 'fund_balance'], 'v_fund_balance'));
  }

  const overdue = (dues.data ?? [])
    .map(toDue)
    .filter((d) => !NON_COUNTED_DUE_STATUSES.includes(d.status) && d.is_overdue)
    .reduce((s, d) => s + d.remaining, 0);

  const apts = (apartments.data ?? []) as Raw[];
  const statusCounts = apts.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    fundBalance,
    monthCollections: (payments.data ?? []).reduce((s: number, p: Raw) => s + num(p.amount), 0),
    monthExpenses: (expenses.data ?? []).reduce((s: number, e: Raw) => s + num(e.amount), 0),
    overdue,
    statusCounts,
    integrityIssues: checkBuildingIntegrity(apts as any),
  };
}

export async function getApartmentDetail(apartmentNumber: number): Promise<ApartmentDetail> {
  const [apt, dues, payments] = await Promise.all([
    supabase
      .from('apartments')
      .select('apartment_number,floor_number,status,owners(full_name),tenants(full_name)')
      .eq('apartment_number', apartmentNumber)
      .maybeSingle(),
    supabase.from('v_due_balances').select('*').eq('apartment_number', apartmentNumber).order('period', { ascending: false }),
    supabase.from('payments').select('*').eq('apartment_number', apartmentNumber).order('paid_at', { ascending: false }).limit(50),
  ]);
  if (apt.error) throw apt.error;
  if (dues.error) throw dues.error;
  if (payments.error) throw payments.error;
  if (!apt.data) throw new ContractError(`الشقة رقم ${apartmentNumber} غير موجودة.`);

  const row = apt.data as Raw;
  return {
    apartment: {
      apartment_number: row.apartment_number,
      floor_number: row.floor_number,
      status: row.status,
      owner_name: one(row.owners)?.full_name ?? null,
      tenant_name: one(row.tenants)?.full_name ?? null,
    },
    dues: (dues.data ?? []).map(toDue),
    payments: (payments.data ?? []).map(toPayment),
  };
}

export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  const { data, error } = await supabase.from('expense_categories').select('id,name').order('name');
  if (error) throw error;
  return (data ?? []).map((r: Raw) => ({ id: String(r.id), name: String(r.name) }));
}

export async function getRecentExpenses(): Promise<ExpenseRow[]> {
  const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false }).limit(30);
  if (error) throw error;
  return (data ?? []).map(toExpense);
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email: email.trim(), password });
}

export async function signOut() {
  return supabase.auth.signOut();
}
