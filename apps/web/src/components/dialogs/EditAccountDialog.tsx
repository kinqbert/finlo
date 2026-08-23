import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { deleteAccount, updateAccount } from '@/api'
import { Button } from '@/components/ui/Button'
import { DialogForm, FinanceDialog, FormField, MoneyInput } from '@/components/ui/FinanceDialog'
import { InlineError, SubmitButton } from '@/components/ui/Feedback'
import { useFinanceMutation } from '@/hooks/useFinanceMutation'
import { errorMessage } from '@/lib/format'
import { editAccountSchema, type EditAccountFormValues } from '@/lib/validation'
import type { Account, FinanceActions } from '@/types'

export function EditAccountDialog({ account, ...actions }: FinanceActions & { account: Account }) {
  const updateMutation = useFinanceMutation(({ id, input }: { id: string; input: { name: string; type: Account['type']; balance_minor: number } }) => updateAccount(id, input))
  const deleteMutation = useFinanceMutation(deleteAccount)
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')
  const form = useForm<EditAccountFormValues>({ resolver: zodResolver(editAccountSchema), defaultValues: { name: account.name, type: account.type, balance: account.balance_minor / 100 } })
  const saving = form.formState.isSubmitting
  const busy = saving || deleteMutation.isPending

  useEffect(() => {
    if (!open) form.reset({ name: account.name, type: account.type, balance: account.balance_minor / 100 })
  }, [account.balance_minor, account.name, account.type, form, open])

  async function submit(input: EditAccountFormValues) {
    const balanceMinor = Math.round(input.balance * 100)
    setError('')
    try {
      if (actions.isDemo) {
        const next = structuredClone(actions.data)
        const target = next.accounts.find((item) => item.id === account.id)
        if (target) Object.assign(target, { name: input.name, type: input.type, balance_minor: balanceMinor, updated_at: new Date().toISOString() })
        next.dashboard.balances = [...new Set(next.accounts.map((item) => item.currency))].map((currency) => ({ currency, balance_minor: next.accounts.filter((item) => item.currency === currency).reduce((total, item) => total + item.balance_minor, 0) }))
        actions.onDemoChange(next)
      } else {
        await updateMutation.mutateAsync({ id: account.id, input: { name: input.name, type: input.type, balance_minor: balanceMinor } })
      }
      setOpen(false)
    } catch (caught) {
      setError(errorMessage(caught, 'Could not update this account.'))
    }
  }

  async function remove() {
    setError('')
    try {
      if (actions.isDemo) {
        const hasTransactions = actions.data.transactions.some((item) => item.account_id === account.id)
        const hasSubscriptions = actions.data.subscriptions.some((item) => item.account_id === account.id)
        if (hasTransactions || hasSubscriptions) throw new Error(`This account has ${hasTransactions ? 'transactions' : 'subscriptions'} and cannot be deleted.`)

        const next = structuredClone(actions.data)
        next.accounts = next.accounts.filter((item) => item.id !== account.id)
        next.dashboard.balances = [...new Set(next.accounts.map((item) => item.currency))].map((currency) => ({
          currency,
          balance_minor: next.accounts.filter((item) => item.currency === currency).reduce((total, item) => total + item.balance_minor, 0),
        }))
        if (next.accounts.every((item) => item.currency === next.dashboard.total_balance.currency)) {
          next.dashboard.total_balance.balance_minor = next.accounts.reduce((total, item) => total + item.balance_minor, 0)
        }
        actions.onDemoChange(next)
      } else {
        await deleteMutation.mutateAsync(account.id)
      }
      setOpen(false)
    } catch (caught) {
      setError(errorMessage(caught, 'Could not delete this account.'))
    }
  }

  return <Dialog.Root open={open} onOpenChange={(next) => { if (!busy) { setOpen(next); setConfirmDelete(false); setError('') } }}>
    <Dialog.Trigger asChild><Button className="absolute top-2 right-2" size="sm" variant="ghost" aria-label={`Edit ${account.name}`}><Pencil size={11} /> Edit</Button></Dialog.Trigger>
    <FinanceDialog busy={busy} eyebrow="Account details" title="Edit account" description={`Update how ${account.name} appears in Finlo. Currency remains ${account.currency}.`}>
      <DialogForm onSubmit={form.handleSubmit(submit)} spaced>
        <FormField label="Account name" error={form.formState.errors.name?.message}><input disabled={busy} {...form.register('name')} /></FormField>
        <FormField label="Type" error={form.formState.errors.type?.message}><select disabled={busy} {...form.register('type')}><option value="card">Card</option><option value="bank">Bank</option><option value="cash">Cash</option><option value="savings">Savings</option><option value="other">Other</option></select></FormField>
        <FormField label="Current balance" error={form.formState.errors.balance?.message}><MoneyInput currency={account.currency}><input type="number" step="0.01" disabled={busy} {...form.register('balance', { valueAsNumber: true })} /></MoneyInput></FormField>
        <InlineError message={error} />
        <SubmitButton busy={saving} disabled={deleteMutation.isPending} label="Save changes" busyLabel="Saving…" />
      </DialogForm>
      <div className="mt-4 border-t border-line pt-4">
        {confirmDelete ? <div className="grid gap-3 rounded-xl border border-[#efc6b9] bg-[#fff8f5] p-3">
          <div><strong className="block text-[11px] text-[#7f3e2d]">Delete {account.name}?</strong><p className="mt-1 mb-0 text-[9px] leading-[1.5] text-[#984b37]">This cannot be undone. Accounts containing transactions or subscriptions must be emptied first.</p></div>
          <div className="flex justify-end gap-2"><Button type="button" disabled={busy} onClick={() => { setConfirmDelete(false); setError('') }}>Cancel</Button><Button type="button" variant="danger" disabled={busy} onClick={() => void remove()}><Trash2 size={14} /> {deleteMutation.isPending ? 'Deleting…' : 'Delete account'}</Button></div>
        </div> : <div className="flex items-center justify-between gap-3"><div><strong className="block text-[10px]">Delete account</strong><p className="mt-0.5 mb-0 text-[9px] text-muted">Permanently remove this account from Finlo.</p></div><Button type="button" size="sm" variant="danger" disabled={busy} onClick={() => { setConfirmDelete(true); setError('') }}><Trash2 size={12} /> Delete</Button></div>}
      </div>
    </FinanceDialog>
  </Dialog.Root>
}
