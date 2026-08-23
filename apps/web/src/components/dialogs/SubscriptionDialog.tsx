import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { createSubscription } from '@/api'
import { Button } from '@/components/ui/Button'
import { DayOfMonthPicker } from '@/components/ui/DayOfMonthPicker'
import { DialogForm, FinanceDialog, FormField, MoneyInput } from '@/components/ui/FinanceDialog'
import { InlineError, SubmitButton } from '@/components/ui/Feedback'
import { baseCurrencyCode } from '@/constants/currencies'
import { useFinanceMutation } from '@/hooks/useFinanceMutation'
import { errorMessage } from '@/lib/format'
import { subscriptionSchema, type SubscriptionFormValues } from '@/lib/validation'
import type { FinanceActions } from '@/types'

export function SubscriptionDialog({ triggerVariant = 'primary', ...props }: FinanceActions & { triggerVariant?: 'primary' | 'secondary' }) {
  const createMutation = useFinanceMutation(createSubscription)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const form = useForm<SubscriptionFormValues>({ resolver: zodResolver(subscriptionSchema), defaultValues: { name: '', amount: 0, billing_day: 1 } })
  const busy = form.formState.isSubmitting

  async function submit(values: SubscriptionFormValues) {
    const input = { name: values.name, amount_minor: Math.round(values.amount * 100), currency: baseCurrencyCode, billing_day: values.billing_day, active: true }
    setError('')
    try {
      if (props.isDemo) { const next = structuredClone(props.data); const timestamp = new Date().toISOString(); const subscription = { ...input, id: crypto.randomUUID(), created_at: timestamp, updated_at: timestamp }; next.subscriptions.push(subscription); next.dashboard.subscriptions.push(subscription); props.onDemoChange(next) }
      else await createMutation.mutateAsync(input)
      form.reset()
      setOpen(false)
    } catch (caught) { setError(errorMessage(caught, 'Could not add subscription.')) }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!busy) { setOpen(next); setError('') } }}>
      <Dialog.Trigger asChild><Button variant={triggerVariant}><Plus size={16} /> Add subscription</Button></Dialog.Trigger>
      <FinanceDialog busy={busy} eyebrow="Recurring expense" title="Add a subscription" description="Include recurring payments in your monthly picture.">
        <DialogForm onSubmit={form.handleSubmit(submit)} spaced>
          <FormField label="Name" error={form.formState.errors.name?.message}><input placeholder="Netflix" disabled={busy} {...form.register('name')} /></FormField>
          <FormField label="Monthly amount" error={form.formState.errors.amount?.message}><MoneyInput><input type="number" min="0.01" step="0.01" placeholder="0.00" disabled={busy} {...form.register('amount', { valueAsNumber: true })} /></MoneyInput></FormField>
          <Controller control={form.control} name="billing_day" render={({ field, fieldState }) => <DayOfMonthPicker value={field.value} onChange={field.onChange} disabled={busy} error={fieldState.error?.message} />} />
          <InlineError message={error} />
          <SubmitButton busy={busy} label="Add subscription" busyLabel="Adding subscription…" />
        </DialogForm>
      </FinanceDialog>
    </Dialog.Root>
  )
}
