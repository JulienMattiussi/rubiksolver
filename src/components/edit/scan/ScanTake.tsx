import { useEffect } from 'react'
import { ScanLine } from 'lucide-react'
import { useI18n } from '@/i18n/i18nStore'
import { Button } from '@/components/ui/Button'

/**
 * What takes a face: in the middle of the screen, the button the user taps
 * once the puzzle is placed (or, on a laptop, the space bar), released; the
 * camera then waits for the face to hold still (ScanView), saying so below
 * the frame. Nothing else tells a puzzle from a wall. When nothing held
 * still in time, it says so over the button.
 */
export function ScanTake({
  armed,
  nothing,
  onArm,
}: {
  armed: boolean
  /** Nothing held still last time. */
  nothing: boolean
  onArm: () => void
}) {
  const t = useI18n((s) => s.t)
  useEffect(() => {
    if (armed) return
    const key = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      e.preventDefault()
      if (e.type === 'keyup') onArm()
    }
    window.addEventListener('keydown', key)
    window.addEventListener('keyup', key)
    return () => {
      window.removeEventListener('keydown', key)
      window.removeEventListener('keyup', key)
    }
  }, [armed, onArm])

  if (armed) {
    // Out of the way: the face is being read.
    return (
      <p
        className="absolute inset-x-0 bottom-24 mx-auto w-fit rounded-full bg-black/70 px-4 py-2 text-sm font-medium"
        role="status"
      >
        {t.scanHolding}
      </p>
    )
  }
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
      <div className="pointer-events-auto flex max-w-sm flex-col items-center gap-3 rounded-2xl bg-black/75 p-5 text-center shadow-xl ring-1 ring-white/15">
        <p className="text-sm leading-snug text-slate-100">
          {nothing ? t.scanNothing : t.scanTakeHint}
        </p>
        <Button variant="primary" onClick={onArm} className="px-6 py-3 text-base">
          <ScanLine className="size-5" aria-hidden />
          {t.scanTake}
        </Button>
      </div>
    </div>
  )
}
