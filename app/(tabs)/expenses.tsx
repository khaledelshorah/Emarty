import { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { ActionModal, ApartmentPicker, Banner, Button, Card, Chips, EmptyText, Field, Loading, SectionTitle } from '@/components/ui';
import { Palette, ROW, useStyles } from '@/constants/theme';
import { ACTIVE_STATUS, PAYMENT_METHODS } from '@/constants/status';
import { getExpenseCategories, getRecentExpenses } from '@/lib/api';
import { recordExpense, voidExpense } from '@/lib/mutations';
import { errorMessage } from '@/lib/errors';
import { dateOnly, isValidISODate, money, parseAmount, todayISO } from '@/lib/format';
import { useFocusLoad } from '@/hooks/useFocusLoad';
import type { ExpenseRow } from '@/types/domain';

const makeStyles = (c: Palette) => StyleSheet.create({
  title: { fontSize: 28, fontWeight: '900', color: c.text, textAlign: 'right', marginBottom: 14 },
  label: { fontSize: 14, fontWeight: '700', color: c.text, marginBottom: 6, textAlign: 'right' },
  gap: { height: 12 },
  item: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.border },
  itemTop: { flexDirection: ROW, justifyContent: 'space-between', gap: 10 },
  itemTitle: { flex: 1, color: c.text, fontWeight: '800', textAlign: 'right' },
  itemAmount: { color: c.text, fontWeight: '900' },
  voided: { color: c.muted, textDecorationLine: 'line-through' },
  meta: { color: c.muted, fontSize: 12, textAlign: 'right', marginTop: 3 },
  actions: { flexDirection: ROW, marginTop: 8 },
});

export default function Expenses() {
  const s = useStyles(makeStyles);
  const cats = useFocusLoad(getExpenseCategories);
  const list = useFocusLoad(getRecentExpenses);

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [supplier, setSupplier] = useState('');
  const [invoice, setInvoice] = useState('');
  const [method, setMethod] = useState('CASH');
  const [apartment, setApartment] = useState<number | null>(null);
  const [voiding, setVoiding] = useState<ExpenseRow | null>(null);
  const busy = useRef(false);
  const [, force] = useState(0);

  function submit() {
    const value = parseAmount(amount);
    if (!categoryId) return Alert.alert('بيانات ناقصة', 'اختر تصنيف المصروف.');
    if (!description.trim()) return Alert.alert('بيانات ناقصة', 'اكتب وصف المصروف.');
    if (value == null) return Alert.alert('مبلغ غير صالح', 'أدخل مبلغًا أكبر من صفر بحد أقصى خانتين عشريتين.');
    if (!isValidISODate(date)) return Alert.alert('تاريخ غير صالح', 'الصيغة المطلوبة YYYY-MM-DD.');
    Alert.alert('تأكيد تسجيل المصروف', `${description.trim()} — ${money(value)}\n\nلا يمكن حذف المصروف بعد تسجيله، وتصحيحه يتم بالإلغاء مع ذكر السبب.`, [
      { text: 'تراجع', style: 'cancel' },
      {
        text: 'تسجيل',
        onPress: async () => {
          if (busy.current) return;
          busy.current = true; force((n) => n + 1);
          try {
            await recordExpense({
              categoryId, description, amount: value, expenseDate: date, supplier,
              paymentMethod: method, invoiceNumber: invoice, apartmentNumber: apartment,
            });
            setDescription(''); setAmount(''); setSupplier(''); setInvoice(''); setApartment(null);
            await list.reload();
            Alert.alert('تم', 'سُجل المصروف وتحدّث رصيد الصندوق.');
          } catch (e) {
            Alert.alert('تعذر تسجيل المصروف', errorMessage(e));
          } finally { busy.current = false; force((n) => n + 1); }
        },
      },
    ]);
  }

  if (!cats.data && !cats.error) return <Loading />;

  return (
    <Screen refreshing={list.refreshing} onRefresh={() => { cats.refresh(); list.refresh(); }}>
      <Text style={s.title}>المصروفات</Text>

      <Card>
        <SectionTitle>إضافة مصروف</SectionTitle>
        {cats.error && <Banner tone="danger" onRetry={cats.reload}>{cats.error}</Banner>}
        <Text style={s.label}>التصنيف</Text>
        <Chips options={(cats.data ?? []).map((c) => ({ value: c.id, label: c.name }))} value={categoryId} onChange={setCategoryId} />
        <Text style={s.gap} />
        <Field label="الوصف" value={description} onChangeText={setDescription} />
        <Field label="المبلغ (ج.م)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" ltr placeholder="0.00" />
        <Field label="تاريخ المصروف" value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" ltr placeholder="YYYY-MM-DD" />
        <Text style={s.label}>طريقة الدفع</Text>
        <Chips options={PAYMENT_METHODS} value={method} onChange={setMethod} />
        <Text style={s.gap} />
        <Field label="المورّد (اختياري)" value={supplier} onChangeText={setSupplier} />
        <Field label="رقم الفاتورة (اختياري)" value={invoice} onChangeText={setInvoice} ltr />
        <ApartmentPicker label="شقة مرتبطة (اختياري — اتركها فارغة لمصروف عام)" value={apartment} onChange={(n) => setApartment(n === apartment ? null : n)} />
        <Button title={busy.current ? 'جارٍ التسجيل…' : 'تسجيل المصروف'} disabled={busy.current || !cats.data} onPress={submit} />
      </Card>

      <SectionTitle>آخر المصروفات</SectionTitle>
      <Card>
        {list.error && <Banner tone="danger" onRetry={list.reload}>{list.error}</Banner>}
        {(list.data ?? []).map((e) => {
          const active = e.status === ACTIVE_STATUS;
          return (
            <View key={e.id} style={s.item}>
              <View style={s.itemTop}>
                <Text style={[s.itemTitle, !active && s.voided]}>{e.description || 'بدون وصف'}</Text>
                <Text style={[s.itemAmount, !active && s.voided]}>{money(e.amount)}</Text>
              </View>
              <Text style={s.meta}>{dateOnly(e.date)}{e.supplier ? ` — ${e.supplier}` : ''}{!active ? ' — ملغى' : ''}</Text>
              {active && (
                <View style={s.actions}>
                  <Button title="إلغاء المصروف" variant="secondary" small onPress={() => setVoiding(e)} />
                </View>
              )}
            </View>
          );
        })}
        {list.data && list.data.length === 0 && <EmptyText>لا توجد مصروفات مسجلة.</EmptyText>}
      </Card>

      <ActionModal
        visible={!!voiding}
        title="إلغاء المصروف"
        description={voiding ? `${voiding.description} — ${money(voiding.amount)}. سيبقى المصروف ظاهرًا في السجل كملغى، ويُعاد احتساب رصيد الصندوق.` : undefined}
        confirmLabel="إلغاء المصروف"
        tone="danger"
        reasonLabel="سبب الإلغاء"
        onCancel={() => setVoiding(null)}
        onConfirm={async ({ reason }) => { await voidExpense(voiding!.id, reason); await list.reload(); }}
      />
    </Screen>
  );
}
