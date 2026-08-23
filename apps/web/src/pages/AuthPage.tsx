import { useState, type ReactNode } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { GoogleLogin } from '@react-oauth/google'
import { ArrowUpRight, LoaderCircle, Sparkles } from 'lucide-react'
import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import { ApiError, login, loginWithGoogle, register } from '@/api'
import { RotatingCurrency } from '@/components/auth/RotatingCurrency'
import { AuroraBackground } from '@/components/ui/AuroraBackground'
import { Button } from '@/components/ui/Button'
import { InlineError } from '@/components/ui/Feedback'
import { Logo } from '@/components/ui/Logo'
import { authSchema, type AuthFormValues } from '@/lib/validation'

function Field({ label, registration, error, ...inputProps }: { label: string; registration: UseFormRegisterReturn; error?: string; type?: string; placeholder?: string; autoComplete?: string; disabled?: boolean }) {
  return <label className="grid flex-1 gap-1.25"><span className="text-[9px] font-bold text-[#5d6a63]">{label}</span><input className="h-9.5 w-full min-w-0 rounded-[9px] border border-[#dfe3db] bg-[#fbfcf8] px-3 text-xs" {...inputProps} {...registration} />{error && <span className="text-[9px] leading-3 text-[#984b37]" role="alert">{error}</span>}</label>
}

function AuthToggle({ active, disabled, children, onClick }: { active: boolean; disabled: boolean; children: ReactNode; onClick: () => void }) {
  return <button className={`flex-1 cursor-pointer rounded-lg border-0 p-2 text-[11px] font-bold disabled:cursor-not-allowed disabled:opacity-60 ${active ? 'bg-white text-ink shadow-[0_2px_7px_rgba(0,0,0,.06)]' : 'bg-transparent text-muted'}`} disabled={disabled} onClick={onClick}>{children}</button>
}

export function AuthPage({ onAuthenticated, onDemo }: { onAuthenticated: () => Promise<void>; onDemo: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [error, setError] = useState('')
  const form = useForm<AuthFormValues>({ resolver: zodResolver(authSchema), defaultValues: { mode: 'login', name: '', surname: '', email: '', password: '' } })
  const googleClientID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
  const authentication = useMutation({
    mutationFn: async (action: () => Promise<unknown>) => {
      await action()
      await onAuthenticated()
    },
  })
  const busy = authentication.isPending

  async function submit(values: AuthFormValues) {
    authentication.reset()
    setError('')
    try {
      await authentication.mutateAsync(() => values.mode === 'login'
        ? login(values.email, values.password)
        : register(values.name.trim(), values.surname.trim(), values.email, values.password))
    } catch (caught) { setError(caught instanceof ApiError ? caught.message : 'Could not connect to Finlo') }
  }

  function selectMode(nextMode: AuthFormValues['mode']) {
    setMode(nextMode)
    form.setValue('mode', nextMode)
    form.clearErrors()
    setError('')
  }

  async function googleSuccess(idToken?: string) {
    if (!idToken) { setError('Google did not return an identity token. Please try again.'); return }
    authentication.reset()
    setError('')
    try { await authentication.mutateAsync(() => loginWithGoogle(idToken)) } catch (caught) { setError(caught instanceof Error ? caught.message : 'Google sign-in failed') }
  }

  return (
    <div className="grid min-h-screen grid-cols-[minmax(420px,1.05fr)_minmax(460px,.95fr)] bg-[#fbfcf8] max-[1100px]:grid-cols-2 max-[820px]:grid-cols-1">
      <section className="relative isolate flex flex-col justify-between overflow-hidden bg-[#0b2f22] px-13.5 py-10.5 text-white max-[1100px]:p-8.5 max-[820px]:min-h-95 max-[820px]:p-7">
        <div className="pointer-events-none absolute inset-0 -z-20 opacity-95"><AuroraBackground /></div>
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(112deg,rgba(5,34,24,.94)_8%,rgba(9,49,34,.58)_52%,rgba(8,42,30,.86)_100%)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_82%_17%,rgba(200,238,117,.16),transparent_31%),radial-gradient(circle_at_15%_85%,rgba(56,169,112,.16),transparent_34%)] mix-blend-screen" />
        <Logo light />
        <div className="my-auto max-w-162 max-[820px]:my-13.5"><span className="mb-2 block text-[10px] font-extrabold tracking-[.14em] text-white/60 uppercase">Personal finance, made clear</span><h1 className="my-4 font-heading text-[clamp(40px,5vw,68px)] leading-[1.04] font-bold tracking-[-3.4px] max-[820px]:text-[43px]">Make every <RotatingCurrency /><br />feel intentional.</h1><p className="max-w-117 text-base leading-[1.6] text-white/65">Balances, budgets, savings, and useful nudges — together in one calm place.</p></div>
        <div className="w-[min(410px,82%)] self-end rounded-[18px] border border-white/18 bg-[#0a2d20]/55 p-5.5 shadow-[0_20px_70px_rgba(0,0,0,.18)] backdrop-blur-xl max-[820px]:hidden"><div className="flex items-end justify-between"><span className="text-[10px] text-white/60">This month</span><strong className="font-heading text-2xl font-bold">₴129,425</strong></div><div className="my-4 flex h-11.5 items-end gap-2 [&_i]:h-[40%] [&_i]:flex-1 [&_i]:rounded-t-[5px] [&_i]:rounded-b-sm [&_i]:bg-white/20 [&_i:nth-child(2)]:h-[64%] [&_i:nth-child(3)]:h-[52%] [&_i:nth-child(4)]:h-[88%] [&_i:nth-child(4)]:bg-lime [&_i:nth-child(5)]:h-[72%]"><i /><i /><i /><i /><i /></div><p className="m-0 flex items-center gap-1.5 text-[10px] text-lime"><Sparkles size={15} /> You’re saving 18% more than last month.</p></div>
      </section>
      <section className="grid place-items-center p-8.5 max-[820px]:px-6 max-[820px]:py-12">
        <div className="w-full max-w-97.5" aria-busy={busy}>
          <span className="mb-2 block text-[10px] font-extrabold tracking-[.14em] text-[#75837b] uppercase">Welcome to Finlo</span><h2 className="mt-0 mb-2 font-heading text-[31px] leading-[1.15] font-bold tracking-[-1.2px]">{mode === 'login' ? 'Good to see you again.' : 'Start with a clearer view.'}</h2><p className="text-xs text-muted">{mode === 'login' ? 'Sign in to continue to your finances.' : 'Create your private Finlo account.'}</p>
          <div className="my-6 flex rounded-[11px] bg-[#eef0e9] p-1"><AuthToggle active={mode === 'login'} disabled={busy} onClick={() => selectMode('login')}>Sign in</AuthToggle><AuthToggle active={mode === 'register'} disabled={busy} onClick={() => selectMode('register')}>Create account</AuthToggle></div>
          <form onSubmit={form.handleSubmit(submit)} className="grid gap-3">{mode === 'register' && <div className="flex gap-2.5 max-[540px]:flex-col"><Field label="First name" registration={form.register('name')} error={form.formState.errors.name?.message} autoComplete="given-name" disabled={busy} /><Field label="Last name" registration={form.register('surname')} error={form.formState.errors.surname?.message} autoComplete="family-name" disabled={busy} /></div>}<Field label="Email" registration={form.register('email')} error={form.formState.errors.email?.message} type="email" autoComplete="email" placeholder="you@example.com" disabled={busy} /><Field label="Password" registration={form.register('password')} error={form.formState.errors.password?.message} type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="At least 8 characters" disabled={busy} /><InlineError message={error} /><Button variant="primary" fullWidth disabled={busy}>{busy ? <><LoaderCircle className="animate-spin" size={15} /> {mode === 'login' ? 'Signing you in…' : 'Creating your account…'}</> : <>{mode === 'login' ? 'Sign in' : 'Create my account'} <ArrowUpRight size={16} /></>}</Button></form>
          <div className="my-4.5 flex items-center gap-3 text-[9px] text-[#9aa39d] before:h-px before:flex-1 before:bg-line before:content-[''] after:h-px after:flex-1 after:bg-line after:content-['']"><span>or</span></div>
          {googleClientID ? <div className={`flex justify-center overflow-hidden rounded-[9px] ${busy ? 'pointer-events-none opacity-60' : ''}`}><GoogleLogin onSuccess={(response) => void googleSuccess(response.credential)} onError={() => setError('Google sign-in was cancelled')} width="360" /></div> : <Button fullWidth disabled><strong>G</strong> Google sign-in needs a client ID</Button>}
          <button className="mx-auto mt-4.5 flex cursor-pointer items-center gap-1 border-0 bg-transparent text-[10px] font-bold text-[#557360] disabled:cursor-not-allowed disabled:opacity-60" disabled={busy} onClick={onDemo}>Explore with demo data <ArrowUpRight size={15} /></button>
        </div>
      </section>
    </div>
  )
}
