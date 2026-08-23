import { Banknote, Car, CircleDollarSign, CreditCard, Repeat2, ShoppingBasket, Target, Utensils, WalletCards } from 'lucide-react'
import type { Account } from '@/types'

export const categoryIcons: Record<string, typeof ShoppingBasket> = {
  Groceries: ShoppingBasket,
  Dining: Utensils,
  Transport: Car,
  Salary: Banknote,
  Subscriptions: Repeat2,
}

export const accountIcons: Record<Account['type'], typeof CreditCard> = {
  card: CreditCard,
  bank: CircleDollarSign,
  cash: Banknote,
  savings: Target,
  other: WalletCards,
}
