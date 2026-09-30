import { PropsWithChildren } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, spacing, usePalette, useStyles } from '@/constants/theme';

const makeStyles = (c: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  scroll: { paddingBottom: 32 },
  content: { padding: spacing.md },
});

export function Screen({ children, scroll = true, refreshing, onRefresh }: PropsWithChildren<{
  scroll?: boolean; refreshing?: boolean; onRefresh?: () => void;
}>) {
  const s = useStyles(makeStyles);
  const c = usePalette();
  const content = <View style={s.content}>{children}</View>;
  return (
    <SafeAreaView style={s.safe}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={c.primary} colors={[c.primary]} /> : undefined}
        >
          {content}
        </ScrollView>
      ) : content}
    </SafeAreaView>
  );
}
