import { it } from 'vitest'
import { readFileSync } from 'node:fs'
import { faceColorsOf, solvedCube } from '@/lib/core/cube'
import { AXIS_ROTATIONS, cross, dot, FACE_NORMAL } from '@/lib/core/geometry'
import { formatMoves, NOTATION_US } from '@/lib/core/notation'
import type { Color, Cube, Face, Vec3 } from '@/lib/core/types'
import { cheapestAssignment } from '@/lib/editor/scan/assign'
import { validateCube } from '@/lib/editor/validate'
import { methodsFor } from '@/lib/solve/solver'

const out = (s: string) => (globalThis as unknown as { process: { stdout: { write: (s: string) => void } } }).process.stdout.write(s)
const BETA = Number((globalThis as unknown as { process: { env: Record<string, string> } }).process.env.BETA ?? '0.06')
const rebeta = (v: number | null) => (v === null ? null : ((v - 0.12) / 0.88) * (1 - 2 * BETA) + 2 * BETA)
const RAW: Record<string, [number, number, number | null, number | null][]> = JSON.parse(
  readFileSync('/tmp/claude-1000/-home-julien-Documents-MyRepos-rubiksolver/bb597f94-de9a-4fdc-adcf-582ee6326aec/scratchpad/mirror2/dims.json', 'utf8'),
)
const DIMS = Object.fromEntries(Object.entries(RAW).map(([f, rows]) => [f, rows.map(([r, k, a, b]) => [r, k, rebeta(a), rebeta(b)] as [number, number, number | null, number | null])]))
// The faces as photographed, in the scan's order.
let MIRROR = false
let ORDER: [Face, Face][] = [['F', 'U'], ['R', 'U'], ['B', 'U'], ['L', 'U'], ['U', 'R'], ['D', 'R']]
// The real layers, by axis pair: thin, thick.
// measured on the real cube: 0.8 / 1.2 / 1.6 / 2.0 / 2.4 / 2.8 cm, the middle 1.8
const PAIRS: [number, number][] = [[0.8 / 1.8, 2.8 / 1.8], [1.2 / 1.8, 2.4 / 1.8], [1.6 / 1.8, 2.0 / 1.8]]
const SOLVED = solvedCube('3')
const COLORS = faceColorsOf('3')
const faceOf = (c: Color) => (Object.keys(COLORS) as Face[]).find((f) => COLORS[f] === c)!
const axis = (v: Vec3) => v.findIndex((x) => x !== 0)
const PERMS = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]]

for (const mirror of [false, true]) for (const sides of [['R', 'B', 'L'], ['L', 'B', 'R']] as Face[][]) for (const upU of ['R', 'L'] as Face[]) for (const upD of ['R', 'L'] as Face[]) it(`reads the mirror cube, mirror ${mirror}, sides ${sides}, U up ${upU}, D up ${upD}`, () => {
  MIRROR = mirror
  ORDER = [['F', 'U'], [sides[0]!, 'U'], [sides[1]!, 'U'], [sides[2]!, 'U'], ['U', upU], ['D', upD]]
  // each measured dimension: the position, the axis, the value
  const measured: { p: Vec3; ax: number; v: number }[] = []
  ORDER.forEach(([front, up], f) => {
    const n = FACE_NORMAL[front], u = FACE_NORMAL[up], r = MIRROR ? cross(n, u) : cross(u, n)
    for (const [rr, k, a, b] of DIMS[String(f + 1)] ?? []) {
      const p = [0, 1, 2].map((i) => n[i]! + u[i]! * -rr + r[i]! * k) as unknown as Vec3
      if (a !== null) measured.push({ p, ax: axis(r), v: a })
      if (b !== null) measured.push({ p, ax: axis(u), v: b })
    }
  })
  const pieces = SOLVED.map((c, i) => ({ c, i })).filter(({ c }) => c.stickers.length >= 2)
  const results: string[] = []
  for (const perm of [PERMS[0]!]) for (let flips = 0; flips < 2; flips++) {
    // a color's real layer: its face's axis's pair, its side thin or thick
    const real = (color: Color) => {
      const nrm = FACE_NORMAL[faceOf(color)], ax = axis(nrm), side = nrm[ax]! > 0 ? 1 : 0
      const pair = PAIRS[perm[ax]!]!
      return pair[(flips >> ax) & 1 ? 1 - side : side]!
    }
    const placements = pieces.map(({ c }) => pieces.map(({ c: slot }) =>
      AXIS_ROTATIONS.filter((R) => R(c.position).join() === slot.position.join()).map((R) => {
        const stickers = c.stickers.map((s) => ({ ...s, normal: R(s.normal) }))
        const along = (ax: number) => { const s = stickers.find((x) => x.normal[ax] !== 0); return s ? real(s.color) : 1 }
        const cost = measured.filter((m) => m.p.join() === slot.position.join()).reduce((t, m) => t + Math.abs(m.v - along(m.ax)), 0)
        return { stickers, cost }
      }).sort((a, b) => a.cost - b.cost)[0]))
    const cost = placements.map((row) => row.map((pl) => pl?.cost ?? 1e6))
    const pick = cheapestAssignment(cost)
    const total = pick.reduce((t, j, i) => t + cost[i]![j]!, 0)
    const state: Cube = SOLVED.map((c) => ({ ...c }))
    pick.forEach((j, i) => {
      state[pieces[i]!.i] = { position: pieces[j]!.c.position, stickers: placements[i]![j]!.stickers }
    })
    // the cheapest repair that makes it a cube: one piece turned in place, or two swapped
    const optionsOf = (i: number, j: number) => {
      const c = pieces[i]!.c, slot = pieces[j]!.c
      return AXIS_ROTATIONS.filter((R) => R(c.position).join() === slot.position.join()).map((R) => {
        const stickers = c.stickers.map((s) => ({ ...s, normal: R(s.normal) }))
        const along = (ax: number) => { const s = stickers.find((x) => x.normal[ax] !== 0); return s ? real(s.color) : 1 }
        return { stickers, cost: measured.filter((m) => m.p.join() === slot.position.join()).reduce((t, m) => t + Math.abs(m.v - along(m.ax)), 0) }
      })
    }
    const tries: { extra: number; what: string; build: () => Cube }[] = []
    pick.forEach((j, i) => {
      for (const o of optionsOf(i, j)) {
        if (o.stickers === placements[i]![j]!.stickers || o.cost === placements[i]![j]!.cost && JSON.stringify(o.stickers) === JSON.stringify(placements[i]![j]!.stickers)) continue
        tries.push({ extra: o.cost - cost[i]![j]!, what: `turn piece ${i} at ${pieces[j]!.c.position}`, build: () => { const st = state.map((c) => ({ ...c })); st[pieces[i]!.i] = { position: pieces[j]!.c.position, stickers: o.stickers }; return st } })
      }
    })
    pick.forEach((j, i) => pick.forEach((j2, i2) => {
      if (i2 <= i || pieces[i]!.c.stickers.length !== pieces[i2]!.c.stickers.length) return
      const a = optionsOf(i, j2), b = optionsOf(i2, j)
      for (const oa of a) for (const ob of b) tries.push({ extra: oa.cost + ob.cost - cost[i]![j]! - cost[i2]![j2]!, what: `swap pieces ${i} and ${i2}`, build: () => { const st = state.map((c) => ({ ...c })); st[pieces[i]!.i] = { position: pieces[j2]!.c.position, stickers: oa.stickers }; st[pieces[i2]!.i] = { position: pieces[j]!.c.position, stickers: ob.stickers }; return st } })
    }))
    tries.sort((x, y) => x.extra - y.extra)
    let repaired: { extra: number; what: string; st: Cube } | undefined
    for (const t of tries.slice(0, 60)) { const st = t.build(); if (validateCube(st).ok) { repaired = { extra: t.extra, what: t.what, st }; break } }
    if (repaired) {
      out(`\nREPAIR +${repaired.extra.toFixed(2)} (${repaired.what}) -> total ${(total + repaired.extra).toFixed(2)}`)
      const pieceNames = (i: number) => pieces[i]!.c.stickers.map((x) => x.color).join('')
      out(`\nSWAPPED ${repaired.what}`)
      const sols = tries.slice(0, 60).filter((t) => validateCube(t.build()).ok).slice(0, 3).map((t) => {
        const st = t.build()
        const best = methodsFor('3').map((m) => { try { return { id: m.id, moves: m.solve(st).flatMap((x) => x.moves) } } catch { return null } }).filter(Boolean).sort((a, b) => a!.moves.length - b!.moves.length)[0]!
        return `+${t.extra.toFixed(2)} ${t.what} [${best.id}, ${best.moves.length} coups]: ${formatMoves(best.moves as never, NOTATION_US)}`
      })
      void pieceNames
      out('\nCAND ' + sols.join('\nCAND '))

    }
    const valid = validateCube(state)
    results.push(`${total.toFixed(2)} ${valid.ok ? 'VALID' : 'invalid ' + JSON.stringify(valid).slice(0, 120)} perm ${perm} flips ${flips}`)
    if (valid.ok && !results.some((r) => r.startsWith('SOLUTION'))) {
      const steps = methodsFor('3')[0]!.solve(state)
      results.push('SOLUTION ' + formatMoves(steps.flatMap((s) => s.moves) as never, NOTATION_US))
    }
  }
  results.sort()
  out(`\nT beta ${BETA} ${MIRROR ? 'mirror' : 'plain'} ${ORDER[1]![0]}${ORDER[2]![0]}${ORDER[3]![0]} U:${ORDER[4]![1]} D:${ORDER[5]![1]} ` + results.map((r) => r.slice(0, 70)).join(' | '))
}, 120000)
