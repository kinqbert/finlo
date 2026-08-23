import { useState, type FormEvent } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Plus } from 'lucide-react'
import { saveBudget } from '../../../api'
import { Button } from '../../../components/ui/Button'
import { DialogForm, FinanceDialog, FormField, MoneyInput } from '../../../components/ui/FinanceDialog'
import { InlineError, SubmitButton } from '../../../components/ui/Feedback'
import { errorMessage } from '../../../lib/format'
import type { FinanceActions } from '../types'
import { useFinanceMutation } from '../useFinanceMutation'

export function BudgetDialog(props: FinanceActions) {
  const saveMutation = useFinanceMutation(saveBudget)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const expenseCategories = props.data.categories.filter((category) => category.type === 'expense').sort((a, b) => a.sort_order - b.sort_order)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const input = { category: String(form.get('category')).trim(), amount_minor: Math.round(Number(form.get('amount')) * 100), currency: 'UAH', month: new Date().toISOString().slice(0, 7) }
    if (!input.category || input.amount_minor <= 0) { setError('Enter a category and an amount greater than zero.'); return }
    setBusy(true)
    setError('')
    try {
      if (props.isDemo) {
        const next = structuredClone(props.data)
        const existing = next.budgets.find((budget) => budget.category === input.category && budget.month === input.month)
        if (existing) existing.amount_minor = input.amount_minor
        else next.budgets.push({ ...input, id: crypto.randomUUID(), spent_minor: 0, remaining_minor: input.amount_minor })
        next.dashboard.budgets = next.budgets
        props.onDemoChange(next)
      } else await saveMutation.mutateAsync(input)
      setOpen(false)
    } catch (caught) { setError(errorMessage(caught, 'Could not save budget.')) } finally { setBusy(false) }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!busy) { setOpen(next); setError('') } }}>
      <Dialog.Trigger asChild><Button variant="primary"><Plus size={16} /> Add budget</Button></Dialog.Trigger>
      <FinanceDialog busy={busy} eyebrow="Monthly plan" title="Add a category budget" description="Set a limit for the current month. Saving the same category updates it.">
        <DialogForm onSubmit={submit} spaced>
          <FormField label="Category"><input name="category" list="expense-categories" placeholder="Groceries" disabled={busy} required /><datalist id="expense-categories">{expenseCategories.map((category) => <option key={category.id} value={category.name} />)}</datalist></FormField>
          <FormField label="Monthly limit"><MoneyInput><input name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" disabled={busy} required /></MoneyInput></FormField>
          <InlineError message={error} />
          <SubmitButton busy={busy} label="Save budget" busyLabel="Saving budget…" />
        </DialogForm>
      </FinanceDialog>
    </Dialog.Root>
  )
}
