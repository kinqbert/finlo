import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { reportError } from '@/lib/monitoring'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    void reportError(error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main className="grid min-h-screen place-items-center bg-canvas p-6">
        <section className="grid w-full max-w-105 justify-items-center gap-4 rounded-[18px] border border-line bg-white p-8 text-center shadow-[0_12px_40px_rgba(20,45,32,.08)]">
          <Logo />
          <div>
            <h1 className="m-0 font-heading text-2xl font-bold tracking-[-.7px] text-ink">Something went wrong</h1>
            <p className="mt-2 mb-0 text-xs leading-5 text-muted">The error has been recorded. Reload Finlo to start from a clean state.</p>
          </div>
          <Button variant="primary" onClick={() => window.location.reload()}>Reload Finlo</Button>
        </section>
      </main>
    )
  }
}
