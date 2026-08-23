import { useState, type FormEvent } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Tabs from '@radix-ui/react-tabs'
import { Plus } from 'lucide-react'
import { createTransaction } from '../../../api'
import { Button } from '../../../components/ui/Button'
import { DialogForm, FinanceDialog, FormField, MoneyInput } from '../../../components/ui/FinanceDialog'
import { InlineError, SubmitButton } from '../../../components/ui/Feedback'
import { SegmentedList, SegmentedTrigger } from '../../../components/ui/SegmentedControl'
import { errorMessage } from '../../../lib/format'
import type { Transaction } from '../../../types'
import type { FinanceActions } from '../types'
import { useFinanceMutation } from '../useFinanceMutation'

export function TransactionDialog(props: FinanceActions & { disabled?: boolean }) {
  const createMutation = useFinanceMutation(createTransaction)
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<Transaction['type']>('expense')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const categoryNames = props.data.categories.filter((category) => category.type === type).sort((a, b) => a.sort_order - b.sort_order).map((category) => category.name)
  const availableCategories = categoryNames.length ? categoryNames : type === 'expense' ? ['Groceries', 'Dining', 'Transport', 'Health', 'Subscriptions', 'Other'] : ['Salary', 'Freelance', 'Gift', 'Other']

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
        await createMutation.mutateAsync({ account_id: account.id, type, amount_minor: amountMinor, category: String(form.get('category')), description: String(form.get('description')), occurred_at: new Date().toISOString() })
      }
      setOpen(false)
    } catch (caught) { setError(errorMessage(caught, 'Could not add transaction.')) } finally { setBusy(false) }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!busy) { setOpen(next); setError('') } }}>
      <Dialog.Trigger asChild><Button variant="primary" disabled={props.disabled} title={props.disabled ? 'Add an account first' : undefined}><Plus size={16} /> Add transaction</Button></Dialog.Trigger>
      <FinanceDialog busy={busy} eyebrow="Quick entry" title="Add a transaction" description="Finlo updates the selected account balance automatically.">
        <Tabs.Root value={type} onValueChange={(value) => { setType(value as Transaction['type']); setError('') }}>
          <SegmentedList className="my-4"><SegmentedTrigger className="flex-1" value="expense" disabled={busy}>Expense</SegmentedTrigger><SegmentedTrigger className="flex-1" value="income" disabled={busy}>Income</SegmentedTrigger></SegmentedList>
        </Tabs.Root>
        <DialogForm onSubmit={submit}>
          <FormField label="Amount"><MoneyInput><input name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" disabled={busy} required /></MoneyInput></FormField>
          <div className="flex gap-3 max-[540px]:flex-col">
            <FormField label="Account"><select name="account" disabled={busy} required>{props.data.accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></FormField>
            <FormField label="Category"><select key={type} name="category" defaultValue={availableCategories[0]} disabled={busy}>{availableCategories.map((item) => <option key={item}>{item}</option>)}</select></FormField>
          </div>
          <FormField label="Note"><input name="description" placeholder="What was this for?" disabled={busy} /></FormField>
          <InlineError message={error} />
          <SubmitButton busy={busy} label={`Add ${type}`} busyLabel={`Adding ${type}…`} />
        </DialogForm>
      </FinanceDialog>
    </Dialog.Root>
  )
}
