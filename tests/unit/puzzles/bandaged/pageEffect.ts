import { solvedCube } from '@/lib/core/cube'
import { applyMoves, turnAllowed } from '@/lib/core/turn'
import type { Move, Vec3 } from '@/lib/core/types'
import type { CubeShape } from '@/lib/core/shapes'

/** fan2cube's names of the faces: H B A P G D = U D F B L R. */
const LETTER: Record<string, string> = {
  '0,1,0': 'H',
  '0,-1,0': 'B',
  '0,0,1': 'A',
  '0,0,-1': 'P',
  '-1,0,0': 'G',
  '1,0,0': 'D',
}
const ORDER = 'HBAPGD'

/** A slot's name, its faces in the order H B A P G D: (HAD) for the page's
 *  (HDA). */
const nameOf = (p: Vec3) =>
  p
    .flatMap((v, a) => {
      const unit = [0, 0, 0]
      unit[a] = v
      return v ? [LETTER[unit.join()]!] : []
    })
    .sort((x, y) => ORDER.indexOf(x) - ORDER.indexOf(y))
    .join('')

/**
 * What a formula does to a bandaged puzzle's corners and edges, from
 * solved or from its START (`start`, played from solved first), as the
 * page writes it: (HA)->(HD) for a piece moved, (HAD)° for one turned in
 * place. Throws when a turn is jammed on the way.
 */
export function effect(
  shape: CubeShape,
  moves: readonly Move[],
  start: readonly Move[] = [],
): string[] {
  const solved = applyMoves(solvedCube(shape), start)
  let state = solved
  for (const move of moves) {
    if (!turnAllowed(state, move)) throw new Error(`jammed: ${move.face}`)
    state = applyMoves(state, [move])
  }
  return state
    .flatMap((c, i) => {
      const home = solved[i]!
      const colored = c.stickers.filter((s) => s.color !== 'H')
      if (colored.length < 2) return []
      if (c.position.join() !== home.position.join()) {
        return [`(${nameOf(home.position)})->(${nameOf(c.position)})`]
      }
      const turned = colored.some((s, k) => s.normal.join() !== home.stickers[k]!.normal.join())
      return turned ? [`(${nameOf(home.position)})°`] : []
    })
    .sort()
}
