import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { zodResolver } from '@hookform/resolvers/zod'
import { Target } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { createGoal } from '@/api'
import { Button } from '@/components/ui/Button'
import { DialogForm, FinanceDialog, FormField, MoneyInput } from '@/components/ui/FinanceDialog'
import { InlineError, SubmitButton } from '@/components/ui/Feedback'
import { baseCurrencyCode, supportedCurrencies } from '@/constants/currencies'
import { useFinanceMutation } from '@/hooks/useFinanceMutation'
import { errorMessage } from '@/lib/format'
import { goalSchema, type GoalFormValues } from '@/lib/validation'
import type { FinanceActions } from '@/types'

const defaultValues: GoalFormValues = {
  name: '',
  current: 0,
  target: 0,
  currency: baseCurrencyCode,
}

export function GoalDialog(props: FinanceActions) {
  const createMutation = useFinanceMutation(createGoal)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const form = useForm<GoalFormValues>({ resolver: zodResolver(goalSchema), defaultValues })
  const busy = form.formState.isSubmitting
  const selectedCurrency = useWatch({ control: form.control, name: 'currency' })

  async function submit(values: GoalFormValues) {
    const timestamp = new Date().toISOString()
    const input = {
      name: values.name.trim(),
      current_minor: Math.round(values.current * 100),
      target_minor: Math.round(values.target * 100),
      currency: values.currency,
    }
    setError('')
    try {
      if (props.isDemo) {
        const next = structuredClone(props.data)
        next.goals.push({ ...input, id: crypto.randomUUID(), source: 'manual', created_at: timestamp, updated_at: timestamp })
        props.onDemoChange(next)
      } else {
        await createMutation.mutateAsync(input)
      }
      form.reset(defaultValues)
      setOpen(false)
    } catch (caught) {
      setError(errorMessage(caught, 'Could not add savings goal.'))
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!busy) { setOpen(next); setError(''); if (!next) form.reset(defaultValues) } }}>
      <Dialog.Trigger asChild><Button variant="primary"><Target size={16} /> Add savings goal</Button></Dialog.Trigger>
      <FinanceDialog busy={busy} eyebrow="Something to look forward to" title="Add savings goal" description="Create a clear target and track how close you are to reaching it.">
        <DialogForm onSubmit={form.handleSubmit(submit)} spaced>
          <FormField label="Goal name" error={form.formState.errors.name?.message}><input autoFocus disabled={busy} maxLength={100} placeholder="Vacation, new laptop…" {...form.register('name')} /></FormField>
          <FormField label="Currency" error={form.formState.errors.currency?.message}><select disabled={busy} {...form.register('currency')}>{supportedCurrencies.map((currency) => <option key={currency.code} value={currency.code}>{currency.code} · {currency.label}</option>)}</select></FormField>
          <div className="flex gap-3 max-[540px]:flex-col">
            <FormField label="Saved now" error={form.formState.errors.current?.message}><MoneyInput currency={selectedCurrency}><input disabled={busy} min="0" step="0.01" type="number" {...form.register('current', { valueAsNumber: true })} /></MoneyInput></FormField>
            <FormField label="Target" error={form.formState.errors.target?.message}><MoneyInput currency={selectedCurrency}><input disabled={busy} min="0.01" placeholder="10000" step="0.01" type="number" {...form.register('target', { valueAsNumber: true })} /></MoneyInput></FormField>
          </div>
          <InlineError message={error} />
          <SubmitButton busy={busy} label="Add savings goal" busyLabel="Adding goal…" />
        </DialogForm>
      </FinanceDialog>
    </Dialog.Root>
  )
}
