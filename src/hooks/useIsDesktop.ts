import { useSyncExternalStore } from 'react'

/** Same breakpoint as Tailwind's `sm:` prefix. */
const QUERY = '(min-width: 640px)'

function subscribe(onChange: () => void) {
  const media = window.matchMedia?.(QUERY)
  media?.addEventListener('change', onChange)
  return () => media?.removeEventListener('change', onChange)
}

/** Whether the viewport is at least Tailwind's `sm` breakpoint (false where
 *  `matchMedia` is unavailable, e.g. jsdom). */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia?.(QUERY).matches ?? false)
}
