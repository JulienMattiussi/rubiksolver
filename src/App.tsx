import { useEffect } from 'react'
import { Controls } from './components/controls/Controls'
import { useI18n } from './i18n/i18nStore'
import { useEditor } from './store/editorStore'
import { Scene } from './three/Scene'

export default function App() {
  const locale = useI18n((s) => s.locale)
  const editing = useEditor((s) => s.mode === 'edit')
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return (
    <main className="relative h-full w-full overflow-hidden">
      {/* In edit mode on mobile the 3D cube is stacked ABOVE the panel (top
          area only) so the whole cube stays visible while painting; on desktop
          it fills the screen and the panel floats over it. */}
      <div
        className={
          editing ? 'absolute inset-x-0 top-0 bottom-[48vh] sm:inset-0' : 'absolute inset-0'
        }
      >
        <Scene />
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-end justify-center p-3 sm:items-start sm:justify-end sm:p-5">
        <div
          className={`pointer-events-auto w-full max-w-sm overflow-auto sm:w-auto ${
            editing ? 'max-h-[48vh] sm:max-h-full' : 'max-h-full'
          }`}
        >
          <Controls />
        </div>
      </div>
    </main>
  )
}
