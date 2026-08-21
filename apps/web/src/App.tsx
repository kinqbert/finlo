import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import * as Avatar from '@radix-ui/react-avatar'
import * as Dialog from '@radix-ui/react-dialog'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Progress from '@radix-ui/react-progress'
import * as Tabs from '@radix-ui/react-tabs'
import * as Tooltip from '@radix-ui/react-tooltip'
import {
  ArrowDownRight, ArrowLeftRight, ArrowUpRight, Banknote, Bell, Car, ChevronDown,
  CircleDollarSign, CreditCard, LayoutDashboard, LogOut, MoreHorizontal, Plus,
  Repeat2, Search, Settings, ShoppingBasket, Sparkles, Target, Utensils, WalletCards, X,
} from 'lucide-react'
import {
  ApiError, createAccount, createSubscription, createTransaction, getMe, loadFinanceData, login,
  loginWithGoogle, register, saveBudget, saveEmergencyFund, tokenStore,
} from './api'
import { demoData, demoUser } from './demo-data'
import type { Account, FinanceData, Transaction, User } from './types'
import './App.css'

type View = 'overview' | 'activity' | 'plans' | 'subscriptions'
type Session = 'loading' | 'guest' | 'api' | 'demo'

const navItems: Array<{ id: View; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'activity', label: 'Activity', icon: ArrowLeftRight },
  { id: 'plans', label: 'Plans & goals', icon: Target },
  { id: 'subscriptions', label: 'Subscriptions', icon: Repeat2 },
]

const categoryIcons: Record<string, typeof ShoppingBasket> = {
  Groceries: ShoppingBasket, Dining: Utensils, Transport: Car,
  Salary: Banknote, Subscriptions: Repeat2,
}

const accountIcons: Record<Account['type'], typeof CreditCard> = {
  card: CreditCard, bank: CircleDollarSign, cash: Banknote, savings: Target, other: WalletCards,
}

function formatMoney(minor: number, currency = 'UAH', compact = false) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency, maximumFractionDigits: compact ? 0 : 2,
    notation: compact ? 'compact' : 'standard',
  }).format(minor / 100)
}

function initials(user: User) {
  return `${user.name[0] ?? ''}${user.surname[0] ?? ''}`.toUpperCase()
}

function App() {
  const [session, setSession] = useState<Session>(() => tokenStore.getAccess() ? 'loading' : 'guest')
  const [user, setUser] = useState<User>(demoUser)
  const [data, setData] = useState<FinanceData>(() => structuredClone(demoData))
  const [view, setView] = useState<View>('overview')
  const [error, setError] = useState('')

  useEffect(() => {
    if (session !== 'loading') return
    Promise.all([getMe(), loadFinanceData()])
      .then(([currentUser, financeData]) => {
        setUser(currentUser)
        setData(financeData)
        setSession('api')
      })
      .catch(() => {
        tokenStore.clear()
        setSession('guest')
      })
  }, [session])

  async function completeAuthentication() {
    const [currentUser, financeData] = await Promise.all([getMe(), loadFinanceData()])
    setUser(currentUser)
    setData(financeData)
    setSession('api')
  }

  async function refreshData() {
    if (session === 'api') setData(await loadFinanceData())
  }

  function signOut() {
    tokenStore.clear()
    setSession('guest')
    setView('overview')
  }

  if (session === 'loading') return <LoadingScreen />
  if (session === 'guest') {
    return <AuthScreen onAuthenticated={completeAuthentication} onDemo={() => {
      setUser(demoUser)
      setData(structuredClone(demoData))
      setSession('demo')
    }} />
  }

  return (
    <Tooltip.Provider delayDuration={250}>
      <div className="app-shell">
        <Sidebar view={view} onView={setView} user={user} onSignOut={signOut} />
        <div className="workspace">
          <Topbar user={user} isDemo={session === 'demo'} onSignOut={signOut} />
          <main className="content">
            {error && <div className="error-banner">{error}<button onClick={() => setError('')}><X size={16} /></button></div>}
            {view === 'overview' && <Overview user={user} data={data} isDemo={session === 'demo'} onCreated={refreshData} onDemoChange={setData} onError={setError} onView={setView} />}
            {view === 'activity' && <Activity data={data} isDemo={session === 'demo'} onCreated={refreshData} onDemoChange={setData} onError={setError} />}
            {view === 'plans' && <Plans data={data} isDemo={session === 'demo'} onCreated={refreshData} onDemoChange={setData} onError={setError} />}
            {view === 'subscriptions' && <Subscriptions data={data} isDemo={session === 'demo'} onCreated={refreshData} onDemoChange={setData} onError={setError} />}
          </main>
        </div>
      </div>
    </Tooltip.Provider>
  )
}

function LoadingScreen() {
  return <div className="loading-screen"><Logo /><span className="loader" /></div>
}

function Logo({ light = false }: { light?: boolean }) {
  return <div className={`logo ${light ? 'logo-light' : ''}`}><span>F</span>finlo</div>
}

function AuthScreen({ onAuthenticated, onDemo }: { onAuthenticated: () => Promise<void>; onDemo: () => void }) {
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
      if (mode === 'login') {
        await login(String(form.get('email')), String(form.get('password')))
      } else {
        await register(String(form.get('name')), String(form.get('surname')), String(form.get('email')), String(form.get('password')))
      }
      await onAuthenticated()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not connect to Finlo')
    } finally {
      setBusy(false)
    }
  }

  async function googleSuccess(idToken?: string) {
    if (!idToken) return
    setBusy(true)
    setError('')
    try {
      await loginWithGoogle(idToken)
      await onAuthenticated()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Google sign-in failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-story">
        <Logo light />
        <div className="auth-story-copy">
          <span className="eyebrow light">Personal finance, made clear</span>
          <h1>Make every hryvnia<br />feel intentional.</h1>
          <p>Balances, budgets, savings, and useful nudges — together in one calm place.</p>
        </div>
        <div className="auth-preview">
          <div><span>This month</span><strong>₴129,425</strong></div>
          <div className="preview-bars"><i /><i /><i /><i /><i /></div>
          <p><Sparkles size={15} /> You’re saving 18% more than last month.</p>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <span className="eyebrow">Welcome to Finlo</span>
          <h2>{mode === 'login' ? 'Good to see you again.' : 'Start with a clearer view.'}</h2>
          <p className="muted">{mode === 'login' ? 'Sign in to continue to your finances.' : 'Create your private Finlo account.'}</p>
          <div className="auth-toggle">
            <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign in</button>
            <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Create account</button>
          </div>
          <form onSubmit={submit} className="auth-form">
            {mode === 'register' && <div className="form-row"><Field label="First name" name="name" autoComplete="given-name" /><Field label="Last name" name="surname" autoComplete="family-name" /></div>}
            <Field label="Email" name="email" type="email" autoComplete="email" placeholder="you@example.com" />
            <Field label="Password" name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="At least 8 characters" />
            {error && <p className="form-error">{error}</p>}
            <button className="primary-button full" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create my account'} <ArrowUpRight size={17} /></button>
          </form>
          <div className="divider"><span>or</span></div>
          {googleClientID ? <div className="google-login"><GoogleLogin onSuccess={(response) => void googleSuccess(response.credential)} onError={() => setError('Google sign-in was cancelled')} width="360" /></div> : <button className="secondary-button full" disabled><strong>G</strong> Google sign-in needs a client ID</button>}
          <button className="demo-button" onClick={onDemo}>Explore with demo data <ArrowUpRight size={15} /></button>
        </div>
      </section>
    </div>
  )
}

function Field(props: { label: string; name: string; type?: string; placeholder?: string; autoComplete?: string }) {
  const { label, ...inputProps } = props
  return <label className="field"><span>{label}</span><input required {...inputProps} /></label>
}

function Sidebar({ view, onView, user, onSignOut }: { view: View; onView: (view: View) => void; user: User; onSignOut: () => void }) {
  return <aside className="sidebar"><Logo /><nav><span className="nav-label">Workspace</span>{navItems.map((item) => <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => onView(item.id)}><item.icon size={19} />{item.label}</button>)}</nav><div className="side-bottom"><button><Settings size={19} />Settings</button><button onClick={onSignOut}><LogOut size={19} />Sign out</button><div className="side-user"><Avatar.Root><Avatar.Fallback>{initials(user)}</Avatar.Fallback></Avatar.Root><div><strong>{user.name} {user.surname}</strong><span>{user.email}</span></div></div></div></aside>
}

function Topbar({ user, isDemo, onSignOut }: { user: User; isDemo: boolean; onSignOut: () => void }) {
  return <header className="topbar"><div className="mobile-logo"><Logo /></div><label className="search"><Search size={17} /><input placeholder="Search transactions, accounts…" /></label><div className="topbar-actions">{isDemo && <span className="demo-pill">Demo mode</span>}<Tooltip.Root><Tooltip.Trigger asChild><button className="icon-button"><Bell size={18} /></button></Tooltip.Trigger><Tooltip.Portal><Tooltip.Content className="tooltip" sideOffset={6}>No new notifications</Tooltip.Content></Tooltip.Portal></Tooltip.Root><DropdownMenu.Root><DropdownMenu.Trigger className="profile-trigger"><Avatar.Root><Avatar.Fallback>{initials(user)}</Avatar.Fallback></Avatar.Root><span>{user.name}</span><ChevronDown size={15} /></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content className="dropdown" align="end"><DropdownMenu.Label>{user.email}</DropdownMenu.Label><DropdownMenu.Separator /><DropdownMenu.Item onSelect={onSignOut}><LogOut size={15} /> Sign out</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root></div></header>
}

type DataActions = { data: FinanceData; isDemo: boolean; onCreated: () => Promise<void>; onDemoChange: (data: FinanceData) => void; onError: (message: string) => void }

function Overview({ user, data, isDemo, onCreated, onDemoChange, onError, onView }: DataActions & { user: User; onView: (view: View) => void }) {
  const income = data.transactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount_minor, 0)
  const spending = data.transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount_minor, 0)
  const primaryBalance = data.dashboard.balances[0] ?? { balance_minor: 0, currency: 'UAH' }
  const savingsRate = income > 0 ? Math.max(0, Math.round(((income - spending) / income) * 100)) : 0
  const actions = { data, isDemo, onCreated, onDemoChange, onError }

  return <><PageHeader eyebrow={new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())} title={`Good morning, ${user.name}.`} subtitle="Here’s what your money is doing today."><TransactionDialog {...actions} /></PageHeader><section className="hero-grid"><div className="balance-card"><div className="card-heading"><span>Total balance</span><button><MoreHorizontal size={20} /></button></div><strong>{formatMoney(primaryBalance.balance_minor, primaryBalance.currency)}</strong><p><span><ArrowUpRight size={13} /> 8.4%</span> from last month</p><div className="balance-accounts">{data.accounts.slice(0, 3).map((account) => <div key={account.id}><i /><span>{account.name}</span><b>{formatMoney(account.balance_minor, account.currency, true)}</b></div>)}</div></div><MetricCard label="Income" value={formatMoney(income, 'UAH')} change="Expected this month" icon={<ArrowDownRight />} tone="mint" /><MetricCard label="Spent" value={formatMoney(spending, 'UAH')} change="Across all categories" icon={<ArrowUpRight />} tone="peach" /><MetricCard label="Savings rate" value={`${savingsRate}%`} change="Healthy target: 20%" icon={<Target />} tone="lilac" /></section><section className="dashboard-grid"><Card className="spending-card"><CardTitle title="Budget pace" action="View plans" onAction={() => onView('plans')} /><div className="budget-list">{data.budgets.map((budget) => <BudgetRow key={budget.id} budget={budget} />)}</div></Card><Card className="insight-card"><div className="insight-orb"><Sparkles size={22} /></div><span className="eyebrow light">Finlo insight</span><h3>{data.dashboard.insights[0]?.title ?? 'Your finances look calm'}</h3><p>{data.dashboard.insights[0]?.message ?? 'Add a budget to start receiving proactive monthly guidance.'}</p><button>See all insights <ArrowUpRight size={16} /></button></Card><Card className="recent-card"><CardTitle title="Recent activity" action="See all" onAction={() => onView('activity')} /><TransactionList transactions={data.transactions.slice(0, 5)} /></Card><Card className="goal-card"><CardTitle title="Emergency fund" action="Manage" onAction={() => onView('plans')} /><Goal fund={data.dashboard.emergency_fund} /></Card></section></>
}

function Activity(props: DataActions) {
  const { data } = props
  return <><PageHeader eyebrow="Money in motion" title="Accounts & activity" subtitle="Every balance and transaction, in one place."><AccountDialog {...props} /><TransactionDialog {...props} /></PageHeader><div className="account-grid">{data.accounts.map((account) => { const Icon = accountIcons[account.type]; return <Card key={account.id} className="account-card"><div className="account-icon"><Icon size={20} /></div><span>{account.name}</span><strong>{formatMoney(account.balance_minor, account.currency)}</strong><small>{account.type} · {account.currency}</small></Card> })}</div><Card><Tabs.Root defaultValue="all"><div className="table-header"><h3>Transactions</h3><Tabs.List className="tabs-list"><Tabs.Trigger value="all">All</Tabs.Trigger><Tabs.Trigger value="expense">Expenses</Tabs.Trigger><Tabs.Trigger value="income">Income</Tabs.Trigger></Tabs.List></div>{(['all', 'expense', 'income'] as const).map((filter) => <Tabs.Content key={filter} value={filter}><TransactionTable transactions={filter === 'all' ? data.transactions : data.transactions.filter((item) => item.type === filter)} /></Tabs.Content>)}</Tabs.Root></Card></>
}

function Plans(props: DataActions) {
  const { data } = props
  return <><PageHeader eyebrow="Stay intentional" title="Plans & goals" subtitle="Give today’s money a job before the month gets busy."><EmergencyDialog {...props} /><BudgetDialog {...props} /></PageHeader><section className="plans-grid"><Card className="goal-large"><CardTitle title="Emergency fund" /><Goal fund={data.dashboard.emergency_fund} large /></Card><Card className="month-plan"><span className="eyebrow">Monthly plan</span><strong>{data.budgets.length}</strong><p>active category budgets</p><div className="month-plan-art"><Target size={34} /></div></Card></section><Card><CardTitle title="Category budgets" /><div className="budget-list roomy">{data.budgets.map((budget) => <BudgetRow key={budget.id} budget={budget} />)}</div></Card></>
}

function Subscriptions(props: DataActions) {
  const { data } = props
  const monthly = data.subscriptions.reduce((sum, subscription) => sum + subscription.amount_minor, 0)
  return <><PageHeader eyebrow="Recurring expenses" title="Subscriptions" subtitle="Know what renews before it leaves your account."><SubscriptionDialog {...props} /></PageHeader><section className="subscription-summary"><div><span>Monthly total</span><strong>{formatMoney(monthly, 'UAH')}</strong></div><div><span>Active services</span><strong>{data.subscriptions.length}</strong></div><div><span>Next renewal</span><strong>In 3 days</strong></div></section><div className="subscription-grid">{data.subscriptions.map((subscription, index) => <Card key={subscription.id} className="subscription-card"><div className={`subscription-logo logo-${index % 3}`}>{subscription.name[0]}</div><div><strong>{subscription.name}</strong><span>Renews on day {subscription.billing_day}</span></div><b>{formatMoney(subscription.amount_minor, subscription.currency)}</b><button><MoreHorizontal size={18} /></button></Card>)}</div></>
}

function PageHeader({ eyebrow, title, subtitle, children }: { eyebrow: string; title: string; subtitle: string; children?: ReactNode }) {
  return <div className="page-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div>{children && <div className="page-actions">{children}</div>}</div>
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) { return <div className={`card ${className}`}>{children}</div> }
function CardTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) { return <div className="card-title"><h3>{title}</h3>{action && <button onClick={onAction}>{action} <ArrowUpRight size={14} /></button>}</div> }
function MetricCard({ label, value, change, icon, tone }: { label: string; value: string; change: string; icon: ReactNode; tone: string }) { return <Card className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><span>{label}</span><strong>{value}</strong><small>{change}</small></Card> }

function BudgetRow({ budget }: { budget: FinanceData['budgets'][number] }) {
  const spent = budget.spent_minor ?? 0
  const percent = Math.min(100, Math.round((spent / budget.amount_minor) * 100))
  const Icon = categoryIcons[budget.category] ?? CircleDollarSign
  return <div className="budget-row"><div className="category-icon"><Icon size={17} /></div><div className="budget-main"><div><strong>{budget.category}</strong><span>{formatMoney(spent, budget.currency)} of {formatMoney(budget.amount_minor, budget.currency)}</span></div><Progress.Root className="progress" value={percent}><Progress.Indicator className={percent > 75 ? 'warn' : ''} style={{ transform: `translateX(-${100 - percent}%)` }} /></Progress.Root></div><b>{percent}%</b></div>
}

function TransactionList({ transactions }: { transactions: Transaction[] }) { return <div className="transaction-list">{transactions.map((transaction) => <TransactionItem key={transaction.id} transaction={transaction} />)}</div> }
function TransactionItem({ transaction }: { transaction: Transaction }) { const Icon = categoryIcons[transaction.category] ?? CircleDollarSign; return <div className="transaction-item"><div className="category-icon"><Icon size={17} /></div><div><strong>{transaction.description || transaction.category}</strong><span>{transaction.category} · {new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(transaction.occurred_at))}</span></div><b className={transaction.type}>{transaction.type === 'expense' ? '−' : '+'}{formatMoney(transaction.amount_minor, transaction.currency)}</b></div> }

function TransactionTable({ transactions }: { transactions: Transaction[] }) {
  return <div className="transaction-table"><div className="table-row table-labels"><span>Transaction</span><span>Category</span><span>Date</span><span>Amount</span></div>{transactions.map((transaction) => <div className="table-row" key={transaction.id}><span><span className="category-icon">{transaction.type === 'expense' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}</span><strong>{transaction.description || transaction.category}</strong></span><span>{transaction.category}</span><span>{new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(transaction.occurred_at))}</span><b className={transaction.type}>{transaction.type === 'expense' ? '−' : '+'}{formatMoney(transaction.amount_minor, transaction.currency)}</b></div>)}</div>
}

function Goal({ fund, large = false }: { fund: FinanceData['dashboard']['emergency_fund']; large?: boolean }) {
  if (!fund) return <p className="empty-copy">Set a target to start tracking your safety net.</p>
  const percent = Math.min(100, Math.round((fund.current_minor / fund.target_minor) * 100))
  return <div className={`goal ${large ? 'large' : ''}`}><div className="goal-ring" style={{ '--goal': `${percent * 3.6}deg` } as React.CSSProperties}><span>{percent}%</span></div><div><strong>{formatMoney(fund.current_minor, fund.currency)}</strong><span>saved of {formatMoney(fund.target_minor, fund.currency)}</span><p>{formatMoney(fund.target_minor - fund.current_minor, fund.currency)} to go</p></div></div>
}

function BudgetDialog(props: DataActions) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const input = { category: String(form.get('category')).trim(), amount_minor: Math.round(Number(form.get('amount')) * 100), currency: 'UAH', month: new Date().toISOString().slice(0, 7) }
    if (!input.category || input.amount_minor <= 0) return
    setBusy(true)
    try {
      if (props.isDemo) {
        const next = structuredClone(props.data)
        const existing = next.budgets.find((budget) => budget.category === input.category && budget.month === input.month)
        if (existing) existing.amount_minor = input.amount_minor
        else next.budgets.push({ ...input, id: crypto.randomUUID(), spent_minor: 0, remaining_minor: input.amount_minor })
        next.dashboard.budgets = next.budgets
        props.onDemoChange(next)
      } else { await saveBudget(input); await props.onCreated() }
      setOpen(false)
    } catch (caught) { props.onError(caught instanceof Error ? caught.message : 'Could not save budget') } finally { setBusy(false) }
  }
  return <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger asChild><button className="primary-button"><Plus size={17} /> Add budget</button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="dialog"><Dialog.Close className="dialog-close"><X size={18} /></Dialog.Close><span className="eyebrow">Monthly plan</span><Dialog.Title>Add a category budget</Dialog.Title><Dialog.Description>Set a limit for the current month. Saving the same category updates it.</Dialog.Description><form onSubmit={submit} className="dialog-form modal-spaced"><label><span>Category</span><input name="category" placeholder="Groceries" required /></label><label><span>Monthly limit</span><div className="money-input"><b>₴</b><input name="amount" inputMode="decimal" placeholder="0.00" required /></div></label><button className="primary-button full" disabled={busy}>{busy ? 'Saving…' : 'Save budget'}</button></form></Dialog.Content></Dialog.Portal></Dialog.Root>
}

function EmergencyDialog(props: DataActions) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const fund = props.data.dashboard.emergency_fund
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const input = { target_minor: Math.round(Number(form.get('target')) * 100), current_minor: Math.round(Number(form.get('current')) * 100), currency: 'UAH' }
    if (input.target_minor <= 0 || input.current_minor < 0) return
    setBusy(true)
    try {
      if (props.isDemo) { const next = structuredClone(props.data); next.dashboard.emergency_fund = input; props.onDemoChange(next) }
      else { await saveEmergencyFund(input); await props.onCreated() }
      setOpen(false)
    } catch (caught) { props.onError(caught instanceof Error ? caught.message : 'Could not save emergency fund') } finally { setBusy(false) }
  }
  return <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger asChild><button className="secondary-button"><Target size={17} /> Edit goal</button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="dialog"><Dialog.Close className="dialog-close"><X size={18} /></Dialog.Close><span className="eyebrow">Safety net</span><Dialog.Title>Emergency fund goal</Dialog.Title><Dialog.Description>Track what you have saved against the amount that feels safe.</Dialog.Description><form onSubmit={submit} className="dialog-form modal-spaced"><div className="form-row"><label><span>Saved now</span><div className="money-input"><b>₴</b><input name="current" inputMode="decimal" defaultValue={fund ? fund.current_minor / 100 : 0} required /></div></label><label><span>Target</span><div className="money-input"><b>₴</b><input name="target" inputMode="decimal" defaultValue={fund ? fund.target_minor / 100 : 100000} required /></div></label></div><button className="primary-button full" disabled={busy}>{busy ? 'Saving…' : 'Update goal'}</button></form></Dialog.Content></Dialog.Portal></Dialog.Root>
}

function SubscriptionDialog(props: DataActions) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const input = { name: String(form.get('name')).trim(), amount_minor: Math.round(Number(form.get('amount')) * 100), currency: 'UAH', billing_day: Number(form.get('billing_day')), active: true }
    if (!input.name || input.amount_minor <= 0 || input.billing_day < 1 || input.billing_day > 31) return
    setBusy(true)
    try {
      if (props.isDemo) { const next = structuredClone(props.data); const subscription = { ...input, id: crypto.randomUUID() }; next.subscriptions.push(subscription); next.dashboard.subscriptions.push(subscription); props.onDemoChange(next) }
      else { await createSubscription(input); await props.onCreated() }
      setOpen(false)
    } catch (caught) { props.onError(caught instanceof Error ? caught.message : 'Could not add subscription') } finally { setBusy(false) }
  }
  return <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger asChild><button className="primary-button"><Plus size={17} /> Add subscription</button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="dialog"><Dialog.Close className="dialog-close"><X size={18} /></Dialog.Close><span className="eyebrow">Recurring expense</span><Dialog.Title>Add a subscription</Dialog.Title><Dialog.Description>Include recurring payments in your monthly picture.</Dialog.Description><form onSubmit={submit} className="dialog-form modal-spaced"><label><span>Name</span><input name="name" placeholder="Netflix" required /></label><div className="form-row"><label><span>Monthly amount</span><div className="money-input"><b>₴</b><input name="amount" inputMode="decimal" placeholder="0.00" required /></div></label><label><span>Billing day</span><input name="billing_day" type="number" min="1" max="31" defaultValue="1" required /></label></div><button className="primary-button full" disabled={busy}>{busy ? 'Saving…' : 'Add subscription'}</button></form></Dialog.Content></Dialog.Portal></Dialog.Root>
}

function TransactionDialog(props: DataActions) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<Transaction['type']>('expense')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const amountMinor = Math.round(Number(form.get('amount')) * 100)
    const account = props.data.accounts.find((item) => item.id === form.get('account'))
    if (!account || amountMinor <= 0) return
    setBusy(true)
    try {
      if (props.isDemo) {
        const transaction: Transaction = { id: crypto.randomUUID(), account_id: account.id, type, amount_minor: amountMinor, currency: account.currency, category: String(form.get('category')), description: String(form.get('description')), occurred_at: new Date().toISOString(), source: 'manual' }
        const next = structuredClone(props.data)
        next.transactions.unshift(transaction)
        next.dashboard.recent_transactions.unshift(transaction)
        const target = next.accounts.find((item) => item.id === account.id)
        if (target) target.balance_minor += type === 'income' ? amountMinor : -amountMinor
        next.dashboard.balances = [{ currency: account.currency, balance_minor: next.accounts.filter((item) => item.currency === account.currency).reduce((sum, item) => sum + item.balance_minor, 0) }]
        props.onDemoChange(next)
      } else {
        await createTransaction({ account_id: account.id, type, amount_minor: amountMinor, category: String(form.get('category')), description: String(form.get('description')), occurred_at: new Date().toISOString() })
        await props.onCreated()
      }
      setOpen(false)
    } catch (caught) { props.onError(caught instanceof Error ? caught.message : 'Could not add transaction') } finally { setBusy(false) }
  }
  return <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger asChild><button className="primary-button"><Plus size={17} /> Add transaction</button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="dialog"><Dialog.Close className="dialog-close"><X size={18} /></Dialog.Close><span className="eyebrow">Quick entry</span><Dialog.Title>Add a transaction</Dialog.Title><Dialog.Description>Finlo updates the selected account balance automatically.</Dialog.Description><Tabs.Root value={type} onValueChange={(value) => setType(value as Transaction['type'])}><Tabs.List className="type-tabs"><Tabs.Trigger value="expense">Expense</Tabs.Trigger><Tabs.Trigger value="income">Income</Tabs.Trigger></Tabs.List></Tabs.Root><form onSubmit={submit} className="dialog-form"><label><span>Amount</span><div className="money-input"><b>₴</b><input name="amount" inputMode="decimal" placeholder="0.00" required /></div></label><div className="form-row"><label><span>Account</span><select name="account" required>{props.data.accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label><label><span>Category</span><select name="category" defaultValue={type === 'expense' ? 'Groceries' : 'Salary'}>{(type === 'expense' ? ['Groceries', 'Dining', 'Transport', 'Health', 'Subscriptions', 'Other'] : ['Salary', 'Freelance', 'Gift', 'Other']).map((item) => <option key={item}>{item}</option>)}</select></label></div><label><span>Note</span><input name="description" placeholder="What was this for?" /></label><button className="primary-button full" disabled={busy}>{busy ? 'Saving…' : `Add ${type}`}</button></form></Dialog.Content></Dialog.Portal></Dialog.Root>
}

function AccountDialog(props: DataActions) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const account: Account = { id: crypto.randomUUID(), name: String(form.get('name')), type: String(form.get('type')) as Account['type'], currency: String(form.get('currency')).toUpperCase(), balance_minor: Math.round(Number(form.get('balance')) * 100) }
    setBusy(true)
    try {
      if (props.isDemo) { const next = structuredClone(props.data); next.accounts.push(account); props.onDemoChange(next) }
      else { await createAccount(account); await props.onCreated() }
      setOpen(false)
    } catch (caught) { props.onError(caught instanceof Error ? caught.message : 'Could not add account') } finally { setBusy(false) }
  }
  return <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger asChild><button className="secondary-button"><WalletCards size={17} /> Add account</button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="dialog"><Dialog.Close className="dialog-close"><X size={18} /></Dialog.Close><span className="eyebrow">New account</span><Dialog.Title>Connect your money map</Dialog.Title><Dialog.Description>Add a balance now. Monobank sync can be connected later.</Dialog.Description><form onSubmit={submit} className="dialog-form"><label><span>Account name</span><input name="name" placeholder="Everyday card" required /></label><div className="form-row"><label><span>Type</span><select name="type"><option value="card">Card</option><option value="bank">Bank</option><option value="cash">Cash</option><option value="savings">Savings</option><option value="other">Other</option></select></label><label><span>Currency</span><input name="currency" defaultValue="UAH" maxLength={3} required /></label></div><label><span>Current balance</span><div className="money-input"><b>₴</b><input name="balance" inputMode="decimal" defaultValue="0" required /></div></label><button className="primary-button full" disabled={busy}>{busy ? 'Saving…' : 'Add account'}</button></form></Dialog.Content></Dialog.Portal></Dialog.Root>
}

export default App
