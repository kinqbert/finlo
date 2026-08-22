import { useEffect, useState } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { AlertCircle, RefreshCw, X } from 'lucide-react'
import { ApiError, getMe, loadFinanceData, tokenStore } from './api'
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
import { errorMessage } from './lib/format'
import type { FinanceData, User } from './types'

type Session = 'loading' | 'error' | 'guest' | 'api' | 'demo'

function App() {
  const [session, setSession] = useState<Session>(() => tokenStore.getAccess() ? 'loading' : 'guest')
  const [user, setUser] = useState<User>(demoUser)
  const [data, setData] = useState<FinanceData>(() => structuredClone(demoData))
  const [view, setView] = useState<View>('overview')
  const [startupError, setStartupError] = useState('')
  const [dataError, setDataError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (session !== 'loading') return
    Promise.all([getMe(), loadFinanceData()])
      .then(([currentUser, financeData]) => {
        setUser(currentUser)
        setData(financeData)
        setSession('api')
      })
      .catch((caught) => {
        if (caught instanceof ApiError && caught.status === 401) {
          tokenStore.clear()
          setSession('guest')
          return
        }
        setStartupError(errorMessage(caught, 'Finlo could not load your financial data.'))
        setSession('error')
      })
  }, [session])

  async function completeAuthentication() {
    const [currentUser, financeData] = await Promise.all([getMe(), loadFinanceData()])
    setUser(currentUser)
    setData(financeData)
    setSession('api')
  }

  async function refreshData() {
    if (session !== 'api') return
    setRefreshing(true)
    setDataError('')
    try { setData(await loadFinanceData()) }
    catch (caught) { setDataError(errorMessage(caught, 'Could not refresh your financial data.')) }
    finally { setRefreshing(false) }
  }

  function signOut() {
    tokenStore.clear()
    setSession('guest')
    setView('overview')
    setStartupError('')
    setDataError('')
  }

  if (session === 'loading') return <LoadingScreen label="Loading your finances…" />
  if (session === 'error') return <LoadErrorScreen message={startupError} onRetry={() => { setStartupError(''); setSession('loading') }} onSignOut={signOut} />
  if (session === 'guest') return <AuthScreen onAuthenticated={completeAuthentication} onDemo={() => { setUser(demoUser); setData(structuredClone(demoData)); setSession('demo') }} />

  const financeActions = { data, isDemo: session === 'demo', onCreated: refreshData, onDemoChange: setData }

  return (
    <Tooltip.Provider delayDuration={250}>
      <div className="flex min-h-screen bg-canvas">
        <Sidebar view={view} onView={setView} user={user} onSignOut={signOut} />
        <div className="ml-61 min-w-0 flex-1 max-[1100px]:ml-51.25 max-[820px]:ml-0 max-[820px]:pb-17.5">
          <Topbar user={user} isDemo={session === 'demo'} onSignOut={signOut} />
          <main className="mx-auto w-full max-w-330 px-10.5 pt-11 pb-17.5 max-[1100px]:px-6.25 max-[820px]:px-4.5 max-[820px]:pt-7 max-[820px]:pb-11.25" aria-busy={refreshing}>
            {refreshing && <div className="mt-[-24px] mb-3.5 flex min-h-7.5 items-center gap-2.5 text-[10px] text-muted max-[540px]:mt-[-12px]" role="status"><span className="relative h-0.75 w-15.5 overflow-hidden rounded-full bg-[#dfe5db] after:absolute after:inset-0 after:w-[45%] after:rounded-[inherit] after:bg-brand after:content-[''] after:animate-[refresh-slide_1s_ease-in-out_infinite]" /><em className="not-italic">Refreshing data…</em></div>}
            {dataError && <div className="mb-4.5 grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2.75 rounded-xl border border-[#efc6b9] bg-[#fff2ed] py-2.75 pr-3 pl-3.5 text-[11px] text-[#984b37] max-[540px]:grid-cols-[auto_minmax(0,1fr)_auto] max-[540px]:items-start" role="alert"><AlertCircle size={17} /><span className="flex min-w-0 flex-col gap-0.5"><strong className="text-[#793a2b]">We couldn’t refresh your data.</strong>{dataError}</span><button className="inline-flex min-h-7.5 cursor-pointer items-center gap-1.25 rounded-lg border border-[#e5b6a8] bg-white/55 px-2.5 text-[10px] font-bold disabled:opacity-60 max-[540px]:col-start-2 max-[540px]:justify-self-start" onClick={() => void refreshData()} disabled={refreshing}><RefreshCw size={14} /> Try again</button><button className="grid size-7.5 cursor-pointer place-items-center rounded-lg border-0 bg-transparent hover:bg-[#984b3714] max-[540px]:col-start-3 max-[540px]:row-start-1 max-[540px]:mt-[-6px]" aria-label="Dismiss error" onClick={() => setDataError('')}><X size={16} /></button></div>}
            {view === 'overview' && <OverviewPage user={user} {...financeActions} onView={setView} />}
            {view === 'activity' && <ActivityPage {...financeActions} />}
            {view === 'plans' && <PlansPage {...financeActions} />}
            {view === 'subscriptions' && <SubscriptionsPage {...financeActions} />}
          </main>
        </div>
      </div>
    </Tooltip.Provider>
  )
}

export default App
