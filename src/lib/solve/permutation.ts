/**
 * Whether a permutation is odd (an odd number of swaps), given as where each
 * element goes: a list (each index to its image) or a map (each slot to the
 * one its piece goes to). Each cycle of length n is n - 1 swaps.
 */
export function permutationIsOdd<K>(images: readonly number[] | ReadonlyMap<K, K>): boolean {
  const next: ReadonlyMap<unknown, unknown> =
    'get' in images ? images : new Map(images.map((image, i) => [i, image]))
  const seen = new Set<unknown>()
  let odd = false
  for (const start of next.keys()) {
    for (let at = start; !seen.has(at); at = next.get(at)) {
      seen.add(at)
      if (at !== start) odd = !odd
    }
  }
  return odd
}
