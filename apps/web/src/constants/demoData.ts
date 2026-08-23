import type { FinanceData, User } from '@/types'

const now = new Date()
const timestamps = { created_at: now.toISOString(), updated_at: now.toISOString() }
const isoDate = (daysAgo: number) => {
  const date = new Date(now)
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString()
}

export const demoUser: User = {
  id: 'demo',
  name: 'Maksym',
  surname: 'Perekhodko',
  email: 'maksym@finlo.app',
  ...timestamps,
}

export const demoData: FinanceData = {
  categories: [
    { id: 'c1', name: 'Groceries', type: 'expense', sort_order: 0, ...timestamps },
    { id: 'c2', name: 'Dining', type: 'expense', sort_order: 1, ...timestamps },
    { id: 'c3', name: 'Transport', type: 'expense', sort_order: 2, ...timestamps },
    { id: 'c4', name: 'Health', type: 'expense', sort_order: 3, ...timestamps },
    { id: 'c5', name: 'Subscriptions', type: 'expense', sort_order: 4, ...timestamps },
    { id: 'c6', name: 'Salary', type: 'income', sort_order: 0, ...timestamps },
    { id: 'c7', name: 'Freelance', type: 'income', sort_order: 1, ...timestamps },
  ],
  accounts: [
    { id: 'a1', name: 'Monobank Black', type: 'card', currency: 'UAH', balance_minor: 4862500, ...timestamps },
    { id: 'a2', name: 'Cash', type: 'cash', currency: 'UAH', balance_minor: 840000, ...timestamps },
    { id: 'a3', name: 'Emergency savings', type: 'savings', currency: 'UAH', balance_minor: 7240000, ...timestamps },
  ],
  transactions: [
    { id: 't1', account_id: 'a1', type: 'expense', amount_minor: 128500, currency: 'UAH', category: 'Groceries', description: 'Silpo', occurred_at: isoDate(0), source: 'monobank', ...timestamps },
    { id: 't2', account_id: 'a1', type: 'expense', amount_minor: 39000, currency: 'UAH', category: 'Transport', description: 'Bolt', occurred_at: isoDate(1), source: 'monobank', ...timestamps },
    { id: 't3', account_id: 'a1', type: 'expense', amount_minor: 64900, currency: 'UAH', category: 'Subscriptions', description: 'Spotify', occurred_at: isoDate(2), source: 'monobank', ...timestamps },
    { id: 't4', account_id: 'a1', type: 'income', amount_minor: 6800000, currency: 'UAH', category: 'Salary', description: 'Monthly salary', occurred_at: isoDate(5), source: 'manual', ...timestamps },
    { id: 't5', account_id: 'a1', type: 'expense', amount_minor: 215000, currency: 'UAH', category: 'Dining', description: 'Lunch with friends', occurred_at: isoDate(6), source: 'manual', ...timestamps },
    { id: 't6', account_id: 'a2', type: 'expense', amount_minor: 78000, currency: 'UAH', category: 'Health', description: 'Pharmacy', occurred_at: isoDate(8), source: 'manual', ...timestamps },
  ],
  budgets: [
    { id: 'b1', category: 'Groceries', amount_minor: 1000000, spent_minor: 642000, remaining_minor: 358000, currency: 'UAH', month: now.toISOString().slice(0, 7), ...timestamps },
    { id: 'b2', category: 'Dining', amount_minor: 500000, spent_minor: 382000, remaining_minor: 118000, currency: 'UAH', month: now.toISOString().slice(0, 7), ...timestamps },
    { id: 'b3', category: 'Transport', amount_minor: 400000, spent_minor: 193000, remaining_minor: 207000, currency: 'UAH', month: now.toISOString().slice(0, 7), ...timestamps },
  ],
  subscriptions: [
    { id: 's1', account_id: 'a1', name: 'Spotify', amount_minor: 64900, currency: 'UAH', billing_day: 24, active: true, ...timestamps },
    { id: 's2', account_id: 'a1', name: 'iCloud+', amount_minor: 39900, currency: 'UAH', billing_day: 28, active: true, ...timestamps },
    { id: 's3', account_id: 'a1', name: 'YouTube Premium', amount_minor: 149000, currency: 'UAH', billing_day: 4, active: true, ...timestamps },
  ],
  dashboard: {
    balances: [{ currency: 'UAH', balance_minor: 12942500 }],
    recent_transactions: [],
    budgets: [],
    emergency_fund: { target_minor: 12000000, current_minor: 7240000, currency: 'UAH', ...timestamps },
    subscriptions: [],
    insights: [
      { type: 'budget_risk', title: 'Dining is moving quickly', message: 'You have used 76% of this month’s dining budget. Keeping the next week light puts you back on track.' },
      { type: 'savings_progress', title: 'Emergency fund momentum', message: 'You are 60% of the way to your safety-net target.' },
    ],
  },
}

demoData.dashboard.recent_transactions = demoData.transactions.slice(0, 5)
demoData.dashboard.budgets = demoData.budgets
demoData.dashboard.subscriptions = demoData.subscriptions
