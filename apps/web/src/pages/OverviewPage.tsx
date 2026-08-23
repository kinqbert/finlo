import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, MoreHorizontal, Sparkles, Target } from 'lucide-react'
import { Link } from 'react-router'
import { TransactionDialog } from '@/components/dialogs/TransactionDialog'
import { BudgetRow } from '@/components/finance/BudgetRow'
import { Goal } from '@/components/finance/Goal'
import { TransactionList } from '@/components/finance/Transactions'
import { AnimatedMoney, AnimatedNumber } from '@/components/ui/AnimatedValue'
import { Card, CardTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { routes } from '@/constants/routes'
import type { FinanceActions, User } from '@/types'

function MetricCard({ label, value, change, icon, tone }: { label: string; value: ReactNode; change: string; icon: ReactNode; tone: 'mint' | 'peach' | 'lilac' }) {
  return <Card className="flex min-h-29 flex-col justify-center max-[1100px]:last:col-span-2 max-[820px]:last:col-auto"><div className={`grid size-8 place-items-center rounded-[10px] [&_svg]:w-3.5 ${tone === 'mint' ? 'bg-mint text-[#387042]' : tone === 'peach' ? 'bg-peach text-[#a85b3c]' : 'bg-lilac text-[#66569a]'}`}>{icon}</div><span className="mt-3 text-[10px] text-muted">{label}</span><strong className="my-0.5 font-heading text-[18px] font-bold tracking-[-.5px]">{value}</strong><small className="text-[8px] text-[#9aa39d]">{change}</small></Card>
}

export function OverviewPage({ user, ...actions }: FinanceActions & { user: User }) {
  const { data } = actions
  const income = data.transactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount_minor, 0)
  const spending = data.transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount_minor, 0)
  const primaryBalance = data.dashboard.balances[0] ?? { balance_minor: 0, currency: 'UAH' }
  const savingsRate = income > 0 ? Math.max(0, Math.round(((income - spending) / income) * 100)) : 0
  const hasAccounts = data.accounts.length > 0

  return <>
    <PageHeader eyebrow={new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())} title={`Good morning, ${user.name}.`} subtitle="Here’s what your money is doing today."><TransactionDialog {...actions} disabled={!hasAccounts} /></PageHeader>
    <section className="mb-2.5 grid grid-cols-[1.6fr_repeat(3,1fr)] gap-2.5 max-[1100px]:grid-cols-[1.4fr_1fr_1fr] max-[820px]:grid-cols-2 max-[540px]:grid-cols-1">
      <div className="row-span-2 rounded-[15px] border border-brand bg-brand p-5 text-white shadow-[0_12px_26px_rgba(21,63,46,.14)] max-[820px]:col-span-2 max-[820px]:row-auto max-[540px]:col-auto">
        <div className="flex items-center justify-between text-[11px] text-white/60"><span>Total balance</span><button className="cursor-pointer border-0 bg-transparent text-white" aria-label="Balance options"><MoreHorizontal size={18} /></button></div>
        <strong className="my-5 block font-heading text-[clamp(28px,2.8vw,38px)] leading-none font-bold tracking-[-1.5px]">{hasAccounts ? <AnimatedMoney currency={primaryBalance.currency} value={primaryBalance.balance_minor} /> : 'No accounts yet'}</strong>
        <p className="m-0 text-[10px] text-white/55">{hasAccounts ? `Across ${data.accounts.length} ${data.accounts.length === 1 ? 'account' : 'accounts'}` : 'Add an account to start building your overview.'}</p>
        <div className="mt-5 grid gap-2 border-t border-white/12 pt-3.5">{hasAccounts ? data.accounts.slice(0, 3).map((account, index) => <div className="grid grid-cols-[7px_1fr_auto] items-center gap-2 text-[10px]" key={account.id}><i className={`size-1.5 rounded-full ${index === 1 ? 'bg-[#ecba9e]' : index === 2 ? 'bg-[#a9a8e8]' : 'bg-lime'}`} /><span className="text-white/65">{account.name}</span><b><AnimatedMoney compact currency={account.currency} value={account.balance_minor} /></b></div>) : <Link className="inline-flex items-center gap-1 justify-self-start text-[10px] font-bold text-lime no-underline" to={routes.accounts}>Add your first account <ArrowUpRight size={13} /></Link>}</div>
      </div>
      <MetricCard label="Income" value={<AnimatedMoney currency="UAH" value={income} />} change={income ? 'Recorded this month' : 'No income recorded yet'} icon={<ArrowDownRight />} tone="mint" />
      <MetricCard label="Spent" value={<AnimatedMoney currency="UAH" value={spending} />} change={spending ? 'Across all categories' : 'No expenses recorded yet'} icon={<ArrowUpRight />} tone="peach" />
      <MetricCard label="Savings rate" value={income ? <AnimatedNumber suffix="%" value={savingsRate} /> : '—'} change={income ? 'Healthy target: 20%' : 'Add income to calculate'} icon={<Target />} tone="lilac" />
    </section>
    <section className="grid grid-cols-[1.45fr_.75fr] gap-2.5 max-[820px]:grid-cols-1">
      <Card fill><CardTitle title="Budget pace" action="View planning" actionTo={routes.planning} />{data.budgets.length ? <div className="grid gap-4">{data.budgets.map((budget) => <BudgetRow key={budget.id} budget={budget} />)}</div> : <EmptyState compact title="No budgets yet" copy="Set a monthly category limit to see your spending pace." action="Plan spending" actionTo={routes.planning} />}</Card>
      <div className="relative overflow-hidden rounded-[15px] border border-[#345c47] bg-[#345c47] p-4.5 after:absolute after:right-[-55px] after:bottom-[-65px] after:size-37.5 after:rounded-full after:border-24 after:border-lime/12 after:content-['']"><div className="relative z-1 mb-5 grid size-9.5 place-items-center rounded-xl bg-lime text-brand"><Sparkles size={20} /></div><span className="relative z-1 mb-1.5 block text-[9px] font-extrabold tracking-[.14em] text-white/60 uppercase">Finlo insight</span><h3 className="relative z-1 my-1.5 max-w-62.5 font-heading text-lg font-bold text-white">{data.dashboard.insights[0]?.title ?? 'Ready when you are'}</h3><p className="relative z-1 mt-0 mb-4 max-w-77.5 text-[10px] leading-[1.5] text-white/70">{data.dashboard.insights[0]?.message ?? 'Add accounts, transactions, and a budget to unlock useful financial guidance.'}</p></div>
      <Card fill className="min-h-64"><CardTitle title="Recent activity" action="See all" actionTo={routes.accounts} /><TransactionList transactions={data.transactions.slice(0, 5)} /></Card>
      <Card fill className="min-h-64"><CardTitle title="Emergency fund" action="Manage" actionTo={routes.goals} /><Goal fund={data.dashboard.emergency_fund} /></Card>
    </section>
  </>
}
