export type {
  Account,
	AssignTransactionCategoryInput,
  APIError,
  Budget,
  Category,
	CompleteMonobankInput,
  CreateAccountInput,
  CreateCategoryInput,
	CreateGoalInput,
  CreateSubscriptionInput,
  CreateTransactionInput,
  Dashboard,
  EmergencyFund,
  GoogleLoginInput,
	Goal,
	MCCCategoryRule,
	MonobankConnection,
	MonobankPreview,
  Insight,
  LoginInput,
  RegisterInput,
  ReorderCategoriesInput,
  SaveBudgetInput,
  SaveEmergencyFundInput,
	SaveMCCRuleInput,
  Subscription,
  Tokens,
  Transaction,
  UpdateCategoryInput,
	UpdateAccountInput,
  User,
} from '@/api/generated'

import type { Account, Budget, Category, Dashboard, Goal, MCCCategoryRule, MonobankConnection, Subscription, Transaction } from '@/api/generated'

export type FinanceData = {
  dashboard: Dashboard
  categories: Category[]
  accounts: Account[]
  transactions: Transaction[]
  budgets: Budget[]
  subscriptions: Subscription[]
	goals: Goal[]
	mccRules: MCCCategoryRule[]
	monobankConnection: MonobankConnection | null
}

export type FinanceActions = {
  data: FinanceData
  isDemo: boolean
  onDemoChange: (data: FinanceData) => void
}
