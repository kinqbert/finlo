import { useEffect } from 'react'
import { animate, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { span as MotionSpan } from 'motion/react-m'
import { formatMoney, formatMoneyAmount } from '@/lib/format'
import { swiftTransition } from '@/lib/motion'
import { cn } from '@/lib/cn'
import { baseCurrencyCode } from '@/constants/currencies'

type SharedAnimatedValueProps = {
  value: number
  className?: string
}

type AnimatedMoneyProps = SharedAnimatedValueProps & {
  currency?: string
  compact?: boolean
  prefix?: string
  subtleCurrency?: boolean
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

export function AnimatedMoney({ value, currency = baseCurrencyCode, compact = false, prefix = '', subtleCurrency = false, className }: AnimatedMoneyProps) {
  const animatedValue = useAnimatedValue(value)
  const formattedValue = useTransform(animatedValue, (latest) => `${prefix}${formatMoney(Math.round(latest), currency, compact)}`)
  const formattedAmount = useTransform(animatedValue, (latest) => `${prefix}${formatMoneyAmount(Math.round(latest), currency, compact)}`)
  const finalValue = `${prefix}${formatMoney(value, currency, compact)}`

  if (subtleCurrency) {
    return (
      <span aria-label={finalValue} className={cn('inline-flex items-baseline gap-[.22em] tabular-nums', className)}>
        <span aria-hidden="true" className="text-[.45em] font-semibold tracking-[.04em] opacity-55">{currency}</span>
        <MotionSpan aria-hidden="true">{formattedAmount}</MotionSpan>
      </span>
    )
  }

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
