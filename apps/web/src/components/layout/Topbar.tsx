import * as Tooltip from '@radix-ui/react-tooltip'
import { Bell, Search } from 'lucide-react'
import type { User } from '@/types'
import { IconButton } from '../ui/Button'
import { Logo } from '../ui/Logo'
import { UserMenu } from './UserMenu'

export function Topbar({ isDemo, user, onSignOut }: { isDemo: boolean; user: User; onSignOut: () => void }) {
  return (
    <header className="sticky top-0 z-15 flex h-14.5 items-center justify-between gap-5 border-b border-line bg-[rgba(250,251,247,.93)] px-7.5 backdrop-blur-[14px] max-[1100px]:px-5 max-[820px]:h-14 max-[820px]:px-4">
      <div className="hidden max-[820px]:block"><Logo compact /></div>
      <label className="flex w-[min(360px,45%)] items-center gap-2 text-[#949e98] max-[820px]:hidden"><Search size={16} /><input className="w-full border-0 bg-transparent py-1.5 text-xs text-ink focus:outline-0" placeholder="Search transactions, accounts…" /></label>
      <div className="flex items-center gap-2">
        {isDemo && <span className="rounded-full bg-[#edf5dd] px-2.5 py-1 text-[10px] font-bold text-[#4d6725] max-[540px]:hidden">Demo mode</span>}
        <Tooltip.Root><Tooltip.Trigger asChild><IconButton aria-label="Notifications"><Bell size={16} /></IconButton></Tooltip.Trigger><Tooltip.Portal><Tooltip.Content className="z-100 rounded-[9px] border border-line bg-white px-2.5 py-1.5 text-[11px] shadow-card data-[state=delayed-open]:animate-[menu-in_.14s_cubic-bezier(.22,1,.36,1)]" sideOffset={5}>No new notifications</Tooltip.Content></Tooltip.Portal></Tooltip.Root>
        <div className="hidden max-[820px]:block"><UserMenu placement="topbar" user={user} onSignOut={onSignOut} /></div>
      </div>
    </header>
  )
}
