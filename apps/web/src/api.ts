import type { Account, Budget, Dashboard, EmergencyFund, FinanceData, Subscription, Tokens, Transaction, User } from './types'

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
const ACCESS_KEY = 'finlo.access-token'
const REFRESH_KEY = 'finlo.refresh-token'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  save(tokens: Tokens) {
    localStorage.setItem(ACCESS_KEY, tokens.access_token)
    localStorage.setItem(REFRESH_KEY, tokens.refresh_token)
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    if (response.status === 204) return undefined as T
    return response.json() as Promise<T>
  }
  const body = await response.json().catch(() => null) as { error?: { message?: string } } | null
  throw new ApiError(body?.error?.message ?? 'Something went wrong', response.status)
}

async function refreshAccessToken() {
  const refreshToken = tokenStore.getRefresh()
  if (!refreshToken) return null
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  if (!response.ok) {
    tokenStore.clear()
    return null
  }
  const tokens = await response.json() as Tokens
  tokenStore.save(tokens)
  return tokens.access_token
}

export async function apiFetch<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  const accessToken = tokenStore.getAccess()
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  const response = await fetch(`${API_URL}${path}`, { ...init, headers })
  if (response.status === 401 && retry && await refreshAccessToken()) {
    return apiFetch<T>(path, init, false)
  }
  return parseResponse<T>(response)
}

export async function login(email: string, password: string) {
  const tokens = await apiFetch<Tokens>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  tokenStore.save(tokens)
  return tokens
}

export async function register(name: string, surname: string, email: string, password: string) {
  const tokens = await apiFetch<Tokens>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, surname, email, password }),
  })
  tokenStore.save(tokens)
  return tokens
}

export async function loginWithGoogle(idToken: string) {
  const tokens = await apiFetch<Tokens>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ id_token: idToken }),
  })
  tokenStore.save(tokens)
  return tokens
}

export const getMe = () => apiFetch<User>('/auth/me')

export async function loadFinanceData(): Promise<FinanceData> {
  const [dashboard, accounts, transactions, budgets, subscriptions] = await Promise.all([
    apiFetch<Dashboard>('/api/dashboard'),
    apiFetch<Account[]>('/api/accounts'),
    apiFetch<Transaction[]>('/api/transactions'),
    apiFetch<Budget[]>(`/api/budgets?month=${new Date().toISOString().slice(0, 7)}`),
    apiFetch<Subscription[]>('/api/subscriptions'),
  ])
  return { dashboard, accounts, transactions, budgets, subscriptions }
}

export const createAccount = (input: { name: string; type: Account['type']; currency: string; balance_minor: number }) =>
  apiFetch<Account>('/api/accounts', { method: 'POST', body: JSON.stringify(input) })

export const createTransaction = (input: { account_id: string; type: Transaction['type']; amount_minor: number; category: string; description: string; occurred_at: string }) =>
  apiFetch<Transaction>('/api/transactions', { method: 'POST', body: JSON.stringify(input) })

export const saveBudget = (input: { category: string; amount_minor: number; currency: string; month: string }) =>
  apiFetch<Budget>('/api/budgets', { method: 'POST', body: JSON.stringify(input) })

export const saveEmergencyFund = (input: { target_minor: number; current_minor: number; currency: string }) =>
  apiFetch<EmergencyFund>('/api/emergency-fund', { method: 'PUT', body: JSON.stringify(input) })

export const createSubscription = (input: { name: string; amount_minor: number; currency: string; billing_day: number; active: boolean }) =>
  apiFetch<Subscription>('/api/subscriptions', { method: 'POST', body: JSON.stringify(input) })
