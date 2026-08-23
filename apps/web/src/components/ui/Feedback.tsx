import { AlertCircle, LoaderCircle } from 'lucide-react'
import { Button } from './Button'

export function InlineError({ message }: { message: string }) {
  if (!message) return null
  return <div className="m-0 flex items-start gap-2 rounded-[9px] border border-[#efc6b9] bg-[#fff2ed] px-3 py-2.5 text-[10px] leading-[1.4] text-[#984b37]" role="alert"><AlertCircle className="mt-px shrink-0" size={15} /><span>{message}</span></div>
}

export function SubmitButton({ busy, label, busyLabel, disabled = false }: { busy: boolean; label: string; busyLabel: string; disabled?: boolean }) {
  return <Button variant="primary" fullWidth disabled={busy || disabled}>{busy && <LoaderCircle className="animate-spin" size={15} />}{busy ? busyLabel : label}</Button>
}
