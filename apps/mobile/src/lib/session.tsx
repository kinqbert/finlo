import { createContext, useContext, useState, type PropsWithChildren } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as api from './api';
import { demoData, demoUser } from './demo-data';
import { queryKeys } from './query';
import type { FinanceData, Transaction, User } from './types';

type Status = 'loading' | 'guest' | 'api' | 'demo';
type TransactionInput = { account_id: string; type: Transaction['type']; amount_minor: number; category: string; description: string };
type SessionData = { user: User; data: FinanceData };

type SessionContextValue = {
  status: Status;
  refreshing: boolean;
  user: User;
  data: FinanceData;
  error: string;
  login(email: string, password: string): Promise<void>;
  register(name: string, surname: string, email: string, password: string): Promise<void>;
  googleLogin(idToken: string): Promise<void>;
  useDemo(): void;
  logout(): Promise<void>;
  refresh(): Promise<void>;
  addTransaction(input: TransactionInput): Promise<void>;
  clearError(): void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

async function loadStoredSession(): Promise<SessionData | null> {
  if (!await api.restoreTokens()) return null;
  try { return await api.loadSession(); }
  catch (error) {
    if (!(error instanceof api.ApiError) || error.status !== 401) throw error;
    await api.clearTokens();
    return null;
  }
}

function mutationError(error: unknown) {
  return error instanceof Error ? error.message : 'Could not connect to Finlo';
}

export function SessionProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [demo, setDemo] = useState(false);
  const sessionQuery = useQuery({
    queryKey: queryKeys.session,
    queryFn: loadStoredSession,
    enabled: !demo,
    retry: false,
  });
  const authMutation = useMutation({
    mutationFn: async (action: () => Promise<void>) => {
      await action();
      return api.loadSession();
    },
    onSuccess: (session) => {
      setDemo(false);
      queryClient.setQueryData(queryKeys.session, session);
    },
  });
  const transactionMutation = useMutation({
    mutationFn: api.addTransaction,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.session });
    },
  });

  const status: Status = sessionQuery.isPending ? 'loading' : demo ? 'demo' : sessionQuery.data ? 'api' : 'guest';
  const cachedSession = sessionQuery.data ?? { user: demoUser, data: demoData };

  async function runAuth(action: () => Promise<void>) {
    await authMutation.mutateAsync(action);
  }

  async function refresh() {
    if (status !== 'api') return;
    const result = await sessionQuery.refetch();
    if (result.error) throw result.error;
  }

  async function addTransaction(input: TransactionInput) {
    authMutation.reset();
    if (status === 'demo') {
      const next = structuredClone(cachedSession.data);
      const account = next.accounts.find((item) => item.id === input.account_id);
      if (!account) return;
      const transaction: Transaction = {
        ...input,
        id: `demo-${Date.now()}`,
        currency: account.currency,
        occurred_at: new Date().toISOString(),
        source: 'manual',
      };
      next.transactions.unshift(transaction);
      next.dashboard.recent_transactions.unshift(transaction);
      account.balance_minor += input.type === 'income' ? input.amount_minor : -input.amount_minor;
      next.dashboard.balances = [{
        currency: account.currency,
        balance_minor: next.accounts.filter((item) => item.currency === account.currency).reduce((sum, item) => sum + item.balance_minor, 0),
      }];
      queryClient.setQueryData(queryKeys.session, { user: cachedSession.user, data: next });
      return;
    }
    await transactionMutation.mutateAsync({ ...input, occurred_at: new Date().toISOString() });
  }

  const value: SessionContextValue = {
    status,
    refreshing: sessionQuery.isFetching && !sessionQuery.isPending,
    user: cachedSession.user,
    data: cachedSession.data,
    error: authMutation.error ? mutationError(authMutation.error) : transactionMutation.error ? mutationError(transactionMutation.error) : '',
    login: (email, password) => runAuth(() => api.login(email, password)),
    register: (name, surname, email, password) => runAuth(() => api.register(name, surname, email, password)),
    googleLogin: (idToken) => runAuth(() => api.loginWithGoogle(idToken)),
    useDemo: () => {
      authMutation.reset();
      transactionMutation.reset();
      setDemo(true);
      queryClient.setQueryData(queryKeys.session, { user: demoUser, data: structuredClone(demoData) });
    },
    logout: async () => {
      await api.clearTokens();
      setDemo(false);
      queryClient.setQueryData(queryKeys.session, null);
      authMutation.reset();
      transactionMutation.reset();
    },
    refresh,
    addTransaction,
    clearError: () => {
      authMutation.reset();
      transactionMutation.reset();
    },
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}
