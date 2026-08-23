import type { User } from '@/types'

const moneyFormatters = new Map<string, Intl.NumberFormat>()

export function formatMoney(minor: number, currency = 'UAH', compact = false) {
  const key = `${currency}:${compact}`
  let formatter = moneyFormatters.get(key)
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: compact ? 0 : 2,
      notation: compact ? 'compact' : 'standard',
    })
    moneyFormatters.set(key, formatter)
  }
  return formatter.format(minor / 100)
}

export function initials(user: User) {
  return `${user.name[0] ?? ''}${user.surname[0] ?? ''}`.toUpperCase()
}

export function errorMessage(caught: unknown, fallback: string) {
  return caught instanceof Error && caught.message ? caught.message : fallback
}
