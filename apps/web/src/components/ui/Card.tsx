import type { ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[18px] border border-line bg-white p-5.5 ${className}`}>{children}</div>
}

export function CardTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <h3 className="m-0 font-heading text-[15px] font-bold">{title}</h3>
      {action && <button className="flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-[10px] font-bold text-[#53725f]" onClick={onAction}>{action} <ArrowUpRight size={14} /></button>}
    </div>
  )
}
