import { Target } from 'lucide-react'
import { EmergencyDialog } from '@/components/dialogs/EmergencyDialog'
import { GoalDialog } from '@/components/dialogs/GoalDialog'
import { Goal } from '@/components/finance/Goal'
import { Card, CardTitle } from '@/components/ui/Card'
import { AnimatedMoney } from '@/components/ui/AnimatedValue'
import { EmptyState } from '@/components/ui/EmptyState'
import { AnimatedProgressRing } from '@/components/ui/Progress'
import { PageHeader } from '@/components/ui/PageHeader'
import type { FinanceActions } from '@/types'

export function GoalsPage(props: FinanceActions) {
  return <>
    <PageHeader eyebrow="Build financial resilience" title="Goals" subtitle="Build your safety net and save for the things that matter."><EmergencyDialog {...props} /><GoalDialog {...props} /></PageHeader>
    <section className="grid grid-cols-[.8fr_1.2fr] items-stretch gap-2.5 max-[900px]:grid-cols-1">
      <Card fill><CardTitle title="Emergency fund" /><Goal fund={props.data.dashboard.emergency_fund} /></Card>
      <Card fill><CardTitle title="Savings goals" />
        {props.data.goals.length ? <div className="grid grid-cols-2 gap-2.5 max-[540px]:grid-cols-1">{props.data.goals.map((goal) => {
          const progress = goal.target_minor ? Math.min(100, Math.round((goal.current_minor / goal.target_minor) * 100)) : 0
          return <div className="flex items-center gap-3 rounded-xl border border-line p-3" key={goal.id}>{goal.target_minor ? <AnimatedProgressRing className="size-14 shrink-0" value={progress} /> : <div className="grid size-14 shrink-0 place-items-center rounded-full bg-[#edf2e9] text-brand"><Target size={20} /></div>}<div className="min-w-0"><strong className="block truncate text-xs">{goal.name}</strong><b className="mt-1 block text-sm"><AnimatedMoney currency={goal.currency} value={goal.current_minor} /></b><small className="text-[9px] text-muted">{goal.target_minor ? <>of <AnimatedMoney currency={goal.currency} value={goal.target_minor} /></> : 'No target set'} · {goal.source === 'monobank' ? 'Monobank jar' : 'Manual'}</small></div></div>
        })}</div> : <EmptyState compact title="No savings goals yet" copy="Add a goal for something you want, or connect a Monobank jar." />}
      </Card>
    </section>
  </>
}
