import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { deleteMCCRule, saveMCCRule } from '@/api'
import { Button, IconButton } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { InlineError } from '@/components/ui/Feedback'
import { FormField } from '@/components/ui/FinanceDialog'
import { useFinanceMutation } from '@/hooks/useFinanceMutation'
import { errorMessage } from '@/lib/format'
import { mccRuleSchema, type MCCRuleFormValues } from '@/lib/validation'
import type { FinanceActions } from '@/types'

export function MCCRulesCard({ data, isDemo }: FinanceActions) {
  const saveMutation = useFinanceMutation(saveMCCRule)
  const deleteMutation = useFinanceMutation(deleteMCCRule)
  const [error, setError] = useState('')
  const form = useForm<MCCRuleFormValues>({ resolver: zodResolver(mccRuleSchema), defaultValues: { mcc: 5411, transaction_type: 'expense', category_id: data.categories.find((item) => item.type === 'expense')?.id ?? '' } })
  const type = useWatch({ control: form.control, name: 'transaction_type' })
  const categories = data.categories.filter((category) => category.type === type)

  async function save(values: MCCRuleFormValues) {
    setError('')
    try {
      await saveMutation.mutateAsync(values)
    } catch (caught) {
      setError(errorMessage(caught, 'Could not save this MCC rule.'))
    }
  }

  async function remove(id: string) {
    setError('')
    try {
      await deleteMutation.mutateAsync(id)
    } catch (caught) {
      setError(errorMessage(caught, 'Could not remove this MCC rule.'))
    }
  }

  const busy = saveMutation.isPending || deleteMutation.isPending

  return <Card className="mt-2.5" fill>
    <div className="mb-4"><h2 className="m-0 font-heading text-base font-bold">MCC category rules</h2><p className="mt-0.5 mb-0 text-[10px] text-muted">Automatically categorize incoming Monobank transactions by merchant category code.</p></div>
    <form className="grid grid-cols-[110px_140px_1fr_auto] items-end gap-2.5 max-[760px]:grid-cols-2 max-[520px]:grid-cols-1" onSubmit={form.handleSubmit(save)}>
      <FormField label="MCC code" error={form.formState.errors.mcc?.message}><input type="number" min="0" max="9999" disabled={busy || isDemo} {...form.register('mcc', { valueAsNumber: true })} /></FormField>
      <FormField label="Transaction type"><select disabled={busy || isDemo} {...form.register('transaction_type', { onChange: (event) => { const nextType = event.target.value as 'income' | 'expense'; form.setValue('category_id', data.categories.find((category) => category.type === nextType)?.id ?? '') } })}><option value="expense">Expense</option><option value="income">Income</option></select></FormField>
      <FormField label="Category" error={form.formState.errors.category_id?.message}><select disabled={busy || isDemo} {...form.register('category_id')}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></FormField>
      <Button variant="primary" disabled={busy || isDemo}><Plus size={14} /> Save rule</Button>
    </form>
    {error && <div className="mt-3"><InlineError message={error} /></div>}
    <div className="mt-4 max-h-72 overflow-y-auto rounded-xl border border-line">
      {data.mccRules.length ? data.mccRules.map((rule) => <div className="grid min-h-10 grid-cols-[64px_90px_1fr_auto] items-center gap-2 border-b border-line px-3 text-[10px] last:border-b-0 max-[520px]:grid-cols-[56px_1fr_auto]" key={rule.id}><b>{String(rule.mcc).padStart(4, '0')}</b><span className="capitalize text-muted max-[520px]:hidden">{rule.transaction_type}</span><span className="truncate">{rule.category}{rule.is_default && <small className="ml-1.5 text-[8px] text-muted">default</small>}</span><IconButton variant="danger" aria-label={`Delete MCC ${rule.mcc} rule`} disabled={busy || isDemo} onClick={() => void remove(rule.id)}><Trash2 size={12} /></IconButton></div>) : <EmptyState compact title="No MCC rules" copy="Add a rule to categorize future Monobank transactions automatically." />}
    </div>
  </Card>
}
