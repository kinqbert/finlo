import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import { useForm } from 'react-hook-form'
import { createCategory, deleteCategory, reorderCategories, updateCategory } from '@/api'
import { Button, IconButton } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { InlineError } from '@/components/ui/Feedback'
import { FormField } from '@/components/ui/FinanceDialog'
import { MotionItem } from '@/components/ui/MotionItem'
import { PageHeader } from '@/components/ui/PageHeader'
import { useFinanceMutation } from '@/hooks/useFinanceMutation'
import { errorMessage } from '@/lib/format'
import { categoryNameSchema, categorySchema, type CategoryFormValues, type CategoryNameFormValues } from '@/lib/validation'
import type { Category, FinanceActions, FinanceData } from '@/types'

function updateDemoCategoryName(data: FinanceData, category: Category, name: string) {
  const next = structuredClone(data)
  const target = next.categories.find((item) => item.id === category.id)
  if (target) target.name = name
  next.transactions.forEach((item) => { if (item.type === category.type && item.category === category.name) item.category = name })
  next.dashboard.recent_transactions.forEach((item) => { if (item.type === category.type && item.category === category.name) item.category = name })
  if (category.type === 'expense') {
    next.budgets.forEach((item) => { if (item.category === category.name) item.category = name })
    next.dashboard.budgets.forEach((item) => { if (item.category === category.name) item.category = name })
  }
  return next
}

export function SettingsPage(props: FinanceActions) {
  const createMutation = useFinanceMutation(createCategory)
  const renameMutation = useFinanceMutation(({ id, name }: { id: string; name: string }) => updateCategory(id, name))
  const deleteMutation = useFinanceMutation(deleteCategory)
  const reorderMutation = useFinanceMutation(({ type, categoryIDs }: { type: Category['type']; categoryIDs: string[] }) => reorderCategories(type, categoryIDs))
  const addForm = useForm<CategoryFormValues>({ resolver: zodResolver(categorySchema), defaultValues: { name: '', type: 'expense' } })
  const renameForm = useForm<CategoryNameFormValues>({ resolver: zodResolver(categoryNameSchema), defaultValues: { name: '' } })
  const [editing, setEditing] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  const categoriesFor = (type: Category['type']) => props.data.categories.filter((item) => item.type === type).sort((a, b) => a.sort_order - b.sort_order)

  async function add(values: CategoryFormValues) {
    const { name, type } = values
    setBusy('new')
    setError('')
    try {
      if (props.isDemo) {
        const next = structuredClone(props.data)
        if (next.categories.some((item) => item.type === type && item.name === name)) throw new Error('A category with this name already exists.')
        const timestamp = new Date().toISOString()
        next.categories.push({ id: crypto.randomUUID(), name, type, sort_order: categoriesFor(type).length, created_at: timestamp, updated_at: timestamp })
        props.onDemoChange(next)
      } else await createMutation.mutateAsync({ name, type })
      addForm.reset({ name: '', type })
    } catch (caught) { setError(errorMessage(caught, 'Could not add category.')) } finally { setBusy(null) }
  }

  async function rename(category: Category, values: CategoryNameFormValues) {
    const { name } = values
    setBusy(category.id)
    setError('')
    try {
      if (props.isDemo) {
        if (props.data.categories.some((item) => item.id !== category.id && item.type === category.type && item.name === name)) throw new Error('A category with this name already exists.')
        props.onDemoChange(updateDemoCategoryName(props.data, category, name))
      } else await renameMutation.mutateAsync({ id: category.id, name })
      setEditing(null)
    } catch (caught) { setError(errorMessage(caught, 'Could not rename category.')) } finally { setBusy(null) }
  }

  async function remove(category: Category) {
    setBusy(category.id)
    setError('')
    try {
      if (props.isDemo) {
        const inTransactions = props.data.transactions.some((item) => item.type === category.type && item.category === category.name)
        const inBudgets = category.type === 'expense' && props.data.budgets.some((item) => item.category === category.name)
        if (inTransactions || inBudgets) throw new Error('This category is in use and cannot be deleted.')
        const next = structuredClone(props.data)
        next.categories = next.categories.filter((item) => item.id !== category.id)
        next.categories.filter((item) => item.type === category.type).sort((a, b) => a.sort_order - b.sort_order).forEach((item, index) => { item.sort_order = index })
        props.onDemoChange(next)
      } else await deleteMutation.mutateAsync(category.id)
      setConfirmDelete(null)
    } catch (caught) { setError(errorMessage(caught, 'Could not delete category.')) } finally { setBusy(null) }
  }

  async function move(category: Category, direction: -1 | 1) {
    const ordered = categoriesFor(category.type)
    const from = ordered.findIndex((item) => item.id === category.id)
    const to = from + direction
    if (from < 0 || to < 0 || to >= ordered.length) return
    const reordered = [...ordered]
    ;[reordered[from], reordered[to]] = [reordered[to], reordered[from]]
    setBusy(category.id)
    setError('')
    try {
      if (props.isDemo) {
        const next = structuredClone(props.data)
        reordered.forEach((item, index) => { const target = next.categories.find((candidate) => candidate.id === item.id); if (target) target.sort_order = index })
        props.onDemoChange(next)
      } else await reorderMutation.mutateAsync({ type: category.type, categoryIDs: reordered.map((item) => item.id) })
    } catch (caught) { setError(errorMessage(caught, 'Could not reorder categories.')) } finally { setBusy(null) }
  }

  function categorySection(type: Category['type'], title: string, copy: string) {
    const categories = categoriesFor(type)
    return <Card fill>
      <div className="mb-4"><h2 className="m-0 font-heading text-base font-bold">{title}</h2><p className="mt-0.5 mb-0 text-[10px] text-muted">{copy}</p></div>
      {categories.length ? <div className="grid"><AnimatePresence initial={false}>{categories.map((category, index) => <MotionItem className="flex min-h-12 items-center gap-2.5 border-t border-[#edf0e9] first:border-t-0" highlight key={category.id}>
        <span className="grid size-7.5 shrink-0 place-items-center rounded-lg bg-canvas text-[10px] font-bold text-muted">{index + 1}</span>
        {editing === category.id ? <div className="min-w-0 flex-1"><input className="h-8.5 w-full rounded-lg border border-line bg-[#fbfcf8] px-2.5 text-xs" autoFocus disabled={busy === category.id} {...renameForm.register('name')} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void renameForm.handleSubmit((values) => rename(category, values))() } if (event.key === 'Escape') setEditing(null) }} />{renameForm.formState.errors.name?.message && <span className="mt-1 block text-[9px] text-[#984b37]" role="alert">{renameForm.formState.errors.name.message}</span>}</div> : <strong className="min-w-0 flex-1 overflow-hidden text-[11px] text-ellipsis whitespace-nowrap">{category.name}</strong>}
        {confirmDelete === category.id ? <div className="flex items-center gap-1"><span className="text-[9px] text-[#984b37]">Delete?</span><IconButton variant="danger" aria-label={`Confirm delete ${category.name}`} disabled={busy === category.id} onClick={() => void remove(category)}><Check size={13} /></IconButton><IconButton aria-label="Cancel delete" onClick={() => setConfirmDelete(null)}><X size={13} /></IconButton></div> : <>
          <div className="flex items-center gap-1"><IconButton aria-label={`Move ${category.name} up`} disabled={index === 0 || busy !== null} onClick={() => void move(category, -1)}><ArrowUp size={13} /></IconButton><IconButton aria-label={`Move ${category.name} down`} disabled={index === categories.length - 1 || busy !== null} onClick={() => void move(category, 1)}><ArrowDown size={13} /></IconButton></div>
          {editing === category.id ? <><IconButton variant="primary" aria-label={`Save ${category.name}`} disabled={busy === category.id} onClick={() => void renameForm.handleSubmit((values) => rename(category, values))()}><Check size={13} /></IconButton><IconButton aria-label="Cancel rename" onClick={() => setEditing(null)}><X size={13} /></IconButton></> : <><IconButton aria-label={`Rename ${category.name}`} disabled={busy !== null} onClick={() => { setEditing(category.id); renameForm.reset({ name: category.name }); setConfirmDelete(null) }}><Pencil size={13} /></IconButton><IconButton variant="danger" aria-label={`Delete ${category.name}`} disabled={busy !== null} onClick={() => { setConfirmDelete(category.id); setEditing(null) }}><Trash2 size={13} /></IconButton></>}
        </>}
      </MotionItem>)}</AnimatePresence></div> : <EmptyState compact title={`No ${type} categories`} copy={`Add your first ${type} category using the form above.`} />}
    </Card>
  }

  return <>
    <PageHeader eyebrow="Preferences" title="Settings" subtitle="Keep your financial categories organized your way." />
    <Card className="mb-2.5">
      <div className="mb-4"><h2 className="m-0 font-heading text-base font-bold">Add a category</h2><p className="mt-0.5 mb-0 text-[10px] text-muted">Income and expense categories are managed separately.</p></div>
      <form className="grid grid-cols-[1fr_160px_auto] items-end gap-2.5 max-[700px]:grid-cols-1" onSubmit={addForm.handleSubmit(add)}>
        <FormField label="Name" error={addForm.formState.errors.name?.message}><input placeholder="e.g. Education" disabled={busy === 'new'} {...addForm.register('name')} /></FormField>
        <FormField label="Type" error={addForm.formState.errors.type?.message}><select disabled={busy === 'new'} {...addForm.register('type')}><option value="expense">Expense</option><option value="income">Income</option></select></FormField>
        <Button variant="primary" disabled={busy === 'new'}><Plus size={15} /> {busy === 'new' ? 'Adding…' : 'Add category'}</Button>
      </form>
      {error && <div className="mt-3"><InlineError message={error} /></div>}
    </Card>
    <section className="grid grid-cols-2 gap-2.5 max-[900px]:grid-cols-1">{categorySection('expense', 'Expense categories', 'Used for spending and category budgets.')}{categorySection('income', 'Income categories', 'Used to organize salary and other money coming in.')}</section>
  </>
}
