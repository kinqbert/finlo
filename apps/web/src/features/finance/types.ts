import type { FinanceData } from '../../types'

export type View = 'overview' | 'activity' | 'plans' | 'subscriptions' | 'settings'

export type FinanceActions = {
  data: FinanceData
  isDemo: boolean
  onDemoChange: (data: FinanceData) => void
}
