import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ActionModal, Banner, Button, Card, Chips, EmptyText, Loading, SectionTitle } from '@/components/ui';
import { Palette, ROW, useStyles, usePalette } from '@/constants/theme';
import {
  ACTIVE_STATUS, DUE_STATUS_LABEL, PAYMENT_METHODS, TERMINAL_DUE_STATUSES, NON_COUNTED_DUE_STATUSES,
  apartmentStatusColor, apartmentStatusLabel,
} from '@/constants/status';
import { getApartmentDetail } from '@/lib/api';
import { closeApartment, reopenApartment, setDueStatus, voidPayment } from '@/lib/mutations';
import { dateOnly, money, monthLabel } from '@/lib/format';
import { useFocusLoad } from '@/hooks/useFocusLoad';
import type { DueRow, PaymentRow } from '@/types/domain';

const makeStyles = (c: Palette) => StyleSheet.create({
  title: { fontSize: 27, fontWeight: '900', color: c.text, textAlign: 'right', marginBottom: 6 },
  badge: { alignSelf: 'flex-end', borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 14 },
  badgeText: { fontWeight: '800', fontSize: 12 },
  meta: { color: c.muted, textAlign: 'right', marginTop: 4 },
  sumRow: { flexDirection: ROW, justifyContent: 'space-between', paddingVertical: 6 },
  sumLabel: { color: c.muted },
  sumValue: { color: c.text, fontWeight: '900' },
  item: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border },
  itemTop: { flexDirection: ROW, justifyContent: 'space-between', gap: 10 },
  itemTitle: { flex: 1, color: c.text, fontWeight: '800', textAlign: 'right' },
  itemAmount: { color: c.text, fontWeight: '900' },
  voided: { color: c.muted, textDecorationLine: 'line-through' },
  itemMeta: { color: c.muted, fontSize: 12, textAlign: 'right', marginTop: 3 },
  actions: { flexDirection: ROW, gap: 8, marginTop: 8 },
  gap: { height: 12 },
  label: { fontSize: 14, fontWeight: '700', color: c.text, marginBottom: 6, textAlign: 'right' },
});

const USAGE_OPTIONS = [
  { value: 'OCCUPIED', label: 'مستخدمة' },
  { value: 'RENTED', label: 'مؤجرة' },
  { value: 'VACANT', label: 'شاغرة' },
];
const RETRO_OPTIONS = [
  { value: 'no', label: 'بدون استحقاقات بأثر رجعي' },
  { value: 'yes', label: 'مع استحقاقات بأثر رجعي' },
];

type Modal =
  | { kind: 'due'; due: DueRow; status: 'EXEMPT' | 'CANCELLED' }
  | { kind: 'payment'; payment: PaymentRow }
  | { kind: 'close' }
  | { kind: 'reopen' }
  | null;

export default function ApartmentDetails() {
  const s = useStyles(makeStyles);
  const c = usePalette();
  const { id } = useLocalSearchParams<{ id: string }>();
  const n = Number(id);
  const valid = Number.isInteger(n) && n >= 1 && n <= 12;

  const { data, error, refreshing, refresh, reload } = useFocusLoad(() => getApartmentDetail(n));
  const [modal, setModal] = useState<Modal>(null);
  const [usage, setUsage] = useState('OCCUPIED');
  const [retro, setRetro] = useState('no');

  if (!valid) {
    return (
      <Screen>
        <Banner tone="danger">رقم الشقة غير صالح. الشقق من 1 إلى 12 فقط.</Banner>
        <Button title="العودة للشقق" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }
  if (!data && !error) return <Loading />;

  const apt = data?.apartment;
  const countedDues = (data?.dues ?? []).filter((d) => !NON_COUNTED_DUE_STATUSES.includes(d.status));
  const balance = countedDues.reduce((sum, d) => sum + d.remaining, 0);
  const overdue = countedDues.filter((d) => d.is_overdue).reduce((sum, d) => sum + d.remaining, 0);
  const isClosed = apt?.status === 'CLOSED';

  const modalTitle =
    modal?.kind === 'due' ? (modal.status === 'EXEMPT' ? 'إعفاء الاستحقاق' : 'إلغاء الاستحقاق')
    : modal?.kind === 'payment' ? 'إلغاء الدفعة'
    : modal?.kind === 'close' ? 'إغلاق الشقة'
    : 'إعادة فتح الشقة';

  const modalDescription =
    modal?.kind === 'due' ? `${monthLabel(new Date(modal.due.period))} — ${money(modal.due.amount)}. يبقى الاستحقاق ظاهرًا في السجل مع السبب والتاريخ.`
    : modal?.kind === 'payment' ? `${money(modal.payment.amount)} بتاريخ ${dateOnly(modal.payment.paid_at)}. تبقى الدفعة ظاهرة كملغاة ويُعاد احتساب الصندوق وكشف الحساب.`
    : modal?.kind === 'close' ? 'يتوقف توليد الاستحقاقات للشقة من تاريخ الإغلاق. لا تُحذف أي بيانات مالية.'
    : 'اختر نوع الاستخدام وتاريخ إعادة الفتح.';

  async function confirm({ reason, date }: { reason: string; date: string }) {
    if (!modal) return;
    if (modal.kind === 'due') await setDueStatus(modal.due.due_id, modal.status, reason);
    else if (modal.kind === 'payment') await voidPayment(modal.payment.id, reason);
    else if (modal.kind === 'close') await closeApartment(n, date, reason);
    else await reopenApartment(n, date, usage, retro === 'yes');
    await reload();
  }

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Text style={s.title}>الدور {n} — شقة {n}</Text>
      {apt && (
        <View style={[s.badge, { borderColor: apartmentStatusColor(apt.status, c) }]}>
          <Text style={[s.badgeText, { color: apartmentStatusColor(apt.status, c) }]}>{apartmentStatusLabel(apt.status)}</Text>
        </View>
      )}
      {error && <Banner tone="danger" onRetry={reload}>{error}</Banner>}

      {apt && (
        <>
          <Card>
            <Text style={s.meta}>{apt.owner_name ? `المالك: ${apt.owner_name}` : 'لا يوجد مالك مسجل'}</Text>
            {apt.tenant_name ? <Text style={s.meta}>المستأجر: {apt.tenant_name}</Text> : null}
          </Card>

          <Card>
            <SectionTitle>كشف الحساب</SectionTitle>
            <View style={s.sumRow}><Text style={s.sumValue}>{money(balance)}</Text><Text style={s.sumLabel}>إجمالي المستحق</Text></View>
            <View style={s.sumRow}><Text style={[s.sumValue, overdue > 0 && { color: c.danger }]}>{money(overdue)}</Text><Text style={s.sumLabel}>المتأخر</Text></View>
          </Card>

          <SectionTitle>الاستحقاقات</SectionTitle>
          <Card>
            {data!.dues.map((d) => {
              const actionable = !TERMINAL_DUE_STATUSES.includes(d.status);
              const dead = NON_COUNTED_DUE_STATUSES.includes(d.status);
              return (
                <View key={d.due_id} style={s.item}>
                  <View style={s.itemTop}>
                    <Text style={[s.itemTitle, dead && s.voided]}>{monthLabel(new Date(d.period))}</Text>
                    <Text style={[s.itemAmount, dead && s.voided]}>{money(d.amount)}</Text>
                  </View>
                  <Text style={s.itemMeta}>
                    {DUE_STATUS_LABEL[d.status] ?? d.status} — مدفوع {money(d.paid_amount)} — متبقٍ {money(d.remaining)}{d.is_overdue ? ' — متأخر' : ''}
                  </Text>
                  {actionable && (
                    <View style={s.actions}>
                      <Button title="إعفاء" variant="secondary" small onPress={() => setModal({ kind: 'due', due: d, status: 'EXEMPT' })} />
                      <Button title="إلغاء" variant="secondary" small onPress={() => setModal({ kind: 'due', due: d, status: 'CANCELLED' })} />
                    </View>
                  )}
                </View>
              );
            })}
            {data!.dues.length === 0 && <EmptyText>لا توجد استحقاقات لهذه الشقة بعد.</EmptyText>}
          </Card>

          <SectionTitle>آخر الدفعات</SectionTitle>
          <Card>
            {data!.payments.map((p) => {
              const active = p.status === ACTIVE_STATUS;
              const methodLabel = PAYMENT_METHODS.find((m) => m.value === p.payment_method)?.label;
              return (
                <View key={p.id} style={s.item}>
                  <View style={s.itemTop}>
                    <Text style={[s.itemTitle, !active && s.voided]}>{dateOnly(p.paid_at)}</Text>
                    <Text style={[s.itemAmount, !active && s.voided]}>{money(p.amount)}</Text>
                  </View>
                  <Text style={s.itemMeta}>{methodLabel ?? p.payment_method ?? '—'}{p.notes ? ` — ${p.notes}` : ''}{!active ? ' — ملغاة' : ''}</Text>
                  {active && (
                    <View style={s.actions}>
                      <Button title="إلغاء الدفعة" variant="secondary" small onPress={() => setModal({ kind: 'payment', payment: p })} />
                    </View>
                  )}
                </View>
              );
            })}
            {data!.payments.length === 0 && <EmptyText>لا توجد دفعات مسجلة.</EmptyText>}
          </Card>

          <SectionTitle>إجراءات</SectionTitle>
          {isClosed
            ? <Button title="إعادة فتح الشقة" onPress={() => setModal({ kind: 'reopen' })} />
            : <Button title="إغلاق الشقة" variant="danger" onPress={() => setModal({ kind: 'close' })} />}
        </>
      )}
      <Button title="العودة للشقق" variant="secondary" onPress={() => router.back()} />

      <ActionModal
        visible={!!modal}
        title={modalTitle}
        description={modalDescription}
        confirmLabel={modal?.kind === 'reopen' ? 'إعادة الفتح' : modal?.kind === 'close' ? 'إغلاق الشقة' : modal?.kind === 'due' && modal.status === 'EXEMPT' ? 'إعفاء' : 'إلغاء'}
        tone={modal?.kind === 'reopen' ? 'primary' : 'danger'}
        requireReason={modal?.kind !== 'reopen'}
        reasonLabel={modal?.kind === 'close' ? 'سبب الإغلاق' : 'السبب'}
        showDate={modal?.kind === 'close' || modal?.kind === 'reopen'}
        dateLabel={modal?.kind === 'close' ? 'تاريخ الإغلاق' : 'تاريخ إعادة الفتح'}
        onCancel={() => setModal(null)}
        onConfirm={confirm}
      >
        {modal?.kind === 'reopen' && (
          <>
            <Text style={s.label}>نوع الاستخدام</Text>
            <Chips options={USAGE_OPTIONS} value={usage} onChange={setUsage} />
            <View style={s.gap} />
            <Chips options={RETRO_OPTIONS} value={retro} onChange={setRetro} />
            <View style={s.gap} />
          </>
        )}
      </ActionModal>
    </Screen>
  );
}
