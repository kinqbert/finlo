import { ArrowDownRight, ArrowUpRight, CircleDollarSign } from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import { EmptyState } from '@/components/ui/EmptyState'
import { CategoryAssignmentDialog } from '@/components/dialogs/CategoryAssignmentDialog'
import { MotionItem } from '@/components/ui/MotionItem'
import { categoryIcons } from '@/constants/financeIcons'
import { formatMoney } from '@/lib/format'
import type { Category, Transaction } from '@/types'

function TransactionItem({ transaction, categories }: { transaction: Transaction; categories: Category[] }) {
  const Icon = categoryIcons[transaction.category] ?? CircleDollarSign
  return (
    <MotionItem className="grid grid-cols-[auto_1fr_auto] items-center gap-2.5 border-b border-[#edf0e9] py-2 last:border-b-0" highlight>
      <div className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-[#f2f3ed] text-[#496153]"><Icon size={16} /></div>
      <div className="flex min-w-0 flex-col"><strong className="overflow-hidden text-[11px] text-ellipsis whitespace-nowrap">{transaction.description || transaction.category}</strong><div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1"><span className="text-[9px] text-muted">{transaction.category} · {new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(transaction.occurred_at))}{transaction.pending ? ' · Pending' : ''}</span>{transaction.category_needs_review && <CategoryAssignmentDialog transaction={transaction} categories={categories} />}</div></div>
      <b className={`text-[11px] ${transaction.type === 'expense' ? 'text-[#a85845]' : 'text-[#347051]'}`}>{transaction.type === 'expense' ? '−' : '+'}{formatMoney(transaction.amount_minor, transaction.currency)}</b>
    </MotionItem>
  )
}

export function TransactionList({ transactions, categories }: { transactions: Transaction[]; categories: Category[] }) {
  if (!transactions.length) return <EmptyState compact title="No activity yet" copy="Your latest income and expenses will appear here." />
  return <div className="grid"><AnimatePresence initial={false}>{transactions.map((transaction) => <TransactionItem key={transaction.id} transaction={transaction} categories={categories} />)}</AnimatePresence></div>
}

export function TransactionTable({ transactions, categories, filter }: { transactions: Transaction[]; categories: Category[]; filter: 'all' | Transaction['type'] }) {
  if (!transactions.length) {
    const label = filter === 'all' ? 'transactions' : filter === 'expense' ? 'expenses' : 'income'
    return <EmptyState title={`No ${label} yet`} copy={filter === 'all' ? 'Add your first transaction to start building a financial history.' : `Recorded ${label} will appear in this view.`} />
  }

  return (
    <div className="grid">
      <div className="grid min-h-7.5 grid-cols-[1.5fr_1fr_.8fr_.7fr] items-center gap-3 text-[8px] font-bold text-[#a0aaa4] uppercase max-[540px]:grid-cols-[1.4fr_.8fr] max-[540px]:[&>span:nth-child(2)]:hidden max-[540px]:[&>span:nth-child(3)]:hidden"><span>Transaction</span><span>Category</span><span>Date</span><span className="text-right">Amount</span></div>
      <AnimatePresence initial={false}>{transactions.map((transaction) => (
        <MotionItem className="grid min-h-13 grid-cols-[1.5fr_1fr_.8fr_.7fr] items-center gap-3 border-t border-[#edf0e9] text-[10px] text-muted max-[540px]:grid-cols-[1.4fr_.8fr] max-[540px]:[&>span:nth-child(2)]:hidden max-[540px]:[&>span:nth-child(3)]:hidden" highlight key={transaction.id}>
          <span className="flex items-center gap-2 text-ink"><span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-[#f2f3ed] text-[#496153]">{transaction.type === 'expense' ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}</span><span><strong className="block">{transaction.description || transaction.category}</strong>{transaction.category_needs_review && <CategoryAssignmentDialog triggerClassName="mt-1" transaction={transaction} categories={categories} />}</span></span>
          <span>{transaction.category}{transaction.pending && <small className="ml-1 text-[8px] text-muted">pending</small>}</span>
          <span>{new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(transaction.occurred_at))}</span>
          <b className={`text-right text-[11px] ${transaction.type === 'expense' ? 'text-[#a85845]' : 'text-[#347051]'}`}>{transaction.type === 'expense' ? '−' : '+'}{formatMoney(transaction.amount_minor, transaction.currency)}</b>
        </MotionItem>
      ))}</AnimatePresence>
    </div>
  )
}
