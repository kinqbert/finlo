import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { saveBudget } from '@/api'
import { Button } from '@/components/ui/Button'
import { DialogForm, FinanceDialog, FormField, MoneyInput } from '@/components/ui/FinanceDialog'
import { InlineError, SubmitButton } from '@/components/ui/Feedback'
import { baseCurrencyCode } from '@/constants/currencies'
import { useFinanceMutation } from '@/hooks/useFinanceMutation'
import { errorMessage } from '@/lib/format'
import { budgetSchema, type BudgetFormValues } from '@/lib/validation'
import type { FinanceActions } from '@/types'

export function BudgetDialog(props: FinanceActions) {
  const saveMutation = useFinanceMutation(saveBudget)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const form = useForm<BudgetFormValues>({ resolver: zodResolver(budgetSchema), defaultValues: { category: '', amount: 0 } })
  const busy = form.formState.isSubmitting
  const expenseCategories = props.data.categories.filter((category) => category.type === 'expense').sort((a, b) => a.sort_order - b.sort_order)

  async function submit(values: BudgetFormValues) {
    const input = { category: values.category, amount_minor: Math.round(values.amount * 100), currency: baseCurrencyCode, month: new Date().toISOString().slice(0, 7) }
    setError('')
    try {
      if (props.isDemo) {
        const next = structuredClone(props.data)
        const existing = next.budgets.find((budget) => budget.category === input.category && budget.month === input.month)
        if (existing) existing.amount_minor = input.amount_minor
        else { const timestamp = new Date().toISOString(); next.budgets.push({ ...input, id: crypto.randomUUID(), spent_minor: 0, remaining_minor: input.amount_minor, created_at: timestamp, updated_at: timestamp }) }
        next.dashboard.budgets = next.budgets
        props.onDemoChange(next)
      } else await saveMutation.mutateAsync(input)
      form.reset()
      setOpen(false)
    } catch (caught) { setError(errorMessage(caught, 'Could not save budget.')) }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!busy) { setOpen(next); setError('') } }}>
      <Dialog.Trigger asChild><Button variant="primary"><Plus size={16} /> Add budget</Button></Dialog.Trigger>
      <FinanceDialog busy={busy} eyebrow="Monthly plan" title="Add a category budget" description="Set a limit for the current month. Saving the same category updates it.">
        <DialogForm onSubmit={form.handleSubmit(submit)} spaced>
          <FormField label="Category" error={form.formState.errors.category?.message}><input list="expense-categories" placeholder="Groceries" disabled={busy} {...form.register('category')} /><datalist id="expense-categories">{expenseCategories.map((category) => <option key={category.id} value={category.name} />)}</datalist></FormField>
          <FormField label="Monthly limit" error={form.formState.errors.amount?.message}><MoneyInput><input type="number" min="0.01" step="0.01" placeholder="0.00" disabled={busy} {...form.register('amount', { valueAsNumber: true })} /></MoneyInput></FormField>
          <InlineError message={error} />
          <SubmitButton busy={busy} label="Save budget" busyLabel="Saving budget…" />
        </DialogForm>
      </FinanceDialog>
    </Dialog.Root>
  )
}
