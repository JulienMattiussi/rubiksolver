import { useMemo } from 'react'
import { cubeShape } from '@/lib/core/cube'
import { useI18n } from '@/i18n/i18nStore'
import { aboutOf, type About } from '@/seo/about'
import { useCube } from '@/store/cubeStore'

/** What the page of the puzzle shown says of it, in the reader's language. */
export function useAbout(): About {
  const t = useI18n((s) => s.t)
  const shape = useCube((s) => cubeShape(s.cube))
  const variant = useCube((s) => s.variant)
  return useMemo(() => aboutOf(t, { shape, variant }), [t, shape, variant])
}
