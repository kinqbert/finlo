import { ArrowUpRight } from 'lucide-react'

export function EmptyState({ title, copy, action, onAction, compact = false }: { title: string; copy: string; action?: string; onAction?: () => void; compact?: boolean }) {
  return (
    <div className={`flex flex-1 items-center justify-center px-4 text-center ${compact ? 'min-h-22.5 py-1' : 'min-h-34 py-4'}`}>
      <div className="max-w-90">
        <strong className="mb-1 block font-heading text-[13px] leading-tight font-bold">{title}</strong>
        <p className="m-0 text-[10px] leading-[1.55] text-muted">{copy}</p>
        {action && onAction && <button className="mt-2.5 inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-[10px] font-bold text-[#53725f]" onClick={onAction}>{action} <ArrowUpRight size={14} /></button>}
      </div>
    </div>
  )
}
