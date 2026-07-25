import { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Locate,
  Pencil,
  RotateCcw,
  Shuffle,
  Sparkles,
  Square,
} from 'lucide-react'
import { isSolved } from '@/lib/cube'
import { faceLabel, NOTATION_FR, NOTATION_US } from '@/lib/moves'
import type { Face, Move } from '@/lib/types'
import { useI18n, type Notation } from '@/i18n/i18nStore'
import type { Locale } from '@/i18n/translations'
import { useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { useView } from '@/store/viewStore'
import { EditPanel } from './EditPanel'
import { SolvePanel } from './SolvePanel'
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
      {(['fr', 'en'] as Locale[]).map((loc) => (
        <button
          key={loc}
          onClick={() => setLocale(loc)}
          aria-pressed={locale === loc}
          title={loc === 'fr' ? 'Français' : 'English'}
          className={`rounded px-2 py-1 text-xs font-semibold uppercase transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
            locale === loc ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {loc}
        </button>
      ))}
    </div>
  )
}

function NotationToggle() {
  const t = useI18n((s) => s.t)
  const notation = useI18n((s) => s.notation)
  const setNotation = useI18n((s) => s.setNotation)
  return (
    <div className="flex items-center gap-1" role="group" aria-label={t.notation}>
      {(['fr', 'us'] as Notation[]).map((n) => (
        <button
          key={n}
          onClick={() => setNotation(n)}
          aria-pressed={notation === n}
          title={t.notationTitles[n]}
          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
            notation === n ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

function MovePad({ disabled }: { disabled: boolean }) {
  const t = useI18n((s) => s.t)
  const notation = useI18n((s) => s.notation)
  const pushMove = useCube((s) => s.pushMove)
  const resetView = useView((s) => s.resetView)
  const labels = notation === 'fr' ? NOTATION_FR : NOTATION_US
  const turn = (face: Face, amount: 1 | 3): Move => ({ face, amount })
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t.moves}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={resetView}
            title={t.recenter}
            aria-label={t.recenter}
            className="rounded p-1 text-slate-400 transition hover:text-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
          >
            <Locate className="size-4" aria-hidden />
          </button>
          <NotationToggle />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {FACES.map((face) => (
          <div key={face} className="flex overflow-hidden rounded-lg">
            <Button
              disabled={disabled}
              onClick={() => pushMove(turn(face, 1))}
              className="flex-1 rounded-none px-2"
              aria-label={t.moveTitle(t.faceNames[face], true)}
              title={t.moveTitle(t.faceNames[face], true)}
            >
              {faceLabel(face, labels)}
            </Button>
            <Button
              disabled={disabled}
              onClick={() => pushMove(turn(face, 3))}
              variant="ghost"
              className="flex-1 rounded-none border-l border-slate-800 bg-slate-800 px-2"
              aria-label={t.moveTitle(t.faceNames[face], false)}
              title={t.moveTitle(t.faceNames[face], false)}
            >
              {faceLabel(face, labels)}&#39;
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
  const turnDuration = useCube((s) => s.turnDuration)
  const scramble = useCube((s) => s.scramble)
  const solveAll = useCube((s) => s.solveAll)
  const reset = useCube((s) => s.reset)
  const stop = useCube((s) => s.stop)
  const setTurnDuration = useCube((s) => s.setTurnDuration)
  const editing = useEditor((s) => s.mode === 'edit')
  const enterEdit = useEditor((s) => s.enter)
  const enterFromCurrent = useEditor((s) => s.enterFromCurrent)
  const [collapsed, setCollapsed] = useState(false)

  const busy = active !== null || queue.length > 0
  const solved = isSolved(cube)
  const status = busy
    ? mode === 'solving'
      ? t.statusSolving
      : t.statusPlaying
    : solved
      ? t.statusSolved
      : t.statusReady

  return (
    <section
      aria-label={t.title}
      className="flex w-full flex-col gap-5 rounded-2xl border border-slate-700/70 bg-slate-900/85 p-5 shadow-2xl backdrop-blur sm:w-80"
    >
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-white">{editing ? t.editTitle : t.title}</h1>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          {!editing && (
            <button
              onClick={() => setCollapsed((c) => !c)}
              aria-expanded={!collapsed}
              aria-label={collapsed ? t.expand : t.collapse}
              title={collapsed ? t.expand : t.collapse}
              className="rounded p-1 text-slate-400 transition hover:text-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 sm:hidden"
            >
              {collapsed ? (
                <ChevronDown className="size-5" aria-hidden />
              ) : (
                <ChevronUp className="size-5" aria-hidden />
              )}
            </button>
          )}
        </div>
      </header>

      {editing ? (
        <EditPanel />
      ) : (
        <>
          {collapsed && (
            <div className="flex gap-2 sm:hidden">
              <Button onClick={scramble} disabled={busy} className="flex-1">
                <Shuffle className="size-4" aria-hidden />
                {t.scramble}
              </Button>
              <Button
                variant="primary"
                onClick={solveAll}
                disabled={busy || solved}
                className="flex-1"
              >
                <Sparkles className="size-4" aria-hidden />
                {t.solve}
              </Button>
            </div>
          )}
          <div className={collapsed ? 'hidden flex-col gap-5 sm:flex' : 'flex flex-col gap-5'}>
            <section
              aria-label={t.sectionSetup}
              className="flex flex-col gap-3 rounded-xl border border-slate-700/60 bg-slate-950/30 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {t.sectionSetup}
                </h2>
                <span className="flex items-center gap-1.5 text-xs">
                  <span
                    className={`inline-block size-2.5 rounded-full ${solved && !busy ? 'bg-emerald-400' : busy ? 'bg-sky-400' : 'bg-amber-400'}`}
                    aria-hidden
                  />
                  <span className="font-medium text-slate-300">{status}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button onClick={scramble} disabled={busy}>
                  <Shuffle className="size-4" aria-hidden />
                  {t.scramble}
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
                <Button onClick={enterEdit} disabled={busy} variant="ghost">
                  <Pencil className="size-4" aria-hidden />
                  {t.editCube}
                </Button>
                <Button onClick={enterFromCurrent} disabled={busy} variant="ghost">
                  {t.fromCurrent}
                </Button>
              </div>

              <div>
                <label
                  htmlFor="speed"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400"
                >
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
            </section>

            <section
              aria-label={t.sectionSolve}
              className="flex flex-col gap-3 rounded-xl border border-slate-700/60 bg-slate-950/30 p-4"
            >
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {t.sectionSolve}
              </h2>
              <SolvePanel />
            </section>
          </div>
        </>
      )}
    </section>
  )
}
