import { supabase } from './supabase';
import { isValidISODate, isValidPeriod, normalizeDateInput, normalizeDigits } from './format';

/**
 * كل العمليات المالية تمر عبر دوال Postgres (RPC) فقط، ولا يوجد أي حذف.
 * التصحيح يتم بالإلغاء (void) أو الإعفاء (exempt) مع سبب إجباري.
 * تحققات العميل هنا للتجربة الأفضل فقط؛ الحماية الفعلية في قاعدة البيانات.
 */

function assertAmount(amount: number, what: string) {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error(`يجب أن يكون مبلغ ${what} أكبر من صفر.`);
  if (Math.round(amount * 100) !== amount * 100 && Math.abs(Math.round(amount * 100) - amount * 100) > 1e-6) {
    throw new Error('المبلغ يقبل خانتين عشريتين كحد أقصى.');
  }
}

function assertApartment(n: number) {
  if (!Number.isInteger(n) || n < 1 || n > 12) throw new Error('رقم الشقة يجب أن يكون من 1 إلى 12.');
}

function assertDate(value: string, what = 'التاريخ') {
  if (!isValidISODate(value)) throw new Error(`${what} غير صالح. الصيغة المطلوبة YYYY-MM-DD.`);
}

function requireReason(reason: string, message = 'السبب إجباري.') {
  const r = reason.trim();
  if (!r) throw new Error(message);
  return r;
}

export async function recordPayment(input: {
  apartmentNumber: number;
  amount: number;
  paymentMethod: string;
  paidAt: string;
  notes?: string;
}) {
  assertApartment(input.apartmentNumber);
  assertAmount(input.amount, 'الدفعة');
  assertDate(input.paidAt, 'تاريخ الدفع');
  const { data, error } = await supabase.rpc('record_payment', {
    p_apartment_number: input.apartmentNumber,
    p_amount: input.amount,
    p_payment_method: input.paymentMethod,
    p_paid_at: normalizeDateInput(input.paidAt),
    p_notes: input.notes?.trim() || null,
  });
  if (error) throw error;
  return data;
}

export async function voidPayment(paymentId: string, reason: string) {
  const { data, error } = await supabase.rpc('void_payment', {
    p_payment_id: paymentId,
    p_reason: requireReason(reason, 'سبب الإلغاء إجباري.'),
  });
  if (error) throw error;
  return data;
}

export async function recordExpense(input: {
  categoryId: string;
  description: string;
  amount: number;
  expenseDate: string;
  supplier?: string;
  paymentMethod: string;
  invoiceNumber?: string;
  apartmentNumber?: number | null;
}) {
  if (!input.categoryId) throw new Error('اختر تصنيف المصروف.');
  if (!input.description.trim()) throw new Error('وصف المصروف إجباري.');
  assertAmount(input.amount, 'المصروف');
  assertDate(input.expenseDate, 'تاريخ المصروف');
  if (input.apartmentNumber != null) assertApartment(input.apartmentNumber);
  const { data, error } = await supabase.rpc('record_expense', {
    p_category_id: input.categoryId,
    p_description: input.description.trim(),
    p_amount: input.amount,
    p_expense_date: normalizeDateInput(input.expenseDate),
    p_supplier: input.supplier?.trim() || null,
    p_payment_method: input.paymentMethod,
    p_invoice_number: input.invoiceNumber?.trim() || null,
    p_apartment_number: input.apartmentNumber ?? null,
  });
  if (error) throw error;
  return data;
}

export async function voidExpense(expenseId: string, reason: string) {
  const { data, error } = await supabase.rpc('void_expense', {
    p_expense_id: expenseId,
    p_reason: requireReason(reason, 'سبب الإلغاء إجباري.'),
  });
  if (error) throw error;
  return data;
}

/** period بصيغة YYYY-MM */
export async function generateMonthDues(period: string) {
  const p = normalizeDigits(period).trim();
  if (!isValidPeriod(p)) throw new Error('الشهر غير صالح. الصيغة المطلوبة YYYY-MM.');
  const { data, error } = await supabase.rpc('generate_month_dues', { p_period: `${p}-01` });
  if (error) throw error;
  return data;
}

export async function setDueStatus(dueId: string, status: 'EXEMPT' | 'CANCELLED', reason: string) {
  const { data, error } = await supabase.rpc('set_due_status', {
    p_due_id: dueId,
    p_status: status,
    p_reason: requireReason(reason),
  });
  if (error) throw error;
  return data;
}

export async function closeApartment(apartmentNumber: number, closedAt: string, reason: string) {
  assertApartment(apartmentNumber);
  assertDate(closedAt, 'تاريخ الإغلاق');
  const { data, error } = await supabase.rpc('close_apartment', {
    p_apartment_number: apartmentNumber,
    p_closed_at: normalizeDateInput(closedAt),
    p_reason: requireReason(reason, 'سبب الإغلاق إجباري.'),
  });
  if (error) throw error;
  return data;
}

export async function reopenApartment(apartmentNumber: number, reopenedAt: string, usageType: string, retroactive = false) {
  assertApartment(apartmentNumber);
  assertDate(reopenedAt, 'تاريخ إعادة الفتح');
  const { data, error } = await supabase.rpc('reopen_apartment', {
    p_apartment_number: apartmentNumber,
    p_reopened_at: normalizeDateInput(reopenedAt),
    p_usage_type: usageType,
    p_create_retroactive_dues: retroactive,
  });
  if (error) throw error;
  return data;
}
