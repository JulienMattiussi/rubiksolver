import { Languages, RotateCcw, Shuffle, Sparkles, Square } from 'lucide-react'
import { isSolved } from '@/lib/cube'
import { formatMoves } from '@/lib/moves'
import type { Face, Move } from '@/lib/types'
import { useI18n } from '@/i18n/i18nStore'
import type { Locale } from '@/i18n/translations'
import { useCube } from '@/store/cubeStore'
import { Button } from './ui/Button'

const FACES: readonly Face[] = ['U', 'D', 'L', 'R', 'F', 'B']

// Slider position 0..100 mapped to seconds per turn (right = faster).
const MIN_DURATION = 0.06
const MAX_DURATION = 0.5
const toDuration = (pos: number) => MAX_DURATION - (pos / 100) * (MAX_DURATION - MIN_DURATION)
const toPosition = (dur: number) => ((MAX_DURATION - dur) / (MAX_DURATION - MIN_DURATION)) * 100

function LanguageToggle() {
  const t = useI18n((s) => s.t)
  const locale = useI18n((s) => s.locale)
  const setLocale = useI18n((s) => s.setLocale)
  return (
    <div className="flex items-center gap-1" role="group" aria-label={t.language}>
      <Languages className="size-4 text-slate-400" aria-hidden />
      {(['fr', 'en'] as Locale[]).map((loc) => (
        <button
          key={loc}
          onClick={() => setLocale(loc)}
          aria-pressed={locale === loc}
          className={`rounded px-2 py-1 text-xs font-semibold uppercase transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400 ${
            locale === loc ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {loc}
        </button>
      ))}
    </div>
  )
}

function MovePad({ disabled }: { disabled: boolean }) {
  const t = useI18n((s) => s.t)
  const pushMove = useCube((s) => s.pushMove)
  const turn = (face: Face, amount: 1 | 3): Move => ({ face, amount })
  return (
    <div>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {t.moves}
      </h2>
      <div className="grid grid-cols-3 gap-2">
        {FACES.map((face) => (
          <div key={face} className="flex overflow-hidden rounded-lg">
            <Button
              disabled={disabled}
              onClick={() => pushMove(turn(face, 1))}
              className="flex-1 rounded-none px-2"
              aria-label={`${face}`}
            >
              {face}
            </Button>
            <Button
              disabled={disabled}
              onClick={() => pushMove(turn(face, 3))}
              variant="ghost"
              className="flex-1 rounded-none border-l border-slate-800 bg-slate-800 px-2"
              aria-label={`${face} prime`}
            >
              {face}&#39;
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Controls() {
  const t = useI18n((s) => s.t)
  const cube = useCube((s) => s.cube)
  const active = useCube((s) => s.active)
  const queue = useCube((s) => s.queue)
  const mode = useCube((s) => s.mode)
  const solution = useCube((s) => s.solution)
  const turnDuration = useCube((s) => s.turnDuration)
  const scramble = useCube((s) => s.scramble)
  const solveCube = useCube((s) => s.solveCube)
  const reset = useCube((s) => s.reset)
  const stop = useCube((s) => s.stop)
  const setTurnDuration = useCube((s) => s.setTurnDuration)

  const busy = active !== null || queue.length > 0
  const solved = isSolved(cube)
  const status = busy
    ? mode === 'solving'
      ? t.statusSolving
      : t.statusPlaying
    : solved
      ? t.statusSolved
      : t.statusReady

  const total = solution?.length ?? 0
  const remaining = queue.length + (active ? 1 : 0)
  const showProgress = busy && mode === 'solving' && total > 0

  return (
    <section
      aria-label={t.title}
      className="flex w-full flex-col gap-5 rounded-2xl border border-slate-700/70 bg-slate-900/85 p-5 shadow-2xl backdrop-blur sm:w-80"
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-white">{t.title}</h1>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">{t.subtitle}</p>
        </div>
        <LanguageToggle />
      </header>

      <div className="flex items-center gap-2 text-sm">
        <span
          className={`inline-block size-2.5 rounded-full ${solved && !busy ? 'bg-emerald-400' : busy ? 'bg-sky-400' : 'bg-amber-400'}`}
          aria-hidden
        />
        <span className="font-medium text-slate-200">{status}</span>
        {showProgress && (
          <span className="text-slate-400">
            {total - remaining}/{total}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button onClick={scramble} disabled={busy}>
          <Shuffle className="size-4" aria-hidden />
          {t.scramble}
        </Button>
        <Button variant="primary" onClick={solveCube} disabled={busy || solved}>
          <Sparkles className="size-4" aria-hidden />
          {t.solve}
        </Button>
        {busy ? (
          <Button onClick={stop}>
            <Square className="size-4" aria-hidden />
            {t.stop}
          </Button>
        ) : (
          <Button onClick={reset} disabled={solved}>
            <RotateCcw className="size-4" aria-hidden />
            {t.reset}
          </Button>
        )}
      </div>

      <div>
        <label htmlFor="speed" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t.speed}
        </label>
        <input
          id="speed"
          type="range"
          min={0}
          max={100}
          value={Math.round(toPosition(turnDuration))}
          onChange={(e) => setTurnDuration(toDuration(Number(e.target.value)))}
          className="w-full accent-sky-500"
        />
      </div>

      <MovePad disabled={busy} />

      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t.solutionLabel}
        </h2>
        {solution && solution.length > 0 ? (
          <div className="space-y-1">
            <p className="text-xs text-slate-400">{t.solutionCount(solution.length)}</p>
            <p className="max-h-24 overflow-auto rounded-lg bg-slate-950/60 p-2 font-mono text-xs leading-relaxed text-slate-300">
              {formatMoves(solution)}
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-500">{solution ? t.emptySolution : t.rotateHint}</p>
        )}
      </div>
    </section>
  )
}
