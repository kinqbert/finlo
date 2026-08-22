import { AlertCircle, RefreshCw } from 'lucide-react'
import { Logo } from '../ui/Logo'

export function LoadingScreen({ label }: { label: string }) {
  return <div className="grid min-h-screen place-content-center gap-5 bg-canvas" role="status"><Logo /><span className="mx-auto size-5.5 animate-spin rounded-full border-2 border-[#dce3d9] border-t-brand" /><p className="mt-[-8px] mb-0 text-center text-[11px] text-muted">{label}</p></div>
}

export function LoadErrorScreen({ message, onRetry, onSignOut }: { message: string; onRetry: () => void; onSignOut: () => void }) {
  return <div className="grid min-h-screen place-items-center bg-canvas p-6"><div className="w-full max-w-97.5 rounded-[20px] border border-line bg-white p-9 text-center shadow-card max-[540px]:px-5.5 max-[540px]:py-7.5"><div className="mb-7 flex justify-center"><Logo /></div><div className="mx-auto mb-4 grid size-11 place-items-center rounded-[14px] bg-[#fff0ea] text-[#a24837]"><AlertCircle size={24} /></div><h1 className="mt-0 mb-2 font-heading text-[25px] font-bold tracking-[-.7px]">We couldn’t load Finlo.</h1><p className="mt-0 mb-5.5 text-[11px] leading-[1.6] text-muted">{message || 'Check your connection and try again.'}</p><button className="inline-flex min-h-10.5 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-brand bg-brand px-4 text-[13px] font-bold text-white shadow-[0_7px_18px_rgba(21,63,46,.16)] hover:bg-brand-dark" onClick={onRetry}><RefreshCw size={16} /> Try again</button><button className="mx-auto mt-4 flex cursor-pointer items-center gap-1 border-0 bg-transparent text-[10px] font-bold text-[#557360]" onClick={onSignOut}>Sign out and use another account</button></div></div>
}
