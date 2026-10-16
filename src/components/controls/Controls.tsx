import { useState } from 'react'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { useI18n } from '@/i18n/i18nStore'
import { selectBusy, selectSolved, useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { Button } from '@/components/ui/Button'
import { EditPanel } from '@/components/edit/EditPanel'
import { SolveArea } from '@/components/solve/SolveArea'
import { CollapseButton } from './CollapseButton'
import { Credit } from './Credit'
import { LanguageToggle } from './LanguageToggle'
import { ScrambleButton } from './ScrambleButton'
import { SetupSection } from './SetupSection'
import { CubePicker } from '@/components/picker/CubePicker'
import { SECTION_BOX } from '@/components/ui/styles'
import { FEATURE_ICON } from '@/components/ui/features'
import { goTo, useRoute } from '@/store/router'

const CARD =
  'pointer-events-auto flex w-full flex-col gap-5 overflow-auto rounded-2xl border border-slate-700/70 bg-slate-900/85 p-5 shadow-2xl backdrop-blur sm:max-h-full sm:w-80'

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
  const [collapsed, setCollapsed] = useState(false)
  const home = useRoute((s) => s.home)

  const busy = useCube(selectBusy)
  const solved = useCube(selectSolved)
  const title = (
    <h1 className="text-lg font-bold text-white">
      {editing ? (
        t.editTitle
      ) : (
        // The app's name leads home.
        <button
          type="button"
          onClick={() => goTo({ kind: null })}
          title={t.homeLink}
          className="flex items-center gap-2 rounded transition hover:text-sky-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        >
          {/* The app's icon (the favicon), decorative beside its name. */}
          <img
            src={`${import.meta.env.BASE_URL}favicon.svg`}
            alt=""
            aria-hidden
            className="size-6"
          />
          {t.title}
        </button>
      )}
    </h1>
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
          <header>{title}</header>
          {setup}
          <Credit />
        </section>
        <div className={CARD}>
          <header className="flex justify-end">
            <LanguageToggle />
          </header>
          <SolveArea home={home} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full items-start justify-end">
      <section aria-label={t.title} className={CARD}>
        <header className="flex items-center justify-between gap-3">
          {title}
          <div className="flex items-center gap-2">
            <LanguageToggle />
            {!editing && !home && (
              <CollapseButton collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
            )}
          </div>
        </header>

        {editing ? (
          <EditPanel />
        ) : (
          <>
            {collapsed && (
              <div className="flex gap-2 sm:hidden">
                <ScrambleButton className="flex-1" />
                <Button
                  variant="solve"
                  onClick={solveAll}
                  disabled={busy || solved}
                  className="flex-1"
                >
                  <FEATURE_ICON.solve className="size-4" aria-hidden />
                  {t.solve}
                </Button>
              </div>
            )}
            <div className={collapsed ? 'hidden flex-col gap-5 sm:flex' : 'flex flex-col gap-5'}>
              {setup}
              <SolveArea home={home} />
              <Credit />
            </div>
          </>
        )}
      </section>
    </div>
  )
}
