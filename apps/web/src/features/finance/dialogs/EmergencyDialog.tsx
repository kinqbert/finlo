import { useState, type FormEvent } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Target } from 'lucide-react'
import { saveEmergencyFund } from '../../../api'
import { Button } from '../../../components/ui/Button'
import { DialogForm, FinanceDialog, FormField, MoneyInput } from '../../../components/ui/FinanceDialog'
import { InlineError, SubmitButton } from '../../../components/ui/Feedback'
import { errorMessage } from '../../../lib/format'
import type { FinanceActions } from '../types'
import { useFinanceMutation } from '../useFinanceMutation'

export function EmergencyDialog(props: FinanceActions) {
  const saveMutation = useFinanceMutation(saveEmergencyFund)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fund = props.data.dashboard.emergency_fund

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const input = { target_minor: Math.round(Number(form.get('target')) * 100), current_minor: Math.round(Number(form.get('current')) * 100), currency: 'UAH' }
    if (input.target_minor <= 0 || input.current_minor < 0) { setError('The target must be greater than zero and saved amount cannot be negative.'); return }
    setBusy(true)
    setError('')
    try {
      if (props.isDemo) { const next = structuredClone(props.data); next.dashboard.emergency_fund = input; props.onDemoChange(next) }
      else await saveMutation.mutateAsync(input)
      setOpen(false)
    } catch (caught) { setError(errorMessage(caught, 'Could not save emergency fund.')) } finally { setBusy(false) }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!busy) { setOpen(next); setError('') } }}>
      <Dialog.Trigger asChild><Button><Target size={16} /> {fund ? 'Edit goal' : 'Set goal'}</Button></Dialog.Trigger>
      <FinanceDialog busy={busy} eyebrow="Safety net" title="Emergency fund goal" description="Track what you have saved against the amount that feels safe.">
        <DialogForm onSubmit={submit} spaced>
          <div className="flex gap-3 max-[540px]:flex-col">
            <FormField label="Saved now"><MoneyInput><input name="current" type="number" min="0" step="0.01" defaultValue={fund ? fund.current_minor / 100 : 0} disabled={busy} required /></MoneyInput></FormField>
            <FormField label="Target"><MoneyInput><input name="target" type="number" min="0.01" step="0.01" defaultValue={fund ? fund.target_minor / 100 : 100000} disabled={busy} required /></MoneyInput></FormField>
          </div>
          <InlineError message={error} />
          <SubmitButton busy={busy} label={fund ? 'Update goal' : 'Set goal'} busyLabel="Saving goal…" />
        </DialogForm>
      </FinanceDialog>
    </Dialog.Root>
  )
}
