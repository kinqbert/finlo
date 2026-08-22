import * as Progress from '@radix-ui/react-progress'
import { CircleDollarSign } from 'lucide-react'
import { formatMoney } from '../../../lib/format'
import type { Budget } from '../../../types'
import { categoryIcons } from '../icons'

export function BudgetRow({ budget }: { budget: Budget }) {
  const spent = budget.spent_minor ?? 0
  const percent = Math.min(100, Math.round((spent / budget.amount_minor) * 100))
  const Icon = categoryIcons[budget.category] ?? CircleDollarSign

  return (
    <div className="flex items-center gap-3">
      <div className="grid size-8.5 shrink-0 place-items-center rounded-[10px] bg-[#f2f3ed] text-[#496153]"><Icon size={17} /></div>
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex justify-between gap-2"><strong className="text-[11px]">{budget.category}</strong><span className="text-[9px] text-muted">{formatMoney(spent, budget.currency)} of {formatMoney(budget.amount_minor, budget.currency)}</span></div>
        <Progress.Root className="h-1.25 overflow-hidden rounded-full bg-[#eceee7]" value={percent}>
          <Progress.Indicator className={`h-full w-full rounded-[inherit] transition-transform ${percent > 75 ? 'bg-[#da936d]' : 'bg-[#6da278]'}`} style={{ transform: `translateX(-${100 - percent}%)` }} />
        </Progress.Root>
      </div>
      <b className="w-8 text-right text-[10px] text-muted">{percent}%</b>
    </div>
  )
}
