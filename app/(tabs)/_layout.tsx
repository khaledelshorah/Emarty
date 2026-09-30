import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '@/hooks/useSession';
import { Loading } from '@/components/ui';
import { usePalette } from '@/constants/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'الرئيسية', icon: 'home-outline' },
  { name: 'apartments', title: 'الشقق', icon: 'business-outline' },
  { name: 'collections', title: 'التحصيل', icon: 'cash-outline' },
  { name: 'expenses', title: 'المصروفات', icon: 'receipt-outline' },
  { name: 'reports', title: 'التقارير', icon: 'bar-chart-outline' },
];

export default function TabsLayout() {
  const { session, loading } = useSession();
  const c = usePalette();
  if (loading) return <Loading />;
  if (!session) return <Redirect href="/(auth)/login" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarStyle: { height: 72, paddingBottom: 10, paddingTop: 8, backgroundColor: c.surface, borderTopColor: c.border },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.title, tabBarIcon: ({ color, size }) => <Ionicons name={t.icon} color={color} size={size} /> }} />
      ))}
    </Tabs>
  );
}
