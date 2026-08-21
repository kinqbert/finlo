import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { Account, Budget, Dashboard, FinanceData, Subscription, Tokens, Transaction, User } from './types';

const devHost = Constants.expoConfig?.hostUri?.split(':')[0];
const defaultURL = devHost ? `http://${devHost}:8080` : Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';
const API_URL = (process.env.EXPO_PUBLIC_API_URL || defaultURL).replace(/\/$/, '');
const ACCESS_KEY = 'finlo.access-token';
const REFRESH_KEY = 'finlo.refresh-token';

let accessToken: string | null = null;
let refreshToken: string | null = null;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
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
  return Boolean(accessToken);
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

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.ok) return response.status === 204 ? undefined as T : response.json() as Promise<T>;
  const body = await response.json().catch(() => null) as { error?: { message?: string } } | null;
  throw new ApiError(body?.error?.message ?? 'Something went wrong', response.status);
}

async function refreshAccessToken() {
  if (!refreshToken) return false;
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!response.ok) {
    await clearTokens();
    return false;
  }
  await saveTokens(await response.json() as Tokens);
  return true;
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (response.status === 401 && retry && await refreshAccessToken()) return request<T>(path, init, false);
  return parseResponse<T>(response);
}

async function authenticate(path: string, body: object) {
  const tokens = await request<Tokens>(path, { method: 'POST', body: JSON.stringify(body) });
  await saveTokens(tokens);
}

export const login = (email: string, password: string) => authenticate('/auth/login', { email, password });
export const register = (name: string, surname: string, email: string, password: string) => authenticate('/auth/register', { name, surname, email, password });
export const loginWithGoogle = (idToken: string) => authenticate('/auth/google', { id_token: idToken });

export async function loadSession(): Promise<{ user: User; data: FinanceData }> {
  const month = new Date().toISOString().slice(0, 7);
  const [user, dashboard, accounts, transactions, budgets, subscriptions] = await Promise.all([
    request<User>('/auth/me'),
    request<Dashboard>('/api/dashboard'),
    request<Account[]>('/api/accounts'),
    request<Transaction[]>('/api/transactions'),
    request<Budget[]>(`/api/budgets?month=${month}`),
    request<Subscription[]>('/api/subscriptions'),
  ]);
  return { user, data: { dashboard, accounts, transactions, budgets, subscriptions } };
}

export const addTransaction = (input: { account_id: string; type: Transaction['type']; amount_minor: number; category: string; description: string; occurred_at: string }) =>
  request<Transaction>('/api/transactions', { method: 'POST', body: JSON.stringify(input) });
