/** يُرمى عندما لا يطابق شكل البيانات القادمة من قاعدة البيانات العقد المتوقع. */
export class ContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContractError';
  }
}

type DbError = { code?: string; message?: string; details?: string; hint?: string };

export function errorMessage(e: unknown): string {
  if (e instanceof ContractError) return e.message;
  const err = (e ?? {}) as DbError;
  const msg = err.message ?? (e instanceof Error ? e.message : '');

  if (/network request failed|failed to fetch|timeout/i.test(msg)) {
    return 'تعذر الاتصال بالخادم. تحقق من الإنترنت وحاول مرة أخرى.';
  }
  if (err.code === 'PGRST202') {
    return 'دالة قاعدة البيانات غير موجودة أو اختلف توقيعها. راجع قسم عقد قاعدة البيانات في README.';
  }
  if (err.code === '42P01' || err.code === 'PGRST205') {
    return 'جدول أو عرض مطلوب غير موجود في قاعدة البيانات. راجع قسم عقد قاعدة البيانات في README.';
  }
  if (err.code === '42501' || /row-level security|permission denied/i.test(msg)) {
    return 'ليست لديك صلاحية لتنفيذ هذه العملية.';
  }
  // P0001 = RAISE EXCEPTION من دوال قاعدة البيانات؛ الرسالة تعبّر عن قاعدة عمل.
  if (err.code === 'P0001' && msg) return msg;
  if (err.code === '23514' || err.code === '23505' || err.code === '23503') {
    return `تم رفض العملية بسبب قيد في قاعدة البيانات${msg ? `: ${msg}` : '.'}`;
  }
  return msg || 'حدث خطأ غير متوقع.';
}
