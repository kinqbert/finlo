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
    <section className="mb-2.5 grid grid-cols-[1.3fr_.7fr] gap-2.5 max-[820px]:grid-cols-1">
      <Card fill><CardTitle title="Emergency fund" /><Goal fund={data.dashboard.emergency_fund} large /></Card>
      <Card tone="soft-green" className="relative min-h-55 overflow-hidden"><span className="mb-1.5 block text-[9px] font-extrabold tracking-[.14em] text-[#75837b] uppercase">Monthly plan</span><strong className="mt-8 block font-heading text-[52px] leading-none font-extrabold text-brand">{data.budgets.length}</strong><p className="my-1 text-[10px] text-muted">{data.budgets.length === 1 ? 'active category budget' : 'active category budgets'}</p><div className="absolute right-[-22px] bottom-[-22px] grid size-27.5 place-items-center rounded-full bg-lime text-brand"><Target size={30} /></div></Card>
    </section>
    <Card fill><CardTitle title="Category budgets" />{data.budgets.length ? <div className="grid grid-cols-2 gap-x-8 gap-y-5 max-[540px]:grid-cols-1">{data.budgets.map((budget) => <BudgetRow key={budget.id} budget={budget} />)}</div> : <EmptyState title="No category budgets" copy="Create a spending plan for this month with the Add budget button above." />}</Card>
  </>
}
