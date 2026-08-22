import { ArrowDownRight, ArrowUpRight, CircleDollarSign } from 'lucide-react'
import { EmptyState } from '../../../components/ui/EmptyState'
import { formatMoney } from '../../../lib/format'
import type { Transaction } from '../../../types'
import { categoryIcons } from '../icons'

function TransactionItem({ transaction }: { transaction: Transaction }) {
  const Icon = categoryIcons[transaction.category] ?? CircleDollarSign
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-[#edf0e9] py-2.5 last:border-b-0">
      <div className="grid size-8.5 shrink-0 place-items-center rounded-[10px] bg-[#f2f3ed] text-[#496153]"><Icon size={17} /></div>
      <div className="flex min-w-0 flex-col"><strong className="overflow-hidden text-[11px] text-ellipsis whitespace-nowrap">{transaction.description || transaction.category}</strong><span className="mt-1 text-[9px] text-muted">{transaction.category} · {new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(transaction.occurred_at))}</span></div>
      <b className={`text-[11px] ${transaction.type === 'expense' ? 'text-[#a85845]' : 'text-[#347051]'}`}>{transaction.type === 'expense' ? '−' : '+'}{formatMoney(transaction.amount_minor, transaction.currency)}</b>
    </div>
  )
}

export function TransactionList({ transactions }: { transactions: Transaction[] }) {
  if (!transactions.length) return <EmptyState compact title="No activity yet" copy="Your latest income and expenses will appear here." />
  return <div className="grid">{transactions.map((transaction) => <TransactionItem key={transaction.id} transaction={transaction} />)}</div>
}

export function TransactionTable({ transactions, filter }: { transactions: Transaction[]; filter: 'all' | Transaction['type'] }) {
  if (!transactions.length) {
    const label = filter === 'all' ? 'transactions' : filter === 'expense' ? 'expenses' : 'income'
    return <EmptyState title={`No ${label} yet`} copy={filter === 'all' ? 'Add your first transaction to start building a financial history.' : `Recorded ${label} will appear in this view.`} />
  }

  return (
    <div className="grid">
      <div className="grid min-h-8.5 grid-cols-[1.5fr_1fr_.8fr_.7fr] items-center gap-4 text-[9px] font-bold text-[#a0aaa4] uppercase max-[540px]:grid-cols-[1.4fr_.8fr] max-[540px]:[&>span:nth-child(2)]:hidden max-[540px]:[&>span:nth-child(3)]:hidden"><span>Transaction</span><span>Category</span><span>Date</span><span className="text-right">Amount</span></div>
      {transactions.map((transaction) => (
        <div className="grid min-h-15.5 grid-cols-[1.5fr_1fr_.8fr_.7fr] items-center gap-4 border-t border-[#edf0e9] text-[10px] text-muted max-[540px]:grid-cols-[1.4fr_.8fr] max-[540px]:[&>span:nth-child(2)]:hidden max-[540px]:[&>span:nth-child(3)]:hidden" key={transaction.id}>
          <span className="flex items-center gap-2.5 text-ink"><span className="grid size-8.5 shrink-0 place-items-center rounded-[10px] bg-[#f2f3ed] text-[#496153]">{transaction.type === 'expense' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}</span><strong>{transaction.description || transaction.category}</strong></span>
          <span>{transaction.category}</span>
          <span>{new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(transaction.occurred_at))}</span>
          <b className={`text-right text-[11px] ${transaction.type === 'expense' ? 'text-[#a85845]' : 'text-[#347051]'}`}>{transaction.type === 'expense' ? '−' : '+'}{formatMoney(transaction.amount_minor, transaction.currency)}</b>
        </div>
      ))}
    </div>
  )
}
