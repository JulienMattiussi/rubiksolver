import type { ReactNode } from 'react'

interface IconButtonProps {
  /** Accessible name shown as tooltip and read by assistive tech. */
  label: string
  onClick: () => void
  children: ReactNode
  className?: string
}

/** Compact icon-only button with a tooltip (recenter, collapse, ...). */
export function IconButton({ label, onClick, children, className = '' }: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`rounded p-1 text-slate-400 transition hover:text-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${className}`}
    >
      {children}
    </button>
  )
}
