import { describe, it } from 'vitest'
import { applyMoves, isBoxed, solvedCube, stateKey } from '@/lib/cube'
import { formatMoves, invertMove, movesFor } from '@/lib/moves'
import type { Cubie, Move } from '@/lib/types'

const SOLVED = solvedCube('224')
const ALL = movesFor('224')
const isMiddle = (c: Cubie) => c.stickers.length === 2
const tipped = (c: Cubie) => isMiddle(c) && c.stickers.some((s) => s.normal[1] !== 0)
/** Quarter turns of a short face: the ones that leave the box. */
const EXITS = ALL.filter((m) => m.amount !== 2 && !m.depth && m.face !== 'U' && m.face !== 'D')

describe('untipping sequences', () => {
  it('short round trips out of the box', () => {
    const found: Array<{ seq: Move[]; tipped: number; moved: number }> = []
    for (const a of EXITS) {
      for (const b of ALL) {
        for (const c of [null, ...ALL]) {
          const seq = c ? [a, b, c, invertMove(a)] : [a, b, invertMove(a)]
          const after = applyMoves(SOLVED, seq)
          if (!isBoxed(after)) continue
          const t = after.filter(tipped).length
          if (t === 0) continue
          const moved = after.filter((x, i) => x.position.join() !== SOLVED[i]!.position.join()).length
          found.push({ seq, tipped: t, moved })
        }
      }
    }
    found.sort((x, y) => x.moved - y.moved || x.seq.length - y.seq.length || x.tipped - y.tipped)
    console.log(`found ${found.length} round trips that tip pieces`)
    const seen = new Set<string>()
    for (const f of found.slice(0, 200)) {
      const k = `${f.moved}:${f.tipped}`
      if (seen.has(k)) continue
      seen.add(k)
      console.log(`  ${formatMoves(f.seq).padEnd(24)} tips ${f.tipped}, moves ${f.moved} pieces`)
    }
  }, 900000)
})
