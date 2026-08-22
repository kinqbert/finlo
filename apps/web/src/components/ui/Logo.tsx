export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 font-heading text-2xl font-extrabold tracking-[-1px] ${light ? 'text-white' : 'text-brand'}`}>
      <span className={`grid size-7 place-items-center rounded-tl-[9px] rounded-tr-sm rounded-br-[9px] rounded-bl-sm text-base ${light ? 'bg-lime text-brand' : 'bg-brand text-lime'}`}>F</span>
      finlo
    </div>
  )
}
