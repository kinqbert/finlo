import * as Avatar from '@radix-ui/react-avatar'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ArrowLeftRight, ChevronUp, LayoutDashboard, LogOut, Repeat2, Settings, Target, UserRound, type LucideIcon } from 'lucide-react'
import { initials } from '../../lib/format'
import type { User } from '../../types'
import type { View } from '../../features/finance/types'
import { Logo } from '../ui/Logo'
import { MenuContent, MenuItem, MenuSeparator } from '../ui/Menu'

const navItems: Array<{ id: View; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'activity', label: 'Activity', icon: ArrowLeftRight },
  { id: 'plans', label: 'Plans & goals', icon: Target },
  { id: 'subscriptions', label: 'Subscriptions', icon: Repeat2 },
]

function SidebarButton({ icon: Icon, label, active = false, onClick }: { icon: LucideIcon; label: string; active?: boolean; onClick?: () => void }) {
  return <button className={`flex min-h-9.5 w-full cursor-pointer items-center gap-2.5 rounded-[9px] border-0 px-2.5 py-1.5 text-left text-[13px] font-semibold hover:bg-[#f0f2eb] hover:text-ink max-[820px]:min-h-0 max-[820px]:w-auto max-[820px]:flex-1 max-[820px]:flex-col max-[820px]:gap-1 max-[820px]:px-1 max-[820px]:py-1.5 max-[820px]:text-[9px] ${active ? 'bg-[#e8efe6] text-brand' : 'bg-transparent text-[#748078]'}`} onClick={onClick}><Icon className="max-[820px]:w-4" size={17} />{label}</button>
}

export function Sidebar({ view, onView, user, onSignOut }: { view: View; onView: (view: View) => void; user: User; onSignOut: () => void }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-55 flex-col border-r border-line bg-[#fafbf7] px-3 pt-5.5 pb-3.5 max-[1100px]:w-50 max-[820px]:inset-x-0 max-[820px]:top-auto max-[820px]:h-15.5 max-[820px]:w-auto max-[820px]:flex-row max-[820px]:items-center max-[820px]:border-r-0 max-[820px]:border-t max-[820px]:px-2.5 max-[820px]:pt-1 max-[820px]:pb-[env(safe-area-inset-bottom)]">
      <div className="px-2 max-[820px]:hidden"><Logo compact /></div>
      <nav className="mt-8 flex flex-col gap-0.5 max-[820px]:mt-0 max-[820px]:min-w-0 max-[820px]:flex-[4] max-[820px]:flex-row max-[820px]:justify-around">
        <span className="mx-2.5 mb-1.5 text-[9px] font-bold tracking-[.13em] text-[#a1aaa4] uppercase max-[820px]:hidden">Workspace</span>
        {navItems.map((item) => <SidebarButton key={item.id} icon={item.icon} label={item.label} active={view === item.id} onClick={() => onView(item.id)} />)}
      </nav>
      <div className="mt-auto min-w-0 border-t border-line pt-2 max-[820px]:mt-0 max-[820px]:flex max-[820px]:h-full max-[820px]:flex-1 max-[820px]:items-center max-[820px]:border-t-0 max-[820px]:pt-0">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger className={`flex min-h-12 w-full min-w-0 cursor-pointer items-center gap-2 rounded-[11px] border-0 bg-transparent p-2 text-left outline-none hover:bg-[#f0f2eb] focus-visible:ring-2 focus-visible:ring-brand/30 data-[state=open]:bg-[#e8efe6] max-[820px]:h-full max-[820px]:min-h-0 max-[820px]:flex-1 max-[820px]:flex-col max-[820px]:justify-center max-[820px]:gap-1 max-[820px]:px-1 max-[820px]:py-1.5 ${view === 'settings' ? 'text-brand' : 'text-ink'}`}>
            <Avatar.Root className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-brand text-[10px] font-bold text-white max-[820px]:hidden"><Avatar.Fallback>{initials(user)}</Avatar.Fallback></Avatar.Root>
            <UserRound className="hidden text-[#748078] max-[820px]:block" size={16} />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5 max-[820px]:hidden"><strong className="overflow-hidden text-[11px] leading-tight text-ellipsis whitespace-nowrap">{user.name} {user.surname}</strong><span className="overflow-hidden text-[9px] leading-tight text-ellipsis whitespace-nowrap text-muted">{user.email}</span></span>
            <span className="hidden text-[9px] font-semibold text-[#748078] max-[820px]:block">Account</span>
            <ChevronUp className="shrink-0 text-muted max-[820px]:hidden" size={14} />
          </DropdownMenu.Trigger>
          <MenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-44" side="top" align="start" sideOffset={5} collisionPadding={8}>
            <MenuItem onSelect={() => onView('settings')}><Settings size={15} /> Settings</MenuItem>
            <MenuSeparator />
            <MenuItem className="text-[#a24837]" onSelect={onSignOut}><LogOut size={15} /> Sign out</MenuItem>
          </MenuContent>
        </DropdownMenu.Root>
      </div>
    </aside>
  )
}
