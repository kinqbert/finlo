import type { ReactNode } from 'react'

export function PageHeader({ eyebrow, title, subtitle, children }: { eyebrow: string; title: string; subtitle: string; children?: ReactNode }) {
  return (
    <div className="mb-7.5 flex items-end justify-between gap-7.5 max-[820px]:flex-col max-[820px]:items-start">
      <div>
        <span className="mb-2 block text-[10px] font-extrabold tracking-[.14em] text-[#75837b] uppercase">{eyebrow}</span>
        <h1 className="mt-0 mb-2 font-heading text-[clamp(28px,3vw,39px)] leading-[1.1] font-bold tracking-[-1.4px]">{title}</h1>
        <p className="m-0 text-sm text-muted">{subtitle}</p>
      </div>
      {children && <div className="flex items-center gap-2.5 max-[820px]:w-full max-[820px]:[&>*]:flex-1">{children}</div>}
    </div>
  )
}
