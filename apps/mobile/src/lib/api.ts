import { AxiosError, create, isCancel, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { Account, Budget, Dashboard, FinanceData, Subscription, Tokens, Transaction, User } from './types';

const devHost = Constants.expoConfig?.hostUri?.split(':')[0];
const defaultURL = devHost ? `http://${devHost}:8080` : Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';
const API_URL = (process.env.EXPO_PUBLIC_API_URL || defaultURL).replace(/\/$/, '');
const ACCESS_KEY = 'finlo.access-token';
const REFRESH_KEY = 'finlo.refresh-token';

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
};

type ApiRequestConfig = AxiosRequestConfig & {
  skipAuthRefresh?: boolean;
};

let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function storageGet(key: string) {
  if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) ?? null;
  return SecureStore.getItemAsync(key);
}

async function storageSet(key: string, value: string) {
  if (Platform.OS === 'web') globalThis.localStorage?.setItem(key, value);
  else await SecureStore.setItemAsync(key, value);
}

async function storageDelete(key: string) {
  if (Platform.OS === 'web') globalThis.localStorage?.removeItem(key);
  else await SecureStore.deleteItemAsync(key);
}

export async function restoreTokens() {
  [accessToken, refreshToken] = await Promise.all([storageGet(ACCESS_KEY), storageGet(REFRESH_KEY)]);
  return Boolean(accessToken || refreshToken);
}

export async function saveTokens(tokens: Tokens) {
  accessToken = tokens.access_token;
  refreshToken = tokens.refresh_token;
  await Promise.all([storageSet(ACCESS_KEY, accessToken), storageSet(REFRESH_KEY, refreshToken)]);
}

export async function clearTokens() {
  accessToken = null;
  refreshToken = null;
  await Promise.all([storageDelete(ACCESS_KEY), storageDelete(REFRESH_KEY)]);
}

function apiError(error: unknown) {
  if (error instanceof ApiError) return error;
  if (isCancel(error)) return error;
  if (!(error instanceof AxiosError)) return new ApiError('Could not connect to Finlo', 0, { cause: error });

  const body = error.response?.data as { error?: { message?: string } } | undefined;
  return new ApiError(body?.error?.message ?? (error.response ? 'Something went wrong' : 'Could not connect to Finlo'), error.response?.status ?? 0, { cause: error });
}

const refreshClient = create({ baseURL: API_URL, headers: { Accept: 'application/json', 'Content-Type': 'application/json' } });
const apiClient = create({ baseURL: API_URL, headers: { Accept: 'application/json', 'Content-Type': 'application/json' } });

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;
  if (!refreshToken) return false;

  refreshPromise = refreshClient.post<Tokens>('/auth/refresh', { refresh_token: refreshToken })
    .then(async ({ data }) => {
      await saveTokens(data);
      return true;
    })
    .catch(async () => {
      await clearTokens();
      return false;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

apiClient.interceptors.request.use((config) => {
  if (accessToken) config.headers.set('Authorization', `Bearer ${accessToken}`);
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (error instanceof AxiosError && error.response?.status === 401 && error.config) {
      const config = error.config as RetriableRequestConfig;
      if (!config._retry && !config.skipAuthRefresh) {
        config._retry = true;
        if (await refreshAccessToken()) {
          config.headers.set('Authorization', `Bearer ${accessToken}`);
          return apiClient.request(config);
        }
      }
    }
    return Promise.reject(apiError(error));
  },
);

async function request<T>(config: ApiRequestConfig): Promise<T> {
  try {
    return (await apiClient.request<T>(config)).data;
  } catch (error) {
    throw apiError(error);
  }
}

async function authenticate(path: string, data: object) {
  const tokens = await request<Tokens>({ url: path, method: 'POST', data, skipAuthRefresh: true });
  await saveTokens(tokens);
}

export const login = (email: string, password: string) => authenticate('/auth/login', { email, password });
export const register = (name: string, surname: string, email: string, password: string) => authenticate('/auth/register', { name, surname, email, password });
export const loginWithGoogle = (idToken: string) => authenticate('/auth/google', { id_token: idToken });

export async function loadSession(signal?: AbortSignal): Promise<{ user: User; data: FinanceData }> {
  const month = new Date().toISOString().slice(0, 7);
  const [user, dashboard, accounts, transactions, budgets, subscriptions] = await Promise.all([
    request<User>({ url: '/auth/me', signal }),
    request<Dashboard>({ url: '/api/dashboard', signal }),
    request<Account[]>({ url: '/api/accounts', signal }),
    request<Transaction[]>({ url: '/api/transactions', signal }),
    request<Budget[]>({ url: '/api/budgets', params: { month }, signal }),
    request<Subscription[]>({ url: '/api/subscriptions', signal }),
  ]);
  return { user, data: { dashboard, accounts, transactions, budgets, subscriptions } };
}

export const addTransaction = (data: { account_id: string; type: Transaction['type']; amount_minor: number; category: string; description: string; occurred_at: string }) =>
  request<Transaction>({ url: '/api/transactions', method: 'POST', data });
