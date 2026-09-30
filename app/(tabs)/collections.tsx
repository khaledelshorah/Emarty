import { useRef, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { Screen } from '@/components/Screen';
import { ApartmentPicker, Button, Card, Chips, Field, SectionTitle } from '@/components/ui';
import { Palette, useStyles } from '@/constants/theme';
import { PAYMENT_METHODS } from '@/constants/status';
import { generateMonthDues, recordPayment } from '@/lib/mutations';
import { errorMessage } from '@/lib/errors';
import { currentPeriod, isValidISODate, money, normalizeDateInput, parseAmount, todayISO } from '@/lib/format';

const makeStyles = (c: Palette) => StyleSheet.create({
  title: { fontSize: 28, fontWeight: '900', color: c.text, textAlign: 'right', marginBottom: 14 },
  text: { color: c.muted, textAlign: 'right', lineHeight: 23, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '700', color: c.text, marginBottom: 6, textAlign: 'right' },
  gap: { height: 12 },
});

export default function Collections() {
  const s = useStyles(makeStyles);
  const [apartment, setApartment] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<string>('CASH');
  const [paidAt, setPaidAt] = useState(todayISO());
  const [notes, setNotes] = useState('');
  const [period, setPeriod] = useState(currentPeriod());
  const busy = useRef(false);
  const [, force] = useState(0);

  async function guarded(fn: () => Promise<void>) {
    if (busy.current) return;
    busy.current = true; force((n) => n + 1);
    try { await fn(); } catch (e) { Alert.alert('تعذر تنفيذ العملية', errorMessage(e)); }
    finally { busy.current = false; force((n) => n + 1); }
  }

  function submitPayment() {
    const value = parseAmount(amount);
    if (apartment == null) return Alert.alert('بيانات ناقصة', 'اختر الشقة.');
    if (value == null) return Alert.alert('مبلغ غير صالح', 'أدخل مبلغًا أكبر من صفر بحد أقصى خانتين عشريتين.');
    if (!isValidISODate(paidAt)) return Alert.alert('تاريخ غير صالح', 'الصيغة المطلوبة YYYY-MM-DD.');
    const methodLabel = PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method;
    Alert.alert('تأكيد تسجيل الدفعة', `شقة ${apartment} — ${money(value)}\n${methodLabel} — ${normalizeDateInput(paidAt)}\n\nلا يمكن حذف الدفعة بعد تسجيلها، وتصحيحها يتم بالإلغاء مع ذكر السبب.`, [
      { text: 'تراجع', style: 'cancel' },
      {
        text: 'تسجيل',
        onPress: () => guarded(async () => {
          await recordPayment({ apartmentNumber: apartment, amount: value, paymentMethod: method, paidAt, notes });
          setAmount(''); setNotes('');
          Alert.alert('تم', 'سُجلت الدفعة وتحدّث رصيد الصندوق.');
        }),
      },
    ]);
  }

  function submitDues() {
    Alert.alert('توليد استحقاقات الشهر', `سيتم توليد استحقاقات شهر ${period} لكل الشقق المؤهلة. هل تريد المتابعة؟`, [
      { text: 'تراجع', style: 'cancel' },
      {
        text: 'توليد',
        onPress: () => guarded(async () => {
          await generateMonthDues(period);
          Alert.alert('تم', 'تم توليد الاستحقاقات.');
        }),
      },
    ]);
  }

  return (
    <Screen>
      <Text style={s.title}>التحصيل</Text>
      <Card>
        <SectionTitle>تسجيل دفعة</SectionTitle>
        <ApartmentPicker value={apartment} onChange={setApartment} />
        <Field label="المبلغ (ج.م)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" ltr placeholder="0.00" />
        <Text style={s.label}>طريقة الدفع</Text>
        <Chips options={PAYMENT_METHODS} value={method} onChange={setMethod} />
        <Text style={s.gap} />
        <Field label="تاريخ الدفع" value={paidAt} onChangeText={setPaidAt} keyboardType="numbers-and-punctuation" ltr placeholder="YYYY-MM-DD" />
        <Field label="ملاحظات (اختياري)" value={notes} onChangeText={setNotes} multiline />
        <Button title={busy.current ? 'جارٍ التسجيل…' : 'تسجيل الدفعة'} disabled={busy.current} onPress={submitPayment} />
      </Card>

      <Card>
        <SectionTitle>استحقاقات الشهر</SectionTitle>
        <Text style={s.text}>توليد الاستحقاقات يتم داخل قاعدة البيانات بعملية واحدة ذرّية.</Text>
        <Field label="الشهر" value={period} onChangeText={setPeriod} keyboardType="numbers-and-punctuation" ltr placeholder="YYYY-MM" />
        <Button title="توليد استحقاقات الشهر" variant="secondary" disabled={busy.current} onPress={submitDues} />
      </Card>
    </Screen>
  );
}
