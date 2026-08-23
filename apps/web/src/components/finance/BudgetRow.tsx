import { CircleDollarSign } from 'lucide-react'
import { AnimatedMoney, AnimatedNumber } from '@/components/ui/AnimatedValue'
import { AnimatedProgressBar } from '@/components/ui/Progress'
import { categoryIcons } from '@/constants/financeIcons'
import type { Budget } from '@/types'

export function BudgetRow({ budget }: { budget: Budget }) {
  const spent = budget.spent_minor ?? 0
  const percent = Math.min(100, Math.round((spent / budget.amount_minor) * 100))
  const Icon = categoryIcons[budget.category] ?? CircleDollarSign

  return (
    <div className="flex items-center gap-3">
      <div className="grid size-8.5 shrink-0 place-items-center rounded-[10px] bg-[#f2f3ed] text-[#496153]"><Icon size={17} /></div>
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex justify-between gap-2"><strong className="text-[11px]">{budget.category}</strong><span className="text-[9px] text-muted"><AnimatedMoney currency={budget.currency} value={spent} /> of <AnimatedMoney currency={budget.currency} value={budget.amount_minor} /></span></div>
        <AnimatedProgressBar value={percent} warning={percent > 75} />
      </div>
      <b className="w-8 text-right text-[10px] text-muted"><AnimatedNumber suffix="%" value={percent} /></b>
    </div>
  )
}
