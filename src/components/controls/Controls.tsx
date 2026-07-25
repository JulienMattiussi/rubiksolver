import { useState } from 'react'
import { Shuffle, Sparkles } from 'lucide-react'
import { isSolved } from '@/lib/cube'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { Button } from '@/components/ui/Button'
import { EditPanel } from '@/components/edit/EditPanel'
import { SolvePanel } from '@/components/solve/SolvePanel'
import { CollapseButton } from './CollapseButton'
import { LanguageToggle } from './LanguageToggle'
import { SetupSection } from './SetupSection'

/** The overlay control panel: header, the setup + solve blocks (play mode) or
 *  the cube-entry panel (edit mode). On mobile it can collapse to a compact
 *  bar with just Scramble and Solve. */
export function Controls() {
  const t = useI18n((s) => s.t)
  const editing = useEditor((s) => s.mode === 'edit')
  const cube = useCube((s) => s.cube)
  const active = useCube((s) => s.active)
  const queue = useCube((s) => s.queue)
  const scramble = useCube((s) => s.scramble)
  const solveAll = useCube((s) => s.solveAll)
  const [collapsed, setCollapsed] = useState(false)

  const busy = active !== null || queue.length > 0
  const solved = isSolved(cube)

  return (
    <section
      aria-label={t.title}
      className="flex w-full flex-col gap-5 rounded-2xl border border-slate-700/70 bg-slate-900/85 p-5 shadow-2xl backdrop-blur sm:w-80"
    >
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-white">{editing ? t.editTitle : t.title}</h1>
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
                disabled={busy || solved}
                className="flex-1"
              >
                <Sparkles className="size-4" aria-hidden />
                {t.solve}
              </Button>
            </div>
          )}
          <div className={collapsed ? 'hidden flex-col gap-5 sm:flex' : 'flex flex-col gap-5'}>
            <SetupSection />
            <section
              aria-label={t.sectionSolve}
              className="flex flex-col gap-3 rounded-xl border border-slate-700/60 bg-slate-950/30 p-4"
            >
              <SolvePanel />
            </section>
          </div>
        </>
      )}
    </section>
  )
}
