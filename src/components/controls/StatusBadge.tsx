import { useI18n } from '@/i18n/i18nStore'
import { selectBusy, selectSolved, useCube } from '@/store/cubeStore'

/** Colored dot + label reflecting the cube's current status. */
export function StatusBadge() {
  const t = useI18n((s) => s.t)
  const busy = useCube(selectBusy)
  const solved = useCube(selectSolved)
  const solving = useCube((s) => s.solving)
  const status = busy
    ? solving
      ? t.statusSolving
      : t.statusPlaying
    : solved
      ? t.statusSolved
      : t.statusReady
  const dot = solved && !busy ? 'bg-emerald-400' : busy ? 'bg-sky-400' : 'bg-amber-400'

  return (
    <span className="flex items-center gap-1.5 text-xs">
      <span className={`inline-block size-2.5 rounded-full ${dot}`} aria-hidden />
      <span className="font-medium text-slate-300">{status}</span>
    </span>
  )
}
