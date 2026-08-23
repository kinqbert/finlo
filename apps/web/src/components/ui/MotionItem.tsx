import type { PropsWithChildren } from 'react'
import { div as MotionDiv } from 'motion/react-m'
import { cn } from '@/lib/cn'
import { swiftTransition } from '@/lib/motion'

export function MotionItem({ children, className, highlight = false }: PropsWithChildren<{ className?: string; highlight?: boolean }>) {
  return (
    <MotionDiv
      animate={{ opacity: 1, y: 0, scale: 1, backgroundColor: 'rgba(223, 243, 219, 0)' }}
      className={cn(className)}
      exit={{ opacity: 0, y: -5, scale: 0.99 }}
      initial={{ opacity: 0, y: 8, scale: 0.992, backgroundColor: highlight ? 'rgba(223, 243, 219, 0.72)' : 'rgba(223, 243, 219, 0)' }}
      layout="position"
      transition={swiftTransition}
    >
      {children}
    </MotionDiv>
  )
}
