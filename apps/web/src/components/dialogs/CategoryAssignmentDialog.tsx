import { useState, type FormEvent } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Tags } from 'lucide-react'
import { assignTransactionCategory } from '@/api'
import { Button } from '@/components/ui/Button'
import { DialogForm, FinanceDialog, FormField } from '@/components/ui/FinanceDialog'
import { InlineError, SubmitButton } from '@/components/ui/Feedback'
import { useFinanceMutation } from '@/hooks/useFinanceMutation'
import { cn } from '@/lib/cn'
import { errorMessage } from '@/lib/format'
import type { Category, Transaction } from '@/types'

export function CategoryAssignmentDialog({ transaction, categories, triggerClassName }: { transaction: Transaction; categories: Category[]; triggerClassName?: string }) {
  const available = categories.filter((category) => category.type === transaction.type)
  const [open, setOpen] = useState(false)
  const [categoryID, setCategoryID] = useState(available[0]?.id ?? '')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const mutation = useFinanceMutation(({ id, category_id, remember_mcc }: { id: string; category_id: string; remember_mcc: boolean }) => assignTransactionCategory(id, { category_id, remember_mcc }))

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    try {
      await mutation.mutateAsync({ id: transaction.id, category_id: categoryID, remember_mcc: remember })
      setOpen(false)
    } catch (caught) {
      setError(errorMessage(caught, 'Could not assign this category.'))
    }
  }

  return <Dialog.Root open={open} onOpenChange={(next) => { if (!mutation.isPending) { if (next) setCategoryID(available[0]?.id ?? ''); setOpen(next); setError('') } }}>
    <Dialog.Trigger asChild><Button className={cn('min-h-6 px-2 py-0 text-[8px]', triggerClassName)} variant="secondary"><Tags size={11} /> Review MCC {transaction.mcc_code}</Button></Dialog.Trigger>
    <FinanceDialog busy={mutation.isPending} eyebrow="Needs review" title="Choose a category" description={`MCC ${transaction.mcc_code ?? 'unknown'} was not found in your category rules.`}>
      <DialogForm onSubmit={submit} spaced>
        <FormField label="Category"><select value={categoryID} disabled={mutation.isPending} onChange={(event) => setCategoryID(event.target.value)}>{available.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></FormField>
        <label className="flex items-start gap-2 text-[10px] leading-[1.5] text-muted"><input className="mt-0.5" type="checkbox" checked={remember} disabled={transaction.mcc_code === undefined || mutation.isPending} onChange={(event) => setRemember(event.target.checked)} /><span>Always assign future {transaction.type} transactions with MCC {transaction.mcc_code} to this category.</span></label>
        <InlineError message={error} />
        <SubmitButton busy={mutation.isPending} label="Assign category" busyLabel="Assigning…" disabled={!categoryID} />
      </DialogForm>
    </FinanceDialog>
  </Dialog.Root>
}
