import { forwardRef, type ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  fullWidth?: boolean
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'neutral' | 'primary' | 'danger'
}

const variants = {
  primary: 'border-brand bg-brand text-white shadow-[0_5px_14px_rgba(21,63,46,.14)] hover:bg-brand-dark',
  secondary: 'border-line bg-white text-ink hover:bg-[#f7f8f4]',
  ghost: 'border-transparent bg-transparent text-[#53725f] hover:bg-[#eef1ea]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant = 'secondary', fullWidth = false, className = '', ...props }, ref) {
  return <button ref={ref} className={`inline-flex min-h-9.5 cursor-pointer items-center justify-center gap-1.75 rounded-[10px] border px-3.5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`} {...props} />
})

const iconVariants = {
  neutral: 'border-line bg-white text-muted hover:bg-canvas hover:text-ink',
  primary: 'border-brand bg-brand text-white hover:bg-brand-dark',
  danger: 'border-[#efc6b9] bg-[#fff2ed] text-[#984b37] hover:bg-[#fde8e0]',
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton({ variant = 'neutral', className = '', ...props }, ref) {
  return <button ref={ref} className={`grid size-7.5 shrink-0 cursor-pointer place-items-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${iconVariants[variant]} ${className}`} {...props} />
})
