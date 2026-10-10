import type { ComponentPropsWithRef, ReactNode } from 'react'

type Variant = 'primary' | 'default' | 'ghost'

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ' +
  'disabled:opacity-40 disabled:cursor-not-allowed ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-sky-500 text-white hover:bg-sky-400',
  default: 'bg-slate-700 text-slate-100 hover:bg-slate-600',
  ghost: 'bg-transparent text-slate-300 hover:bg-slate-700/60',
}

interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: Variant
  children: ReactNode
}

export function Button({ variant = 'default', className = '', children, ...rest }: ButtonProps) {
  return (
    <button className={`${BASE} ${VARIANTS[variant]} ${className}`} {...rest}>
      {children}
    </button>
  )
}
