import { CalendarRange, LayoutDashboard, Target, WalletCards, type LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router'
import { routes } from '@/constants/routes'
import type { User } from '@/types'
import { Logo } from '../ui/Logo'
import { UserMenu } from './UserMenu'

const navItems = [
  { to: routes.overview, label: 'Overview', icon: LayoutDashboard, end: true },
  { to: routes.accounts, label: 'Accounts', icon: WalletCards },
  { to: routes.goals, label: 'Goals', icon: Target },
  { to: routes.planning, label: 'Planning', icon: CalendarRange },
]

const navClassName = 'flex min-h-9.5 w-full cursor-pointer items-center gap-2.5 rounded-[9px] px-2.5 py-1.5 text-left text-[13px] font-semibold no-underline transition-colors duration-150 ease-out hover:bg-[#f0f2eb] hover:text-ink max-[820px]:min-h-0 max-[820px]:w-auto max-[820px]:flex-1 max-[820px]:flex-col max-[820px]:gap-1 max-[820px]:px-1 max-[820px]:py-1.5 max-[820px]:text-[9px]'

function SidebarLink({ icon: Icon, label, to, end = false }: { icon: LucideIcon; label: string; to: string; end?: boolean }) {
  return <NavLink className={({ isActive }) => `${navClassName} ${isActive ? 'bg-[#e8efe6] text-brand' : 'text-[#748078]'}`} to={to} end={end}><Icon className="max-[820px]:w-4" size={17} />{label}</NavLink>
}

export function Sidebar({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-55 flex-col border-r border-line bg-[#fafbf7] px-3 pt-5.5 pb-3.5 max-[1100px]:w-50 max-[820px]:inset-x-0 max-[820px]:top-auto max-[820px]:h-15.5 max-[820px]:w-auto max-[820px]:flex-row max-[820px]:items-center max-[820px]:border-r-0 max-[820px]:border-t max-[820px]:px-2.5 max-[820px]:pt-1 max-[820px]:pb-[env(safe-area-inset-bottom)]">
      <div className="px-2 max-[820px]:hidden"><Logo compact /></div>
      <nav className="mt-8 flex flex-col gap-0.5 max-[820px]:mt-0 max-[820px]:min-w-0 max-[820px]:flex-[4] max-[820px]:flex-row max-[820px]:justify-around">
        <span className="mx-2.5 mb-1.5 text-[9px] font-bold tracking-[.13em] text-[#a1aaa4] uppercase max-[820px]:hidden">Workspace</span>
        {navItems.map((item) => <SidebarLink key={item.to} {...item} />)}
      </nav>
      <div className="mt-auto min-w-0 border-t border-line pt-2 max-[820px]:hidden">
        <UserMenu user={user} onSignOut={onSignOut} />
      </div>
    </aside>
  )
}
