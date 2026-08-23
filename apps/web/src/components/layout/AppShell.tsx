import { AlertCircle, RefreshCw, X } from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import { div as MotionDiv } from 'motion/react-m'
import { useLocation, useOutlet } from 'react-router'
import { quickTransition } from '@/lib/motion'
import type { User } from '@/types'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

type AppShellProps = {
  user: User
  isDemo: boolean
  refreshing: boolean
  error: string
  onRetry: () => void
  onDismissError: () => void
  onSignOut: () => void
}

export function AppShell({ user, isDemo, refreshing, error, onRetry, onDismissError, onSignOut }: AppShellProps) {
  const location = useLocation()
  const outlet = useOutlet()

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar user={user} onSignOut={onSignOut} />
      <div className="ml-55 min-w-0 flex-1 max-[1100px]:ml-50 max-[820px]:ml-0 max-[820px]:pb-16">
        <Topbar isDemo={isDemo} user={user} onSignOut={onSignOut} />
        <main className="mx-auto w-full max-w-330 px-7.5 pt-7 pb-10 max-[1100px]:px-5 max-[820px]:px-4 max-[820px]:pt-5 max-[820px]:pb-8" aria-busy={refreshing}>
          {refreshing && (
            <div className="mt-[-16px] mb-2.5 flex min-h-6 items-center gap-2 text-[9px] text-muted max-[540px]:mt-[-10px]" role="status">
              <span className="relative h-0.75 w-13 overflow-hidden rounded-full bg-[#dfe5db] after:absolute after:inset-0 after:w-[45%] after:rounded-[inherit] after:bg-brand after:content-[''] after:animate-[refresh-slide_1s_ease-in-out_infinite]" />
              <em className="not-italic">Refreshing data…</em>
            </div>
          )}
          {error && (
            <div className="mb-4.5 grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2.75 rounded-xl border border-[#efc6b9] bg-[#fff2ed] py-2.75 pr-3 pl-3.5 text-[11px] text-[#984b37] animate-[notice-in_.2s_cubic-bezier(.22,1,.36,1)] max-[540px]:grid-cols-[auto_minmax(0,1fr)_auto] max-[540px]:items-start" role="alert">
              <AlertCircle size={17} />
              <span className="flex min-w-0 flex-col gap-0.5"><strong className="text-[#793a2b]">We couldn’t refresh your data.</strong>{error}</span>
              <button className="inline-flex min-h-7.5 cursor-pointer items-center gap-1.25 rounded-lg border border-[#e5b6a8] bg-white/55 px-2.5 text-[10px] font-bold disabled:opacity-60 max-[540px]:col-start-2 max-[540px]:justify-self-start" onClick={onRetry} disabled={refreshing}><RefreshCw size={14} /> Try again</button>
              <button className="grid size-7.5 cursor-pointer place-items-center rounded-lg border-0 bg-transparent hover:bg-[#984b3714] max-[540px]:col-start-3 max-[540px]:row-start-1 max-[540px]:mt-[-6px]" aria-label="Dismiss error" onClick={onDismissError}><X size={16} /></button>
            </div>
          )}
          <AnimatePresence initial={false} mode="wait">
            <MotionDiv
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              initial={{ opacity: 0, y: 7 }}
              key={location.pathname}
              transition={quickTransition}
            >
              {outlet}
            </MotionDiv>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
