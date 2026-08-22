import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, MoreHorizontal, Sparkles, Target } from 'lucide-react'
import { Card, CardTitle } from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/EmptyState'
import { PageHeader } from '../../../components/ui/PageHeader'
import { formatMoney } from '../../../lib/format'
import type { User } from '../../../types'
import { BudgetRow } from '../components/BudgetRow'
import { Goal } from '../components/Goal'
import { TransactionList } from '../components/Transactions'
import { TransactionDialog } from '../dialogs/TransactionDialog'
import type { FinanceActions, View } from '../types'

function MetricCard({ label, value, change, icon, tone }: { label: string; value: string; change: string; icon: ReactNode; tone: 'mint' | 'peach' | 'lilac' }) {
  return <Card className="flex min-h-36 flex-col justify-center max-[1100px]:last:col-span-2 max-[820px]:last:col-auto"><div className={`grid size-9 place-items-center rounded-[11px] [&_svg]:w-4 ${tone === 'mint' ? 'bg-mint text-[#387042]' : tone === 'peach' ? 'bg-peach text-[#a85b3c]' : 'bg-lilac text-[#66569a]'}`}>{icon}</div><span className="mt-4 text-[11px] text-muted">{label}</span><strong className="my-1 font-heading text-[21px] font-bold tracking-[-.6px]">{value}</strong><small className="text-[9px] text-[#9aa39d]">{change}</small></Card>
}

export function OverviewPage({ user, onView, ...actions }: FinanceActions & { user: User; onView: (view: View) => void }) {
  const { data } = actions
  const income = data.transactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount_minor, 0)
  const spending = data.transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount_minor, 0)
  const primaryBalance = data.dashboard.balances[0] ?? { balance_minor: 0, currency: 'UAH' }
  const savingsRate = income > 0 ? Math.max(0, Math.round(((income - spending) / income) * 100)) : 0
  const hasAccounts = data.accounts.length > 0

  return <>
    <PageHeader eyebrow={new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())} title={`Good morning, ${user.name}.`} subtitle="Here’s what your money is doing today."><TransactionDialog {...actions} disabled={!hasAccounts} /></PageHeader>
    <section className="mb-3.5 grid grid-cols-[1.6fr_repeat(3,1fr)] gap-3.5 max-[1100px]:grid-cols-[1.4fr_1fr_1fr] max-[820px]:grid-cols-2 max-[540px]:grid-cols-1">
      <div className="row-span-2 rounded-[18px] border border-brand bg-brand p-6 text-white shadow-[0_16px_32px_rgba(21,63,46,.16)] max-[820px]:col-span-2 max-[820px]:row-auto max-[540px]:col-auto">
        <div className="flex items-center justify-between text-xs text-white/60"><span>Total balance</span><button className="cursor-pointer border-0 bg-transparent text-white" aria-label="Balance options"><MoreHorizontal size={20} /></button></div>
        <strong className="my-6 block font-heading text-[clamp(30px,3vw,43px)] leading-none font-bold tracking-[-1.8px]">{hasAccounts ? formatMoney(primaryBalance.balance_minor, primaryBalance.currency) : 'No accounts yet'}</strong>
        <p className="m-0 text-[11px] text-white/55">{hasAccounts ? `Across ${data.accounts.length} ${data.accounts.length === 1 ? 'account' : 'accounts'}` : 'Add an account to start building your overview.'}</p>
        <div className="mt-7 grid gap-2.5 border-t border-white/12 pt-4.5">{hasAccounts ? data.accounts.slice(0, 3).map((account, index) => <div className="grid grid-cols-[7px_1fr_auto] items-center gap-2 text-[11px]" key={account.id}><i className={`size-1.75 rounded-full ${index === 1 ? 'bg-[#ecba9e]' : index === 2 ? 'bg-[#a9a8e8]' : 'bg-lime'}`} /><span className="text-white/65">{account.name}</span><b>{formatMoney(account.balance_minor, account.currency, true)}</b></div>) : <button className="inline-flex cursor-pointer items-center gap-1 justify-self-start border-0 bg-transparent p-0 text-[11px] font-bold text-lime" onClick={() => onView('activity')}>Add your first account <ArrowUpRight size={14} /></button>}</div>
      </div>
      <MetricCard label="Income" value={formatMoney(income, 'UAH')} change={income ? 'Recorded this month' : 'No income recorded yet'} icon={<ArrowDownRight />} tone="mint" />
      <MetricCard label="Spent" value={formatMoney(spending, 'UAH')} change={spending ? 'Across all categories' : 'No expenses recorded yet'} icon={<ArrowUpRight />} tone="peach" />
      <MetricCard label="Savings rate" value={income ? `${savingsRate}%` : '—'} change={income ? 'Healthy target: 20%' : 'Add income to calculate'} icon={<Target />} tone="lilac" />
    </section>
    <section className="grid grid-cols-[1.45fr_.75fr] gap-3.5 max-[820px]:grid-cols-1">
      <Card><CardTitle title="Budget pace" action="View plans" onAction={() => onView('plans')} />{data.budgets.length ? <div className="grid gap-5">{data.budgets.map((budget) => <BudgetRow key={budget.id} budget={budget} />)}</div> : <EmptyState compact title="No budgets yet" copy="Set a monthly category limit to see your spending pace." action="Plan spending" onAction={() => onView('plans')} />}</Card>
      <Card className="relative overflow-hidden border-[#345c47] bg-[#345c47] text-white after:absolute after:right-[-55px] after:bottom-[-65px] after:size-37.5 after:rounded-full after:border-24 after:border-lime/12 after:content-['']"><div className="mb-7 grid size-10.5 place-items-center rounded-[14px] bg-lime text-brand"><Sparkles size={22} /></div><span className="mb-2 block text-[10px] font-extrabold tracking-[.14em] text-white/60 uppercase">Finlo insight</span><h3 className="my-2 max-w-62.5 font-heading text-xl font-bold">{data.dashboard.insights[0]?.title ?? 'Ready when you are'}</h3><p className="mt-0 mb-6 max-w-77.5 text-[11px] leading-[1.55] text-white/70">{data.dashboard.insights[0]?.message ?? 'Add accounts, transactions, and a budget to unlock useful financial guidance.'}</p></Card>
      <Card className="min-h-80"><CardTitle title="Recent activity" action="See all" onAction={() => onView('activity')} /><TransactionList transactions={data.transactions.slice(0, 5)} /></Card>
      <Card className="min-h-80"><CardTitle title="Emergency fund" action="Manage" onAction={() => onView('plans')} /><Goal fund={data.dashboard.emergency_fund} /></Card>
    </section>
  </>
}
