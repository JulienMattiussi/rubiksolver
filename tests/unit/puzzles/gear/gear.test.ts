import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube, stateKey } from '@/lib/core/cube'
import { buildCube, cubeToEdit, emptyEdit, withFixedHome } from '@/lib/editor/editor'
import { tablesFor } from '@/lib/editor/editorTables'
import { applyGearMove, GEAR_TURNS, parseGearFormula } from '@/lib/puzzles/gear/gear'
import { applyMoves } from '@/lib/core/turn'
import {
  completeGears,
  gearColorsOf,
  gearFaces,
  gearsPainted,
  nextSpin,
  paintGear,
  spinsOf,
  turnedOf,
} from '@/lib/editor/gearEditor'
import type { Cube, Face, GearMove } from '@/lib/core/types'
import { validateCube } from '@/lib/editor/validate'
import { GEAR_SLOTS, twists } from '@/lib/methods/gear/gearExtreme'
import { spinEffect, spinsHome } from '@/lib/methods/gear/spinSearch'
import { seededRng, twistedCorner } from '../../../helpers'

const SOLVED = solvedCube('gearU')

/** A state however its pieces and their stickers are listed. */
const look = (cube: Cube) =>
  cube
    .map(
      (c) =>
        `${c.position.join()}:${c.stickers
          .map((s) => s.normal.join() + s.color)
          .sort()
          .join()}@${c.spin}`,
    )
    .sort()

/** fan2cube's letters in the cube's (D = R, A = F, G = L...): each a half
 *  turn, so its D² is our R. */
const play = (moves: string): Cube =>
  moves
    .split(' ')
    .map((t): GearMove => ({ gear: t[0] as Face, amount: t.includes("'") ? 3 : 1 }))
    .reduce(applyGearMove, SOLVED)

/** What a sequence changed, piece by piece: moved, turned over, spun. */
function changes(cube: Cube) {
  return SOLVED.flatMap((c, i) => {
    const a = cube[i]!
    const moved = a.position.join() !== c.position.join()
    const turned = a.stickers.some((s, k) => s.normal.join() !== c.stickers[k]!.normal.join())
    return moved || turned || a.spin !== c.spin
      ? [{ at: c.position.join(), to: a.position.join(), turned, spin: a.spin }]
      : []
  })
}

describe('Gear Cube model', () => {
  it('turns a face half and the slice beside it a quarter, its gears five sixths', () => {
    const after = play('R')
    const slice = changes(after).filter((c) => c.at.startsWith('0,'))
    // The slice's centers and edges all moved a quarter; its 4 gears spun.
    expect(slice).toHaveLength(8)
    expect(slice.filter((c) => c.spin === 5)).toHaveLength(4)
    // The left face held.
    expect(changes(after).some((c) => c.at.startsWith('-1,'))).toBe(false)
  })

  it('pivots the 4 gears of a slice with D⁸, nothing else (fan2cube)', () => {
    const c = changes(play('R R R R'))
    expect(c.map((p) => p.at).sort()).toEqual(['0,-1,-1', '0,-1,1', '0,1,-1', '0,1,1'])
    // Four moves of five sixths: a third of a turn.
    expect(c.every((p) => p.to === p.at && !p.turned && p.spin === 2)).toBe(true)
  })

  it('swaps the clips of the 8 edges of the top and bottom with (A² D²)³ (fan2cube)', () => {
    const c = changes(play('F R F R F R'))
    expect(c).toHaveLength(8)
    // Each base turned over in place, its gear on it a half turn: the gear
    // back as it was, only its clips turned over (fan2cube's "agrafes").
    expect(c.every((p) => p.to === p.at && p.turned && p.spin === 3)).toBe(true)
    expect(c.every((p) => p.at.split(',')[1] !== '0')).toBe(true)
  })

  it('turns the whole cube over with G’² D², no piece out of place (fan2cube)', () => {
    const after = play("L' R")
    // A half turn about the left-right axis: every piece where its mirror was.
    expect(
      SOLVED.every((c, i) => {
        const [x, y, z] = c.position
        return after[i]!.position.join() === [x, -y, -z].join() && (after[i]!.spin ?? 0) === 0
      }),
    ).toBe(true)
  })

  it('comes back after twelve turns of a face (four full turns of its gears)', () => {
    const twelve = Array.from({ length: 12 }, () => 'R').join(' ')
    expect(changes(play(twelve))).toEqual([])
  })

  it('rejects an entered state it cannot reach: a corner twisted, an edge turned over', () => {
    // Its solving says where: here, the corners.
    expect(validateCube(twistedCorner('gearU'))).toEqual({
      ok: false,
      error: 'impossible',
      step: 'stepGearCorners',
    })
    const edge = SOLVED.findIndex((c) => c.spin !== undefined)
    const flipped = SOLVED.map((c, i) =>
      i === edge
        ? { ...c, stickers: c.stickers.map((s, k) => ({ ...s, color: c.stickers[1 - k]!.color })) }
        : c,
    )
    expect(validateCube(flipped).ok).toBe(false)
  })
})

describe('Gear Cube entry', () => {
  const slot = tablesFor('gearU').slots.find((s) => s.kind === 'edge')!
  const [a, b] = slot.stickers as [(typeof slot.stickers)[0], (typeof slot.stickers)[0]]
  const clips = { [a.id]: a.solvedColor, [b.id]: b.solvedColor }

  it('counts the gear faces left in each color: four per face', () => {
    const { remaining, painted, total } = gearFaces({}, 'gearU')
    expect([painted, total]).toEqual([0, 24])
    expect(Object.values(remaining).every((n) => n === 4)).toBe(true)
  })

  it('pre-fills the centers: the slices only ever turn them all together', () => {
    const centers = tablesFor('gearU').slots.filter((s) => s.kind === 'center')
    expect(centers).toHaveLength(6)
    expect(centers.every((s) => !s.paintable)).toBe(true)
  })

  it('paints a gear apart from its clips, alone while they are not painted', () => {
    const gear = paintGear({}, emptyEdit('gearU'), 'gearU', slot.key, a.ni, b.solvedColor)
    expect(gear).toEqual({ [a.id]: b.solvedColor })
  })

  it('completes a gear from its clips, and refuses a color not theirs', () => {
    const edit = { ...emptyEdit('gearU'), ...clips }
    const turned = paintGear({}, edit, 'gearU', slot.key, a.ni, b.solvedColor)
    expect(turned).toEqual({ [a.id]: b.solvedColor, [b.id]: a.solvedColor })
    const other = SOLVED.flatMap((c) => c.stickers).find(
      (s) => s.color !== a.solvedColor && s.color !== b.solvedColor,
    )!.color
    expect(paintGear({}, edit, 'gearU', slot.key, a.ni, other)).toEqual({})
    // Painted before its clips, a gear's other face follows them.
    expect(completeGears({ [a.id]: a.solvedColor }, edit, 'gearU')).toEqual(clips)
  })

  it('tells the gears turned over on their clips, or a gear not theirs', () => {
    const cube = play('R R R')
    const edit = cubeToEdit(cube)
    const gear = gearColorsOf(cube)
    expect(gearsPainted(gear, 'gearU')).toEqual({ painted: 12, total: 12 })
    expect(turnedOf(gear, edit, 'gearU')).toHaveLength(4)
    expect(
      look(
        buildCube(edit, 'gearU', undefined, { turned: turnedOf(gear, edit, 'gearU')!, spins: {} }),
      ),
    ).toEqual(
      look(withFixedHome(cube)), // held as entered: its centers home
    )
    expect(turnedOf({ ...gear, [a.id]: 'V' }, edit, 'gearU')).toBeNull()
  })

  it("pivots a slice's four gears together, the Extreme's one at a time", () => {
    const slice = nextSpin({}, 'gearU', '1,1,0')
    expect(slice).toEqual({ '1,1,0': 1, '1,-1,0': 1, '-1,1,0': 1, '-1,-1,0': 1 })
    // Three clicks: a half turn, which looks the same: back to none.
    expect(nextSpin(nextSpin(slice, 'gearU', '-1,1,0'), 'gearU', '1,-1,0')).toEqual({})
    expect(nextSpin({}, 'gearX', '1,1,0')).toEqual({ '1,1,0': 1 })
  })

  it('is entered with its gears askew, their pivots read from its state', () => {
    // One move: its slice's gears five sixths round, showing two.
    const cube = play('R')
    const spins = spinsOf(cube)
    expect(Object.values(spins)).toEqual([2, 2, 2, 2])
    const edit = cubeToEdit(cube)
    const turned = turnedOf(gearColorsOf(cube), edit, 'gearU')!
    const built = buildCube(edit, 'gearU', undefined, { turned, spins })
    expect(look(built)).toEqual(look(withFixedHome(cube)))
    expect(validateCube(built)).toEqual({ ok: true })
  })
})

describe('plain Gear Cube', () => {
  const PLAIN = solvedCube('gearCube')
  const playPlain = (moves: string): Cube =>
    moves
      .split(' ')
      .map((t): GearMove => ({ gear: t[0] as Face, amount: t.includes("'") ? 3 : 1 }))
      .reduce(applyGearMove, PLAIN)

  it('shows nothing of (A² D²)³, which only turns clips over', () => {
    expect(isSolved(playPlain('F R F R F R'))).toBe(true)
  })

  it('reaches 4 x 41 472 positions, as Jaap counts (the 4: how it is held)', () => {
    const seen = new Set([stateKey(PLAIN)])
    let frontier = [PLAIN]
    while (frontier.length) {
      const next: Cube[] = []
      for (const cube of frontier) {
        for (const move of GEAR_TURNS) {
          const after = applyGearMove(cube, move)
          const key = stateKey(after)
          if (!seen.has(key)) {
            seen.add(key)
            next.push(after)
          }
        }
      }
      frontier = next
    }
    expect(seen.size).toBe(4 * 41472)
  }, 60000)
})

describe('Gear Cube Extreme (fan2cube.fr/gearultimate2)', () => {
  const X = solvedCube('gearX')
  const run = (formula: string) => applyMoves(X, parseGearFormula(formula))
  /** What a formula changed: each piece's colors, where it went, how. */
  const changed = (cube: Cube) =>
    X.flatMap((c, i) => {
      const a = cube[i]!
      const moved = a.position.join() !== c.position.join()
      const turned = a.stickers.some((s, k) => s.normal.join() !== c.stickers[k]!.normal.join())
      return moved || turned || a.spin !== c.spin
        ? [{ piece: c, to: a.position.join(), turned, spin: a.spin }]
        : []
    })
  const corners = (cube: Cube) => changed(cube).filter((c) => c.piece.stickers.length === 3)
  const held = (cube: Cube) =>
    changed(cube).every(
      (c) =>
        (c.piece.stickers.length !== 1 && c.piece.spin !== undefined) ||
        c.piece.stickers.length === 3,
    )

  it('turns its top and bottom a quarter, its sides by gears; its middle edges are no gears', () => {
    expect(X.filter((c) => c.spin !== undefined)).toHaveLength(8)
    expect(X.filter((c) => c.spin !== undefined).every((c) => c.position[1] !== 0)).toBe(true)
    const u = applyMoves(X, [{ face: 'U', amount: 1 }])
    expect(changed(u).every((c) => c.piece.position[1] === 1)).toBe(true)
  })

  it('lowers a corner, (HDA)->(BAD): (D²H)².(D²H²)², the equator and centers kept', () => {
    const cube = run('(D²H)(D²H).(D²H²)(D²H²)')
    expect(held(cube)).toBe(true)
    const lowered = corners(cube).find((c) => c.to === '1,-1,1')!
    expect(lowered.piece.position.join()).toBe('1,1,1')
    // The other bottom corners stay.
    expect(corners(cube).filter((c) => c.piece.position[1] === -1)).toHaveLength(1)
  })

  it('cycles three top corners and swaps two, nothing else of the corners', () => {
    const cycle = corners(run("D²BH'D'²H.D²B'D'²B.D²B'D'²"))
    expect(cycle).toHaveLength(3)
    expect(cycle.every((c) => c.piece.position[1] === 1 && c.to.split(',')[1] === '1')).toBe(true)
    const swap = corners(run("G²BH'G'²HG²B'G'²BG²B'G'².H"))
    expect(swap.map((c) => c.piece.position.join()).sort()).toEqual(['-1,1,1', '1,1,1'])
  })

  it('moves edges only with (BG²B’G’²)⁵ and the pair swap, their clips with D²(D²H)¹²D’²', () => {
    for (const formula of ["BG²B'G'²".repeat(5), "D²BD'².D4H²D4H².D²B'D'²"]) {
      expect(corners(run(formula))).toEqual([])
      expect(held(run(formula))).toBe(true)
    }
    // (HA,HD)(BA,BD): two top edges swapped, two bottom ones.
    const swapped = changed(run("D²BD'².D4H²D4H².D²B'D'²")).filter(
      (c) => c.to !== c.piece.position.join(),
    )
    expect(swapped).toHaveLength(4)
    // The clips: the bottom-back edge's turned over, its gear as it was (a
    // half turn on its clips), three top ones too.
    const clips = changed(run(`D²${'D²H'.repeat(12)}D'²`))
    expect(
      clips.filter((c) => c.turned && c.spin === 3 && c.piece.position[1] === -1),
    ).toHaveLength(1)
    expect(clips.every((c) => c.to === c.piece.position.join())).toBe(true)
  })

  it('turns the front bottom gear a third with (D²H)².D⁸.(H’D’²)², stirring three top ones', () => {
    const twisted = changed(run("D²HD²H.D8.H'D'²H'D'²"))
    expect(
      twisted.every((c) => !c.turned && c.spin === 2 && c.to === c.piece.position.join()),
    ).toBe(true)
    expect(twisted.map((c) => c.piece.position[1]).sort()).toEqual([-1, 1, 1, 1])
  })
})

describe('Gear Cube Extreme: its gears spun home on their spins alone', () => {
  const X = solvedCube('gearX')
  const rng = seededRng(7)
  const spun = () =>
    applyMoves(
      X,
      Array.from({ length: 6 }, () => [
        ...twists()[Math.floor(rng() * twists().length)]!.formula,
      ]).flat(),
    )

  it('has each twist only spin gears, by the same sixths whatever their spins', () => {
    expect(twists().length).toBeGreaterThan(0)
    const state = spun()
    for (const { effect, formula } of twists()) {
      expect(spinEffect(state, GEAR_SLOTS, formula)).toEqual(effect)
    }
  })

  it('spins every gear home with the fewest twists', () => {
    for (let k = 0; k < 3; k++) {
      const state = spun()
      const home = applyMoves(state, spinsHome(state, GEAR_SLOTS, twists()))
      expect(home.every((c) => !c.spin)).toBe(true)
    }
  })
})
