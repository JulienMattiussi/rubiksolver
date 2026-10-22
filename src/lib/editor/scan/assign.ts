/**
 * The cheapest one-to-one assignment of rows to columns of a square cost
 * matrix (the Hungarian method, in O(n^3)): which piece goes where, given
 * what each would cost there.
 */
export function cheapestAssignment(cost: readonly (readonly number[])[]): number[] {
  const n = cost.length
  // 1-based potentials and matching, column 0 standing for "none yet".
  const u = new Array<number>(n + 1).fill(0)
  const v = new Array<number>(n + 1).fill(0)
  const rowOf = new Array<number>(n + 1).fill(0)
  const way = new Array<number>(n + 1).fill(0)
  for (let i = 1; i <= n; i++) {
    rowOf[0] = i
    let j0 = 0
    const minv = new Array<number>(n + 1).fill(Infinity)
    const used = new Array<boolean>(n + 1).fill(false)
    do {
      used[j0] = true
      const i0 = rowOf[j0]!
      let delta = Infinity
      let j1 = 0
      for (let j = 1; j <= n; j++) {
        if (used[j]) continue
        const cur = cost[i0 - 1]![j - 1]! - u[i0]! - v[j]!
        if (cur < minv[j]!) {
          minv[j] = cur
          way[j] = j0
        }
        if (minv[j]! < delta) {
          delta = minv[j]!
          j1 = j
        }
      }
      for (let j = 0; j <= n; j++) {
        if (used[j]) {
          u[rowOf[j]!]! += delta
          v[j]! -= delta
        } else minv[j]! -= delta
      }
      // A cost that is no number would never settle: none taken.
      if (!Number.isFinite(delta)) throw new Error('cheapestAssignment: costs must be numbers')
      j0 = j1
    } while (rowOf[j0] !== 0)
    do {
      const j1 = way[j0]!
      rowOf[j0] = rowOf[j1]!
      j0 = j1
    } while (j0)
  }
  const out = new Array<number>(n).fill(-1)
  for (let j = 1; j <= n; j++) out[rowOf[j]! - 1] = j - 1
  return out
}
