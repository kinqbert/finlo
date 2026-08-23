import { AnimatedMoney } from '@/components/ui/AnimatedValue'
import { EmptyState } from '@/components/ui/EmptyState'
import { AnimatedProgressRing } from '@/components/ui/Progress'
import type { EmergencyFund } from '@/types'

export function Goal({ fund, large = false }: { fund: EmergencyFund | null; large?: boolean }) {
  if (!fund) return <EmptyState compact={!large} title="No emergency fund yet" copy="Choose a currency and target to start building your safety net." />
  const percent = Math.min(100, Math.round((fund.current_minor / fund.target_minor) * 100))

  return (
    <div className={`flex items-center max-[540px]:gap-4 ${large ? 'justify-center gap-5 px-3 py-6' : 'gap-5 px-1 pt-4 pb-1'}`}>
      <AnimatedProgressRing className={large ? 'size-32' : 'size-24.5 max-[540px]:size-22'} value={percent} />
      <div className="flex flex-col"><strong className="font-heading text-xl font-bold"><AnimatedMoney currency={fund.currency} value={fund.current_minor} /></strong><span className="mt-1 text-[10px] text-muted">saved of <AnimatedMoney currency={fund.currency} value={fund.target_minor} /></span><p className="mt-3.5 mb-0 text-[10px] font-bold text-[#4d765e]"><AnimatedMoney currency={fund.currency} value={fund.target_minor - fund.current_minor} /> to go</p></div>
    </div>
  )
}
