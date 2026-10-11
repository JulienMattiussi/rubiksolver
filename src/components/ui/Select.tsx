import type { ReactNode } from 'react'
import { SECTION_LABEL } from './styles'

interface SelectProps {
  id: string
  label: string
  value: string
  disabled?: boolean
  onChange: (value: string) => void
  /** Optional extra content shown at the right end of the label line. */
  trailing?: ReactNode
  /** The `<option>` elements. */
  children: ReactNode
}

/** A labeled dropdown, styled like the rest of the panel. */
export function Select({
  id,
  label,
  value,
  disabled = false,
  onChange,
  trailing,
  children,
}: SelectProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <label htmlFor={id} className={`block ${SECTION_LABEL}`}>
          {label}
        </label>
        {trailing}
      </div>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-semibold text-white transition hover:border-slate-500 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
      >
        {children}
      </select>
    </div>
  )
}
