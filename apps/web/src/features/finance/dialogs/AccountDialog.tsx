import { useState, type FormEvent } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { WalletCards } from 'lucide-react'
import { createAccount } from '../../../api'
import { Button } from '../../../components/ui/Button'
import { DialogForm, FinanceDialog, FormField, MoneyInput } from '../../../components/ui/FinanceDialog'
import { InlineError, SubmitButton } from '../../../components/ui/Feedback'
import { errorMessage } from '../../../lib/format'
import type { Account } from '../../../types'
import type { FinanceActions } from '../types'
import { useFinanceMutation } from '../useFinanceMutation'

export function AccountDialog(props: FinanceActions) {
  const createMutation = useFinanceMutation(createAccount)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const account: Account = { id: crypto.randomUUID(), name: String(form.get('name')), type: String(form.get('type')) as Account['type'], currency: String(form.get('currency')).toUpperCase(), balance_minor: Math.round(Number(form.get('balance')) * 100) }
    if (!account.name.trim() || account.currency.length !== 3 || !Number.isFinite(account.balance_minor)) { setError('Enter an account name, three-letter currency, and valid balance.'); return }
    setBusy(true)
    setError('')
    try {
      if (props.isDemo) { const next = structuredClone(props.data); next.accounts.push(account); props.onDemoChange(next) }
      else await createMutation.mutateAsync(account)
      setOpen(false)
    } catch (caught) { setError(errorMessage(caught, 'Could not add account.')) } finally { setBusy(false) }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!busy) { setOpen(next); setError('') } }}>
      <Dialog.Trigger asChild><Button><WalletCards size={16} /> Add account</Button></Dialog.Trigger>
      <FinanceDialog busy={busy} eyebrow="New account" title="Connect your money map" description="Add a balance now. Monobank sync can be connected later.">
        <DialogForm onSubmit={submit} spaced>
          <FormField label="Account name"><input name="name" placeholder="Everyday card" disabled={busy} required /></FormField>
          <div className="flex gap-3 max-[540px]:flex-col">
            <FormField label="Type"><select name="type" disabled={busy}><option value="card">Card</option><option value="bank">Bank</option><option value="cash">Cash</option><option value="savings">Savings</option><option value="other">Other</option></select></FormField>
            <FormField label="Currency"><input name="currency" defaultValue="UAH" minLength={3} maxLength={3} disabled={busy} required /></FormField>
          </div>
          <FormField label="Current balance"><MoneyInput><input name="balance" type="number" step="0.01" defaultValue="0" disabled={busy} required /></MoneyInput></FormField>
          <InlineError message={error} />
          <SubmitButton busy={busy} label="Add account" busyLabel="Adding account…" />
        </DialogForm>
      </FinanceDialog>
    </Dialog.Root>
  )
}
