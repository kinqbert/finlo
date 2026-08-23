import { lazy, Suspense, type PropsWithChildren } from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { QueryClientProvider } from '@tanstack/react-query'
import { LazyMotion, MotionConfig } from 'motion/react'
import { BrowserRouter } from 'react-router'
import { queryClient } from '@/lib/query'

const googleClientID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const QueryDevtools = import.meta.env.DEV
  ? lazy(() => import('@tanstack/react-query-devtools').then((module) => ({ default: module.ReactQueryDevtools })))
  : null
const loadMotionFeatures = () => import('@/lib/motionFeatures').then((module) => module.default)

export function AppProviders({ children }: PropsWithChildren) {
  const app = googleClientID ? <GoogleOAuthProvider clientId={googleClientID}>{children}</GoogleOAuthProvider> : children

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <LazyMotion features={loadMotionFeatures} strict>
        <MotionConfig reducedMotion="user">
          <QueryClientProvider client={queryClient}>{app}{QueryDevtools && <Suspense fallback={null}><QueryDevtools initialIsOpen={false} /></Suspense>}</QueryClientProvider>
        </MotionConfig>
      </LazyMotion>
    </BrowserRouter>
  )
}
