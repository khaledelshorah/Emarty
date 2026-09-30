import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Banner, Card, EmptyText, Loading, SectionTitle, StatCard } from '@/components/ui';
import { Palette, ROW, useStyles, usePalette } from '@/constants/theme';
import { apartmentStatusLabel } from '@/constants/status';
import { getDashboardStats, signOut } from '@/lib/api';
import { greeting, monthLabel, money } from '@/lib/format';
import { useFocusLoad } from '@/hooks/useFocusLoad';

const makeStyles = (c: Palette) => StyleSheet.create({
  header: { flexDirection: ROW, justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  eyebrow: { fontSize: 12, color: c.muted, textAlign: 'right' },
  title: { fontSize: 28, fontWeight: '900', color: c.text, textAlign: 'right', marginTop: 3 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' },
  statusRow: { flexDirection: ROW, justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: c.border },
  status: { fontWeight: '700', color: c.text },
  count: { fontWeight: '900', color: c.primary },
  alert: { color: c.danger, fontWeight: '800', textAlign: 'right' },
  ok: { color: c.success, fontWeight: '800', textAlign: 'right' },
});

export default function Dashboard() {
  const s = useStyles(makeStyles);
  const c = usePalette();
  const { data: stats, error, refreshing, refresh, reload } = useFocusLoad(getDashboardStats);

  function confirmSignOut() {
    Alert.alert('تسجيل الخروج', 'هل تريد تسجيل الخروج من التطبيق؟', [
      { text: 'تراجع', style: 'cancel' },
      { text: 'تسجيل الخروج', style: 'destructive', onPress: async () => { await signOut(); router.replace('/(auth)/login'); } },
    ]);
  }

  if (!stats && !error) return <Loading />;

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <View style={s.header}>
        <View>
          <Text style={s.eyebrow}>{monthLabel()}</Text>
          <Text style={s.title}>{greeting()} 👋</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="تسجيل الخروج" onPress={confirmSignOut} style={s.avatar}>
          <Ionicons name="log-out-outline" size={22} color={c.onPrimary} />
        </Pressable>
      </View>

      {error && <Banner tone="danger" onRetry={reload}>{error}</Banner>}

      {stats && (
        <>
          {stats.integrityIssues.length > 0 && (
            <Banner tone="warning">
              بنية العمارة في قاعدة البيانات مخالفة للقواعد (12 دورًا، شقة لكل دور): {stats.integrityIssues.join(' ')}
            </Banner>
          )}
          <StatCard title="رصيد الصندوق" value={stats.fundBalance} tone="success" />
          <StatCard title="تحصيلات الشهر" value={stats.monthCollections} />
          <StatCard title="مصروفات الشهر" value={stats.monthExpenses} />
          <StatCard title="المتأخرات" value={stats.overdue} tone="danger" />

          <SectionTitle>حالة الشقق</SectionTitle>
          <Card>
            {Object.entries(stats.statusCounts).map(([status, count]) => (
              <View key={status} style={s.statusRow}>
                <Text style={s.count}>{count.toLocaleString('ar-EG')}</Text>
                <Text style={s.status}>{apartmentStatusLabel(status)}</Text>
              </View>
            ))}
            {Object.keys(stats.statusCounts).length === 0 && <EmptyText>لا توجد بيانات متاحة بعد.</EmptyText>}
          </Card>

          <SectionTitle>يحتاج انتباهك</SectionTitle>
          <Card>
            <Text style={stats.overdue > 0 ? s.alert : s.ok}>
              {stats.overdue > 0 ? `يوجد ${money(stats.overdue)} متأخرات تحتاج متابعة.` : 'لا توجد متأخرات.'}
            </Text>
          </Card>
        </>
      )}
    </Screen>
  );
}
