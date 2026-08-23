import { useId } from 'react'

const days = Array.from({ length: 31 }, (_, index) => index + 1)

type DayOfMonthPickerProps = {
  value: number
  onChange: (day: number) => void
  disabled?: boolean
  error?: string
}

export function DayOfMonthPicker({ value, onChange, disabled = false, error }: DayOfMonthPickerProps) {
  const id = useId()
  const descriptionID = `${id}-description`
  const errorID = `${id}-error`

  return (
    <fieldset className="m-0 min-w-0 border-0 p-0" disabled={disabled} aria-describedby={`${descriptionID}${error ? ` ${errorID}` : ''}`}>
      <legend className="sr-only">Billing day</legend>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[9px] font-bold text-[#5d6a63]" aria-hidden="true">Billing day</span>
        <span className="rounded-full bg-[#edf2e9] px-2 py-0.5 text-[9px] font-bold text-brand">Day {value}</span>
      </div>
      <div className="grid grid-cols-7 gap-1 rounded-xl border border-[#dfe3db] bg-[#f6f7f3] p-2" role="group" aria-label="Choose a billing day">
        {days.map((day) => {
          const selected = day === value
          return (
            <button
              aria-label={`Day ${day} of each month`}
              aria-pressed={selected}
              className={`h-8 cursor-pointer rounded-lg border text-[10px] font-bold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55 ${selected ? 'border-brand bg-brand text-white' : 'border-transparent bg-white text-[#5d6a63] hover:border-[#cbd5c9] hover:bg-[#edf2e9] hover:text-brand'}`}
              key={day}
              onClick={() => onChange(day)}
              type="button"
            >
              {day}
            </button>
          )
        })}
      </div>
      <p className="mt-1.5 mb-0 text-[9px] leading-[1.45] text-muted" id={descriptionID}>In shorter months, billing falls on the last available day.</p>
      {error && <span className="mt-1 block text-[9px] leading-3 text-[#984b37]" id={errorID} role="alert">{error}</span>}
    </fieldset>
  )
}
