import { useEffect } from 'react'
import { animate, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { span as MotionSpan } from 'motion/react-m'
import { formatMoney } from '@/lib/format'
import { swiftTransition } from '@/lib/motion'
import { cn } from '@/lib/cn'

type SharedAnimatedValueProps = {
  value: number
  className?: string
}

type AnimatedMoneyProps = SharedAnimatedValueProps & {
  currency?: string
  compact?: boolean
  prefix?: string
}

type AnimatedNumberProps = SharedAnimatedValueProps & {
  prefix?: string
  suffix?: string
}

function useAnimatedValue(value: number) {
  const animatedValue = useMotionValue(value)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (reduceMotion) {
      animatedValue.set(value)
      return
    }

    const animation = animate(animatedValue, value, swiftTransition)
    return () => animation.stop()
  }, [animatedValue, reduceMotion, value])

  return animatedValue
}

export function AnimatedMoney({ value, currency = 'UAH', compact = false, prefix = '', className }: AnimatedMoneyProps) {
  const animatedValue = useAnimatedValue(value)
  const formattedValue = useTransform(animatedValue, (latest) => `${prefix}${formatMoney(Math.round(latest), currency, compact)}`)
  const finalValue = `${prefix}${formatMoney(value, currency, compact)}`

  return (
    <span aria-label={finalValue} className={cn('tabular-nums', className)}>
      <MotionSpan aria-hidden="true">{formattedValue}</MotionSpan>
    </span>
  )
}

export function AnimatedNumber({ value, prefix = '', suffix = '', className }: AnimatedNumberProps) {
  const animatedValue = useAnimatedValue(value)
  const formattedValue = useTransform(animatedValue, (latest) => `${prefix}${Math.round(latest)}${suffix}`)
  const finalValue = `${prefix}${Math.round(value)}${suffix}`

  return (
    <span aria-label={finalValue} className={cn('tabular-nums', className)}>
      <MotionSpan aria-hidden="true">{formattedValue}</MotionSpan>
    </span>
  )
}
