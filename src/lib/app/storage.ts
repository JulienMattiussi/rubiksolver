/**
 * Values kept in the browser between visits (localStorage, as JSON). Storage
 * may be missing, blocked or hold anything: a read that fails, or finds a
 * value `valid` refuses, gives `fallback`; a write that fails is dropped (the
 * value still lives for the session).
 */

export function readStored<T>(key: string, valid: (value: unknown) => value is T, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    const value: unknown = raw === null ? undefined : JSON.parse(raw)
    return valid(value) ? value : fallback
  } catch {
    return fallback
  }
}

export function writeStored(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage unavailable: kept for this session only.
  }
}
