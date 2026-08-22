import { MoreHorizontal } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/EmptyState'
import { PageHeader } from '../../../components/ui/PageHeader'
import { formatMoney } from '../../../lib/format'
import { SubscriptionDialog } from '../dialogs/SubscriptionDialog'
import type { FinanceActions } from '../types'

export function SubscriptionsPage(props: FinanceActions) {
  const { data } = props
  const activeSubscriptions = data.subscriptions.filter((subscription) => subscription.active)
  const monthly = activeSubscriptions.reduce((sum, subscription) => sum + subscription.amount_minor, 0)
  const nextBillingDay = activeSubscriptions.length ? Math.min(...activeSubscriptions.map((subscription) => subscription.billing_day)) : null
  return <>
    <PageHeader eyebrow="Recurring expenses" title="Subscriptions" subtitle="Know what renews before it leaves your account."><SubscriptionDialog {...props} /></PageHeader>
    <section className="mb-3.5 grid grid-cols-3 overflow-hidden rounded-[18px] border border-line bg-brand text-white max-[540px]:grid-cols-1 [&>div]:flex [&>div]:flex-col [&>div]:gap-2 [&>div]:border-r [&>div]:border-white/12 [&>div]:p-6 max-[540px]:[&>div]:border-r-0 max-[540px]:[&>div]:border-b [&>div:last-child]:border-r-0 max-[540px]:[&>div:last-child]:border-b-0 [&_span]:text-[10px] [&_span]:text-white/60 [&_strong]:font-heading [&_strong]:text-[23px] [&_strong]:font-bold"><div><span>Monthly total</span><strong>{formatMoney(monthly, activeSubscriptions[0]?.currency ?? 'UAH')}</strong></div><div><span>Active services</span><strong>{activeSubscriptions.length}</strong></div><div><span>Next renewal</span><strong>{nextBillingDay ? `Day ${nextBillingDay}` : '—'}</strong></div></section>
    {data.subscriptions.length ? <div className="grid grid-cols-2 gap-3.5 max-[820px]:grid-cols-1">{data.subscriptions.map((subscription, index) => <Card key={subscription.id} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3.5"><div className={`grid size-11 place-items-center rounded-[13px] font-heading text-lg font-extrabold ${index % 3 === 0 ? 'bg-mint text-brand' : index % 3 === 1 ? 'bg-lilac text-[#594d86]' : 'bg-peach text-[#98583e]'}`}>{subscription.name[0]}</div><div className="flex flex-col"><strong className="text-xs">{subscription.name}</strong><span className="mt-1 text-[9px] text-muted">{subscription.active ? `Renews on day ${subscription.billing_day}` : 'Paused'}</span></div><b className="text-[11px]">{formatMoney(subscription.amount_minor, subscription.currency)}</b><button className="border-0 bg-transparent text-muted" aria-label={`${subscription.name} options`}><MoreHorizontal size={18} /></button></Card>)}</div> : <Card className="mb-3.5"><EmptyState title="No subscriptions yet" copy="Add recurring services to understand how much is already committed each month." /></Card>}
  </>
}
