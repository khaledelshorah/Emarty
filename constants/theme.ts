import { useMemo } from 'react';
import { I18nManager, useColorScheme } from 'react-native';

const light = {
  primary: '#0F766E',
  primaryDark: '#115E59',
  onPrimary: '#FFFFFF',
  background: '#F5F7F7',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF3F2',
  text: '#13201F',
  muted: '#5F6C6A',
  border: '#E2E8E6',
  success: '#15803D',
  warning: '#A16207',
  danger: '#DC2626',
  dangerSolid: '#DC2626',
  orange: '#EA580C',
  info: '#2563EB',
  overlay: 'rgba(0,0,0,0.45)',
};

export type Palette = { [K in keyof typeof light]: string };

const dark: Palette = {
  primary: '#2DD4BF',
  primaryDark: '#14B8A6',
  onPrimary: '#04211E',
  background: '#0D1514',
  surface: '#152120',
  surfaceAlt: '#1C2C2A',
  text: '#E7F0EE',
  muted: '#93A5A2',
  border: '#263836',
  success: '#4ADE80',
  warning: '#FACC15',
  danger: '#F87171',
  dangerSolid: '#DC2626',
  orange: '#FB923C',
  info: '#60A5FA',
  overlay: 'rgba(0,0,0,0.65)',
};

export const spacing = { xs: 6, sm: 10, md: 16, lg: 22, xl: 30 };
export const radius = { sm: 10, md: 16, lg: 22, pill: 999 };

/**
 * اتجاه الصفوف: يعمل سواء كان الجهاز RTL أو LTR.
 * في RTL يقلب React Native الاتجاه تلقائياً، فنستخدم 'row'.
 * في LTR نستخدم 'row-reverse' لنحصل على نفس الشكل العربي.
 * (textAlign: 'right' مادي وليس منطقياً في RN، فلا يحتاج معالجة.)
 */
export const ROW: 'row' | 'row-reverse' = I18nManager.isRTL ? 'row' : 'row-reverse';

export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}

/** مصنع الأنماط يجب أن يكون دالة ثابتة على مستوى الملف (خارج المكوّن). */
export function useStyles<T>(factory: (c: Palette) => T): T {
  const c = usePalette();
  return useMemo(() => factory(c), [c, factory]);
}
