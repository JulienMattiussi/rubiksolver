import { useState, type CSSProperties } from 'react'
import { Lock, LockOpen, Zap } from 'lucide-react'
import { cubeShape } from '@/lib/core/cube'
import { canUnlock } from '@/lib/app/unlock'
import { useI18n } from '@/i18n/i18nStore'
import { selectBusy, selectSolved, useCube } from '@/store/cubeStore'
import { useTutorialStore } from '@/store/tutorialStore'

/** The sparks bursting out of the padlock as it opens: each one's way out
 *  (its angle round the knob, how far) and its color. */
const SPARKS = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * 2 * Math.PI
  const reach = i % 2 ? 22 : 34
  return {
    dx: `${Math.round(Math.cos(angle) * reach)}px`,
    dy: `${Math.round(Math.sin(angle) * reach)}px`,
    color: ['bg-amber-300', 'bg-rose-400', 'bg-fuchsia-400', 'bg-sky-300'][i % 4]!,
  }
})

/** The unlocked mode's switch, on a puzzle that has one (the Floppy's
 *  quarter turns): off, its track breathes and its padlock rattles now and
 *  then (hovered, it nudges toward on); on, the padlock springs open in a
 *  burst of sparks, the track shimmering and the bolt flickering. Back off
 *  only once reset, locked during the tutorial. The whole line toggles it. */
export function UnlockSwitch() {
  const t = useI18n((s) => s.t)
  const has = useCube((s) => canUnlock(cubeShape(s.cube)))
  const unlocked = useCube((s) => s.unlocked)
  const setUnlocked = useCube((s) => s.setUnlocked)
  const busy = useCube(selectBusy)
  const solved = useCube(selectSolved)
  const tutorial = useTutorialStore((s) => s.active)
  // Each opening bursts anew (the sparks remounted).
  const [bursts, setBursts] = useState(0)
  if (!has) return null
  const stuck = unlocked && !solved
  const Padlock = unlocked ? LockOpen : Lock
  return (
    <button
      type="button"
      role="switch"
      aria-checked={unlocked}
      disabled={busy || tutorial || stuck}
      title={tutorial ? t.tutorial.locked : stuck ? t.unlocked.stuck : t.unlocked.title}
      onClick={() => {
        if (!unlocked) setBursts((n) => n + 1)
        setUnlocked(!unlocked)
      }}
      className="group mb-2 flex w-full items-center justify-between gap-2 rounded py-1 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="flex items-center gap-1.5">
        <Zap
          className={`size-3.5 transition ${
            unlocked
              ? 'fill-amber-300 text-amber-300 motion-safe:animate-flicker'
              : 'text-indigo-400 group-hover:fill-amber-300/40 group-hover:text-amber-300 group-disabled:group-hover:fill-transparent'
          }`}
          aria-hidden
        />
        <span
          className={
            unlocked
              ? 'bg-gradient-to-r from-amber-300 via-rose-400 to-fuchsia-400 bg-clip-text font-bold text-transparent'
              : 'text-slate-300'
          }
        >
          {t.unlocked.label}
        </span>
      </span>
      <span
        aria-hidden
        className={`relative h-6 w-11 shrink-0 rounded-full transition-all duration-300 ${
          unlocked
            ? 'bg-[linear-gradient(90deg,#fbbf24,#f43f5e,#d946ef,#fbbf24)] bg-[length:200%_100%] shadow-[0_0_14px_rgba(244,63,94,0.7)] motion-safe:animate-shimmer'
            : 'bg-gradient-to-r from-slate-700 to-indigo-900 ring-1 ring-indigo-400/40 motion-safe:animate-beckon group-disabled:animate-none'
        }`}
      >
        <span
          className={`absolute top-0.5 flex size-5 items-center justify-center rounded-full bg-white shadow transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            unlocked ? 'left-[22px]' : 'left-0.5 group-enabled:group-hover:left-1.5'
          }`}
        >
          {/* Remounted on each change, so it jolts every time. */}
          {/* Off, it rattles now and then, as if it wanted out. */}
          <span className={`flex ${unlocked ? '' : 'motion-safe:animate-rattle'}`}>
            <Padlock
              key={String(unlocked)}
              className={`size-3 motion-safe:animate-jolt ${unlocked ? 'text-rose-500' : 'text-indigo-500'}`}
            />
          </span>
        </span>
        {unlocked && bursts > 0 && (
          <span
            key={bursts}
            className="pointer-events-none absolute top-3 left-8 z-10 motion-reduce:hidden"
          >
            {SPARKS.map((spark, i) => (
              <span
                key={i}
                className={`absolute -top-[3px] -left-[3px] size-1.5 rounded-full shadow-[0_0_6px_currentColor] ${spark.color} animate-spark`}
                style={{ '--dx': spark.dx, '--dy': spark.dy } as CSSProperties}
              />
            ))}
          </span>
        )}
      </span>
    </button>
  )
}
