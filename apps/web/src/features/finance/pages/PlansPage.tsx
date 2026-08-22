import { Target } from 'lucide-react'
import { Card, CardTitle } from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/EmptyState'
import { PageHeader } from '../../../components/ui/PageHeader'
import { BudgetRow } from '../components/BudgetRow'
import { Goal } from '../components/Goal'
import { BudgetDialog } from '../dialogs/BudgetDialog'
import { EmergencyDialog } from '../dialogs/EmergencyDialog'
import type { FinanceActions } from '../types'

export function PlansPage(props: FinanceActions) {
  const { data } = props
  return <>
    <PageHeader eyebrow="Stay intentional" title="Plans & goals" subtitle="Give today’s money a job before the month gets busy."><EmergencyDialog {...props} /><BudgetDialog {...props} /></PageHeader>
    <section className="mb-3.5 grid grid-cols-[1.3fr_.7fr] gap-3.5 max-[820px]:grid-cols-1">
      <Card><CardTitle title="Emergency fund" /><Goal fund={data.dashboard.emergency_fund} large /></Card>
      <Card className="relative min-h-68.5 overflow-hidden bg-[#e9eedc]"><span className="mb-2 block text-[10px] font-extrabold tracking-[.14em] text-[#75837b] uppercase">Monthly plan</span><strong className="mt-11 block font-heading text-[64px] leading-none font-extrabold text-brand">{data.budgets.length}</strong><p className="my-1.5 text-[11px] text-muted">{data.budgets.length === 1 ? 'active category budget' : 'active category budgets'}</p><div className="absolute right-[-25px] bottom-[-25px] grid size-32.5 place-items-center rounded-full bg-lime text-brand"><Target size={34} /></div></Card>
    </section>
    <Card><CardTitle title="Category budgets" />{data.budgets.length ? <div className="grid grid-cols-2 gap-x-10.5 gap-y-7 max-[540px]:grid-cols-1">{data.budgets.map((budget) => <BudgetRow key={budget.id} budget={budget} />)}</div> : <EmptyState title="No category budgets" copy="Create a spending plan for this month with the Add budget button above." />}</Card>
  </>
}
