import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Move } from '@/lib/core/types'
import { formulaSegments, occupantOf, pieceColors } from '@/lib/tutorial/tutorial'
import type { TutorialView } from '@/hooks/useTutorial'
import { useI18n } from '@/i18n/i18nStore'
import { useView } from '@/store/viewStore'
import { useTutorialStore } from '@/store/tutorialStore'
import { formatMove } from '@/lib/core/moves'
import { COLOR_HEX, HIGHLIGHT, PLACE } from '@/three/core/colors'
import { FormulaMoves } from './FormulaMoves'
import { Toned } from './Toned'
import { liftFor } from './liftFor'

/**
 * A tutorial step's instructions, numbered: hold the puzzle (a click turns
 * the view so), spot the pieces, play the formula, check where they went.
 * Once played (`review`), the instructions done are checked off and the
 * last stands out.
 */

export function Instructions({ view, busy }: { view: TutorialView; busy: boolean }) {
  const t = useI18n((s) => s.t)
  const viewToward = useView((s) => s.viewToward)
  const learnt = useTutorialStore((s) => s.learnt)
  const { cube, step, pick, hold, frame, shown, review } = view
  if (!step || !hold) return null
  // Where the center to face stands: the view turns toward it.
  // The center to hold in front: the one on that side.
  const front = cube.find(
    (c) => c.stickers.length === 1 && c.stickers[0]!.normal.join() === frame.front(hold).join(),
  )!
  const frontColor = front.stickers[0]!.color
  const name = (index: number) =>
    t.tutorial.piece(
      cube[index]!.stickers.length,
      pieceColors(cube, index, step.marker)
        .map((c) => t.colors[c].toLowerCase())
        .join('-'),
    )
  const occupant = pick ? occupantOf(cube, pick) : null
  // The formula cut as taught (moves one by one, sequences learnt, a
  // sequence repeated told once with its count); followed by hand, the
  // moves played so far checked off, the next one standing out, a repeat's
  // round told. Read as held: a sequence is known by its letters.
  const play = (formula: Move[], done: number) => {
    const segments = formulaSegments(
      formula.map((m) => frame.inHold(hold, m)),
      step.algorithms,
      frame,
    )
    // Seen: in a step validated, or earlier in this formula (a gesture told
    // once with its words, then in a row).
    const seen = new Set(learnt)
    const key = (m: Move) => formatMove(frame.inHold(hold, m))
    const isNew = (m: Move) => !seen.has(key(m))
    // Words beside each move: for moves one by one in the steps that keep
    // them (`words`), and always for a piece with a move not shown yet;
    // else in tooltips, the moves in a row.
    let start = 0
    return segments.map((segment, k) => {
      const size = segment.moves.length
      const from = start
      start += size * segment.times
      const moves = formula.slice(from, from + size)
      // How far into this segment the moves played reach, and its next one.
      const into = Math.max(0, done - from)
      const rounds = Math.min(segment.times, Math.floor(into / size))
      const playedOf = rounds === segment.times ? size : into % size
      const current = done > 0 && done >= from && done < start
      const fresh = moves.some(isNew)
      for (const m of moves) seen.add(key(m))
      const round =
        segment.times > 1 && into > 0 && rounds < segment.times
          ? ` ${t.tutorial.round(rounds + 1, segment.times)}`
          : ''
      const text =
        segment.kind === 'moves'
          ? k === 0
            ? t.tutorial.play(size)
            : t.tutorial.thenPlay(size)
          : segment.times > 1
            ? k === 0
              ? t.tutorial.repeatAll(size, segment.times)
              : t.tutorial.repeat(segment.times)
            : k === 0
              ? t.tutorial.sequence(size)
              : t.tutorial.thenSequence
      return (
        <div key={k} className={k > 0 ? 'mt-1.5' : ''}>
          {text}
          {round}
          <FormulaMoves
            cube={cube}
            moves={moves}
            disabled={busy || review}
            inline={!fresh && (segment.kind === 'sequence' || !step.words)}
            hold={hold}
            frame={frame}
            done={playedOf}
            next={current}
          />
        </div>
      )
    })
  }
  const instructions: ReactNode[] = [
    <button
      key="hold"
      type="button"
      onClick={() => viewToward(front.stickers[0]!.normal, liftFor(step))}
      title={t.tutorial.facingTitle}
      className="rounded text-left underline decoration-dotted underline-offset-2 hover:text-white focus-visible:outline-2 focus-visible:outline-sky-400"
    >
      <Toned colors={[COLOR_HEX[frontColor]]}>
        {t.tutorial.facing(t.colors[frontColor].toLowerCase())}
      </Toned>
    </button>,
    ...(step.figure
      ? [
          <Toned key="figure" framed colors={[HIGHLIGHT]}>
            {t.tutorial.figures[step.figure]}
          </Toned>,
        ]
      : pick
        ? [
            <Toned key="spot" framed colors={occupant === null ? [HIGHLIGHT] : [HIGHLIGHT, PLACE]}>
              {occupant === null
                ? t.tutorial.spot(name(pick.piece))
                : t.tutorial.spotSwap(name(pick.piece), name(occupant))}
            </Toned>,
          ]
        : []),
    shown ? <div key="play">{play(shown.moves, shown.done)}</div> : t.tutorial.noFormula,
    pick
      ? t.tutorial.check(name(pick.piece))
      : step.figure
        ? (t.tutorial.checks[step.key]?.(step.outcome?.done ?? 0) ?? t.tutorial.checkFigure)
        : t.tutorial.checkAll,
  ]
  return (
    <ol className="flex flex-col gap-2.5 text-xs leading-snug text-slate-300">
      {instructions.map((text, i) => {
        // Played: the instructions done, the last (check) to do.
        const done = review && i < instructions.length - 1
        const now = review && !done
        return (
          <li key={i} className={`flex gap-2 ${done ? 'opacity-50' : ''}`}>
            <span
              className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white ${now ? 'bg-amber-500' : 'bg-slate-700'}`}
              aria-hidden
            >
              {done ? <Check className="size-3" /> : i + 1}
            </span>
            <div className={`min-w-0 ${now ? 'text-white' : ''}`}>{text}</div>
          </li>
        )
      })}
    </ol>
  )
}
