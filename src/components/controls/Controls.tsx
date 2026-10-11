import { useState } from 'react'
import { Shuffle, Sparkles } from 'lucide-react'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { useI18n } from '@/i18n/i18nStore'
import { selectBusy, selectSolvable, selectSolved, useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { Button } from '@/components/ui/Button'
import { EditPanel } from '@/components/edit/EditPanel'
import { SolvePanel } from '@/components/solve/SolvePanel'
import { CollapseButton } from './CollapseButton'
import { LanguageToggle } from './LanguageToggle'
import { SetupSection } from './SetupSection'

const CARD =
  'pointer-events-auto flex w-full flex-col gap-5 overflow-auto rounded-2xl border border-slate-700/70 bg-slate-900/85 p-5 shadow-2xl backdrop-blur sm:max-h-full sm:w-80'

/** The overlay control panel: header, the setup + solve blocks (play mode) or
 *  the cube-entry panel (edit mode). On desktop, play mode splits into two
 *  cards: title + setup on the left, language + solve on the right. On mobile
 *  it is a single card that can collapse to a compact bar with just Scramble
 *  and Solve. */
export function Controls() {
  const t = useI18n((s) => s.t)
  const editing = useEditor((s) => s.mode === 'edit')
  const desktop = useIsDesktop()
  const scramble = useCube((s) => s.scramble)
  const solveAll = useCube((s) => s.solveAll)
  const [collapsed, setCollapsed] = useState(false)

  const busy = useCube(selectBusy)
  const solved = useCube(selectSolved)
  const solvable = useCube(selectSolvable)
  const title = <h1 className="text-lg font-bold text-white">{editing ? t.editTitle : t.title}</h1>

  if (desktop && !editing) {
    return (
      <div className="flex h-full items-start justify-between gap-5">
        <section aria-label={t.title} className={CARD}>
          <header>{title}</header>
          <SetupSection />
        </section>
        <div className={CARD}>
          <header className="flex justify-end">
            <LanguageToggle />
          </header>
          <SolvePanel />
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
            {!editing && (
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
                <Button onClick={scramble} disabled={busy} className="flex-1">
                  <Shuffle className="size-4" aria-hidden />
                  {t.scramble}
                </Button>
                <Button
                  variant="primary"
                  onClick={solveAll}
                  disabled={busy || solved || !solvable}
                  className="flex-1"
                >
                  <Sparkles className="size-4" aria-hidden />
                  {t.solve}
                </Button>
              </div>
            )}
            <div className={collapsed ? 'hidden flex-col gap-5 sm:flex' : 'flex flex-col gap-5'}>
              <SetupSection />
              <SolvePanel />
            </div>
          </>
        )}
      </section>
    </div>
  )
}
