import { I18nManager } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { usePalette } from '@/constants/theme';

// يجب أن يُستدعى قبل أول رسم للواجهة (وليس داخل useEffect).
I18nManager.allowRTL(true);

export default function RootLayout() {
  const c = usePalette();
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.background } }} />
    </SafeAreaProvider>
  );
}
