import { useEffect } from 'react'
import { Controls } from '@/components/controls/Controls'
import { useI18n } from '@/i18n/i18nStore'
import { useEditor } from '@/store/editorStore'
import { useRoute } from '@/store/router'
import { HomeGallery } from '@/components/home/HomeGallery'
import { Fireworks } from '@/components/celebration/Fireworks'
import { Scene } from '@/three/Scene'

export default function App() {
  const locale = useI18n((s) => s.locale)
  const editing = useEditor((s) => s.mode === 'edit')
  const home = useRoute((s) => s.home)
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return (
    <main className="relative h-full w-full overflow-hidden">
      {/* In edit mode on mobile the 3D cube is stacked ABOVE the panel (top
          area only) so the whole cube stays visible while painting; on desktop
          it fills the screen and the panel floats over it. */}
      {/* The home page shows its gallery instead, above the panel on mobile. */}
      <div
        className={
          editing || home ? 'absolute inset-x-0 top-0 bottom-[48vh] sm:inset-0' : 'absolute inset-0'
        }
      >
        {home ? <HomeGallery /> : <Scene />}
      </div>
      {/* On desktop the wrapper spans the whole screen and lets clicks through
          to the scene: the panel cards opt back in (see Controls). */}
      <div className="pointer-events-none absolute inset-0 flex items-end justify-center p-3 sm:p-5">
        <div
          className={`pointer-events-auto w-full max-w-sm overflow-auto sm:pointer-events-none sm:h-full sm:max-w-none sm:overflow-visible ${
            editing || home ? 'max-h-[48vh] sm:max-h-full' : 'max-h-full'
          }`}
        >
          <Controls />
        </div>
      </div>
      {/* A turn that solves the puzzle sets off a little show. */}
      <Fireworks />
    </main>
  )
}
