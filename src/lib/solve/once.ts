/** Lazily built, once: the tables a method only needs when it solves. */
export function once<T>(build: () => T): () => T {
  let value: T | undefined
  return () => (value ??= build())
}
