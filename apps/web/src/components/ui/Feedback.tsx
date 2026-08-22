import { AlertCircle, LoaderCircle } from 'lucide-react'

export function InlineError({ message }: { message: string }) {
  if (!message) return null
  return <div className="m-0 flex items-start gap-2 rounded-[9px] border border-[#efc6b9] bg-[#fff2ed] px-3 py-2.5 text-[10px] leading-[1.4] text-[#984b37]" role="alert"><AlertCircle className="mt-px shrink-0" size={15} /><span>{message}</span></div>
}

export function SubmitButton({ busy, label, busyLabel, disabled = false }: { busy: boolean; label: string; busyLabel: string; disabled?: boolean }) {
  return <button className="inline-flex min-h-10.5 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-brand bg-brand px-4 text-[13px] font-bold text-white shadow-[0_7px_18px_rgba(21,63,46,.16)] hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60" disabled={busy || disabled}>{busy && <LoaderCircle className="animate-spin" size={16} />}{busy ? busyLabel : label}</button>
}
