import { create } from 'zustand'
import { cubeShape } from '@/lib/core/cube'
import { parseRoute, routeHash, sameKind } from '@/lib/app/route'
import type { CubeKind } from '@/lib/core/shapes'
import { useI18n } from '@/i18n/i18nStore'
import { selectBusy, useCube } from './cubeStore'
import { useEditor } from './editorStore'

/**
 * The hash router: the address (`#/fr/floppy-ghost`, see lib/app/route.ts) says
 * which language and puzzle the app shows, or the home page when it names
 * no puzzle (`#/fr`). Choosing either one goes there (`goTo`), and the
 * stores follow the address, so a link opens that puzzle and the browser's
 * back button returns to the previous one.
 */

interface RouteState {
  /** The home page: no puzzle chosen yet, its gallery instead of the scene. */
  home: boolean
}

export const useRoute = create<RouteState>(() => ({ home: false }))

const currentKind = (): CubeKind => {
  const { cube, variant } = useCube.getState()
  return { shape: cubeShape(cube), variant }
}

/** The address of what the app shows. */
const shownHash = () =>
  routeHash(useI18n.getState().locale, useRoute.getState().home ? undefined : currentKind())

/** Bring the stores in line with the address, then the address in line with
 *  them: an unknown language keeps the one shown (without a new history
 *  entry). Neither the puzzle nor the page change under a turn or an entry
 *  under way. */
export function followRoute(): void {
  const { locale, kind } = parseRoute(window.location.hash)
  const i18n = useI18n.getState()
  if (locale && locale !== i18n.locale) i18n.setLocale(locale)
  const cube = useCube.getState()
  const idle = !selectBusy(cube) && useEditor.getState().mode === 'play'
  if (idle) {
    if (kind && !sameKind(kind, currentKind())) {
      cube.setShape(kind.shape)
      cube.setVariant(kind.variant)
    }
    useRoute.setState({ home: !kind })
  }
  const hash = shownHash()
  if (window.location.hash !== hash) window.history.replaceState(null, '', hash)
}

/** Go to another language, a puzzle, or the home page (`kind: null`), as a
 *  new history entry; what is not named stays as shown. */
export function goTo(route: { locale?: 'fr' | 'en'; kind?: CubeKind | null }): void {
  const home = useRoute.getState().home
  const kind = route.kind === null ? undefined : (route.kind ?? (home ? undefined : currentKind()))
  const hash = routeHash(route.locale ?? useI18n.getState().locale, kind)
  if (window.location.hash !== hash) window.history.pushState(null, '', hash)
  followRoute()
}

/** Follow the address from now on: the first one, then each the browser
 *  goes to (back, forward, a link). */
export function startRouter(): void {
  followRoute()
  window.addEventListener('popstate', followRoute)
  window.addEventListener('hashchange', followRoute)
}
