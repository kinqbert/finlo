import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '../ui/Button'
import { Logo } from '../ui/Logo'

export function LoadingScreen({ label }: { label: string }) {
  return <div className="grid min-h-screen place-content-center gap-5 bg-canvas" role="status"><Logo /><span className="mx-auto size-5.5 animate-spin rounded-full border-2 border-[#dce3d9] border-t-brand" /><p className="mt-[-8px] mb-0 text-center text-[11px] text-muted">{label}</p></div>
}

export function LoadErrorScreen({ message, onRetry, onSignOut }: { message: string; onRetry: () => void; onSignOut: () => void }) {
  return <div className="grid min-h-screen place-items-center bg-canvas p-6"><div className="w-full max-w-97.5 rounded-[18px] border border-line bg-white p-7 text-center shadow-card max-[540px]:p-5"><div className="mb-5 flex justify-center"><Logo /></div><div className="mx-auto mb-3.5 grid size-10 place-items-center rounded-xl bg-[#fff0ea] text-[#a24837]"><AlertCircle size={22} /></div><h1 className="mt-0 mb-1.5 font-heading text-[22px] font-bold tracking-[-.6px]">We couldn’t load Finlo.</h1><p className="mt-0 mb-4.5 text-[10px] leading-[1.6] text-muted">{message || 'Check your connection and try again.'}</p><Button variant="primary" fullWidth onClick={onRetry}><RefreshCw size={15} /> Try again</Button><button className="mx-auto mt-3.5 flex cursor-pointer items-center gap-1 border-0 bg-transparent text-[10px] font-bold text-[#557360]" onClick={onSignOut}>Sign out and use another account</button></div></div>
}
