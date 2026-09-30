import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Palette, ROW, radius, spacing, useStyles, usePalette } from '@/constants/theme';
import { apartmentStatusColor, apartmentStatusLabel } from '@/constants/status';
import { money } from '@/lib/format';
import type { Apartment } from '@/types/domain';

const makeStyles = (c: Palette) => StyleSheet.create({
  card: { backgroundColor: c.surface, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: c.border, marginBottom: 10 },
  row: { flexDirection: ROW, justifyContent: 'space-between', gap: 10 },
  title: { fontSize: 16, fontWeight: '800', color: c.text, textAlign: 'right' },
  meta: { fontSize: 12, color: c.muted, textAlign: 'right', marginTop: 4 },
  due: { fontSize: 12, fontWeight: '800', textAlign: 'right', marginTop: 6 },
  badge: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' },
  badgeText: { fontWeight: '800', fontSize: 12 },
});

export function ApartmentCard({ apartment, onPress }: { apartment: Apartment; onPress: () => void }) {
  const s = useStyles(makeStyles);
  const c = usePalette();
  const color = apartmentStatusColor(apartment.status, c);
  const due = apartment.balance_due ?? 0;
  const overdue = apartment.overdue_amount ?? 0;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [s.card, pressed && { opacity: 0.8 }]}>
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>الدور {apartment.floor_number} — شقة {apartment.apartment_number}</Text>
          <Text style={s.meta}>{apartment.owner_name ? `المالك: ${apartment.owner_name}` : 'لا يوجد مالك مسجل'}</Text>
          {apartment.tenant_name ? <Text style={s.meta}>المستأجر: {apartment.tenant_name}</Text> : null}
          {due > 0 && (
            <Text style={[s.due, { color: overdue > 0 ? c.danger : c.warning }]}>
              مستحق {money(due)}{overdue > 0 ? ` (متأخر ${money(overdue)})` : ''}
            </Text>
          )}
        </View>
        <View style={[s.badge, { borderColor: color }]}>
          <Text style={[s.badgeText, { color }]}>{apartmentStatusLabel(apartment.status)}</Text>
        </View>
      </View>
    </Pressable>
  );
}
