import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { zodResolver } from '@hookform/resolvers/zod'
import { WalletCards } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { createAccount } from '@/api'
import { Button } from '@/components/ui/Button'
import { DialogForm, FinanceDialog, FormField, MoneyInput } from '@/components/ui/FinanceDialog'
import { InlineError, SubmitButton } from '@/components/ui/Feedback'
import { baseCurrencyCode, supportedCurrencies } from '@/constants/currencies'
import { useFinanceMutation } from '@/hooks/useFinanceMutation'
import { errorMessage } from '@/lib/format'
import { accountSchema, type AccountFormValues } from '@/lib/validation'
import type { Account, FinanceActions } from '@/types'

export function AccountDialog(props: FinanceActions) {
  const createMutation = useFinanceMutation(createAccount)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const form = useForm<AccountFormValues>({ resolver: zodResolver(accountSchema), defaultValues: { name: '', type: 'card', currency: baseCurrencyCode, balance: 0 } })
  const selectedCurrency = useWatch({ control: form.control, name: 'currency' })
  const busy = form.formState.isSubmitting

  async function submit(values: AccountFormValues) {
    const timestamp = new Date().toISOString()
    const input = { name: values.name, type: values.type, currency: values.currency, balance_minor: Math.round(values.balance * 100) }
    const account: Account = { id: crypto.randomUUID(), ...input, created_at: timestamp, updated_at: timestamp }
    setError('')
    try {
      if (props.isDemo) { const next = structuredClone(props.data); next.accounts.push(account); props.onDemoChange(next) }
      else await createMutation.mutateAsync(input)
      form.reset()
      setOpen(false)
    } catch (caught) { setError(errorMessage(caught, 'Could not add account.')) }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!busy) { setOpen(next); setError('') } }}>
      <Dialog.Trigger asChild><Button><WalletCards size={16} /> Add account</Button></Dialog.Trigger>
      <FinanceDialog busy={busy} eyebrow="New account" title="Connect your money map" description="Add a balance now. Monobank sync can be connected later.">
        <DialogForm onSubmit={form.handleSubmit(submit)} spaced>
          <FormField label="Account name" error={form.formState.errors.name?.message}><input placeholder="Everyday card" disabled={busy} {...form.register('name')} /></FormField>
          <div className="flex gap-3 max-[540px]:flex-col">
            <FormField label="Type" error={form.formState.errors.type?.message}><select disabled={busy} {...form.register('type')}><option value="card">Card</option><option value="bank">Bank</option><option value="cash">Cash</option><option value="savings">Savings</option><option value="other">Other</option></select></FormField>
            <FormField label="Currency" error={form.formState.errors.currency?.message}><select disabled={busy} {...form.register('currency')}>{supportedCurrencies.map((currency) => <option key={currency.code} value={currency.code}>{currency.code} — {currency.label}</option>)}</select></FormField>
          </div>
          <FormField label="Current balance" error={form.formState.errors.balance?.message}><MoneyInput currency={selectedCurrency}><input type="number" step="0.01" disabled={busy} {...form.register('balance', { valueAsNumber: true })} /></MoneyInput></FormField>
          <InlineError message={error} />
          <SubmitButton busy={busy} label="Add account" busyLabel="Adding account…" />
        </DialogForm>
      </FinanceDialog>
    </Dialog.Root>
  )
}
