import 'react-native-url-polyfill/auto';
import { AppState, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) console.warn('Missing Supabase environment variables.');

const storage = {
  getItem: (keyName: string) => SecureStore.getItemAsync(keyName),
  setItem: (keyName: string, value: string) => SecureStore.setItemAsync(keyName, value),
  removeItem: (keyName: string) => SecureStore.deleteItemAsync(keyName),
};

export const supabase = createClient(url ?? 'https://invalid.local', key ?? 'missing-key', {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// توصية Supabase لـ React Native: إيقاف تجديد الجلسة في الخلفية وتشغيله عند العودة للتطبيق.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
