import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import * as Tooltip from '@radix-ui/react-tooltip'
import { AlertCircle, RefreshCw, X } from 'lucide-react'
import { loadSession, tokenStore } from './api'
import { Sidebar } from './components/layout/Sidebar'
import { Topbar } from './components/layout/Topbar'
import { LoadErrorScreen, LoadingScreen } from './components/screens/LoadingScreen'
import { demoData, demoUser } from './demo-data'
import { AuthScreen } from './features/auth/AuthScreen'
import { ActivityPage } from './features/finance/pages/ActivityPage'
import { OverviewPage } from './features/finance/pages/OverviewPage'
import { PlansPage } from './features/finance/pages/PlansPage'
import { SubscriptionsPage } from './features/finance/pages/SubscriptionsPage'
import type { View } from './features/finance/types'
import { SettingsPage } from './features/settings/SettingsPage'
import { errorMessage } from './lib/format'
import { queryKeys } from './lib/query'
import type { FinanceData } from './types'

type Session = 'guest' | 'api' | 'demo'

function App() {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session>(() => tokenStore.getAccess() ? 'api' : 'guest')
  const [view, setView] = useState<View>('overview')
  const [dataError, setDataError] = useState('')
  const sessionQuery = useQuery({
    queryKey: queryKeys.session,
    queryFn: loadSession,
    enabled: session === 'api',
    retry: false,
  })

  async function completeAuthentication() {
    await queryClient.fetchQuery({ queryKey: queryKeys.session, queryFn: loadSession, staleTime: 0 })
    setSession('api')
  }

  async function refreshData() {
    if (session !== 'api') return
    setDataError('')
    const result = await sessionQuery.refetch()
    if (result.error) setDataError(errorMessage(result.error, 'Could not refresh your financial data.'))
  }

  function updateDemoData(data: FinanceData) {
    queryClient.setQueryData(queryKeys.session, { user: demoUser, data })
  }

  function signOut() {
    tokenStore.clear()
    queryClient.removeQueries({ queryKey: queryKeys.session })
    setSession('guest')
    setView('overview')
    setDataError('')
  }

  if (session === 'api' && sessionQuery.isPending) return <LoadingScreen label="Loading your finances…" />
  if (session === 'api' && sessionQuery.isError && !sessionQuery.data) return <LoadErrorScreen message={errorMessage(sessionQuery.error, 'Finlo could not load your financial data.')} onRetry={() => void sessionQuery.refetch()} onSignOut={signOut} />
  if (session === 'guest') return <AuthScreen onAuthenticated={completeAuthentication} onDemo={() => { queryClient.setQueryData(queryKeys.session, { user: demoUser, data: structuredClone(demoData) }); setSession('demo') }} />

  const cachedSession = sessionQuery.data ?? queryClient.getQueryData<{ user: typeof demoUser; data: FinanceData }>(queryKeys.session)
  const user = cachedSession?.user ?? demoUser
  const data = cachedSession?.data ?? structuredClone(demoData)
  const refreshing = session === 'api' && sessionQuery.isFetching
  const financeActions = { data, isDemo: session === 'demo', onDemoChange: updateDemoData }

  return (
    <Tooltip.Provider delayDuration={250}>
      <div className="flex min-h-screen bg-canvas">
        <Sidebar view={view} onView={setView} user={user} onSignOut={signOut} />
        <div className="ml-55 min-w-0 flex-1 max-[1100px]:ml-50 max-[820px]:ml-0 max-[820px]:pb-16">
          <Topbar isDemo={session === 'demo'} />
          <main className="mx-auto w-full max-w-330 px-7.5 pt-7 pb-10 max-[1100px]:px-5 max-[820px]:px-4 max-[820px]:pt-5 max-[820px]:pb-8" aria-busy={refreshing}>
            {refreshing && <div className="mt-[-16px] mb-2.5 flex min-h-6 items-center gap-2 text-[9px] text-muted max-[540px]:mt-[-10px]" role="status"><span className="relative h-0.75 w-13 overflow-hidden rounded-full bg-[#dfe5db] after:absolute after:inset-0 after:w-[45%] after:rounded-[inherit] after:bg-brand after:content-[''] after:animate-[refresh-slide_1s_ease-in-out_infinite]" /><em className="not-italic">Refreshing data…</em></div>}
            {dataError && <div className="mb-4.5 grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2.75 rounded-xl border border-[#efc6b9] bg-[#fff2ed] py-2.75 pr-3 pl-3.5 text-[11px] text-[#984b37] max-[540px]:grid-cols-[auto_minmax(0,1fr)_auto] max-[540px]:items-start" role="alert"><AlertCircle size={17} /><span className="flex min-w-0 flex-col gap-0.5"><strong className="text-[#793a2b]">We couldn’t refresh your data.</strong>{dataError}</span><button className="inline-flex min-h-7.5 cursor-pointer items-center gap-1.25 rounded-lg border border-[#e5b6a8] bg-white/55 px-2.5 text-[10px] font-bold disabled:opacity-60 max-[540px]:col-start-2 max-[540px]:justify-self-start" onClick={() => void refreshData()} disabled={refreshing}><RefreshCw size={14} /> Try again</button><button className="grid size-7.5 cursor-pointer place-items-center rounded-lg border-0 bg-transparent hover:bg-[#984b3714] max-[540px]:col-start-3 max-[540px]:row-start-1 max-[540px]:mt-[-6px]" aria-label="Dismiss error" onClick={() => setDataError('')}><X size={16} /></button></div>}
            {view === 'overview' && <OverviewPage user={user} {...financeActions} onView={setView} />}
            {view === 'activity' && <ActivityPage {...financeActions} />}
            {view === 'plans' && <PlansPage {...financeActions} />}
            {view === 'subscriptions' && <SubscriptionsPage {...financeActions} />}
            {view === 'settings' && <SettingsPage {...financeActions} />}
          </main>
        </div>
      </div>
    </Tooltip.Provider>
  )
}

export default App
