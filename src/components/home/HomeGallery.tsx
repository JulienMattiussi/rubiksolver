import { CUBE_KINDS, cubeCategory, SHAPE_LABEL, type CubeKind } from '@/lib/core/types'
import { useI18n } from '@/i18n/i18nStore'
import { goTo } from '@/store/router'
import { PuzzleIcon } from '@/components/picker/PuzzleIcon'
import { FEATURE_CHIP, FEATURE_ICON, type Feature } from '@/components/ui/features'

/** The gallery's models: one or two of each kind, for variety (the picker
 *  holds them all). */
const SHOWCASE: readonly CubeKind[] = [
  { shape: '3', variant: 'classic' },
  { shape: 'pyra', variant: 'classic' },
  { shape: 'ghost', variant: 'classic' },
  { shape: '4', variant: 'mirror' },
  { shape: '224', variant: 'classic' },
  { shape: 'star', variant: 'classic' },
  { shape: 'gearU', variant: 'classic' },
]

const FEATURES: readonly Feature[] = ['edit', 'guide', 'solve']

/**
 * The home page's center, in place of the 3D scene: a gallery of a few
 * models (a click opens one, through the address), then what the app does
 * with it. On desktop it stays between the two panel cards.
 */
export function HomeGallery() {
  const t = useI18n((s) => s.t)
  const nameOf = (kind: CubeKind) => t.cubeKind(SHAPE_LABEL[kind.shape], kind.variant === 'mirror')
  return (
    <div className="absolute inset-0 overflow-auto">
      {/* Soft colored glows behind the gallery. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[12%] left-1/2 size-[28rem] -translate-x-[70%] rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute top-[35%] left-1/2 size-[24rem] -translate-x-[10%] rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      {/* Between the two panel cards on desktop (20rem each, plus margins). */}
      <div className="relative flex min-h-full px-4 py-8 sm:px-[22rem]">
        <div className="mx-auto flex max-w-2xl flex-col justify-center gap-8">
          <h2 className="bg-gradient-to-r from-sky-300 via-white to-violet-300 bg-clip-text text-center text-2xl font-bold text-transparent sm:text-3xl">
            {t.homeTitle.before}{' '}
            <span className="bg-none text-4xl font-black text-amber-300 sm:text-5xl">
              {CUBE_KINDS.length}
            </span>{' '}
            {t.homeTitle.after}
          </h2>

          <ul className="flex flex-wrap justify-center gap-3">
            {SHOWCASE.map((kind) => (
              <li key={`${kind.shape}${kind.variant}`}>
                <button
                  type="button"
                  onClick={() => goTo({ kind })}
                  aria-label={nameOf(kind)}
                  className="group flex w-32 flex-col items-center gap-2 rounded-2xl border border-slate-700/60 bg-slate-900/60 p-3 text-center shadow-lg shadow-black/20 transition duration-200 hover:-translate-y-1 hover:border-sky-400/60 hover:bg-slate-800/80 hover:shadow-sky-500/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                >
                  <span className="flex h-20 w-full items-center justify-center transition duration-200 group-hover:scale-110">
                    <PuzzleIcon shape={kind.shape} variant={kind.variant} className="h-full" />
                  </span>
                  {/* Two lines kept for every name: the cards all the same size. */}
                  <span className="flex min-h-[2lh] items-center text-sm leading-tight font-semibold text-white">
                    {nameOf(kind)}
                  </span>
                  <span className="-mt-1.5 text-[11px] text-slate-400">
                    {t.cubeCategories[cubeCategory(kind)]}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <ul className="grid gap-3 sm:grid-cols-3">
            {FEATURES.map((key) => {
              const Icon = FEATURE_ICON[key]
              return (
                <li
                  key={key}
                  className="flex gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4 sm:flex-col"
                >
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 ${FEATURE_CHIP[key]}`}
                  >
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white">
                      {t.homeFeatures[key].title}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-slate-400">
                      {t.homeFeatures[key].text}
                    </span>
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}
