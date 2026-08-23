import { lazy } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router'
import { useShallow } from 'zustand/react/shallow'
import { ApiError, logout, restoreSession, tokenStore } from '@/api'
import { AppShell } from '@/components/layout/AppShell'
import { LoadErrorScreen, LoadingScreen } from '@/components/ui/AppStatus'
import { demoData, demoUser } from '@/constants/demoData'
import { legacyRoutes, routes } from '@/constants/routes'
import { errorMessage } from '@/lib/format'
import { queryKeys } from '@/lib/query'
import { AuthPage } from '@/pages/AuthPage'
import { useAppStore } from '@/store/appStore'

type LoginLocationState = { from?: string }

const AccountsPage = lazy(() => import('@/pages/AccountsPage').then((module) => ({ default: module.AccountsPage })))
const GoalsPage = lazy(() => import('@/pages/GoalsPage').then((module) => ({ default: module.GoalsPage })))
const OverviewPage = lazy(() => import('@/pages/OverviewPage').then((module) => ({ default: module.OverviewPage })))
const PlanningPage = lazy(() => import('@/pages/PlanningPage').then((module) => ({ default: module.PlanningPage })))
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((module) => ({ default: module.SettingsPage })))

async function loadAuthenticatedSession(signal?: AbortSignal) {
  try {
    return await restoreSession(signal)
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error
    tokenStore.clear()
    return null
  }
}

function RequireAuthentication({ authenticated }: { authenticated: boolean }) {
  const location = useLocation()
  if (!authenticated) {
    const from = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to={routes.login} replace state={{ from }} />
  }
  return <Outlet />
}

function App() {
  const queryClient = useQueryClient()
  const location = useLocation()
  const navigate = useNavigate()
  const { sessionMode, demoState, dataError, startApiSession, startDemoSession, endSession, updateDemoData, setDataError } = useAppStore(useShallow((state) => ({
    sessionMode: state.sessionMode,
    demoState: state.demoData,
    dataError: state.dataError,
    startApiSession: state.startApiSession,
    startDemoSession: state.startDemoSession,
    endSession: state.endSession,
    updateDemoData: state.updateDemoData,
    setDataError: state.setDataError,
  })))
  const sessionQuery = useQuery({
    queryKey: queryKeys.session,
    queryFn: ({ signal }) => loadAuthenticatedSession(signal),
    enabled: sessionMode === 'api',
    retry: false,
  })
  const session = sessionMode === 'api' && sessionQuery.data === null ? 'guest' : sessionMode

  function destinationAfterLogin() {
    const from = (location.state as LoginLocationState | null)?.from
    return from?.startsWith('/') && from !== routes.login ? from : routes.overview
  }

  async function completeAuthentication() {
    const authenticatedSession = await queryClient.fetchQuery({ queryKey: queryKeys.session, queryFn: ({ signal }) => loadAuthenticatedSession(signal), staleTime: 0 })
    if (!authenticatedSession) throw new Error('Authentication could not be completed.')
    startApiSession()
    navigate(destinationAfterLogin(), { replace: true })
  }

  function enterDemo() {
    startDemoSession()
    navigate(destinationAfterLogin(), { replace: true })
  }

  async function refreshData() {
    if (session !== 'api') return
    setDataError('')
    const result = await sessionQuery.refetch()
    if (result.error) setDataError(errorMessage(result.error, 'Could not refresh your financial data.'))
  }

  async function signOut() {
    await logout()
    queryClient.removeQueries({ queryKey: queryKeys.session })
    endSession()
    navigate(routes.login, { replace: true })
  }

  if (session === 'api' && sessionQuery.isPending) return <LoadingScreen label="Loading your finances…" />
  if (session === 'api' && sessionQuery.isError && !sessionQuery.data) return <LoadErrorScreen message={errorMessage(sessionQuery.error, 'Finlo could not load your financial data.')} onRetry={() => void sessionQuery.refetch()} onSignOut={() => void signOut()} />

  const user = session === 'demo' ? demoUser : sessionQuery.data?.user ?? demoUser
  const data = session === 'demo' ? demoState : sessionQuery.data?.data ?? demoData
  const refreshing = session === 'api' && sessionQuery.isFetching
  const financeActions = { data, isDemo: session === 'demo', onDemoChange: updateDemoData }

  return (
    <Tooltip.Provider delayDuration={250}>
      <Routes>
        <Route path={routes.login} element={session === 'guest' ? <AuthPage onAuthenticated={completeAuthentication} onDemo={enterDemo} /> : <Navigate to={routes.overview} replace />} />
        <Route element={<RequireAuthentication authenticated={session !== 'guest'} />}>
          <Route element={<AppShell user={user} isDemo={session === 'demo'} refreshing={refreshing} error={dataError} onRetry={() => void refreshData()} onDismissError={() => setDataError('')} onSignOut={() => void signOut()} />}>
            <Route index element={<OverviewPage user={user} {...financeActions} />} />
            <Route path={routes.accounts} element={<AccountsPage {...financeActions} />} />
            <Route path={routes.goals} element={<GoalsPage {...financeActions} />} />
            <Route path={routes.planning} element={<PlanningPage {...financeActions} />} />
            <Route path={routes.settings} element={<SettingsPage {...financeActions} />} />
            <Route path={legacyRoutes.activity} element={<Navigate to={routes.accounts} replace />} />
            <Route path={legacyRoutes.plans} element={<Navigate to={routes.planning} replace />} />
            <Route path={legacyRoutes.subscriptions} element={<Navigate to={routes.planning} replace />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to={session === 'guest' ? routes.login : routes.overview} replace />} />
      </Routes>
    </Tooltip.Provider>
  )
}

export default App
