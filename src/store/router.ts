import { create } from 'zustand'
import { cubeShape } from '@/lib/core/cube'
import { parseRoute, routePath, sameKind } from '@/lib/app/route'
import type { CubeKind } from '@/lib/core/shapes'
import { useI18n } from '@/i18n/i18nStore'
import { selectBusy, useCube } from './cubeStore'
import { useEditor } from './editorStore'

/**
 * The router: the address (`/fr/floppy-ghost`, see lib/app/route.ts) says
 * which language and puzzle the app shows, or the home page when it names
 * no puzzle (`/fr`). Choosing either one goes there (`goTo`), and the
 * stores follow the address, so a link opens that puzzle and the browser's
 * back button returns to the previous one. An old link's hash
 * (`#/fr/floppy-ghost`) is read the same, then replaced by the path.
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
const shownPath = () =>
  routePath(useI18n.getState().locale, useRoute.getState().home ? undefined : currentKind())

/** Bring the stores in line with the address, then the address in line with
 *  them: an unknown language keeps the one shown (without a new history
 *  entry). Neither the puzzle nor the page change under a turn or an entry
 *  under way. */
export function followRoute(): void {
  const { hash, pathname, search } = window.location
  const { locale, kind } = parseRoute(hash.startsWith('#/') ? hash : pathname)
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
  const path = shownPath()
  if (pathname !== path || hash) window.history.replaceState(null, '', path + search)
}

/** Go to another language, a puzzle, or the home page (`kind: null`), as a
 *  new history entry; what is not named stays as shown. */
export function goTo(route: { locale?: 'fr' | 'en'; kind?: CubeKind | null }): void {
  const home = useRoute.getState().home
  const kind = route.kind === null ? undefined : (route.kind ?? (home ? undefined : currentKind()))
  const path = routePath(route.locale ?? useI18n.getState().locale, kind)
  if (window.location.pathname !== path) window.history.pushState(null, '', path)
  followRoute()
}

/** Follow the address from now on: the first one, then each the browser
 *  goes to (back, forward, an old link's hash). */
export function startRouter(): void {
  followRoute()
  window.addEventListener('popstate', followRoute)
  window.addEventListener('hashchange', followRoute)
}
