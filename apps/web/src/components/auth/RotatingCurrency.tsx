import { supportedCurrencies } from '@/constants/currencies'

const animationDelays = [
  '[animation-delay:-.48s]',
  '[animation-delay:2.72s]',
  '[animation-delay:5.92s]',
] as const

export function RotatingCurrency() {
  return (
    <span className="contents">
      <span className="sr-only">hryvnia, dollar, or euro</span>
      <span
        aria-hidden="true"
        className="relative isolate mx-[.04em] inline-grid overflow-hidden align-baseline text-lime [text-shadow:0_0_30px_rgba(200,238,117,.22)] before:absolute before:inset-x-[-.04em] before:inset-y-[.04em] before:-z-1 before:rounded-[.16em] before:bg-lime/8 before:ring-1 before:ring-lime/12 before:content-[''] after:absolute after:right-[.1em] after:bottom-[.02em] after:left-[.1em] after:h-[.035em] after:rounded-full after:bg-lime/70 after:shadow-[0_0_18px_rgba(200,238,117,.45)] after:content-['']"
      >
        <span className="invisible px-[.12em]">hryvnia</span>
        {supportedCurrencies.map((currency, index) => (
          <span
            className={`absolute inset-0 px-[.12em] text-center opacity-0 [animation:currency-cycle_9.6s_cubic-bezier(.22,1,.36,1)_infinite] motion-reduce:[animation:none] ${index === 0 ? 'motion-reduce:opacity-100' : 'motion-reduce:opacity-0'} ${animationDelays[index]}`}
            key={currency.code}
          >
            {currency.name}
          </span>
        ))}
      </span>
    </span>
  )
}
