import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const buttonVariants = cva('inline-flex min-h-9.5 cursor-pointer items-center justify-center gap-1.75 rounded-[10px] border px-3.5 text-xs font-bold transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100', {
  variants: {
    variant: {
      primary: 'border-brand bg-brand text-white shadow-[0_5px_14px_rgba(21,63,46,.14)] hover:bg-brand-dark',
      secondary: 'border-line bg-white text-ink hover:bg-[#f7f8f4]',
      ghost: 'border-transparent bg-transparent text-[#53725f] hover:bg-[#eef1ea]',
    },
    fullWidth: { true: 'w-full' },
  },
  defaultVariants: { variant: 'secondary', fullWidth: false },
})

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant, fullWidth, className, ...props }, ref) {
  return <button ref={ref} className={cn(buttonVariants({ variant, fullWidth }), className)} {...props} />
})

const iconButtonVariants = cva('grid size-7.5 shrink-0 cursor-pointer place-items-center rounded-lg border transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[.94] disabled:cursor-not-allowed disabled:opacity-35 disabled:active:scale-100', {
  variants: {
    variant: {
      neutral: 'border-line bg-white text-muted hover:bg-canvas hover:text-ink',
      primary: 'border-brand bg-brand text-white hover:bg-brand-dark',
      danger: 'border-[#efc6b9] bg-[#fff2ed] text-[#984b37] hover:bg-[#fde8e0]',
    },
  },
  defaultVariants: { variant: 'neutral' },
})

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof iconButtonVariants>

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton({ variant, className, ...props }, ref) {
  return <button ref={ref} className={cn(iconButtonVariants({ variant }), className)} {...props} />
})
