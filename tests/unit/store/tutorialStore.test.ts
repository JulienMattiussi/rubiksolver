import { beforeEach, describe, expect, it } from 'vitest'
import { stateKey } from '@/lib/core/cube'
import { parseMoves } from '@/lib/core/moves'
import { tutorialFor } from '@/lib/tutorial/tutorial'
import { selectBusy, useCube } from '@/store/cubeStore'
import { useTutorialStore } from '@/store/tutorialStore'

/** Play the queue to the end, as the 3D loop does one frame at a time. */
function drain() {
  for (let guard = 0; selectBusy(useCube.getState()); guard++) {
    if (guard > 5000) throw new Error('drain: queue never empties')
    useCube.getState().startNext()
    useCube.getState().commitActive()
  }
}

/** The step and suggested formula on the cube as it is. */
function current() {
  const step = tutorialFor('3')!.stepOf(useCube.getState().cube)!
  const pick = step.suggestion!
  return { step, pick, moves: step.formula(pick)! }
}

/** Turns by hand, played to the end. */
function byHand(moves: string) {
  for (const m of parseMoves(moves)) useCube.getState().pushMove(m)
  drain()
}

beforeEach(() => {
  useCube.getState().setShape('3')
  useCube.getState().reset()
  for (const m of parseMoves("R U F' L2 D B' R2 U' F L D2 B")) useCube.getState().pushMove(m)
  drain()
  useTutorialStore.getState().start()
})

describe('tutorial store', () => {
  it('applies a formula, stops on it, then goes on', () => {
    const { step, pick, moves } = current()
    useTutorialStore.getState().apply({ key: step.key, moves }, pick)
    expect(useTutorialStore.getState().review).toBe(true)
    drain()
    const played = useTutorialStore.getState().played
    expect(played).toHaveLength(1)
    expect(played[0]!.after).toBe(stateKey(useCube.getState().cube))
    // The formula's turns are not taken for turns by hand.
    expect(useTutorialStore.getState().manual).toEqual([])
    useTutorialStore.getState().next()
    expect(useTutorialStore.getState().review).toBe(false)
  })

  it('undoes a formula, its pick back', () => {
    const start = stateKey(useCube.getState().cube)
    const { step, pick, moves } = current()
    useTutorialStore.getState().apply({ key: step.key, moves }, pick)
    drain()
    useTutorialStore.getState().undo()
    drain()
    expect(stateKey(useCube.getState().cube)).toBe(start)
    expect(useTutorialStore.getState()).toMatchObject({ played: [], pick, pickedOn: start })
  })

  it('keeps turns by hand, and undoing goes back to where the step began', () => {
    const start = stateKey(useCube.getState().cube)
    const { pick } = current()
    byHand("U R'")
    expect(useTutorialStore.getState().manual).toHaveLength(2)
    // The pick shown follows the turns.
    expect(useTutorialStore.getState()).toMatchObject({
      pick,
      pickedOn: stateKey(useCube.getState().cube),
    })
    useTutorialStore.getState().undo()
    drain()
    expect(stateKey(useCube.getState().cube)).toBe(start)
    expect(useTutorialStore.getState().manual).toEqual([])
  })

  it('finishes the step after turns by hand, and undoes both together', () => {
    const start = stateKey(useCube.getState().cube)
    const { pick } = current()
    byHand('U')
    // The formula from there, for the same pick.
    const rest = tutorialFor('3')!.stepOf(useCube.getState().cube)!
    useTutorialStore.getState().apply({ key: rest.key, moves: rest.formula(pick)! }, pick)
    drain()
    expect(useTutorialStore.getState().played[0]!.manual).toHaveLength(1)
    expect(useCube.getState().cube[pick.piece]!.position).toEqual(pick.slot)
    useTutorialStore.getState().undo()
    drain()
    expect(stateKey(useCube.getState().cube)).toBe(start)
  })

  it('forgets it all on leaving', () => {
    byHand('U')
    useTutorialStore.getState().exit()
    expect(useTutorialStore.getState()).toMatchObject({ active: false, manual: [], played: [] })
  })
})
