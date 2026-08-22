import { useState, type FormEvent, type ReactNode } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { ArrowUpRight, LoaderCircle, Sparkles } from 'lucide-react'
import { ApiError, login, loginWithGoogle, register } from '../../api'
import { InlineError } from '../../components/ui/Feedback'
import { Logo } from '../../components/ui/Logo'

function Field(props: { label: string; name: string; type?: string; placeholder?: string; autoComplete?: string; disabled?: boolean }) {
  const { label, ...inputProps } = props
  return <label className="grid flex-1 gap-1.5"><span className="text-[10px] font-bold text-[#5d6a63]">{label}</span><input className="h-10.5 w-full min-w-0 rounded-[10px] border border-[#dfe3db] bg-[#fbfcf8] px-3 text-xs" required {...inputProps} /></label>
}

function AuthToggle({ active, disabled, children, onClick }: { active: boolean; disabled: boolean; children: ReactNode; onClick: () => void }) {
  return <button className={`flex-1 cursor-pointer rounded-lg border-0 p-2 text-[11px] font-bold disabled:cursor-not-allowed disabled:opacity-60 ${active ? 'bg-white text-ink shadow-[0_2px_7px_rgba(0,0,0,.06)]' : 'bg-transparent text-muted'}`} disabled={disabled} onClick={onClick}>{children}</button>
}

export function AuthScreen({ onAuthenticated, onDemo }: { onAuthenticated: () => Promise<void>; onDemo: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const googleClientID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    try {
      if (mode === 'login') await login(String(form.get('email')), String(form.get('password')))
      else await register(String(form.get('name')), String(form.get('surname')), String(form.get('email')), String(form.get('password')))
      await onAuthenticated()
    } catch (caught) { setError(caught instanceof ApiError ? caught.message : 'Could not connect to Finlo') } finally { setBusy(false) }
  }

  async function googleSuccess(idToken?: string) {
    if (!idToken) { setError('Google did not return an identity token. Please try again.'); return }
    setBusy(true)
    setError('')
    try { await loginWithGoogle(idToken); await onAuthenticated() } catch (caught) { setError(caught instanceof Error ? caught.message : 'Google sign-in failed') } finally { setBusy(false) }
  }

  return (
    <div className="grid min-h-screen grid-cols-[minmax(420px,1.05fr)_minmax(460px,.95fr)] bg-[#fbfcf8] max-[1100px]:grid-cols-2 max-[820px]:grid-cols-1">
      <section className="relative flex flex-col justify-between overflow-hidden bg-brand px-13.5 py-10.5 text-white before:absolute before:top-[-180px] before:right-[-190px] before:size-110 before:rounded-full before:border before:border-lime/15 before:shadow-[0_0_0_80px_rgba(200,238,117,.025),0_0_0_160px_rgba(200,238,117,.018)] before:content-[''] after:absolute after:bottom-15 after:left-[-170px] after:size-72.5 after:rounded-full after:border after:border-lime/15 after:content-[''] max-[1100px]:p-8.5 max-[820px]:min-h-95 max-[820px]:p-7">
        <Logo light />
        <div className="relative z-1 my-auto max-w-142 max-[820px]:my-13.5"><span className="mb-2 block text-[10px] font-extrabold tracking-[.14em] text-white/60 uppercase">Personal finance, made clear</span><h1 className="my-4 font-heading text-[clamp(40px,5vw,68px)] leading-[1.04] font-bold tracking-[-3.4px] max-[820px]:text-[43px]">Make every hryvnia<br />feel intentional.</h1><p className="max-w-117 text-base leading-[1.6] text-white/60">Balances, budgets, savings, and useful nudges — together in one calm place.</p></div>
        <div className="relative z-1 w-[min(410px,82%)] self-end rounded-[18px] border border-white/15 bg-white/8 p-5.5 backdrop-blur-xl max-[820px]:hidden"><div className="flex items-end justify-between"><span className="text-[10px] text-white/60">This month</span><strong className="font-heading text-2xl font-bold">₴129,425</strong></div><div className="my-4 flex h-11.5 items-end gap-2 [&_i]:h-[40%] [&_i]:flex-1 [&_i]:rounded-t-[5px] [&_i]:rounded-b-sm [&_i]:bg-white/20 [&_i:nth-child(2)]:h-[64%] [&_i:nth-child(3)]:h-[52%] [&_i:nth-child(4)]:h-[88%] [&_i:nth-child(4)]:bg-lime [&_i:nth-child(5)]:h-[72%]"><i /><i /><i /><i /><i /></div><p className="m-0 flex items-center gap-1.5 text-[10px] text-lime"><Sparkles size={15} /> You’re saving 18% more than last month.</p></div>
      </section>
      <section className="grid place-items-center p-8.5 max-[820px]:px-6 max-[820px]:py-12">
        <div className="w-full max-w-97.5" aria-busy={busy}>
          <span className="mb-2 block text-[10px] font-extrabold tracking-[.14em] text-[#75837b] uppercase">Welcome to Finlo</span><h2 className="mt-0 mb-2 font-heading text-[31px] leading-[1.15] font-bold tracking-[-1.2px]">{mode === 'login' ? 'Good to see you again.' : 'Start with a clearer view.'}</h2><p className="text-xs text-muted">{mode === 'login' ? 'Sign in to continue to your finances.' : 'Create your private Finlo account.'}</p>
          <div className="my-6 flex rounded-[11px] bg-[#eef0e9] p-1"><AuthToggle active={mode === 'login'} disabled={busy} onClick={() => { setMode('login'); setError('') }}>Sign in</AuthToggle><AuthToggle active={mode === 'register'} disabled={busy} onClick={() => { setMode('register'); setError('') }}>Create account</AuthToggle></div>
          <form onSubmit={submit} className="grid gap-3.5">{mode === 'register' && <div className="flex gap-3 max-[540px]:flex-col"><Field label="First name" name="name" autoComplete="given-name" disabled={busy} /><Field label="Last name" name="surname" autoComplete="family-name" disabled={busy} /></div>}<Field label="Email" name="email" type="email" autoComplete="email" placeholder="you@example.com" disabled={busy} /><Field label="Password" name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="At least 8 characters" disabled={busy} /><InlineError message={error} /><button className="inline-flex min-h-10.5 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-brand bg-brand px-4 text-[13px] font-bold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60" disabled={busy}>{busy ? <><LoaderCircle className="animate-spin" size={16} /> {mode === 'login' ? 'Signing you in…' : 'Creating your account…'}</> : <>{mode === 'login' ? 'Sign in' : 'Create my account'} <ArrowUpRight size={17} /></>}</button></form>
          <div className="my-4.5 flex items-center gap-3 text-[9px] text-[#9aa39d] before:h-px before:flex-1 before:bg-line before:content-[''] after:h-px after:flex-1 after:bg-line after:content-['']"><span>or</span></div>
          {googleClientID ? <div className={`flex justify-center overflow-hidden rounded-[9px] ${busy ? 'pointer-events-none opacity-60' : ''}`}><GoogleLogin onSuccess={(response) => void googleSuccess(response.credential)} onError={() => setError('Google sign-in was cancelled')} width="360" /></div> : <button className="inline-flex min-h-10.5 w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 text-[13px] font-bold" disabled><strong>G</strong> Google sign-in needs a client ID</button>}
          <button className="mx-auto mt-4.5 flex cursor-pointer items-center gap-1 border-0 bg-transparent text-[10px] font-bold text-[#557360] disabled:cursor-not-allowed disabled:opacity-60" disabled={busy} onClick={onDemo}>Explore with demo data <ArrowUpRight size={15} /></button>
        </div>
      </section>
    </div>
  )
}
