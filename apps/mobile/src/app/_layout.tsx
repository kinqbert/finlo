import { DefaultTheme, ThemeProvider } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import AppTabs from '@/components/app-tabs';
import { AuthScreen } from '@/components/auth-screen';
import { Palette } from '@/constants/theme';
import { SessionProvider, useSession } from '@/lib/session';

export default function TabLayout() {
  return (
    <SessionProvider>
      <ThemeProvider value={DefaultTheme}>
        <StatusBar style="dark" />
        <AppRoot />
      </ThemeProvider>
    </SessionProvider>
  );
}

function AppRoot() {
  const { status } = useSession();
  if (status === 'loading') return <View style={styles.loading}><View style={styles.mark}><ActivityIndicator color={Palette.lime} /></View></View>;
  if (status === 'guest') return <AuthScreen />;
  return <AppTabs />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Palette.canvas },
  mark: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: Palette.green },
});
