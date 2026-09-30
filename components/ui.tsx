import { PropsWithChildren, useEffect, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView,
  StyleProp, StyleSheet, Text, TextInput, View, ViewStyle, KeyboardTypeOptions,
} from 'react-native';
import { Palette, ROW, radius, spacing, useStyles, usePalette } from '@/constants/theme';
import { errorMessage } from '@/lib/errors';
import { money, todayISO } from '@/lib/format';

const makeStyles = (c: Palette) => StyleSheet.create({
  card: { backgroundColor: c.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: c.border },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: c.text, marginBottom: spacing.sm, textAlign: 'right' },
  muted: { fontSize: 13, color: c.muted, textAlign: 'right' },
  stat: { fontSize: 22, fontWeight: '800', color: c.text, marginTop: 6, textAlign: 'right' },
  button: { backgroundColor: c.primary, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginVertical: 6 },
  buttonText: { color: c.onPrimary, fontSize: 16, fontWeight: '800' },
  secondary: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
  secondaryText: { color: c.text },
  danger: { backgroundColor: c.dangerSolid },
  dangerText: { color: '#FFFFFF' },
  small: { paddingVertical: 9, paddingHorizontal: 14, marginVertical: 0 },
  smallText: { fontSize: 13 },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
  field: { marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '700', color: c.text, marginBottom: 6, textAlign: 'right' },
  input: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 13, color: c.text, textAlign: 'right' },
  inputError: { borderColor: c.danger },
  multiline: { minHeight: 84, textAlignVertical: 'top' },
  hint: { fontSize: 12, color: c.muted, marginTop: 4, textAlign: 'right' },
  errorText: { fontSize: 12, color: c.danger, marginTop: 4, textAlign: 'right' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background, paddingVertical: 60 },
  chips: { flexDirection: ROW, flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8, minWidth: 44, alignItems: 'center' },
  chipActive: { backgroundColor: c.primary, borderColor: c.primary },
  chipText: { color: c.text, fontWeight: '700', fontSize: 14 },
  chipTextActive: { color: c.onPrimary },
  banner: { borderRadius: radius.md, padding: spacing.sm + 2, marginBottom: spacing.md, borderWidth: 1 },
  bannerText: { fontSize: 13, lineHeight: 20, textAlign: 'right' },
  overlay: { flex: 1, backgroundColor: c.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: c.background, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.md, maxHeight: '90%' },
  sheetTitle: { fontSize: 20, fontWeight: '900', color: c.text, textAlign: 'right', marginBottom: 6 },
  sheetDesc: { fontSize: 13, color: c.muted, textAlign: 'right', lineHeight: 20, marginBottom: 12 },
  row: { flexDirection: ROW, gap: 10 },
  flex1: { flex: 1 },
  empty: { color: c.muted, textAlign: 'center', paddingVertical: 8 },
});

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const s = useStyles(makeStyles);
  return <View style={[s.card, style]}>{children}</View>;
}

export function SectionTitle({ children }: PropsWithChildren) {
  const s = useStyles(makeStyles);
  return <Text style={s.sectionTitle}>{children}</Text>;
}

export function EmptyText({ children }: PropsWithChildren) {
  const s = useStyles(makeStyles);
  return <Text style={s.empty}>{children}</Text>;
}

export function Button({ title, onPress, variant = 'primary', disabled = false, small = false }: {
  title: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'danger'; disabled?: boolean; small?: boolean;
}) {
  const s = useStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        variant === 'secondary' && s.secondary,
        variant === 'danger' && s.danger,
        small && s.small,
        pressed && s.pressed,
        disabled && s.disabled,
      ]}
    >
      <Text style={[s.buttonText, variant === 'secondary' && s.secondaryText, variant === 'danger' && s.dangerText, small && s.smallText]}>{title}</Text>
    </Pressable>
  );
}

export function Field({
  label, value, onChangeText, secureTextEntry = false, keyboardType, multiline = false,
  placeholder, autoCapitalize, autoComplete, ltr = false, error, hint, editable = true,
}: {
  label: string; value: string; onChangeText: (v: string) => void; secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions; multiline?: boolean; placeholder?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'; autoComplete?: any;
  ltr?: boolean; error?: string | null; hint?: string; editable?: boolean;
}) {
  const s = useStyles(makeStyles);
  const c = usePalette();
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholder={placeholder}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        editable={editable}
        style={[s.input, multiline && s.multiline, ltr && { writingDirection: 'ltr' }, !!error && s.inputError]}
        placeholderTextColor={c.muted}
      />
      {error ? <Text style={s.errorText}>{error}</Text> : hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  );
}

export function StatCard({ title, value, tone = 'default' }: {
  title: string; value: number; tone?: 'default' | 'danger' | 'success' | 'warning';
}) {
  const s = useStyles(makeStyles);
  const c = usePalette();
  const color = tone === 'danger' ? c.danger : tone === 'success' ? c.success : tone === 'warning' ? c.warning : c.text;
  return (
    <Card>
      <Text style={s.muted}>{title}</Text>
      <Text style={[s.stat, { color }]}>{money(value)}</Text>
    </Card>
  );
}

export function Loading() {
  const s = useStyles(makeStyles);
  const c = usePalette();
  return <View style={s.loading}><ActivityIndicator size="large" color={c.primary} /></View>;
}

export function Banner({ tone = 'info', children, onRetry }: PropsWithChildren<{ tone?: 'info' | 'warning' | 'danger'; onRetry?: () => void }>) {
  const s = useStyles(makeStyles);
  const c = usePalette();
  const color = tone === 'danger' ? c.danger : tone === 'warning' ? c.warning : c.info;
  return (
    <View style={[s.banner, { borderColor: color, backgroundColor: c.surface }]}>
      <Text style={[s.bannerText, { color }]}>{children}</Text>
      {onRetry && <View style={{ marginTop: 8 }}><Button title="إعادة المحاولة" variant="secondary" small onPress={onRetry} /></View>}
    </View>
  );
}

export function Chips<T extends string | number>({ options, value, onChange }: {
  options: { value: T; label: string }[]; value: T | null; onChange: (v: T) => void;
}) {
  const s = useStyles(makeStyles);
  return (
    <View style={s.chips}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable key={String(o.value)} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => onChange(o.value)} style={[s.chip, active && s.chipActive]}>
            <Text style={[s.chipText, active && s.chipTextActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const APARTMENT_OPTIONS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: (i + 1).toLocaleString('ar-EG') }));

/** اختيار شقة من 1 إلى 12 فقط (قاعدة العمارة). */
export function ApartmentPicker({ label = 'الشقة', value, onChange }: { label?: string; value: number | null; onChange: (n: number) => void }) {
  const s = useStyles(makeStyles);
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <Chips options={APARTMENT_OPTIONS} value={value} onChange={onChange} />
    </View>
  );
}

/**
 * نافذة تأكيد لعملية حساسة: تطلب سببًا (اختياريًا تاريخًا)، وتمنع الضغط المزدوج،
 * وتعرض خطأ قاعدة البيانات داخل النافذة بدل إغلاقها.
 */
export function ActionModal({
  visible, title, description, confirmLabel, tone = 'primary', requireReason = true,
  reasonLabel = 'السبب', showDate = false, dateLabel = 'التاريخ', children, onCancel, onConfirm,
}: PropsWithChildren<{
  visible: boolean; title: string; description?: string; confirmLabel: string; tone?: 'primary' | 'danger';
  requireReason?: boolean; reasonLabel?: string; showDate?: boolean; dateLabel?: string;
  onCancel: () => void; onConfirm: (v: { reason: string; date: string }) => Promise<void>;
}>) {
  const s = useStyles(makeStyles);
  const [reason, setReason] = useState('');
  const [date, setDate] = useState(todayISO());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) { setReason(''); setDate(todayISO()); setError(null); setBusy(false); }
  }, [visible]);

  async function submit() {
    if (busy) return;
    if (requireReason && !reason.trim()) { setError(`${reasonLabel} إجباري.`); return; }
    setBusy(true); setError(null);
    try {
      await onConfirm({ reason: reason.trim(), date });
      onCancel();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => !busy && onCancel()}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.overlay}>
        <View style={s.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={s.sheetTitle}>{title}</Text>
            {description ? <Text style={s.sheetDesc}>{description}</Text> : null}
            {children}
            {showDate && <Field label={dateLabel} value={date} onChangeText={setDate} ltr placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" />}
            {(requireReason || reasonLabel !== 'السبب') && (
              <Field label={reasonLabel} value={reason} onChangeText={setReason} multiline />
            )}
            {error && <Banner tone="danger">{error}</Banner>}
            <View style={s.row}>
              <View style={s.flex1}><Button title="تراجع" variant="secondary" disabled={busy} onPress={onCancel} /></View>
              <View style={s.flex1}><Button title={busy ? 'جارٍ التنفيذ…' : confirmLabel} variant={tone === 'danger' ? 'danger' : 'primary'} disabled={busy} onPress={submit} /></View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
