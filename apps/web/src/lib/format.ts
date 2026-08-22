import type { User } from '../types'

export function formatMoney(minor: number, currency = 'UAH', compact = false) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: compact ? 0 : 2,
    notation: compact ? 'compact' : 'standard',
  }).format(minor / 100)
}

export function initials(user: User) {
  return `${user.name[0] ?? ''}${user.surname[0] ?? ''}`.toUpperCase()
}

export function errorMessage(caught: unknown, fallback: string) {
  return caught instanceof Error && caught.message ? caught.message : fallback
}
