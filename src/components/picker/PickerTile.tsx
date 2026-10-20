import { GraduationCap } from 'lucide-react'
import type { ReactNode } from 'react'

/** A picker choice: a picture above its name, highlighted when current;
 *  a puzzle with a tutorial (or a category holding one) marked in its
 *  corner (`tutorial`: told so). */
export function PickerTile({
  label,
  detail,
  current = false,
  tutorial,
  onClick,
  children,
}: {
  label: string
  /** Second line under the name (a count, a hint). */
  detail?: string
  current?: boolean
  tutorial?: string
  onClick: () => void
  /** The picture. */
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={detail ? `${label}, ${detail}` : label}
      title={tutorial}
      aria-description={tutorial}
      aria-current={current || undefined}
      className={`relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
        current
          ? 'border-sky-400 bg-sky-500/10'
          : 'border-slate-700/60 bg-slate-800/40 hover:border-slate-500 hover:bg-slate-800'
      }`}
    >
      {tutorial && (
        <span className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full border border-amber-400/60 bg-amber-500/20 text-amber-300">
          <GraduationCap className="size-3.5" aria-hidden />
        </span>
      )}
      <span className="flex h-20 w-full items-center justify-center">{children}</span>
      <span className="text-sm font-semibold text-white">{label}</span>
      {detail && <span className="-mt-1.5 text-xs text-slate-400">{detail}</span>}
    </button>
  )
}
