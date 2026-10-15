import type { ReactNode } from 'react'

/** A red alert of the entry panel: why the entry is refused. */
export function ErrorAlert({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-lg bg-red-500/15 px-3 py-2 text-xs text-red-300">
      {children}
    </p>
  )
}
