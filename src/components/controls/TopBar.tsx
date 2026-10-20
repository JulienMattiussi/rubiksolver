import { useEditor } from '@/store/editorStore'
import { useRoute } from '@/store/router'
import { useView } from '@/store/viewStore'
import { AppTitle } from './AppTitle'
import { CollapseButton } from './CollapseButton'
import { LanguageToggle } from './LanguageToggle'

/** A phone's top bar, out of the panel: the title (its icon alone while
 *  the panel is open, leaving the puzzle the room), the language and the
 *  panel's fold. Not while entering a cube (the panel says so). */
export function TopBar() {
  const editing = useEditor((s) => s.mode === 'edit')
  const home = useRoute((s) => s.home)
  const folded = useView((s) => s.folded)
  const setFolded = useView((s) => s.setFolded)
  if (editing) return null
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 sm:hidden"
      // Over the scene: the puzzle stands between the screen's top and the
      // panel's.
      style={{ height: 56 }}
    >
      <div className="pointer-events-auto">
        <AppTitle named={home || folded} />
      </div>
      <div className="pointer-events-auto flex items-center gap-2">
        <LanguageToggle />
        {/* The home page has no fold. */}
        {!home && <CollapseButton collapsed={folded} onToggle={() => setFolded(!folded)} />}
      </div>
    </div>
  )
}
