import { useState, type FormEvent } from 'react'
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { createCategory, deleteCategory, reorderCategories, updateCategory } from '../../api'
import { Button, IconButton } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { InlineError } from '../../components/ui/Feedback'
import { FormField } from '../../components/ui/FinanceDialog'
import { PageHeader } from '../../components/ui/PageHeader'
import type { FinanceActions } from '../finance/types'
import { useFinanceMutation } from '../finance/useFinanceMutation'
import type { Category, FinanceData } from '../../types'
import { errorMessage } from '../../lib/format'

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
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<Category['type']>('expense')
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  const categoriesFor = (type: Category['type']) => props.data.categories.filter((item) => item.type === type).sort((a, b) => a.sort_order - b.sort_order)

  async function add(event: FormEvent) {
    event.preventDefault()
    const name = newName.trim()
    if (!name) { setError('Enter a category name.'); return }
    setBusy('new')
    setError('')
    try {
      if (props.isDemo) {
        const next = structuredClone(props.data)
        if (next.categories.some((item) => item.type === newType && item.name === name)) throw new Error('A category with this name already exists.')
        next.categories.push({ id: crypto.randomUUID(), name, type: newType, sort_order: categoriesFor(newType).length })
        props.onDemoChange(next)
      } else await createMutation.mutateAsync({ name, type: newType })
      setNewName('')
    } catch (caught) { setError(errorMessage(caught, 'Could not add category.')) } finally { setBusy(null) }
  }

  async function rename(category: Category) {
    const name = editing?.name.trim() ?? ''
    if (!name) { setError('Category name cannot be empty.'); return }
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
      {categories.length ? <div className="grid">{categories.map((category, index) => <div className="flex min-h-12 items-center gap-2.5 border-t border-[#edf0e9] first:border-t-0" key={category.id}>
        <span className="grid size-7.5 shrink-0 place-items-center rounded-lg bg-canvas text-[10px] font-bold text-muted">{index + 1}</span>
        {editing?.id === category.id ? <input className="h-8.5 min-w-0 flex-1 rounded-lg border border-line bg-[#fbfcf8] px-2.5 text-xs" autoFocus value={editing.name} disabled={busy === category.id} onChange={(event) => setEditing({ id: category.id, name: event.target.value })} onKeyDown={(event) => { if (event.key === 'Enter') void rename(category); if (event.key === 'Escape') setEditing(null) }} /> : <strong className="min-w-0 flex-1 overflow-hidden text-[11px] text-ellipsis whitespace-nowrap">{category.name}</strong>}
        {confirmDelete === category.id ? <div className="flex items-center gap-1"><span className="text-[9px] text-[#984b37]">Delete?</span><IconButton variant="danger" aria-label={`Confirm delete ${category.name}`} disabled={busy === category.id} onClick={() => void remove(category)}><Check size={13} /></IconButton><IconButton aria-label="Cancel delete" onClick={() => setConfirmDelete(null)}><X size={13} /></IconButton></div> : <>
          <div className="flex items-center gap-1"><IconButton aria-label={`Move ${category.name} up`} disabled={index === 0 || busy !== null} onClick={() => void move(category, -1)}><ArrowUp size={13} /></IconButton><IconButton aria-label={`Move ${category.name} down`} disabled={index === categories.length - 1 || busy !== null} onClick={() => void move(category, 1)}><ArrowDown size={13} /></IconButton></div>
          {editing?.id === category.id ? <><IconButton variant="primary" aria-label={`Save ${category.name}`} disabled={busy === category.id} onClick={() => void rename(category)}><Check size={13} /></IconButton><IconButton aria-label="Cancel rename" onClick={() => setEditing(null)}><X size={13} /></IconButton></> : <><IconButton aria-label={`Rename ${category.name}`} disabled={busy !== null} onClick={() => { setEditing({ id: category.id, name: category.name }); setConfirmDelete(null) }}><Pencil size={13} /></IconButton><IconButton variant="danger" aria-label={`Delete ${category.name}`} disabled={busy !== null} onClick={() => { setConfirmDelete(category.id); setEditing(null) }}><Trash2 size={13} /></IconButton></>}
        </>}
      </div>)}</div> : <EmptyState compact title={`No ${type} categories`} copy={`Add your first ${type} category using the form above.`} />}
    </Card>
  }

  return <>
    <PageHeader eyebrow="Preferences" title="Settings" subtitle="Keep your financial categories organized your way." />
    <Card className="mb-2.5">
      <div className="mb-4"><h2 className="m-0 font-heading text-base font-bold">Add a category</h2><p className="mt-0.5 mb-0 text-[10px] text-muted">Income and expense categories are managed separately.</p></div>
      <form className="grid grid-cols-[1fr_160px_auto] items-end gap-2.5 max-[700px]:grid-cols-1" onSubmit={add}>
        <FormField label="Name"><input placeholder="e.g. Education" value={newName} disabled={busy === 'new'} onChange={(event) => setNewName(event.target.value)} /></FormField>
        <FormField label="Type"><select value={newType} disabled={busy === 'new'} onChange={(event) => setNewType(event.target.value as Category['type'])}><option value="expense">Expense</option><option value="income">Income</option></select></FormField>
        <Button variant="primary" disabled={busy === 'new'}><Plus size={15} /> {busy === 'new' ? 'Adding…' : 'Add category'}</Button>
      </form>
      {error && <div className="mt-3"><InlineError message={error} /></div>}
    </Card>
    <section className="grid grid-cols-2 gap-2.5 max-[900px]:grid-cols-1">{categorySection('expense', 'Expense categories', 'Used for spending and category budgets.')}{categorySection('income', 'Income categories', 'Used to organize salary and other money coming in.')}</section>
  </>
}
