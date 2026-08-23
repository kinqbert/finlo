import type { CSSProperties } from 'react'
import { EmptyState } from '../../../components/ui/EmptyState'
import { formatMoney } from '../../../lib/format'
import type { EmergencyFund } from '../../../types'

export function Goal({ fund, large = false }: { fund: EmergencyFund | null; large?: boolean }) {
  if (!fund) return <EmptyState compact={!large} title="No goal set" copy="Set a target to start tracking your safety net." />
  const percent = Math.min(100, Math.round((fund.current_minor / fund.target_minor) * 100))

  return (
    <div className={`flex items-center max-[540px]:gap-4 ${large ? 'justify-center gap-5 px-3 py-6' : 'gap-5 px-1 pt-4 pb-1'}`}>
      <div className={`relative grid shrink-0 place-items-center rounded-full bg-[conic-gradient(#77a576_var(--goal),#e9ede5_0)] before:absolute before:rounded-full before:bg-white before:content-[''] ${large ? 'size-32 before:size-24' : 'size-24.5 before:size-18.5 max-[540px]:size-22 max-[540px]:before:size-16.5'}`} style={{ '--goal': `${percent * 3.6}deg` } as CSSProperties}><span className="relative font-heading text-sm font-bold">{percent}%</span></div>
      <div className="flex flex-col"><strong className="font-heading text-xl font-bold">{formatMoney(fund.current_minor, fund.currency)}</strong><span className="mt-1 text-[10px] text-muted">saved of {formatMoney(fund.target_minor, fund.currency)}</span><p className="mt-3.5 mb-0 text-[10px] font-bold text-[#4d765e]">{formatMoney(fund.target_minor - fund.current_minor, fund.currency)} to go</p></div>
    </div>
  )
}
