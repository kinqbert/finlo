import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'

export function EmptyState({ title, copy, action, actionTo, compact = false }: { title: string; copy: string; action?: string; actionTo?: string; compact?: boolean }) {
  return (
    <div className={`flex flex-1 items-center justify-center px-4 text-center ${compact ? 'min-h-22.5 py-1' : 'min-h-34 py-4'}`}>
      <div className="max-w-90">
        <strong className="mb-1 block font-heading text-[13px] leading-tight font-bold">{title}</strong>
        <p className="m-0 text-[10px] leading-[1.55] text-muted">{copy}</p>
        {action && actionTo && <Link className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-bold text-[#53725f] no-underline" to={actionTo}>{action} <ArrowUpRight size={14} /></Link>}
      </div>
    </div>
  )
}
