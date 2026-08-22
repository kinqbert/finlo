import { useState, type FormEvent } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Tabs from '@radix-ui/react-tabs'
import { Plus } from 'lucide-react'
import { createTransaction } from '../../../api'
import { DialogForm, FinanceDialog, FormField, MoneyInput } from '../../../components/ui/FinanceDialog'
import { InlineError, SubmitButton } from '../../../components/ui/Feedback'
import { errorMessage } from '../../../lib/format'
import type { Transaction } from '../../../types'
import type { FinanceActions } from '../types'

export function TransactionDialog(props: FinanceActions & { disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<Transaction['type']>('expense')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const amountMinor = Math.round(Number(form.get('amount')) * 100)
    const account = props.data.accounts.find((item) => item.id === form.get('account'))
    if (!account) { setError('Add an account before recording a transaction.'); return }
    if (amountMinor <= 0) { setError('Enter an amount greater than zero.'); return }
    setBusy(true)
    setError('')
    try {
      if (props.isDemo) {
        const transaction: Transaction = { id: crypto.randomUUID(), account_id: account.id, type, amount_minor: amountMinor, currency: account.currency, category: String(form.get('category')), description: String(form.get('description')), occurred_at: new Date().toISOString(), source: 'manual' }
        const next = structuredClone(props.data)
        next.transactions.unshift(transaction)
        next.dashboard.recent_transactions.unshift(transaction)
        const target = next.accounts.find((item) => item.id === account.id)
        if (target) target.balance_minor += type === 'income' ? amountMinor : -amountMinor
        next.dashboard.balances = [{ currency: account.currency, balance_minor: next.accounts.filter((item) => item.currency === account.currency).reduce((sum, item) => sum + item.balance_minor, 0) }]
        props.onDemoChange(next)
      } else {
        await createTransaction({ account_id: account.id, type, amount_minor: amountMinor, category: String(form.get('category')), description: String(form.get('description')), occurred_at: new Date().toISOString() })
        await props.onCreated()
      }
      setOpen(false)
    } catch (caught) { setError(errorMessage(caught, 'Could not add transaction.')) } finally { setBusy(false) }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!busy) { setOpen(next); setError('') } }}>
      <Dialog.Trigger asChild><button className="inline-flex min-h-10.5 cursor-pointer items-center justify-center gap-2 rounded-xl border border-brand bg-brand px-4 text-[13px] font-bold text-white shadow-[0_7px_18px_rgba(21,63,46,.16)] hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60" disabled={props.disabled} title={props.disabled ? 'Add an account first' : undefined}><Plus size={17} /> Add transaction</button></Dialog.Trigger>
      <FinanceDialog busy={busy} eyebrow="Quick entry" title="Add a transaction" description="Finlo updates the selected account balance automatically.">
        <Tabs.Root value={type} onValueChange={(value) => { setType(value as Transaction['type']); setError('') }}>
          <Tabs.List className="my-5 flex gap-1 rounded-[10px] bg-[#f0f2ec] p-1"><Tabs.Trigger className="flex-1 cursor-pointer rounded-[7px] border-0 bg-transparent px-3 py-2 text-[10px] font-bold text-muted data-[state=active]:bg-white data-[state=active]:text-ink data-[state=active]:shadow-[0_2px_7px_rgba(0,0,0,.05)]" value="expense" disabled={busy}>Expense</Tabs.Trigger><Tabs.Trigger className="flex-1 cursor-pointer rounded-[7px] border-0 bg-transparent px-3 py-2 text-[10px] font-bold text-muted data-[state=active]:bg-white data-[state=active]:text-ink data-[state=active]:shadow-[0_2px_7px_rgba(0,0,0,.05)]" value="income" disabled={busy}>Income</Tabs.Trigger></Tabs.List>
        </Tabs.Root>
        <DialogForm onSubmit={submit}>
          <FormField label="Amount"><MoneyInput><input name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" disabled={busy} required /></MoneyInput></FormField>
          <div className="flex gap-3 max-[540px]:flex-col">
            <FormField label="Account"><select name="account" disabled={busy} required>{props.data.accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></FormField>
            <FormField label="Category"><select key={type} name="category" defaultValue={type === 'expense' ? 'Groceries' : 'Salary'} disabled={busy}>{(type === 'expense' ? ['Groceries', 'Dining', 'Transport', 'Health', 'Subscriptions', 'Other'] : ['Salary', 'Freelance', 'Gift', 'Other']).map((item) => <option key={item}>{item}</option>)}</select></FormField>
          </div>
          <FormField label="Note"><input name="description" placeholder="What was this for?" disabled={busy} /></FormField>
          <InlineError message={error} />
          <SubmitButton busy={busy} label={`Add ${type}`} busyLabel={`Adding ${type}…`} />
        </DialogForm>
      </FinanceDialog>
    </Dialog.Root>
  )
}
