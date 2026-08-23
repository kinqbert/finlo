import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from './Button'
import { Logo } from './Logo'

export function LoadingScreen({ label }: { label: string }) {
  return <div className="grid min-h-screen place-content-center gap-5 bg-canvas" role="status"><Logo /><span className="mx-auto size-5.5 animate-spin rounded-full border-2 border-[#dce3d9] border-t-brand" /><p className="mt-[-8px] mb-0 text-center text-[11px] text-muted">{label}</p></div>
}

export function PageLoading({ label }: { label: string }) {
  return (
    <div className="animate-pulse" role="status" aria-label={label}>
      <span className="sr-only">{label}</span>
      <div className="mb-5.5 grid gap-2">
        <span className="h-2 w-31 rounded-full bg-[#dde3da]" />
        <span className="h-7 w-[min(290px,72%)] rounded-lg bg-[#d7ded4]" />
        <span className="h-2.5 w-[min(410px,92%)] rounded-full bg-[#e1e5de]" />
      </div>
      <div className="mb-2.5 grid grid-cols-3 gap-2.5 max-[820px]:grid-cols-2 max-[540px]:grid-cols-1">
        {[0, 1, 2].map((item) => (
          <div className="min-h-29 rounded-[15px] border border-line bg-white p-4.5" key={item}>
            <span className="mb-5 block size-8 rounded-[10px] bg-[#e6ebe3]" />
            <span className="mb-2 block h-2 w-16 rounded-full bg-[#e1e6df]" />
            <span className="block h-4 w-25 rounded-md bg-[#d8dfd5]" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[1.35fr_.65fr] gap-2.5 max-[820px]:grid-cols-1">
        {[0, 1].map((item) => (
          <div className="min-h-52 rounded-[15px] border border-line bg-white p-4.5" key={item}>
            <span className="mb-8 block h-3 w-28 rounded-full bg-[#d9dfd6]" />
            <div className="grid gap-3">
              <span className="h-2.5 w-full rounded-full bg-[#e5e9e2]" />
              <span className="h-2.5 w-4/5 rounded-full bg-[#e5e9e2]" />
              <span className="h-2.5 w-2/3 rounded-full bg-[#e5e9e2]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function LoadErrorScreen({ message, onRetry, onSignOut }: { message: string; onRetry: () => void; onSignOut: () => void }) {
  return <div className="grid min-h-screen place-items-center bg-canvas p-6"><div className="w-full max-w-97.5 rounded-[18px] border border-line bg-white p-7 text-center shadow-card max-[540px]:p-5"><div className="mb-5 flex justify-center"><Logo /></div><div className="mx-auto mb-3.5 grid size-10 place-items-center rounded-xl bg-[#fff0ea] text-[#a24837]"><AlertCircle size={22} /></div><h1 className="mt-0 mb-1.5 font-heading text-[22px] font-bold tracking-[-.6px]">We couldn’t load Finlo.</h1><p className="mt-0 mb-4.5 text-[10px] leading-[1.6] text-muted">{message || 'Check your connection and try again.'}</p><Button variant="primary" fullWidth onClick={onRetry}><RefreshCw size={15} /> Try again</Button><button className="mx-auto mt-3.5 flex cursor-pointer items-center gap-1 border-0 bg-transparent text-[10px] font-bold text-[#557360]" onClick={onSignOut}>Sign out and use another account</button></div></div>
}
