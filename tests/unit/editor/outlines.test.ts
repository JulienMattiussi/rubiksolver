import { describe, expect, it } from 'vitest'
import { stateKey } from '@/lib/core/cube'
import { cubeToEdit } from '@/lib/editor/edit'
import { readOutlines } from '@/lib/editor/scan/outlines'
import { scanPlan } from '@/lib/editor/scan/plan'
import { readScan } from '@/lib/editor/scan/read'
import { ghostScan } from '@/lib/puzzles/flat/ghostScan'
import { seededRng } from '../../helpers'
import { ghostPicture, type Shot } from './ghostPictures'

const STATES = ghostScan.states()

/** Whether a picture of a state reads as that state. */
function reads(state: number, shot: Shot, seed: number): boolean {
  const cube = STATES[state]!
  const reading = readOutlines(ghostScan, ghostPicture(cube, shot, seededRng(seed)))
  return reading.ok && stateKey(reading.cube) === stateKey(cube)
}

describe('a Floppy Ghost read by its outlines', () => {
  it('knows all its states', () => {
    expect(STATES).toHaveLength(30720)
  })

  it('reads the solved one, straight on', () => {
    expect(reads(0, {}, 1)).toBe(true)
  })

  it('reads any state, however held, front or back', () => {
    const rng = seededRng(7)
    for (let i = 0; i < 20; i++) {
      const state = Math.floor(rng() * STATES.length)
      const shot: Shot = {
        turn: rng() * 2 * Math.PI,
        mirrored: rng() < 0.5,
        zoom: 0.9 + rng() * 0.2,
        shift: [(rng() - 0.5) * 10, (rng() - 0.5) * 10],
        background: rng() * 100,
      }
      expect(reads(state, shot, i), `state ${state} ${JSON.stringify(shot)}`).toBe(true)
    }
  }, 30_000)

  it('reads a noisy picture', () => {
    expect(reads(2024, { noise: 18, turn: 2 }, 5)).toBe(true)
  })

  it('reads through a dark reflection on a sticker', () => {
    expect(reads(12345, { shadow: { at: [115, 60], radius: 9 } }, 3)).toBe(true)
  })

  it('reads nothing when no anchor shows in the middle', () => {
    const picture = ghostPicture(STATES[0]!, { shift: [70, 70] }, seededRng(2))
    expect(readOutlines(ghostScan, picture).ok).toBe(false)
  })
})

describe('the scan of a Floppy Ghost', () => {
  it('takes one face, read whole, its pentagon marked', () => {
    const plan = scanPlan('ghost')
    expect(plan).toHaveLength(1)
    expect(plan[0]).toMatchObject({ move: 'anchored', named: false, told: false })
    expect(plan[0]!.whole).toBe(ghostScan)
    expect(plan[0]!.mark).toHaveLength(5)
  })

  it('reads the puzzle from the picture taken, front or back', () => {
    const cube = STATES[4321]!
    const picture = ghostPicture(cube, { turn: 1, mirrored: true }, seededRng(9))
    const cells = scanPlan('ghost')[0]!.cells.map(() => ({ lab: [80, 0, 0] as const }))
    expect(readScan('ghost', [cells], false, [picture])).toEqual({
      ok: true,
      edit: cubeToEdit(cube),
    })
    // No picture, or nothing in its middle: taken again.
    expect(readScan('ghost', [cells])).toEqual({ ok: false, face: 0 })
  })
})
