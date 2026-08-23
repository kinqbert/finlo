import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { zodResolver } from '@hookform/resolvers/zod'
import { Target } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { saveEmergencyFund } from '@/api'
import { Button } from '@/components/ui/Button'
import { DialogForm, FinanceDialog, FormField, MoneyInput } from '@/components/ui/FinanceDialog'
import { InlineError, SubmitButton } from '@/components/ui/Feedback'
import { baseCurrencyCode } from '@/constants/currencies'
import { useFinanceMutation } from '@/hooks/useFinanceMutation'
import { errorMessage } from '@/lib/format'
import { emergencyFundSchema, type EmergencyFundFormValues } from '@/lib/validation'
import type { FinanceActions } from '@/types'

export function EmergencyDialog(props: FinanceActions) {
  const saveMutation = useFinanceMutation(saveEmergencyFund)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const fund = props.data.dashboard.emergency_fund
  const form = useForm<EmergencyFundFormValues>({ resolver: zodResolver(emergencyFundSchema), defaultValues: { current: fund ? fund.current_minor / 100 : 0, target: fund ? fund.target_minor / 100 : 100000 } })
  const busy = form.formState.isSubmitting

  useEffect(() => {
    if (!open) form.reset({ current: fund ? fund.current_minor / 100 : 0, target: fund ? fund.target_minor / 100 : 100000 })
  }, [form, fund, open])

  async function submit(values: EmergencyFundFormValues) {
    const input = { target_minor: Math.round(values.target * 100), current_minor: Math.round(values.current * 100), currency: baseCurrencyCode }
    setError('')
    try {
      if (props.isDemo) { const next = structuredClone(props.data); const timestamp = new Date().toISOString(); next.dashboard.emergency_fund = { ...input, created_at: fund?.created_at ?? timestamp, updated_at: timestamp }; props.onDemoChange(next) }
      else await saveMutation.mutateAsync(input)
      setOpen(false)
    } catch (caught) { setError(errorMessage(caught, 'Could not save emergency fund.')) }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!busy) { setOpen(next); setError('') } }}>
      <Dialog.Trigger asChild><Button><Target size={16} /> {fund ? 'Edit goal' : 'Set goal'}</Button></Dialog.Trigger>
      <FinanceDialog busy={busy} eyebrow="Safety net" title="Emergency fund goal" description="Track what you have saved against the amount that feels safe.">
        <DialogForm onSubmit={form.handleSubmit(submit)} spaced>
          <div className="flex gap-3 max-[540px]:flex-col">
            <FormField label="Saved now" error={form.formState.errors.current?.message}><MoneyInput><input type="number" min="0" step="0.01" disabled={busy} {...form.register('current', { valueAsNumber: true })} /></MoneyInput></FormField>
            <FormField label="Target" error={form.formState.errors.target?.message}><MoneyInput><input type="number" min="0.01" step="0.01" disabled={busy} {...form.register('target', { valueAsNumber: true })} /></MoneyInput></FormField>
          </div>
          <InlineError message={error} />
          <SubmitButton busy={busy} label={fund ? 'Update goal' : 'Set goal'} busyLabel="Saving goal…" />
        </DialogForm>
      </FinanceDialog>
    </Dialog.Root>
  )
}
