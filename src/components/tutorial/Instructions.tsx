import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Turn } from '@/lib/core/types'
import { markedOn, occupantOf, pieceColors, turnsWhole } from '@/lib/teach/scene'
import { applyMoves } from '@/lib/core/turn'
import { formulaSegments } from '@/lib/teach/segments'
import type { TutorialView } from '@/hooks/useTutorial'
import { useView } from '@/store/viewStore'
import { useTutorialTrack } from '@/store/tutorialTrack'
import { formatMove } from '@/lib/core/notation'
import { HIGHLIGHT, PLACE } from '@/three/core/colors'
import { FormulaMoves } from './FormulaMoves'
import { Toned } from './Toned'
import { liftFor } from './liftFor'
import { Bolded } from './Bolded'
import { useTutorialTexts } from './useTutorialTexts'

/**
 * A tutorial step's instructions, numbered: hold the puzzle (a click turns
 * the view so), spot the pieces, play the formula, check where they went.
 * Once played (`review`), the instructions done are checked off and the
 * last stands out.
 */

export function Instructions({ view, busy }: { view: TutorialView; busy: boolean }) {
  const tx = useTutorialTexts()
  const viewToward = useView((s) => s.viewToward)
  const learnt = useTutorialTrack((s) => s.learnt)
  const { cube, step, pick, hold, frame, shown, review } = view
  if (!step || !hold) return null
  // Where the center to face stands: the view turns toward it.
  // The side to hold in front, told by its color (its center's, or the
  // pieces' frame's on a puzzle with no centers).
  const frontNormal = frame.front(hold)
  // A formula turning the whole puzzle only (the cube held another way):
  // told as the way to hold it once turned, nothing to play.
  const turning = shown !== null && turnsWhole(shown.moves)
  const held = turning && !review ? applyMoves(cube, shown.moves) : cube
  const front = view.tutorial?.faceColor(held, frontNormal) ?? null
  // And the side held down (the holds turn round the top).
  const down = view.tutorial?.faceColor(held, frame.down) ?? null
  const name = (index: number) =>
    tx.piece(
      view.tutorial?.pieceKind(cube[index]!) ?? 'piece',
      pieceColors(cube, index, step.marker, view.tutorial?.outside).map(tx.colorName),
    )
  const occupant = pick ? occupantOf(cube, pick, view.moves ?? []) : null
  // The formula cut as taught (moves one by one, sequences learnt, a
  // sequence repeated told once with its count); followed by hand, the
  // moves played so far checked off, the next one standing out, a repeat's
  // round told. Read as held: a sequence is known by its letters.
  const play = (formula: Turn[], done: number) => {
    const segments = formulaSegments(
      formula.map((m) => frame.inHold(hold, m)),
      step.algorithms,
      frame,
    )
    // Seen: in a step validated, or earlier in this formula (a gesture told
    // once with its words, then in a row).
    const seen = new Set(learnt)
    const key = (m: Turn) => formatMove(frame.inHold(hold, m))
    const isNew = (m: Turn) => !seen.has(key(m))
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
          ? ` ${tx.round(rounds + 1, segment.times)}`
          : ''
      const text =
        segment.kind === 'moves'
          ? k === 0
            ? tx.play(size)
            : tx.thenPlay(size)
          : segment.times > 1
            ? k === 0
              ? tx.repeatAll(size, segment.times)
              : tx.repeat(segment.times)
            : k === 0
              ? tx.sequence(size)
              : tx.thenSequence
      return (
        <div key={k} className={k > 0 ? 'mt-1.5' : ''}>
          <Bolded text={text} />
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
    // No side to name (a 2x2 before its anchor corner): any way will do.
    ...(front
      ? [
          <button
            key="hold"
            type="button"
            onClick={() => viewToward(frontNormal, liftFor(step))}
            title={tx.facingTitle}
            className="rounded text-left underline decoration-dotted underline-offset-2 hover:text-white focus-visible:outline-2 focus-visible:outline-sky-400"
          >
            <Toned colors={[tx.swatch(front.color)]}>
              {tx.facing(
                tx.colorName(front.color),
                down ? tx.colorName(down.color) : '',
                view.tutorial?.holding ?? (front.center ? 'center' : 'side'),
              )}
            </Toned>
          </button>,
        ]
      : []),
    ...(step.figure
      ? [
          <Toned key="figure" framed colors={[HIGHLIGHT]}>
            {tx.figures[step.figure]}
          </Toned>,
        ]
      : pick
        ? [
            <Toned key="spot" framed colors={occupant === null ? [HIGHLIGHT] : [HIGHLIGHT, PLACE]}>
              {occupant === null
                ? tx.spot(name(pick.piece))
                : tx.spotSwap(name(pick.piece), name(occupant))}
            </Toned>,
          ]
        : []),
    ...(turning
      ? []
      : [shown ? <div key="play">{play(shown.moves, shown.done)}</div> : tx.noFormula]),
    pick
      ? tx.check(name(pick.piece))
      : step.figure
        ? (tx.checks[step.key]?.(
            step.outcome?.done ?? 0,
            // Which pieces it leaves marked on the side, named.
            markedOn(cube, view.moves ?? [], step).map(name),
          ) ?? tx.checkFigure)
        : (tx.checks[step.key]?.(0) ?? tx.checkAll),
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
