import type { Subscription } from '@/types'

const shortDateFormatter = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' })

export function greetingForTime(date = new Date()) {
  const hour = date.getHours()
  if (hour < 5) return 'Good night'
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  if (hour < 21) return 'Good evening'
  return 'Good night'
}

export function nextBillingDate(billingDay: number, from = new Date()) {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  let result = billingDate(from.getFullYear(), from.getMonth(), billingDay)
  if (result < today) result = billingDate(from.getFullYear(), from.getMonth() + 1, billingDay)
  return result
}

export function subscriptionNextBillingDate(subscription: Pick<Subscription, 'billing_day' | 'next_payment_date'>, from = new Date()) {
  const persisted = subscription.next_payment_date ? parseCalendarDate(subscription.next_payment_date) : null
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  return persisted && persisted >= today ? persisted : nextBillingDate(subscription.billing_day, from)
}

export function formatShortDate(date: Date) {
  return shortDateFormatter.format(date)
}

function billingDate(year: number, month: number, preferredDay: number) {
  const lastDay = new Date(year, month + 1, 0).getDate()
  return new Date(year, month, Math.max(1, Math.min(preferredDay, lastDay)))
}

function parseCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) ? null : date
}
