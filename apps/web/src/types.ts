export type Tokens = {
  access_token: string
  refresh_token: string
}

export type User = {
  id: string
  name: string
  surname: string
  email: string
  avatar_url?: string
}

export type Category = {
  id: string
  name: string
  type: 'income' | 'expense'
  sort_order: number
  created_at?: string
  updated_at?: string
}

export type Account = {
  id: string
  name: string
  type: 'cash' | 'bank' | 'card' | 'savings' | 'other'
  currency: string
  balance_minor: number
  created_at?: string
  updated_at?: string
}

export type Transaction = {
  id: string
  account_id: string
  type: 'income' | 'expense'
  amount_minor: number
  currency: string
  category: string
  description: string
  occurred_at: string
  source: 'manual' | 'monobank'
}

export type Budget = {
  id: string
  category: string
  amount_minor: number
  currency: string
  month: string
  spent_minor?: number
  remaining_minor?: number
}

export type EmergencyFund = {
  target_minor: number
  current_minor: number
  currency: string
}

export type Subscription = {
  id: string
  account_id?: string
  name: string
  amount_minor: number
  currency: string
  billing_day: number
  active: boolean
  next_payment_date?: string
}

export type Insight = {
  type: string
  title: string
  message: string
}

export type Dashboard = {
  balances: Array<{ currency: string; balance_minor: number }>
  recent_transactions: Transaction[]
  budgets: Budget[]
  emergency_fund: EmergencyFund | null
  subscriptions: Subscription[]
  insights: Insight[]
}

export type FinanceData = {
  dashboard: Dashboard
  categories: Category[]
  accounts: Account[]
  transactions: Transaction[]
  budgets: Budget[]
  subscriptions: Subscription[]
}
