import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/core/cube'
import { applyMoves } from '@/lib/core/turn'
import { parseMoves } from '@/lib/core/notation'
import type { CubeShape } from '@/lib/core/shapes'
import { slotsFor } from '@/lib/editor/edit'
import { entryOf, firstStepOf, stepOf } from '@/lib/editor/entry'
import { litSlots } from '@/lib/editor/modes/toggles'
import { nextStep, settingsOf } from '@/lib/editor/steps'

const kinds = (shape: CubeShape) => entryOf(shape).steps.map((s) => s.kind)

describe('an entry, as its model declares it', () => {
  it('lists each puzzle its steps, the paint after them', () => {
    expect(kinds('3')).toEqual([])
    expect(kinds('stripe')).toEqual(['joints'])
    expect(kinds('fused')).toEqual([])
    expect(kinds('fashion')).toEqual(['cuts'])
    expect(kinds('roadblock')).toEqual(['toggles'])
    expect(kinds('224')).toEqual(['form'])
    expect(kinds('purple')).toEqual(['canvas'])
    expect((['gearCube', 'gearU', 'gearX'] as const).map(kinds)).toEqual([
      ['toggles'],
      ['toggles'],
      ['toggles'],
    ])
    expect(nextStep('roadblock', 'toggles')).toBe('paint')
  })

  it('starts with its first step, unless offered later only (the Camouflage)', () => {
    expect(firstStepOf('purple')).toBe('canvas')
    expect(firstStepOf('camo')).toBe('paint')
    expect(firstStepOf('3')).toBe('paint')
  })

  it('paints its colors, or puts its pieces, with toggles and parts of its own', () => {
    expect(entryOf('ghost').paint.by).toBe('pieces')
    expect(entryOf('twist').paint).toMatchObject({ by: 'pieces', toggles: { name: 'centers' } })
    expect(entryOf('gearU').paint.parts).toBeDefined()
    expect(entryOf('gearCube').paint.parts).toBeUndefined()
  })

  it('lights up what a click turns: a face of bars, a slice of gears, one Extreme gear', () => {
    const lit = (shape: CubeShape, hovered: string) =>
      litSlots(
        stepOf(shape, 'toggles')!.toggles,
        slotsFor(shape).map((s) => ({ ...s, stickers: s.stickers.length })),
        hovered,
      )
    // The front face's nine centers (x and y within the face, z at its edge).
    const front = lit('roadblock', '1,0,2')
    expect(front).toHaveLength(9)
    expect(front.every((k) => k.endsWith(',2'))).toBe(true)
    expect(lit('gearU', '1,1,0')).toHaveLength(4)
    expect(lit('gearX', '1,1,0')).toEqual(['1,1,0'])
  })

  it('reads its settings from a state: bars turned, gears pivoted', () => {
    expect(settingsOf(applyMoves(solvedCube('roadblock'), parseMoves('R'))).toggles).toEqual({
      '2,0,0': 1,
    })
    const spun = settingsOf(applyMoves(solvedCube('gearU'), [{ gear: 'R', amount: 1 }]))
    expect(Object.keys(spun.toggles)).toHaveLength(4)
  })
})
