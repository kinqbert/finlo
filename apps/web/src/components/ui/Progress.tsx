import * as Progress from '@radix-ui/react-progress'
import { useReducedMotion } from 'motion/react'
import { circle as MotionCircle, div as MotionDiv } from 'motion/react-m'
import { AnimatedNumber } from './AnimatedValue'
import { cn } from '@/lib/cn'
import { swiftTransition } from '@/lib/motion'

export function AnimatedProgressBar({ value, warning = false }: { value: number; warning?: boolean }) {
  const reduceMotion = useReducedMotion()
  const normalizedValue = Math.min(100, Math.max(0, value))

  return (
    <Progress.Root className="h-1.25 overflow-hidden rounded-full bg-[#eceee7]" value={normalizedValue}>
      <Progress.Indicator asChild>
        <MotionDiv
          animate={{ scaleX: normalizedValue / 100 }}
          className={cn('h-full w-full origin-left rounded-[inherit]', warning ? 'bg-[#da936d]' : 'bg-[#6da278]')}
          initial={false}
          transition={reduceMotion ? { duration: 0 } : swiftTransition}
        />
      </Progress.Indicator>
    </Progress.Root>
  )
}

export function AnimatedProgressRing({ value, className }: { value: number; className?: string }) {
  const reduceMotion = useReducedMotion()
  const normalizedValue = Math.min(100, Math.max(0, value))

  return (
    <div className={cn('relative grid shrink-0 place-items-center', className)}>
      <svg aria-hidden="true" className="absolute inset-0 size-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" fill="none" r="43" stroke="#e9ede5" strokeWidth="14" />
        <MotionCircle
          animate={{ pathLength: normalizedValue / 100 }}
          cx="50"
          cy="50"
          fill="none"
          initial={false}
          pathLength={1}
          r="43"
          stroke="#77a576"
          strokeLinecap="round"
          strokeWidth="14"
          transition={reduceMotion ? { duration: 0 } : swiftTransition}
        />
      </svg>
      <AnimatedNumber className="relative font-heading text-sm font-bold" suffix="%" value={normalizedValue} />
    </div>
  )
}
