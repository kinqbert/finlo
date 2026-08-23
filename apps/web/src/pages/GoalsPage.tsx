import { ShieldCheck, Target } from 'lucide-react'
import { EmergencyDialog } from '@/components/dialogs/EmergencyDialog'
import { Goal } from '@/components/finance/Goal'
import { Card, CardTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import type { FinanceActions } from '@/types'

export function GoalsPage(props: FinanceActions) {
  const hasEmergencyFund = props.data.dashboard.emergency_fund !== null

  return <>
    <PageHeader eyebrow="Build financial resilience" title="Goals" subtitle="Turn the things you’re saving for into visible progress."><EmergencyDialog {...props} /></PageHeader>
    <section className="grid grid-cols-[1.35fr_.65fr] gap-2.5 max-[820px]:grid-cols-1">
      <Card fill className="min-h-75"><CardTitle title="Emergency fund" /><Goal fund={props.data.dashboard.emergency_fund} large /></Card>
      <Card tone="soft-green" className="relative min-h-75 overflow-hidden">
        <div className="grid size-10 place-items-center rounded-xl bg-brand text-lime"><ShieldCheck size={20} /></div>
        <span className="mt-8 mb-1.5 block text-[9px] font-extrabold tracking-[.14em] text-[#75837b] uppercase">Your safety net</span>
        <h2 className="my-1.5 max-w-65 font-heading text-xl font-bold text-brand">{hasEmergencyFund ? 'Keep your target within reach.' : 'Start with one clear target.'}</h2>
        <p className="m-0 max-w-72 text-[11px] leading-[1.55] text-muted">{hasEmergencyFund ? 'Update your saved amount as it grows and Finlo will keep the remaining distance visible.' : 'Choose an emergency-fund amount that feels safe, then track every contribution toward it.'}</p>
        <Target className="absolute right-[-20px] bottom-[-22px] size-31 rounded-full bg-lime/70 p-10 text-brand/75" />
      </Card>
    </section>
  </>
}
