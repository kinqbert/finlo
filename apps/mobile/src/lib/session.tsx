import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

import * as api from './api';
import { demoData, demoUser } from './demo-data';
import type { FinanceData, Transaction, User } from './types';

type Status = 'loading' | 'guest' | 'api' | 'demo';
type TransactionInput = { account_id: string; type: Transaction['type']; amount_minor: number; category: string; description: string };

type SessionContextValue = {
  status: Status;
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

export function SessionProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<User>(demoUser);
  const [data, setData] = useState<FinanceData>(() => structuredClone(demoData));
  const [error, setError] = useState('');

  useEffect(() => {
    api.restoreTokens()
      .then(async (hasTokens) => {
        if (!hasTokens) return setStatus('guest');
        try {
          const session = await api.loadSession();
          setUser(session.user);
          setData(session.data);
          setStatus('api');
        } catch {
          await api.clearTokens();
          setStatus('guest');
        }
      })
      .catch(() => setStatus('guest'));
  }, []);

  async function finishAuthentication() {
    const session = await api.loadSession();
    setUser(session.user);
    setData(session.data);
    setStatus('api');
  }

  async function runAuth(action: () => Promise<void>) {
    setError('');
    try {
      await action();
      await finishAuthentication();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not connect to Finlo');
      throw caught;
    }
  }

  async function refresh() {
    if (status !== 'api') return;
    const session = await api.loadSession();
    setUser(session.user);
    setData(session.data);
  }

  async function addTransaction(input: TransactionInput) {
    setError('');
    if (status === 'demo') {
      const next = structuredClone(data);
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
      setData(next);
      return;
    }
    await api.addTransaction({ ...input, occurred_at: new Date().toISOString() });
    await refresh();
  }

  const value: SessionContextValue = {
    status,
    user,
    data,
    error,
    login: (email, password) => runAuth(() => api.login(email, password)),
    register: (name, surname, email, password) => runAuth(() => api.register(name, surname, email, password)),
    googleLogin: (idToken) => runAuth(() => api.loginWithGoogle(idToken)),
    useDemo: () => {
      setUser(demoUser);
      setData(structuredClone(demoData));
      setStatus('demo');
      setError('');
    },
    logout: async () => {
      await api.clearTokens();
      setStatus('guest');
    },
    refresh,
    addTransaction,
    clearError: () => setError(''),
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}
