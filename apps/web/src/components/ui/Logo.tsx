import finloLogo from '@/assets/finlo-logo.svg'

export function Logo({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return <img className={`block w-auto ${compact ? 'h-5.25' : 'h-7.5'} ${light ? 'brightness-0 invert' : ''}`} src={finloLogo} alt="Finlo" />
}
