import * as Avatar from '@radix-ui/react-avatar'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronUp, LogOut, Settings } from 'lucide-react'
import { Link, useMatch } from 'react-router'
import { MenuContent, MenuItem, MenuSeparator } from '@/components/ui/Menu'
import { routes } from '@/constants/routes'
import { initials } from '@/lib/format'
import type { User } from '@/types'

export function UserMenu({ user, onSignOut, placement = 'sidebar' }: { user: User; onSignOut: () => void; placement?: 'sidebar' | 'topbar' }) {
  const settingsActive = useMatch(routes.settings) !== null
  const compact = placement === 'topbar'

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={compact ? 'Open account menu' : undefined}
        className={compact
          ? 'grid size-8.5 cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 outline-none transition-transform duration-150 active:scale-[.96] focus-visible:ring-2 focus-visible:ring-brand/30'
          : `group flex min-h-12 w-full min-w-0 cursor-pointer items-center gap-2 rounded-[11px] border-0 bg-transparent p-2 text-left outline-none transition-colors duration-150 hover:bg-[#f0f2eb] focus-visible:ring-2 focus-visible:ring-brand/30 data-[state=open]:bg-[#e8efe6] ${settingsActive ? 'text-brand' : 'text-ink'}`}
      >
        <Avatar.Root className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-brand font-bold text-white ${compact ? 'size-8.5 text-[10px] ring-1 ring-brand/10 ring-offset-2 ring-offset-[#fafbf7]' : 'size-8 text-[10px]'}`}>
          <Avatar.Fallback>{initials(user)}</Avatar.Fallback>
        </Avatar.Root>
        {!compact && <><span className="flex min-w-0 flex-1 flex-col gap-0.5"><strong className="overflow-hidden text-[11px] leading-tight text-ellipsis whitespace-nowrap">{user.name} {user.surname}</strong><span className="overflow-hidden text-[9px] leading-tight text-ellipsis whitespace-nowrap text-muted">{user.email}</span></span><ChevronUp className="shrink-0 text-muted transition-transform duration-200 group-data-[state=open]:rotate-180" size={14} /></>}
      </DropdownMenu.Trigger>
      <MenuContent className={compact ? 'w-62' : 'w-[var(--radix-dropdown-menu-trigger-width)] min-w-44'} side={compact ? 'bottom' : 'top'} align={compact ? 'end' : 'start'} sideOffset={compact ? 8 : 5} collisionPadding={8}>
        {compact && <div className="min-w-0 px-2.5 py-2"><strong className="block overflow-hidden text-xs text-ellipsis whitespace-nowrap">{user.name} {user.surname}</strong><span className="mt-0.5 block overflow-hidden text-[10px] text-ellipsis whitespace-nowrap text-muted">{user.email}</span></div>}
        {compact && <MenuSeparator />}
        <MenuItem asChild><Link to={routes.settings}><Settings size={15} /> Settings</Link></MenuItem>
        <MenuSeparator />
        <MenuItem className="text-[#a24837]" onSelect={onSignOut}><LogOut size={15} /> Sign out</MenuItem>
      </MenuContent>
    </DropdownMenu.Root>
  )
}
