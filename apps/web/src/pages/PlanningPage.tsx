import { AnimatePresence } from 'motion/react'
import { BudgetDialog } from '@/components/dialogs/BudgetDialog'
import { SubscriptionDialog } from '@/components/dialogs/SubscriptionDialog'
import { BudgetRow } from '@/components/finance/BudgetRow'
import { AnimatedMoney, AnimatedNumber } from '@/components/ui/AnimatedValue'
import { Card, CardTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { MotionItem } from '@/components/ui/MotionItem'
import { PageHeader } from '@/components/ui/PageHeader'
import { formatShortDate, subscriptionNextBillingDate } from '@/lib/date'
import type { FinanceActions } from '@/types'

export function PlanningPage(props: FinanceActions) {
  const { data } = props
  const activeSubscriptions = data.subscriptions.filter((subscription) => subscription.active)
  const subscriptionCurrency = activeSubscriptions[0]?.currency ?? 'UAH'
  const monthlySubscriptions = activeSubscriptions.filter((subscription) => subscription.currency === subscriptionCurrency).reduce((sum, subscription) => sum + subscription.amount_minor, 0)
  const today = new Date()
  const nextRenewal = activeSubscriptions.map((subscription) => subscriptionNextBillingDate(subscription, today)).sort((left, right) => left.getTime() - right.getTime())[0]

  return <>
    <PageHeader eyebrow="Plan the month ahead" title="Planning" subtitle="Set spending boundaries and keep recurring commitments visible."><SubscriptionDialog triggerVariant="secondary" {...props} /><BudgetDialog {...props} /></PageHeader>
    <section className="mb-2.5 grid grid-cols-3 overflow-hidden rounded-[15px] border border-line bg-brand text-white max-[540px]:grid-cols-1 [&>div]:flex [&>div]:flex-col [&>div]:gap-1.5 [&>div]:border-r [&>div]:border-white/12 [&>div]:p-4.5 max-[540px]:[&>div]:border-r-0 max-[540px]:[&>div]:border-b [&>div:last-child]:border-r-0 max-[540px]:[&>div:last-child]:border-b-0 [&_span]:text-[9px] [&_span]:text-white/60 [&_strong]:font-heading [&_strong]:text-xl [&_strong]:font-bold">
      <div><span>Category budgets</span><strong><AnimatedNumber value={data.budgets.length} /></strong></div>
      <div><span>Monthly subscriptions</span><strong><AnimatedMoney currency={subscriptionCurrency} value={monthlySubscriptions} /></strong></div>
      <div><span>Next renewal</span><strong>{nextRenewal ? formatShortDate(nextRenewal) : '—'}</strong></div>
    </section>
    <Card fill className="mb-2.5"><CardTitle title="Category budgets" />{data.budgets.length ? <div className="grid grid-cols-2 gap-x-8 gap-y-5 max-[540px]:grid-cols-1"><AnimatePresence initial={false}>{data.budgets.map((budget) => <MotionItem key={budget.id}><BudgetRow budget={budget} /></MotionItem>)}</AnimatePresence></div> : <EmptyState title="No category budgets" copy="Create a spending plan for this month with the Add budget button above." />}</Card>
    <Card fill><CardTitle title="Recurring payments" />{data.subscriptions.length ? <div className="grid grid-cols-2 gap-2.5 max-[820px]:grid-cols-1"><AnimatePresence initial={false}>{data.subscriptions.map((subscription, index) => <MotionItem className="h-full" key={subscription.id}><div className="grid h-full grid-cols-[auto_1fr_auto] items-center gap-2.5 rounded-xl border border-line bg-[#fbfcf8] p-3"><div className={`grid size-9.5 place-items-center rounded-[11px] font-heading text-base font-extrabold ${index % 3 === 0 ? 'bg-mint text-brand' : index % 3 === 1 ? 'bg-lilac text-[#594d86]' : 'bg-peach text-[#98583e]'}`}>{subscription.name[0]}</div><div className="flex min-w-0 flex-col"><strong className="overflow-hidden text-[11px] text-ellipsis whitespace-nowrap">{subscription.name}</strong><span className="mt-0.5 text-[8px] text-muted">{subscription.active ? `Renews ${formatShortDate(subscriptionNextBillingDate(subscription, today))}` : 'Paused'}</span></div><b className="text-[10px]"><AnimatedMoney currency={subscription.currency} value={subscription.amount_minor} /></b></div></MotionItem>)}</AnimatePresence></div> : <EmptyState title="No subscriptions yet" copy="Add recurring services to understand how much is already committed each month." />}</Card>
  </>
}
