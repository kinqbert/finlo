import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Tabs from '@radix-ui/react-tabs'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { createTransaction } from '@/api'
import { Button } from '@/components/ui/Button'
import { DialogForm, FinanceDialog, FormField, MoneyInput } from '@/components/ui/FinanceDialog'
import { InlineError, SubmitButton } from '@/components/ui/Feedback'
import { SegmentedList, SegmentedTrigger } from '@/components/ui/SegmentedControl'
import { useFinanceMutation } from '@/hooks/useFinanceMutation'
import { errorMessage } from '@/lib/format'
import { transactionSchema, type TransactionFormValues } from '@/lib/validation'
import type { FinanceActions, Transaction } from '@/types'

export function TransactionDialog(props: FinanceActions & { disabled?: boolean }) {
  const createMutation = useFinanceMutation(createTransaction)
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<Transaction['type']>('expense')
  const [error, setError] = useState('')
  const categoryNames = props.data.categories.filter((category) => category.type === type).sort((a, b) => a.sort_order - b.sort_order).map((category) => category.name)
  const availableCategories = categoryNames.length ? categoryNames : type === 'expense' ? ['Groceries', 'Dining', 'Transport', 'Health', 'Subscriptions', 'Other'] : ['Salary', 'Freelance', 'Gift', 'Other']
  const form = useForm<TransactionFormValues>({ resolver: zodResolver(transactionSchema), defaultValues: { amount: 0, account: props.data.accounts[0]?.id ?? '', category: availableCategories[0], description: '' } })
  const busy = form.formState.isSubmitting

  useEffect(() => {
    const selected = form.getValues('account')
    if (!props.data.accounts.some((account) => account.id === selected)) form.setValue('account', props.data.accounts[0]?.id ?? '')
  }, [form, props.data.accounts])

  async function submit(values: TransactionFormValues) {
    const amountMinor = Math.round(values.amount * 100)
    const account = props.data.accounts.find((item) => item.id === values.account)
    if (!account) { setError('Add an account before recording a transaction.'); return }
    setError('')
    try {
      if (props.isDemo) {
        const timestamp = new Date().toISOString()
        const transaction: Transaction = { id: crypto.randomUUID(), account_id: account.id, type, amount_minor: amountMinor, currency: account.currency, category: values.category, description: values.description, occurred_at: timestamp, source: 'manual', created_at: timestamp, updated_at: timestamp }
        const next = structuredClone(props.data)
        next.transactions.unshift(transaction)
        next.dashboard.recent_transactions.unshift(transaction)
        const target = next.accounts.find((item) => item.id === account.id)
        if (target) target.balance_minor += type === 'income' ? amountMinor : -amountMinor
        next.dashboard.balances = [{ currency: account.currency, balance_minor: next.accounts.filter((item) => item.currency === account.currency).reduce((sum, item) => sum + item.balance_minor, 0) }]
        props.onDemoChange(next)
      } else {
        await createMutation.mutateAsync({ account_id: account.id, type, amount_minor: amountMinor, category: values.category, description: values.description, occurred_at: new Date().toISOString() })
      }
      form.reset({ amount: 0, account: props.data.accounts[0]?.id ?? '', category: availableCategories[0], description: '' })
      setOpen(false)
    } catch (caught) { setError(errorMessage(caught, 'Could not add transaction.')) }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!busy) { setOpen(next); setError('') } }}>
      <Dialog.Trigger asChild><Button variant="primary" disabled={props.disabled} title={props.disabled ? 'Add an account first' : undefined}><Plus size={16} /> Add transaction</Button></Dialog.Trigger>
      <FinanceDialog busy={busy} eyebrow="Quick entry" title="Add a transaction" description="Finlo updates the selected account balance automatically.">
        <Tabs.Root value={type} onValueChange={(value) => { const nextType = value as Transaction['type']; setType(nextType); const nextCategories = props.data.categories.filter((category) => category.type === nextType).sort((a, b) => a.sort_order - b.sort_order); form.setValue('category', nextCategories[0]?.name ?? (nextType === 'expense' ? 'Groceries' : 'Salary')); setError('') }}>
          <SegmentedList className="my-4"><SegmentedTrigger className="flex-1" value="expense" disabled={busy}>Expense</SegmentedTrigger><SegmentedTrigger className="flex-1" value="income" disabled={busy}>Income</SegmentedTrigger></SegmentedList>
        </Tabs.Root>
        <DialogForm onSubmit={form.handleSubmit(submit)}>
          <FormField label="Amount" error={form.formState.errors.amount?.message}><MoneyInput><input type="number" min="0.01" step="0.01" placeholder="0.00" disabled={busy} {...form.register('amount', { valueAsNumber: true })} /></MoneyInput></FormField>
          <div className="flex gap-3 max-[540px]:flex-col">
            <FormField label="Account" error={form.formState.errors.account?.message}><select disabled={busy} {...form.register('account')}>{props.data.accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></FormField>
            <FormField label="Category" error={form.formState.errors.category?.message}><select key={type} disabled={busy} {...form.register('category')}>{availableCategories.map((item) => <option key={item}>{item}</option>)}</select></FormField>
          </div>
          <FormField label="Note" error={form.formState.errors.description?.message}><input placeholder="What was this for?" disabled={busy} {...form.register('description')} /></FormField>
          <InlineError message={error} />
          <SubmitButton busy={busy} label={`Add ${type}`} busyLabel={`Adding ${type}…`} />
        </DialogForm>
      </FinanceDialog>
    </Dialog.Root>
  )
}
