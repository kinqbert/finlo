import type { ComponentProps, ReactNode } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

export function MenuContent({ children, className = '', ...props }: ComponentProps<typeof DropdownMenu.Content> & { children: ReactNode }) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content className={`z-100 rounded-[11px] border border-line bg-white p-1 shadow-card ${className}`} {...props}>{children}</DropdownMenu.Content>
    </DropdownMenu.Portal>
  )
}

export function MenuItem({ className = '', ...props }: ComponentProps<typeof DropdownMenu.Item>) {
  return <DropdownMenu.Item className={`flex min-h-8.5 cursor-pointer items-center gap-2 rounded-lg px-2.5 text-xs outline-none hover:bg-canvas focus:bg-canvas ${className}`} {...props} />
}

export function MenuSeparator({ className = '', ...props }: ComponentProps<typeof DropdownMenu.Separator>) {
  return <DropdownMenu.Separator className={`my-1 h-px bg-line ${className}`} {...props} />
}
