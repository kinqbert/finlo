import * as Tabs from '@radix-ui/react-tabs'
import { Card } from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/EmptyState'
import { PageHeader } from '../../../components/ui/PageHeader'
import { formatMoney } from '../../../lib/format'
import { TransactionTable } from '../components/Transactions'
import { AccountDialog } from '../dialogs/AccountDialog'
import { TransactionDialog } from '../dialogs/TransactionDialog'
import { accountIcons } from '../icons'
import type { FinanceActions } from '../types'

export function ActivityPage(props: FinanceActions) {
  const { data } = props
  return <>
    <PageHeader eyebrow="Money in motion" title="Accounts & activity" subtitle="Every balance and transaction, in one place."><AccountDialog {...props} /><TransactionDialog {...props} disabled={!data.accounts.length} /></PageHeader>
    {data.accounts.length ? <div className="mb-3.5 grid grid-cols-3 gap-3.5 max-[820px]:grid-cols-2 max-[540px]:grid-cols-1">{data.accounts.map((account) => { const Icon = accountIcons[account.type]; return <Card key={account.id} className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1"><div className="row-span-3 grid size-9 place-items-center rounded-[11px] bg-[#edf2e9] text-brand"><Icon size={20} /></div><span className="text-[10px] text-muted">{account.name}</span><strong className="font-heading text-[19px] font-bold">{formatMoney(account.balance_minor, account.currency)}</strong><small className="text-[9px] text-[#a1aaa4] capitalize">{account.type} · {account.currency}</small></Card> })}</div> : <Card className="mb-3.5"><EmptyState title="Add your first account" copy="Accounts give transactions and balances a place to live. Use Add account above to get started." /></Card>}
    <Card><Tabs.Root defaultValue="all"><div className="flex items-center justify-between pb-4.5"><h3 className="m-0 font-heading text-[15px] font-bold">Transactions</h3><Tabs.List className="flex gap-1 rounded-[10px] bg-[#f0f2ec] p-1">{(['all', 'expense', 'income'] as const).map((filter) => <Tabs.Trigger className="cursor-pointer rounded-[7px] border-0 bg-transparent px-3 py-2 text-[10px] font-bold text-muted capitalize data-[state=active]:bg-white data-[state=active]:text-ink data-[state=active]:shadow-[0_2px_7px_rgba(0,0,0,.05)] max-[540px]:px-2" key={filter} value={filter}>{filter === 'all' ? 'All' : filter === 'expense' ? 'Expenses' : 'Income'}</Tabs.Trigger>)}</Tabs.List></div>{(['all', 'expense', 'income'] as const).map((filter) => <Tabs.Content key={filter} value={filter}><TransactionTable transactions={filter === 'all' ? data.transactions : data.transactions.filter((item) => item.type === filter)} filter={filter} /></Tabs.Content>)}</Tabs.Root></Card>
  </>
}
