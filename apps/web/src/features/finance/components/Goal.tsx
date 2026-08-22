import type { CSSProperties } from 'react'
import { EmptyState } from '../../../components/ui/EmptyState'
import { formatMoney } from '../../../lib/format'
import type { EmergencyFund } from '../../../types'

export function Goal({ fund, large = false }: { fund: EmergencyFund | null; large?: boolean }) {
  if (!fund) return <EmptyState compact={!large} title="No goal set" copy="Set a target to start tracking your safety net." />
  const percent = Math.min(100, Math.round((fund.current_minor / fund.target_minor) * 100))

  return (
    <div className={`flex items-center max-[540px]:gap-4 ${large ? 'justify-center gap-6 px-4.5 py-8.5' : 'gap-6 px-1 pt-5.5 pb-1.5'}`}>
      <div className={`relative grid shrink-0 place-items-center rounded-full bg-[conic-gradient(#77a576_var(--goal),#e9ede5_0)] before:absolute before:rounded-full before:bg-white before:content-[''] ${large ? 'size-37.5 before:size-28' : 'size-29 before:size-22 max-[540px]:size-24.5 max-[540px]:before:size-18.5'}`} style={{ '--goal': `${percent * 3.6}deg` } as CSSProperties}><span className="relative font-heading text-base font-bold">{percent}%</span></div>
      <div className="flex flex-col"><strong className="font-heading text-xl font-bold">{formatMoney(fund.current_minor, fund.currency)}</strong><span className="mt-1 text-[10px] text-muted">saved of {formatMoney(fund.target_minor, fund.currency)}</span><p className="mt-3.5 mb-0 text-[10px] font-bold text-[#4d765e]">{formatMoney(fund.target_minor - fund.current_minor, fund.currency)} to go</p></div>
    </div>
  )
}
