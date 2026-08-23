import type { ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'

export function Card({ children, className = '', tone = 'default', fill = false }: { children: ReactNode; className?: string; tone?: 'default' | 'soft-green'; fill?: boolean }) {
  return <div className={`rounded-[15px] border border-line p-4.5 ${tone === 'soft-green' ? 'bg-[#e9eedc]' : 'bg-white'} ${fill ? 'flex flex-col' : ''} ${className}`}>{children}</div>
}

export function CardTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h3 className="m-0 font-heading text-sm font-bold">{title}</h3>
      {action && <button className="flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-[10px] font-bold text-[#53725f]" onClick={onAction}>{action} <ArrowUpRight size={14} /></button>}
    </div>
  )
}
