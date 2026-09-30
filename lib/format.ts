export function money(value: number | null | undefined) {
  return new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 2 }).format(value ?? 0) + ' ج.م';
}

export function dateTime(value?: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function dateOnly(value?: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' }).format(new Date(value));
}

export function monthLabel(date = new Date()) {
  return new Intl.DateTimeFormat('ar-EG', { month: 'long', year: 'numeric' }).format(date);
}

/** يحوّل الأرقام العربية/الفارسية وفواصلها إلى صيغة يفهمها JavaScript. */
export function normalizeDigits(input: string) {
  return input
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٫]/g, '.')
    .replace(/[٬،,]/g, '');
}

/** مبلغ موجب بحد أقصى خانتين عشريتين، وإلا null. */
export function parseAmount(input: string): number | null {
  const s = normalizeDigits(input).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const v = Number(s);
  return Number.isFinite(v) && v > 0 ? v : null;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** تاريخ اليوم بالتوقيت المحلي (وليس UTC) بصيغة YYYY-MM-DD. */
export function todayISO(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** الشهر الحالي بالتوقيت المحلي بصيغة YYYY-MM. */
export function currentPeriod(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

/** بداية الشهر وبداية الشهر التالي (لاستعلامات gte / lt). */
export function monthRange(d = new Date()) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return { start: todayISO(start), next: todayISO(next) };
}

export function normalizeDateInput(input: string) {
  return normalizeDigits(input).trim();
}

export function isValidISODate(input: string) {
  const s = normalizeDateInput(input);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

export function isValidPeriod(input: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(normalizeDigits(input).trim());
}

export function greeting(d = new Date()) {
  return d.getHours() < 12 ? 'صباح الخير' : 'مساء الخير';
}
