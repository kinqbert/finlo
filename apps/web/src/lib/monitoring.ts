export async function initializeMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return

  const Sentry = await import('@sentry/react')
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION || undefined,
    sendDefaultPii: false,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
  })
}

export async function reportError(error: unknown, componentStack?: string | null) {
  if (!import.meta.env.VITE_SENTRY_DSN) return
  const Sentry = await import('@sentry/react')
  Sentry.captureException(error, componentStack
    ? { contexts: { react: { componentStack } } }
    : undefined)
}
