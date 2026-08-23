import type { ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import { cn } from '@/lib/cn'

export function Card({ children, className = '', tone = 'default', fill = false }: { children: ReactNode; className?: string; tone?: 'default' | 'soft-green'; fill?: boolean }) {
  return <div className={cn('rounded-[15px] border border-line p-4.5', tone === 'soft-green' ? 'bg-[#e9eedc]' : 'bg-white', fill && 'flex flex-col', className)}>{children}</div>
}

export function CardTitle({ title, action, actionTo }: { title: string; action?: string; actionTo?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h3 className="m-0 font-heading text-sm font-bold">{title}</h3>
      {action && actionTo && <Link className="group flex items-center gap-1 text-[10px] font-bold text-[#53725f] no-underline" to={actionTo}><span>{action}</span> <ArrowUpRight className="transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" size={14} /></Link>}
    </div>
  )
}
