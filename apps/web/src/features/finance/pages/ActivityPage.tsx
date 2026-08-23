import * as Tabs from '@radix-ui/react-tabs'
import { Card } from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/EmptyState'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SegmentedList, SegmentedTrigger } from '../../../components/ui/SegmentedControl'
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
    {data.accounts.length ? <div className="mb-2.5 grid grid-cols-3 gap-2.5 max-[820px]:grid-cols-2 max-[540px]:grid-cols-1">{data.accounts.map((account) => { const Icon = accountIcons[account.type]; return <Card key={account.id} className="grid grid-cols-[auto_1fr] items-center gap-x-2.5 gap-y-0.5"><div className="row-span-3 grid size-8.5 place-items-center rounded-[10px] bg-[#edf2e9] text-brand"><Icon size={18} /></div><span className="text-[9px] text-muted">{account.name}</span><strong className="font-heading text-[17px] font-bold">{formatMoney(account.balance_minor, account.currency)}</strong><small className="text-[8px] text-[#a1aaa4] capitalize">{account.type} · {account.currency}</small></Card> })}</div> : <Card fill className="mb-2.5"><EmptyState title="Add your first account" copy="Accounts give transactions and balances a place to live. Use Add account above to get started." /></Card>}
    <Card fill><Tabs.Root className="flex flex-1 flex-col" defaultValue="all"><div className="flex items-center justify-between pb-3.5"><h3 className="m-0 font-heading text-sm font-bold">Transactions</h3><SegmentedList>{(['all', 'expense', 'income'] as const).map((filter) => <SegmentedTrigger className="capitalize max-[540px]:px-2" key={filter} value={filter}>{filter === 'all' ? 'All' : filter === 'expense' ? 'Expenses' : 'Income'}</SegmentedTrigger>)}</SegmentedList></div>{(['all', 'expense', 'income'] as const).map((filter) => <Tabs.Content className="flex flex-1 flex-col" key={filter} value={filter}><TransactionTable transactions={filter === 'all' ? data.transactions : data.transactions.filter((item) => item.type === filter)} filter={filter} /></Tabs.Content>)}</Tabs.Root></Card>
  </>
}
