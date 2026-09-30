import { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ApartmentCard } from '@/components/ApartmentCard';
import { Banner, EmptyText, Loading } from '@/components/ui';
import { Palette, radius, useStyles, usePalette } from '@/constants/theme';
import { checkBuildingIntegrity, getApartments } from '@/lib/api';
import { normalizeDigits } from '@/lib/format';
import { useFocusLoad } from '@/hooks/useFocusLoad';

const makeStyles = (c: Palette) => StyleSheet.create({
  title: { fontSize: 28, fontWeight: '900', color: c.text, textAlign: 'right', marginBottom: 14 },
  search: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: radius.md, padding: 13, color: c.text, textAlign: 'right', marginBottom: 14 },
});

export default function Apartments() {
  const s = useStyles(makeStyles);
  const c = usePalette();
  const [q, setQ] = useState('');
  const { data: items, error, refreshing, refresh, reload } = useFocusLoad(getApartments);

  if (!items && !error) return <Loading />;

  const needle = normalizeDigits(q).trim();
  const filtered = (items ?? []).filter((a) =>
    `${a.apartment_number} ${a.floor_number} ${a.owner_name ?? ''} ${a.tenant_name ?? ''}`.includes(needle));
  const issues = items ? checkBuildingIntegrity(items) : [];

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Text style={s.title}>الشقق</Text>
      {error && <Banner tone="danger" onRetry={reload}>{error}</Banner>}
      {issues.length > 0 && <Banner tone="warning">{issues.join(' ')}</Banner>}
      <TextInput value={q} onChangeText={setQ} placeholder="ابحث برقم الشقة أو الاسم" placeholderTextColor={c.muted} style={s.search} />
      {filtered.map((a) => (
        <ApartmentCard key={a.apartment_number} apartment={a} onPress={() => router.push(`/apartments/${a.apartment_number}`)} />
      ))}
      {items && filtered.length === 0 && <EmptyText>لا توجد شقة مطابقة للبحث.</EmptyText>}
    </Screen>
  );
}
