import type { LoginInput, RegisterInput, Tokens, User } from '@/types'
import { apiRequest, refreshAccessToken, tokenStore } from './client'
import { loadFinanceData } from './finance'

export async function login(email: string, password: string) {
  const tokens = await apiRequest<Tokens>({
    url: '/auth/login',
    method: 'POST',
    headers: { 'X-Finlo-Token-Transport': 'cookie' },
    data: { email, password } satisfies LoginInput,
    skipAuthRefresh: true,
  })
  tokenStore.save(tokens)
  return tokens
}

export async function register(name: string, surname: string, email: string, password: string) {
  const tokens = await apiRequest<Tokens>({
    url: '/auth/register',
    method: 'POST',
    headers: { 'X-Finlo-Token-Transport': 'cookie' },
    data: { name, surname, email, password } satisfies RegisterInput,
    skipAuthRefresh: true,
  })
  tokenStore.save(tokens)
  return tokens
}

export async function loginWithGoogle(idToken: string) {
  const tokens = await apiRequest<Tokens>({
    url: '/auth/google',
    method: 'POST',
    headers: { 'X-Finlo-Token-Transport': 'cookie' },
    data: { id_token: idToken },
    skipAuthRefresh: true,
  })
  tokenStore.save(tokens)
  return tokens
}

export const getMe = (signal?: AbortSignal) => apiRequest<User>({ url: '/auth/me', signal })

export async function loadSession(signal?: AbortSignal) {
  const [user, data] = await Promise.all([getMe(signal), loadFinanceData(signal)])
  return { user, data }
}

export async function restoreSession(signal?: AbortSignal) {
  if (!tokenStore.getAccess() && !await refreshAccessToken()) return null
  return loadSession(signal)
}

export async function logout() {
  try {
    await apiRequest<void>({ url: '/auth/logout', method: 'POST', skipAuthRefresh: true })
  } finally {
    tokenStore.clear()
  }
}
