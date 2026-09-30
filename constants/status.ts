import type { ApartmentStatus } from '@/types/domain';
import type { Palette } from './theme';

export const APARTMENT_STATUS_LABEL: Record<ApartmentStatus, string> = {
  ACTIVE: 'نشطة',
  OCCUPIED: 'مستخدمة',
  RENTED: 'مؤجرة',
  VACANT: 'شاغرة',
  CLOSED: 'مغلقة',
  MAINTENANCE: 'تحت الصيانة',
  TEMPORARILY_DISABLED: 'موقوفة مؤقتًا',
  ARCHIVED: 'مؤرشفة',
};

export function apartmentStatusLabel(status: string) {
  return APARTMENT_STATUS_LABEL[status as ApartmentStatus] ?? status;
}

export function apartmentStatusColor(status: string, c: Palette): string {
  switch (status) {
    case 'ACTIVE': return c.success;
    case 'OCCUPIED': return c.info;
    case 'RENTED': return c.primary;
    case 'VACANT': return c.warning;
    case 'CLOSED': return c.danger;
    case 'MAINTENANCE': return c.orange;
    case 'TEMPORARILY_DISABLED': return c.warning;
    default: return c.muted;
  }
}

/** حالات الاستحقاق/العمليات التي لا يُتوقع منها رصيد مستحق أو لا تقبل إجراءً إضافياً. */
export const TERMINAL_DUE_STATUSES = ['EXEMPT', 'CANCELLED', 'VOID', 'VOIDED', 'PAID'];
export const NON_COUNTED_DUE_STATUSES = ['EXEMPT', 'CANCELLED', 'VOID', 'VOIDED'];

export const DUE_STATUS_LABEL: Record<string, string> = {
  PENDING: 'مستحق',
  PARTIAL: 'مدفوع جزئيًا',
  PAID: 'مدفوع',
  OVERDUE: 'متأخر',
  EXEMPT: 'معفى',
  CANCELLED: 'ملغى',
  VOID: 'ملغى',
  VOIDED: 'ملغى',
};

export const ACTIVE_STATUS = 'ACTIVE';

export const PAYMENT_METHODS = [
  { value: 'CASH', label: 'نقدي' },
  { value: 'BANK_TRANSFER', label: 'تحويل بنكي' },
  { value: 'CHECK', label: 'شيك' },
];
