import * as Avatar from '@radix-ui/react-avatar'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Bell, ChevronDown, LogOut, Search } from 'lucide-react'
import { initials } from '../../lib/format'
import type { User } from '../../types'
import { Logo } from '../ui/Logo'

export function Topbar({ user, isDemo, onSignOut }: { user: User; isDemo: boolean; onSignOut: () => void }) {
  return (
    <header className="sticky top-0 z-15 flex h-18 items-center justify-between gap-6 border-b border-line bg-[rgba(250,251,247,.93)] px-10.5 backdrop-blur-[14px] max-[1100px]:px-6.25 max-[820px]:h-15.5 max-[820px]:px-4.5">
      <div className="hidden max-[820px]:block"><Logo /></div>
      <label className="flex w-[min(390px,45%)] items-center gap-2.5 text-[#949e98] max-[820px]:hidden"><Search size={17} /><input className="w-full border-0 bg-transparent py-2 text-[13px] text-ink focus:outline-0" placeholder="Search transactions, accounts…" /></label>
      <div className="flex items-center gap-2.5">
        {isDemo && <span className="rounded-full bg-[#edf5dd] px-2.5 py-1.5 text-[11px] font-bold text-[#4d6725] max-[540px]:hidden">Demo mode</span>}
        <Tooltip.Root><Tooltip.Trigger asChild><button className="grid size-9.5 cursor-pointer place-items-center rounded-[11px] border border-line bg-white"><Bell size={18} /></button></Tooltip.Trigger><Tooltip.Portal><Tooltip.Content className="z-100 rounded-[10px] border border-line bg-white px-3 py-2 text-xs shadow-card" sideOffset={6}>No new notifications</Tooltip.Content></Tooltip.Portal></Tooltip.Root>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger className="flex cursor-pointer items-center gap-2 border-0 bg-transparent py-1 pr-1 pl-0.5 text-[13px] font-semibold max-[820px]:[&>span]:hidden max-[820px]:[&>svg]:hidden"><Avatar.Root className="grid size-8.5 shrink-0 place-items-center overflow-hidden rounded-full bg-brand text-[11px] font-bold text-white"><Avatar.Fallback>{initials(user)}</Avatar.Fallback></Avatar.Root><span>{user.name}</span><ChevronDown size={15} /></DropdownMenu.Trigger>
          <DropdownMenu.Portal><DropdownMenu.Content className="z-100 min-w-47.5 rounded-[10px] border border-line bg-white p-2 text-xs shadow-card [&_[role=menuitem]]:flex [&_[role=menuitem]]:cursor-pointer [&_[role=menuitem]]:items-center [&_[role=menuitem]]:gap-2 [&_[role=menuitem]]:rounded-[7px] [&_[role=menuitem]]:p-2 hover:[&_[role=menuitem]]:bg-canvas [&_[role=separator]]:my-2 [&_[role=separator]]:h-px [&_[role=separator]]:bg-line" align="end"><DropdownMenu.Label className="px-2 py-1.5 text-[11px] text-muted">{user.email}</DropdownMenu.Label><DropdownMenu.Separator /><DropdownMenu.Item onSelect={onSignOut}><LogOut size={15} /> Sign out</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  )
}
