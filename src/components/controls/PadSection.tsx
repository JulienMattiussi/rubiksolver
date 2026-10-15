import type { ReactNode } from 'react'
import { SECTION_LABEL } from '@/components/ui/styles'

/** A block of a rotation pad: its title, then its buttons. */
export function PadSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-2">
      <p className={`${SECTION_LABEL} mb-1`}>{title}</p>
      {children}
    </div>
  )
}
