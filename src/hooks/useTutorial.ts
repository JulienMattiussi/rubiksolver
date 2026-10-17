import { useMemo } from 'react'
import type { Hold } from '@/lib/core/hold'
import type { Cube, Move } from '@/lib/core/types'
import { invertMoves } from '@/lib/core/moves'
import { applyMoves } from '@/lib/core/turn'
import { formulaUnderWay } from '@/lib/tutorial/keep'
import { cubeShape, stateKey } from '@/lib/core/cube'
import {
  tonesOf,
  tutorialFor,
  type Tone,
  type TutorialPick,
  type TutorialStep,
} from '@/lib/tutorial/tutorial'
import { selectBusy, useCube } from '@/store/cubeStore'
import { useTutorialStore } from '@/store/tutorialStore'

export interface TutorialView {
  /** The state the step reads: the cube's, or, looking at a formula just
   *  played, the one it was played on. */
  cube: Cube
  /** Looking at the formula just played (its step, pick and moves shown
   *  done; the pieces where they went, no arrow), before `next`. */
  review: boolean
  /** How far the step has come on the cube as it is (a formula just played
   *  counted): its pieces placed, of how many. */
  progress: { done: number; total: number } | null
  /** The step the cube stands at (null: off, or the puzzle solved). */
  step: TutorialStep | null
  /** The piece and place shown: the user's pick, else the suggestion. */
  pick: TutorialPick | null
  /** The way to hold the puzzle for it: the formula reads from there. */
  hold: Hold | null
  /** The formula for it, what is left to play (null: none). */
  moves: Move[] | null
  /** The formula shown, and how many of its moves are played by hand
   *  already (it stays shown while they follow it). */
  shown: { moves: Move[]; done: number } | null
  /** Each piece's tone under it, by index (null while a turn plays). */
  tones: Tone[] | null
  /** A piece clicked on the puzzle: picked, or the place for the piece
   *  picked. */
  click: (index: number) => void
}

const OFF = {
  review: false,
  progress: null,
  step: null,
  pick: null,
  hold: null,
  moves: null,
  shown: null,
  tones: null,
  click: () => {},
}

/** The tutorial as it stands on the cube: its step, the pick and its
 *  formula, the pieces' tones, and what a click on a piece does. */
export function useTutorial(): TutorialView {
  const cube = useCube((s) => s.cube)
  const busy = useCube(selectBusy)
  const active = useTutorialStore((s) => s.active)
  const picked = useTutorialStore((s) => s.pick)
  const pickedOn = useTutorialStore((s) => s.pickedOn)
  const choose = useTutorialStore((s) => s.choose)
  const played = useTutorialStore((s) => s.played)
  const manual = useTutorialStore((s) => s.manual)
  const reviewing = useTutorialStore((s) => s.review)
  const last = played[played.length - 1]
  // The formula just played, while it plays and until a turn by hand.
  const review = reviewing && !!last && (busy || stateKey(cube) === last.after)
  const tutorial = tutorialFor(cubeShape(cube))
  const read = review ? last.cube : cube
  // Where the step began: before the turns by hand since (the cube's turns
  // on a puzzle with a tutorial are its own moves).
  const begun = useMemo(
    () => (review || manual.length === 0 ? read : applyMoves(read, invertMoves(manual) as Move[])),
    [review, manual, read],
  )
  const step = useMemo(
    () => (active && tutorial ? tutorial.stepOf(read, begun) : null),
    [active, tutorial, read, begun],
  )
  const pick = review
    ? last.pick
    : picked && pickedOn === stateKey(cube)
      ? picked
      : (step?.suggestion ?? null)
  const underWay = useMemo(() => {
    if (review) return { rest: [...last.moves], shown: [...last.moves], done: 0 }
    if (!step || !tutorial) return null
    return formulaUnderWay(tutorial, step, pick, read, begun, manual as Move[])
  }, [review, last, step, pick, manual, read, begun, tutorial])
  const moves = underWay?.rest ?? null
  const shown = underWay?.shown ? { moves: underWay.shown, done: underWay.done } : null
  const tones = useMemo(() => {
    if (!step || !moves || busy) return null
    const tones = tonesOf(read, moves, pick, step.placed, step.focus)
    // Played: the piece that stood in the way only moved like the others.
    return review ? tones.map((t) => (t === 'slot' ? 'moved' : t)) : tones
  }, [step, moves, busy, read, pick, review])
  if (!step) return { ...OFF, cube }
  // Looking at a formula played, its step may be over: all its pieces placed.
  const live = review && tutorial ? tutorial.stepOf(cube) : step
  const total = step.progress?.total
  const progress =
    total === undefined
      ? null
      : live?.key === step.key && live.progress
        ? live.progress
        : { done: total, total }
  const click = (index: number) => {
    if (busy || review) return
    const at = cube[index]!.position.join()
    // A piece picked: a place for it, or the piece itself again to drop it.
    if (pick && index === pick.piece) {
      choose(null)
      return
    }
    const slot = pick && step.slots(pick.piece).find((s) => s.join() === at)
    if (pick && slot) {
      choose({ piece: pick.piece, slot })
      return
    }
    if (step.pickable.includes(index)) {
      const suggested = step.suggestion?.piece === index ? step.suggestion.slot : undefined
      const first = suggested ?? step.slots(index)[0]
      if (first) choose({ piece: index, slot: first })
    }
  }
  return {
    cube: read,
    review,
    progress,
    step,
    pick,
    hold: step.hold(pick),
    moves,
    shown,
    tones,
    click,
  }
}
