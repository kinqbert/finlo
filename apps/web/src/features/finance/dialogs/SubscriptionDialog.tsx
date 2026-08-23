import { useState, type FormEvent } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Plus } from 'lucide-react'
import { createSubscription } from '../../../api'
import { Button } from '../../../components/ui/Button'
import { DialogForm, FinanceDialog, FormField, MoneyInput } from '../../../components/ui/FinanceDialog'
import { InlineError, SubmitButton } from '../../../components/ui/Feedback'
import { errorMessage } from '../../../lib/format'
import type { FinanceActions } from '../types'
import { useFinanceMutation } from '../useFinanceMutation'

export function SubscriptionDialog(props: FinanceActions) {
  const createMutation = useFinanceMutation(createSubscription)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const input = { name: String(form.get('name')).trim(), amount_minor: Math.round(Number(form.get('amount')) * 100), currency: 'UAH', billing_day: Number(form.get('billing_day')), active: true }
    if (!input.name || input.amount_minor <= 0 || input.billing_day < 1 || input.billing_day > 31) { setError('Enter a name, a positive amount, and a billing day from 1 to 31.'); return }
    setBusy(true)
    setError('')
    try {
      if (props.isDemo) { const next = structuredClone(props.data); const subscription = { ...input, id: crypto.randomUUID() }; next.subscriptions.push(subscription); next.dashboard.subscriptions.push(subscription); props.onDemoChange(next) }
      else await createMutation.mutateAsync(input)
      setOpen(false)
    } catch (caught) { setError(errorMessage(caught, 'Could not add subscription.')) } finally { setBusy(false) }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!busy) { setOpen(next); setError('') } }}>
      <Dialog.Trigger asChild><Button variant="primary"><Plus size={16} /> Add subscription</Button></Dialog.Trigger>
      <FinanceDialog busy={busy} eyebrow="Recurring expense" title="Add a subscription" description="Include recurring payments in your monthly picture.">
        <DialogForm onSubmit={submit} spaced>
          <FormField label="Name"><input name="name" placeholder="Netflix" disabled={busy} required /></FormField>
          <div className="flex gap-3 max-[540px]:flex-col">
            <FormField label="Monthly amount"><MoneyInput><input name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" disabled={busy} required /></MoneyInput></FormField>
            <FormField label="Billing day"><input name="billing_day" type="number" min="1" max="31" defaultValue="1" disabled={busy} required /></FormField>
          </div>
          <InlineError message={error} />
          <SubmitButton busy={busy} label="Add subscription" busyLabel="Adding subscription…" />
        </DialogForm>
      </FinanceDialog>
    </Dialog.Root>
  )
}
