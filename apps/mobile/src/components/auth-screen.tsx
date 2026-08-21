import { useState, type ComponentProps } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Palette } from '@/constants/theme';
import { useSession } from '@/lib/session';

WebBrowser.maybeCompleteAuthSession();

export function AuthScreen() {
  const session = useSession();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const googleConfigured = Boolean(
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  );
  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    selectAccount: true,
  }, { scheme: 'finlo' });

  async function submit() {
    setBusy(true);
    session.clearError();
    try {
      if (mode === 'login') await session.login(email.trim(), password);
      else await session.register(name.trim(), surname.trim(), email.trim(), password);
    } catch {
      // The session context exposes a user-friendly API error.
    } finally {
      setBusy(false);
    }
  }

  async function googleSignIn() {
    setBusy(true);
    session.clearError();
    try {
      const result = await promptAsync();
      if (result.type === 'success' && result.params.id_token) await session.googleLogin(result.params.id_token);
    } catch {
      // The session context exposes a user-friendly API error.
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.brand}><View style={styles.brandMark}><Text style={styles.brandLetter}>F</Text></View><Text style={styles.brandName}>finlo</Text></View>
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>PERSONAL FINANCE, MADE CLEAR</Text>
            <Text style={styles.title}>{mode === 'login' ? 'Welcome back.' : 'Build a calmer money life.'}</Text>
            <Text style={styles.subtitle}>{mode === 'login' ? 'Sign in to see where your money stands today.' : 'One private place for balances, budgets, and progress.'}</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.toggle}>
              <Pressable style={[styles.toggleButton, mode === 'login' && styles.toggleActive]} onPress={() => setMode('login')}><Text style={[styles.toggleText, mode === 'login' && styles.toggleTextActive]}>Sign in</Text></Pressable>
              <Pressable style={[styles.toggleButton, mode === 'register' && styles.toggleActive]} onPress={() => setMode('register')}><Text style={[styles.toggleText, mode === 'register' && styles.toggleTextActive]}>Create account</Text></Pressable>
            </View>
            {mode === 'register' && <View style={styles.row}><Field label="First name" value={name} onChangeText={setName} autoComplete="name-given" /><Field label="Last name" value={surname} onChangeText={setSurname} autoComplete="name-family" /></View>}
            <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="you@example.com" />
            <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="At least 8 characters" />
            {session.error ? <Text style={styles.error}>{session.error}</Text> : null}
            <Pressable style={({ pressed }) => [styles.primaryButton, (pressed || busy) && styles.pressed]} disabled={busy || !email || !password} onPress={submit}><Text style={styles.primaryText}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create my account'}</Text></Pressable>
            <View style={styles.divider}><View style={styles.dividerLine} /><Text style={styles.dividerText}>OR</Text><View style={styles.dividerLine} /></View>
            <Pressable style={({ pressed }) => [styles.googleButton, (pressed || !request || !googleConfigured) && styles.pressed]} disabled={!request || !googleConfigured || busy} onPress={googleSignIn}><Text style={styles.googleLetter}>G</Text><Text style={styles.googleText}>{googleConfigured ? 'Continue with Google' : 'Google sign-in needs client IDs'}</Text></Pressable>
          </View>
          <Pressable onPress={session.useDemo} style={styles.demoButton}><Text style={styles.demoText}>Explore with demo data  →</Text></Pressable>
          <Text style={styles.privacy}>Your financial data stays private and isolated to your account.</Text>
        </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type FieldProps = ComponentProps<typeof TextInput> & { label: string };
function Field({ label, ...props }: FieldProps) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput style={styles.input} placeholderTextColor="#9AA39D" {...props} /></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Palette.green },
  scroll: { flexGrow: 1 },
  safeArea: { flex: 1, paddingHorizontal: 22, paddingBottom: 24 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingTop: 14 },
  brandMark: { width: 30, height: 30, borderRadius: 9, borderBottomRightRadius: 4, backgroundColor: Palette.lime, alignItems: 'center', justifyContent: 'center' },
  brandLetter: { color: Palette.green, fontSize: 16, fontWeight: '900' },
  brandName: { color: '#FFFFFF', fontSize: 23, fontWeight: '800', letterSpacing: -1 },
  hero: { paddingTop: 56, paddingBottom: 28 },
  eyebrow: { color: '#BBD194', fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: '#FFFFFF', fontSize: 39, lineHeight: 43, fontWeight: '800', letterSpacing: -1.5, marginTop: 11 },
  subtitle: { color: 'rgba(255,255,255,0.62)', fontSize: 14, lineHeight: 21, marginTop: 11, maxWidth: 330 },
  card: { gap: 14, padding: 20, borderRadius: 22, backgroundColor: Palette.paper },
  toggle: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 12, backgroundColor: '#EEF0E9', marginBottom: 2 },
  toggleButton: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 9 },
  toggleActive: { backgroundColor: '#FFFFFF' },
  toggleText: { color: Palette.muted, fontSize: 12, fontWeight: '700' },
  toggleTextActive: { color: Palette.ink },
  row: { flexDirection: 'row', gap: 10 },
  field: { flex: 1, gap: 6 },
  label: { color: '#5D6A63', fontSize: 11, fontWeight: '700' },
  input: { height: 47, paddingHorizontal: 13, borderWidth: 1, borderColor: Palette.line, borderRadius: 12, backgroundColor: '#FBFCF8', color: Palette.ink, fontSize: 14 },
  primaryButton: { height: 49, marginTop: 2, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: Palette.green },
  primaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  pressed: { opacity: 0.55 },
  error: { color: '#A24837', fontSize: 11, lineHeight: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { height: 1, flex: 1, backgroundColor: Palette.line },
  dividerText: { color: Palette.muted, fontSize: 9, fontWeight: '700' },
  googleButton: { height: 47, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: Palette.line, borderRadius: 13 },
  googleLetter: { color: '#4285F4', fontSize: 16, fontWeight: '900' },
  googleText: { color: Palette.ink, fontSize: 12, fontWeight: '700' },
  demoButton: { alignSelf: 'center', padding: 18 },
  demoText: { color: Palette.lime, fontSize: 12, fontWeight: '700' },
  privacy: { color: 'rgba(255,255,255,0.45)', fontSize: 10, textAlign: 'center' },
});
