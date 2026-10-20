import { useIsDesktop } from '@/hooks/useIsDesktop'
import { usePanelFold } from '@/hooks/usePanelFold'
import { useI18n } from '@/i18n/i18nStore'
import { selectBusy, selectSolved, useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { Button } from '@/components/ui/Button'
import { EditPanel } from '@/components/edit/EditPanel'
import { SolveArea } from '@/components/solve/SolveArea'
import { StopButton } from './StopButton'
import { Credit } from './Credit'
import { LanguageToggle } from './LanguageToggle'
import { ScrambleButton } from './ScrambleButton'
import { SetupSection } from './SetupSection'
import { CubePicker } from '@/components/picker/CubePicker'
import { SECTION_BOX, SECTION_RULE } from '@/components/ui/styles'
import { useTutorialStore } from '@/store/tutorialStore'
import { MethodSelect } from '@/components/solve/MethodSelect'
import { TutorialButton } from '@/components/solve/TutorialButton'
import { FEATURE_ICON } from '@/components/ui/features'
import { useRoute } from '@/store/router'
import { AppTitle } from './AppTitle'

const CARD =
  'pointer-events-auto flex min-h-0 w-full flex-col gap-5 overflow-auto rounded-2xl border border-slate-700/70 bg-slate-900/85 p-5 shadow-2xl backdrop-blur sm:max-h-full sm:w-80'

/** The overlay control panel: header, the setup + solve blocks (play mode) or
 *  the cube-entry panel (edit mode). On desktop, play mode splits into two
 *  cards: title + setup on the left, language + solve on the right. On mobile
 *  it is a single card that can collapse to a compact bar with just Scramble
 *  and Solve. On the home page, the puzzle choice alone and the solve block
 *  grayed (see HomeGallery). */
export function Controls() {
  const t = useI18n((s) => s.t)
  const editing = useEditor((s) => s.mode === 'edit')
  const desktop = useIsDesktop()
  const solveAll = useCube((s) => s.solveAll)
  const solving = useCube((s) => s.solving)
  const pause = useCube((s) => s.pause)
  const stop = useCube((s) => s.stop)
  // Folded on a phone: scrambling and solving fold it too (the puzzle in
  // sight).
  const home = useRoute((s) => s.home)
  const tutorial = useTutorialStore((s) => s.active) && !home
  // Never on the home page, which has no fold.
  // Folding, the open panel goes down first, then turns into its bar.
  const { folded: collapsed, closing } = usePanelFold()

  const busy = useCube(selectBusy)
  const solved = useCube(selectSolved)
  const title = editing ? (
    <h1 className="text-lg font-bold text-white">{t.editTitle}</h1>
  ) : (
    <AppTitle />
  )
  // The home page: the puzzle choice alone, inviting to choose one.
  const setup = home ? (
    <section aria-label={t.sectionSetup} className={SECTION_BOX}>
      <CubePicker disabled={false} home />
    </section>
  ) : (
    <SetupSection />
  )

  if (desktop && !editing) {
    return (
      <div className="flex h-full items-start justify-between gap-5">
        <section aria-label={t.title} className={CARD}>
          <header className="flex items-center justify-between gap-3">
            {title}
            <LanguageToggle />
          </header>
          {setup}
          <Credit />
        </section>
        <div className={CARD}>
          <SolveArea home={home} />
        </div>
      </div>
    )
  }

  return (
    // The card scrolls within itself (CARD), its frame kept whole.
    <div className="flex min-h-0 flex-col">
      <section
        aria-label={t.title}
        // Unfolding, it rises from the bottom (the puzzle shrinking above);
        // folding, it goes down first.
        className={`${CARD} ${
          editing || home
            ? ''
            : closing
              ? 'motion-safe:animate-fold sm:animate-none'
              : collapsed
                ? ''
                : 'motion-safe:animate-unfold sm:animate-none'
        }`}
      >
        {/* On a phone, the title, the language and the fold stand in the
            top bar (TopBar): the panel keeps the entry's title only. */}
        {editing && <header>{title}</header>}

        {editing ? (
          <EditPanel />
        ) : (
          <>
            {collapsed && (
              // Folded (a phone): the method and the main actions only.
              <div className="flex flex-col gap-3 sm:hidden">
                {/* The tutorial beside the method it teaches. */}
                <div className="flex items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <MethodSelect disabled={busy} compact />
                  </div>
                  <TutorialButton />
                </div>
                <div className="flex gap-2">
                  <ScrambleButton className="flex-1" />
                  {/* Playing (a scramble, a solution): Stop in Solve's place. */}
                  {busy ? (
                    <StopButton
                      onClick={solving ? pause : stop}
                      title={solving ? t.pauseTitle : undefined}
                      className="flex-1"
                    />
                  ) : (
                    <Button variant="solve" onClick={solveAll} disabled={solved} className="flex-1">
                      <FEATURE_ICON.solve className="size-4" aria-hidden />
                      {t.solve}
                    </Button>
                  )}
                </div>
              </div>
            )}
            <div className={collapsed ? 'hidden flex-col gap-5 sm:flex' : 'flex flex-col gap-5'}>
              {/* The tutorial on, it comes first: what one reads while
                  turning. */}
              {tutorial ? (
                <>
                  <SolveArea home={home} />
                  <div className={SECTION_RULE}>{setup}</div>
                </>
              ) : (
                <>
                  {setup}
                  <div className={SECTION_RULE}>
                    <SolveArea home={home} />
                  </div>
                </>
              )}
              <Credit />
            </div>
          </>
        )}
      </section>
    </div>
  )
}
