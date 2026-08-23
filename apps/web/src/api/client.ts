import { AxiosError, create, isCancel, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import type { APIError, Tokens } from '@/types'

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
const ACCESS_KEY = 'finlo.access-token'
const REFRESH_KEY = 'finlo.refresh-token'
const COOKIE_TRANSPORT_HEADERS = { 'X-Finlo-Token-Transport': 'cookie' }

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
  skipAuthRefresh?: boolean
}

export type ApiRequestConfig = AxiosRequestConfig & {
  skipAuthRefresh?: boolean
}

let accessToken: string | null = null
let refreshPromise: Promise<string | null> | null = null

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number, options?: ErrorOptions) {
    super(message, options)
    this.name = 'ApiError'
    this.status = status
  }
}

export const tokenStore = {
  getAccess: () => accessToken,
  save(tokens: Tokens) {
    accessToken = tokens.access_token
  },
  clear() {
    accessToken = null
    // Remove tokens created by older Finlo web builds.
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

function apiError(error: unknown) {
  if (error instanceof ApiError) return error
  if (isCancel(error)) return error
  if (!(error instanceof AxiosError)) return new ApiError('Could not connect to Finlo', 0, { cause: error })

  const body = error.response?.data as APIError | undefined
  return new ApiError(body?.error?.message ?? (error.response ? 'Something went wrong' : 'Could not connect to Finlo'), error.response?.status ?? 0, { cause: error })
}

const refreshClient = create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { Accept: 'application/json' },
})

export const apiClient = create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
})

export async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise

  refreshPromise = refreshClient.post<Tokens>('/auth/refresh', undefined, { headers: COOKIE_TRANSPORT_HEADERS })
    .then(({ data }) => {
      tokenStore.save(data)
      return data.access_token
    })
    .catch(() => {
      tokenStore.clear()
      return null
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

apiClient.interceptors.request.use((config) => {
  const token = tokenStore.getAccess()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (error instanceof AxiosError && error.response?.status === 401 && error.config) {
      const config = error.config as RetriableRequestConfig
      if (!config._retry && !config.skipAuthRefresh) {
        config._retry = true
        const token = await refreshAccessToken()
        if (token) {
          config.headers.set('Authorization', `Bearer ${token}`)
          return apiClient.request(config)
        }
      }
    }
    return Promise.reject(apiError(error))
  },
)

export async function apiRequest<T>(config: ApiRequestConfig): Promise<T> {
  try {
    const response = await apiClient.request<T>(config)
    return response.data
  } catch (error) {
    throw apiError(error)
  }
}
