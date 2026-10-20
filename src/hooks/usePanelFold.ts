import { useRoute } from '@/store/router'
import { useView } from '@/store/viewStore'
import { useLagging } from './useLagging'

/** How long a phone's panel takes to go down, folding (the `fold`
 *  animation, index.css). */
const FOLD_MS = 300

/** A phone's panel fold as shown (none on the home page, which has no
 *  fold): `folded` once it has gone down, `closing` while it does (still
 *  open for the panel's content and the scene). */
export function usePanelFold(): { folded: boolean; closing: boolean } {
  const home = useRoute((s) => s.home)
  const asked = useView((s) => s.folded) && !home
  const folded = useLagging(asked, FOLD_MS)
  return { folded, closing: asked && !folded }
}
