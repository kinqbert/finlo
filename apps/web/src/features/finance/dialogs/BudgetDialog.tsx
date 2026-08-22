import { useState, type FormEvent } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Plus } from 'lucide-react'
import { saveBudget } from '../../../api'
import { DialogForm, FinanceDialog, FormField, MoneyInput } from '../../../components/ui/FinanceDialog'
import { InlineError, SubmitButton } from '../../../components/ui/Feedback'
import { errorMessage } from '../../../lib/format'
import type { FinanceActions } from '../types'

export function BudgetDialog(props: FinanceActions) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

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
      } else { await saveBudget(input); await props.onCreated() }
      setOpen(false)
    } catch (caught) { setError(errorMessage(caught, 'Could not save budget.')) } finally { setBusy(false) }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!busy) { setOpen(next); setError('') } }}>
      <Dialog.Trigger asChild><button className="inline-flex min-h-10.5 cursor-pointer items-center justify-center gap-2 rounded-xl border border-brand bg-brand px-4 text-[13px] font-bold text-white shadow-[0_7px_18px_rgba(21,63,46,.16)] hover:bg-brand-dark"><Plus size={17} /> Add budget</button></Dialog.Trigger>
      <FinanceDialog busy={busy} eyebrow="Monthly plan" title="Add a category budget" description="Set a limit for the current month. Saving the same category updates it.">
        <DialogForm onSubmit={submit} spaced>
          <FormField label="Category"><input name="category" placeholder="Groceries" disabled={busy} required /></FormField>
          <FormField label="Monthly limit"><MoneyInput><input name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" disabled={busy} required /></MoneyInput></FormField>
          <InlineError message={error} />
          <SubmitButton busy={busy} label="Save budget" busyLabel="Saving budget…" />
        </DialogForm>
      </FinanceDialog>
    </Dialog.Root>
  )
}
