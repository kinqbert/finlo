import type { ComponentProps } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { cn } from '@/lib/cn'

export function SegmentedList({ className = '', ...props }: ComponentProps<typeof Tabs.List>) {
  return <Tabs.List className={cn('flex gap-0.5 rounded-[9px] bg-[#f0f2ec] p-0.75', className)} {...props} />
}

export function SegmentedTrigger({ className = '', ...props }: ComponentProps<typeof Tabs.Trigger>) {
  return <Tabs.Trigger className={cn('cursor-pointer rounded-[6px] border-0 bg-transparent px-2.5 py-1.5 text-[10px] font-bold text-muted outline-none transition-[background-color,color,box-shadow,transform] duration-150 ease-out active:scale-[.98] data-[state=active]:bg-white data-[state=active]:text-ink data-[state=active]:shadow-[0_2px_7px_rgba(0,0,0,.05)]', className)} {...props} />
}
