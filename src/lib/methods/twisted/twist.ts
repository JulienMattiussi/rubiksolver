import { isSolved, solvedCube } from '../../core/cube'
import { allTurnsOf } from '../../core/moveSet'
import { buildSteps, type MethodPlan } from '../../solve/solverKit'
import { applyMoves } from '../../core/turn'
import type { Cube, Face, Move, Turn } from '../../core/types'
import { BEGINNER_PLAN } from '../standard/layers3'

/**
 * The Z-Twist (twist.ts) solved as a 3x3: a 3x3 method on its colors (the
 * side centers' quarter turns set aside), then a last step turning back the
 * side centers that stand a quarter turn off.
 *
 * That last step uses sequences that leave every piece in place: a fixed
 * mix of turns, then a 3x3 solve of its colors. Each turns some side
 * centers over (the face's quarter turns in it, an odd number or not); put
 * together, they turn over any set of them (worked out once, over GF(2)).
 */

const SOLVED = solvedCube('twist')

/** The puzzle as a 3x3: its side centers' quarter turns set aside. */
const asCube = (cube: Cube): Cube =>
  cube.map((c) => (c.spin === undefined ? c : { position: c.position, stickers: c.stickers }))

/** The side centers, in a fixed order: which stand a quarter turn off. */
const sides = SOLVED.flatMap((c, i) => (c.spin === undefined ? [] : [i]))
const offOf = (cube: Cube): number[] => sides.map((i) => cube[i]!.spin ?? 0)

/** A sequence leaving every piece home, and the side centers it turns over. */
interface Turner {
  readonly moves: Turn[]
  readonly flips: number[]
}

let turners: Turner[] | undefined

/** A fixed mix of face turns (the same every time: a small linear
 *  congruential generator). */
function mix(seed: number, length: number): Move[] {
  const faces: Face[] = ['F', 'R', 'B', 'L', 'U', 'D']
  let x = seed
  return Array.from({ length }, () => {
    x = (x * 1103515245 + 12345) % 2147483648
    return { face: faces[x % 6]!, amount: ((x >> 8) % 3) + 1 } as Move
  })
}

/** Sequences that each turn over some side centers, until any set can be
 *  reached: a fixed mix, then the beginner's solve of its colors. */
function centerTurners(): Turner[] {
  if (turners) return turners
  const found: Turner[] = []
  for (let seed = 1; seed < 64 && !reachesAll(found); seed++) {
    const mixed = mix(seed, 12)
    const turned = applyMoves(SOLVED, mixed)
    const back = buildSteps(asCube(turned), BEGINNER_PLAN).flatMap((s) => [...s.moves])
    const moves = [...mixed, ...back]
    const flips = offOf(applyMoves(SOLVED, moves))
    if (flips.some((f) => f) && !reaches(found, flips)) found.push({ moves, flips })
  }
  return (turners = found)
}

/** Whether some of `found` add up to `target` (mod 2). */
const reaches = (found: readonly Turner[], target: readonly number[]) =>
  subsetFor(found, target) !== null

/** Whether every set of side centers can be reached. */
const reachesAll = (found: readonly Turner[]) =>
  sides.every((_, i) =>
    reaches(
      found,
      sides.map((__, j) => (i === j ? 1 : 0)),
    ),
  )

/** The turners (by index) whose flips add up to `target`, or null. */
function subsetFor(all: readonly Turner[], target: readonly number[]): number[] | null {
  for (let mask = 0; mask < 1 << all.length; mask++) {
    const sum = target.map(() => 0)
    all.forEach((t, k) => {
      if (mask & (1 << k)) t.flips.forEach((f, i) => (sum[i]! ^= f))
    })
    if (sum.every((x, i) => x === target[i])) {
      return all.flatMap((_, k) => (mask & (1 << k) ? [k] : []))
    }
  }
  return null
}

/** The turners whose flips add up (mod 2) to `target`, played in a row. */
function combine(target: readonly number[]): Turn[] | null {
  const all = centerTurners()
  const subset = subsetFor(all, target)
  return subset && subset.flatMap((k) => all[k]!.moves)
}

/** A 3x3 plan, played on the Z-Twist: on its colors, then its centers. */
export function twistPlan(plan: MethodPlan): MethodPlan {
  return [
    ...plan.map((spec) => ({
      ...spec,
      goal: (cube: Cube) => spec.goal(asCube(cube)),
      phases: spec.phases.map((phase) => (cube: Cube) => phase(asCube(cube))),
    })),
    {
      key: 'stepTwistCenters',
      goal: isSolved,
      moves: allTurnsOf('twist'),
      phases: [
        (cube) => {
          const moves = combine(offOf(cube))
          if (!moves) throw new Error('twist: these side centers cannot be turned back')
          return moves
        },
      ],
    },
  ]
}
