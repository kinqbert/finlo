import * as Avatar from '@radix-ui/react-avatar'
import { ArrowLeftRight, LayoutDashboard, LogOut, Repeat2, Settings, Target, type LucideIcon } from 'lucide-react'
import { initials } from '../../lib/format'
import type { User } from '../../types'
import type { View } from '../../features/finance/types'
import { Logo } from '../ui/Logo'

const navItems: Array<{ id: View; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'activity', label: 'Activity', icon: ArrowLeftRight },
  { id: 'plans', label: 'Plans & goals', icon: Target },
  { id: 'subscriptions', label: 'Subscriptions', icon: Repeat2 },
]

function SidebarButton({ icon: Icon, label, active = false, onClick }: { icon: LucideIcon; label: string; active?: boolean; onClick?: () => void }) {
  return <button className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border-0 px-3 py-3 text-left text-sm font-semibold hover:bg-[#f0f2eb] hover:text-ink max-[820px]:w-auto max-[820px]:flex-1 max-[820px]:flex-col max-[820px]:gap-1 max-[820px]:px-1 max-[820px]:py-2 max-[820px]:text-[9px] ${active ? 'bg-[#e8efe6] text-brand' : 'bg-transparent text-[#748078]'}`} onClick={onClick}><Icon className="max-[820px]:w-4" size={19} />{label}</button>
}

export function Sidebar({ view, onView, user, onSignOut }: { view: View; onView: (view: View) => void; user: User; onSignOut: () => void }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-61 flex-col border-r border-line bg-[#fafbf7] px-4.5 pt-7.5 pb-5.5 max-[1100px]:w-51.25 max-[820px]:inset-x-0 max-[820px]:top-auto max-[820px]:h-16.75 max-[820px]:w-auto max-[820px]:flex-row max-[820px]:items-center max-[820px]:border-r-0 max-[820px]:border-t max-[820px]:px-3 max-[820px]:pt-1.75 max-[820px]:pb-[env(safe-area-inset-bottom)]">
      <div className="px-2.5 max-[820px]:hidden"><Logo /></div>
      <nav className="mt-14.5 flex flex-col gap-1.5 max-[820px]:mt-0 max-[820px]:w-full max-[820px]:flex-row max-[820px]:justify-around">
        <span className="mx-3 mb-2 text-[10px] font-bold tracking-[.13em] text-[#a1aaa4] uppercase max-[820px]:hidden">Workspace</span>
        {navItems.map((item) => <SidebarButton key={item.id} icon={item.icon} label={item.label} active={view === item.id} onClick={() => onView(item.id)} />)}
      </nav>
      <div className="mt-auto flex flex-col gap-1 max-[820px]:hidden">
        <SidebarButton icon={Settings} label="Settings" />
        <SidebarButton icon={LogOut} label="Sign out" onClick={onSignOut} />
        <div className="mt-3.5 flex min-w-0 items-center gap-2.5 border-t border-line px-2 pt-4">
          <Avatar.Root className="grid size-8.5 shrink-0 place-items-center overflow-hidden rounded-full bg-brand text-[11px] font-bold text-white"><Avatar.Fallback>{initials(user)}</Avatar.Fallback></Avatar.Root>
          <div className="flex min-w-0 flex-col"><strong className="overflow-hidden text-xs text-ellipsis whitespace-nowrap">{user.name} {user.surname}</strong><span className="overflow-hidden text-[10px] text-ellipsis whitespace-nowrap text-muted">{user.email}</span></div>
        </div>
      </div>
    </aside>
  )
}
