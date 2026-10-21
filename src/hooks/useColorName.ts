import { useMemo } from 'react'
import { cubeShape, shapeColors } from '@/lib/core/cube'
import { namedAs } from '@/lib/core/colorNames'
import type { Color } from '@/lib/core/types'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'

/** A color's name on the puzzle shown: a shade named plainly where the
 *  puzzle has no other shade of it (`namedAs`). */
export function useColorName(): (color: Color) => string {
  const t = useI18n((s) => s.t)
  const shape = useCube((s) => cubeShape(s.cube))
  return useMemo(() => {
    const colors = shapeColors(shape)
    return (color) => t.colors[namedAs(color, colors)]
  }, [t, shape])
}
