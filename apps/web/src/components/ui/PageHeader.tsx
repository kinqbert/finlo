import type { ReactNode } from 'react'

export function PageHeader({ eyebrow, title, subtitle, children }: { eyebrow: string; title: string; subtitle: string; children?: ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-5 max-[820px]:flex-col max-[820px]:items-start max-[820px]:gap-3.5">
      <div>
        <span className="mb-1.5 block text-[9px] font-extrabold tracking-[.14em] text-[#75837b] uppercase">{eyebrow}</span>
        <h1 className="mt-0 mb-1.5 font-heading text-[clamp(25px,2.6vw,33px)] leading-[1.1] font-bold tracking-[-1.1px]">{title}</h1>
        <p className="m-0 text-xs text-muted">{subtitle}</p>
      </div>
      {children && <div className="flex items-center gap-2 max-[820px]:w-full max-[820px]:[&>*]:flex-1">{children}</div>}
    </div>
  )
}
