import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Button, Card, Field } from '@/components/ui';
import { Palette, spacing, useStyles } from '@/constants/theme';
import { signIn } from '@/lib/api';
import { errorMessage } from '@/lib/errors';

const makeStyles = (c: Palette) => StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center' },
  logo: { alignItems: 'center', marginBottom: spacing.xl },
  logoText: { fontSize: 42, fontWeight: '900', color: c.primary },
  tag: { marginTop: 6, color: c.muted, fontSize: 14 },
  heading: { fontSize: 24, fontWeight: '900', color: c.text, marginBottom: 18, textAlign: 'right' },
  note: { fontSize: 12, color: c.muted, textAlign: 'center', lineHeight: 19 },
});

export default function Login() {
  const s = useStyles(makeStyles);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (loading) return;
    if (!email.trim() || !password) return Alert.alert('بيانات ناقصة', 'أدخل البريد الإلكتروني وكلمة المرور.');
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) return Alert.alert('تعذر تسجيل الدخول', errorMessage(error));
      router.replace('/(tabs)/');
    } catch (e) {
      Alert.alert('تعذر تسجيل الدخول', errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.wrap}>
        <View style={s.logo}>
          <Text style={s.logoText}>عمارتي</Text>
          <Text style={s.tag}>كل حسابات العمارة… في مكان واحد</Text>
        </View>
        <Card>
          <Text style={s.heading}>تسجيل الدخول</Text>
          <Field label="البريد الإلكتروني" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" ltr />
          <Field label="كلمة المرور" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete="password" ltr />
          <Button title={loading ? 'جارٍ الدخول…' : 'دخول'} onPress={submit} disabled={loading} />
        </Card>
        <Text style={s.note}>الحسابات تُدار من Supabase Auth. يُفضّل إيقاف التسجيل العام بعد إنشاء المستخدم الأول.</Text>
      </KeyboardAvoidingView>
    </Screen>
  );
}
