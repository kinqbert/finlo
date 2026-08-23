import { QueryClient, QueryClientProvider, focusManager, onlineManager } from '@tanstack/react-query';
import * as Network from 'expo-network';
import { useEffect, type PropsWithChildren } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';

import { ApiError } from './api';

export const queryKeys = {
  session: ['session', 'finance'] as const,
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => failureCount < 2 && (!(error instanceof ApiError) || error.status >= 500),
    },
    mutations: {
      retry: false,
    },
  },
});

if (Platform.OS !== 'web') {
  onlineManager.setEventListener((setOnline) => {
    void Network.getNetworkStateAsync().then((state) => setOnline(state.isInternetReachable ?? state.isConnected ?? true));
    const subscription = Network.addNetworkStateListener((state) => {
      setOnline(state.isInternetReachable ?? state.isConnected ?? true);
    });
    return () => subscription.remove();
  });
}

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') focusManager.setFocused(status === 'active');
}

export function AppQueryProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
