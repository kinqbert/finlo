import type { FinanceData } from '../../types'

export type View = 'overview' | 'activity' | 'plans' | 'subscriptions'

export type FinanceActions = {
  data: FinanceData
  isDemo: boolean
  onCreated: () => Promise<void>
  onDemoChange: (data: FinanceData) => void
}
