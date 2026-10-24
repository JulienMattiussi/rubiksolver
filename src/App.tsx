import { useEffect, useRef } from 'react'
import { useHeight } from '@/hooks/useHeight'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { usePanelFold } from '@/hooks/usePanelFold'
import { Controls } from '@/components/controls/Controls'
import { TopBar } from '@/components/controls/TopBar'
import { useI18n } from '@/i18n/i18nStore'
import { cubeShape } from '@/lib/core/cube'
import { SHAPE_LABEL } from '@/lib/core/shapes'
import { useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { useRoute } from '@/store/router'
import { HomeGallery } from '@/components/home/HomeGallery'
import { Fireworks } from '@/components/celebration/Fireworks'
import { StageCheer } from '@/components/celebration/StageCheer'
import { Scene } from '@/three/core/Scene'
import { FaceArrows } from '@/components/edit/FaceArrows'
import { usePreloadStickers } from '@/hooks/usePreloadStickers'

/** A phone's folded panel, its height while it goes down (px, measured
 *  once folded), and the margin below it (p-3). */
const FOLDED_BAR = 152
const PANEL_MARGIN = 12

export default function App() {
  const locale = useI18n((s) => s.locale)
  const editing = useEditor((s) => s.mode === 'edit')
  const home = useRoute((s) => s.home)
  const t = useI18n((s) => s.t)
  const shape = useCube((s) => cubeShape(s.cube))
  const variant = useCube((s) => s.variant)
  // A mirror cube that scans: OpenCV loaded ahead, the page once idle.
  usePreloadStickers(shape, variant)
  // On a phone, the puzzle is framed in the space above the panel (Scene's
  // `covered`): open, the top fifth of the screen; folded, all above its
  // bar; going down, the bar's height already, so the puzzle grows as the
  // panel goes.
  const panel = useRef<HTMLDivElement>(null)
  const panelHeight = useHeight(panel)
  const desktop = useIsDesktop()
  const fold = usePanelFold()
  const phone = !desktop && !editing && !home
  const open = phone && !fold.folded
  const covered = !phone
    ? 0
    : (fold.closing || panelHeight === 0 ? FOLDED_BAR : panelHeight) + PANEL_MARGIN
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
        {home ? <HomeGallery /> : <Scene covered={covered} />}
        <FaceArrows />
        {/* A tutorial stage done: a cheer in front of the puzzle. */}
        <StageCheer />
      </div>
      {/* On desktop the wrapper spans the whole screen and lets clicks through
          to the scene: the panel cards opt back in (see Controls). */}
      <div className="pointer-events-none absolute inset-0 flex items-end justify-center p-3 sm:p-5">
        <div
          ref={panel}
          className={`pointer-events-auto flex w-full max-w-sm flex-col sm:pointer-events-none sm:block sm:h-full sm:max-w-none ${
            editing || home
              ? 'max-h-[48vh] sm:max-h-full'
              : open
                ? 'max-h-[80vh] sm:max-h-full'
                : 'max-h-full'
          }`}
        >
          <Controls />
        </div>
      </div>
      <TopBar />
      {/* A turn that solves the puzzle sets off a little show. */}
      <Fireworks />
    </main>
  )
}
