import type { ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

export function FinanceDialog({ busy, eyebrow, title, description, children }: { busy: boolean; eyebrow: string; title: string; description: string; children: ReactNode }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-[rgba(11,24,18,.46)] backdrop-blur-[3px] data-[state=open]:animate-[fade-in_.15s_ease] data-[state=closed]:animate-[fade-out_.12s_ease]" />
      <Dialog.Content className="fixed top-1/2 left-1/2 z-51 max-h-[calc(100vh-24px)] w-[min(490px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[17px] bg-white p-6 shadow-[0_26px_80px_rgba(10,30,20,.22)] data-[state=open]:animate-[fade-in_.18s_ease-out] data-[state=closed]:animate-[fade-out_.12s_ease-in] max-[540px]:p-5 aria-busy:[&_input]:bg-[#f4f5f1] aria-busy:[&_select]:bg-[#f4f5f1]" aria-busy={busy}>
        <Dialog.Close className="absolute top-3.5 right-3.5 grid size-8 cursor-pointer place-items-center rounded-full border-0 bg-canvas disabled:cursor-not-allowed disabled:opacity-60" disabled={busy}><X size={17} /></Dialog.Close>
        <span className="mb-1.5 block text-[9px] font-extrabold tracking-[.14em] text-[#75837b] uppercase">{eyebrow}</span>
        <Dialog.Title className="mt-0 mb-1 font-heading text-[22px] font-bold tracking-[-.6px]">{title}</Dialog.Title>
        <Dialog.Description className="m-0 text-[11px] text-muted">{description}</Dialog.Description>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  )
}

export function DialogForm({ children, onSubmit, spaced = false }: { children: ReactNode; onSubmit: React.FormEventHandler<HTMLFormElement>; spaced?: boolean }) {
  return <form className={`grid gap-3 ${spaced ? 'mt-5' : ''}`} onSubmit={onSubmit}>{children}</form>
}

export function FormField({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return <label className="grid flex-1 gap-1.25 [&_input]:h-9.5 [&_input]:w-full [&_input]:min-w-0 [&_input]:rounded-[9px] [&_input]:border [&_input]:border-[#dfe3db] [&_input]:bg-[#fbfcf8] [&_input]:px-3 [&_input]:text-xs [&_select]:h-9.5 [&_select]:w-full [&_select]:min-w-0 [&_select]:rounded-[9px] [&_select]:border [&_select]:border-[#dfe3db] [&_select]:bg-[#fbfcf8] [&_select]:px-3 [&_select]:text-xs"><span className="text-[9px] font-bold text-[#5d6a63]">{label}</span>{children}{error && <span className="text-[9px] leading-3 text-[#984b37]" role="alert">{error}</span>}</label>
}

export function MoneyInput({ children }: { children: ReactNode }) {
  return <div className="relative [&_b]:absolute [&_b]:top-1/2 [&_b]:left-3 [&_b]:z-1 [&_b]:-translate-y-1/2 [&_b]:text-brand [&_input]:pl-8 [&_input]:text-[17px] [&_input]:font-bold"><b>₴</b>{children}</div>
}
