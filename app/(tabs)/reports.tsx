import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card } from '@/components/ui';
import { Palette, ROW, useStyles } from '@/constants/theme';

const reports = ['صندوق العمارة', 'المتأخرات', 'الإعفاءات', 'تقرير حسب الدور', 'سجل العمليات', 'التقرير المالي الشهري', 'المصروفات', 'الإيرادات', 'التحصيلات', 'الإيجارات', 'الاشتراكات', 'الصيانة', 'الشقق المغلقة', 'الشقق الشاغرة', 'العمليات الملغاة', 'كشف حساب شقة', 'التقرير السنوي'];

const makeStyles = (c: Palette) => StyleSheet.create({
  title: { fontSize: 28, fontWeight: '900', color: c.text, textAlign: 'right', marginBottom: 6 },
  sub: { color: c.muted, textAlign: 'right', marginBottom: 14 },
  row: { flexDirection: ROW, justifyContent: 'space-between', alignItems: 'center' },
  num: { color: c.primary, fontWeight: '900' },
  name: { fontSize: 16, fontWeight: '800', color: c.text, textAlign: 'right' },
  soon: { fontSize: 12, color: c.muted },
});

export default function Reports() {
  const s = useStyles(makeStyles);
  return (
    <Screen>
      <Text style={s.title}>التقارير</Text>
      <Text style={s.sub}>قائمة التقارير المخططة. كشف حساب الشقة متاح من شاشة الشقة.</Text>
      {reports.map((r, i) => (
        <Card key={r}>
          <View style={s.row}>
            <Text style={s.num}>{(i + 1).toLocaleString('ar-EG')}</Text>
            <Text style={s.name}>{r}</Text>
            <Text style={s.soon}>قريبًا</Text>
          </View>
        </Card>
      ))}
    </Screen>
  );
}
