import { useEffect, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { span as MotionSpan } from 'motion/react-m'
import { supportedCurrencies } from '@/constants/currencies'

const typingDelay = 115
const deletingDelay = 70
const completedWordDelay = 2400
const betweenWordsDelay = 320

export function RotatingCurrency() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [visibleCharacters, setVisibleCharacters] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const reduceMotion = useReducedMotion()
  const activeCurrency = supportedCurrencies[activeIndex]

  useEffect(() => {
    if (reduceMotion) return

    let delay = typingDelay
    let advance = () => setVisibleCharacters((current) => current + 1)

    if (deleting) {
      if (visibleCharacters > 0) {
        delay = deletingDelay
        advance = () => setVisibleCharacters((current) => current - 1)
      } else {
        delay = betweenWordsDelay
        advance = () => {
          setActiveIndex((current) => (current + 1) % supportedCurrencies.length)
          setDeleting(false)
        }
      }
    } else if (visibleCharacters >= activeCurrency.name.length) {
      delay = completedWordDelay
      advance = () => setDeleting(true)
    }

    const timeout = window.setTimeout(advance, delay)

    return () => window.clearTimeout(timeout)
  }, [activeCurrency.name.length, deleting, reduceMotion, visibleCharacters])

  const visibleText = reduceMotion
    ? supportedCurrencies[0].name
    : activeCurrency.name.slice(0, visibleCharacters)

  return (
    <span className="contents">
      <span className="sr-only">hryvnia, dollar, or euro</span>
      <span
        aria-hidden="true"
        className="relative isolate mx-[.04em] inline-flex overflow-hidden align-baseline text-lime [text-shadow:0_0_30px_rgba(200,238,117,.22)] before:absolute before:inset-x-[-.04em] before:inset-y-[.04em] before:-z-1 before:rounded-[.16em] before:bg-lime/8 before:ring-1 before:ring-lime/12 before:content-[''] after:absolute after:right-[.1em] after:bottom-[.02em] after:left-[.1em] after:h-[.035em] after:rounded-full after:bg-lime/70 after:shadow-[0_0_18px_rgba(200,238,117,.45)] after:content-['']"
      >
        <span className="inline-block min-w-[.25em] whitespace-nowrap px-[.12em]">
          {visibleText}
        </span>
        {!reduceMotion && (
          <MotionSpan
            animate={{ opacity: [1, 1, 0, 0] }}
            className="absolute top-[.18em] right-[.06em] h-[.7em] w-[.025em] rounded-full bg-lime/90"
            transition={{ duration: 1, ease: 'linear', repeat: Infinity, times: [0, 0.48, 0.5, 1] }}
          />
        )}
      </span>
    </span>
  )
}
