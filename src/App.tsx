import { useEffect } from 'react'
import { Controls } from '@/components/controls/Controls'
import { useI18n } from '@/i18n/i18nStore'
import { cubeShape } from '@/lib/core/cube'
import { SHAPE_LABEL } from '@/lib/core/types'
import { useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { useRoute } from '@/store/router'
import { HomeGallery } from '@/components/home/HomeGallery'
import { Fireworks } from '@/components/celebration/Fireworks'
import { StageCheer } from '@/components/celebration/StageCheer'
import { Scene } from '@/three/core/Scene'
import { FaceArrows } from '@/components/edit/FaceArrows'

export default function App() {
  const locale = useI18n((s) => s.locale)
  const editing = useEditor((s) => s.mode === 'edit')
  const home = useRoute((s) => s.home)
  const t = useI18n((s) => s.t)
  const shape = useCube((s) => cubeShape(s.cube))
  const variant = useCube((s) => s.variant)
  useEffect(() => {
    document.documentElement.lang = locale
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.metaDescription)
  }, [locale, t])
  // The page's title names the puzzle shown.
  useEffect(() => {
    document.title = home
      ? t.pageTitle
      : `Rubik Solver - ${t.cubeKind(SHAPE_LABEL[shape], variant)}`
  }, [home, t, shape, variant])

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
        <FaceArrows />
        {/* A tutorial stage done: a cheer in front of the puzzle. */}
        <StageCheer />
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
