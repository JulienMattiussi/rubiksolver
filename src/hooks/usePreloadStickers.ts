import { useEffect } from 'react'
import { tellsSizes } from '@/lib/core/shape'
import { SHAPE_MIRROR_SCAN, type CubeShape, type CubeVariant } from '@/lib/core/shapes'
import { warmStickers } from '@/workers/findStickers'
import { hasCamera } from './useCamera'

/** Once the page is idle, OpenCV loaded ahead for a mirror cube that scans
 *  by its stickers' sizes, as soon as it shows (before the editor, before
 *  the camera); not to spend the data of who saves it. Loaded once, its
 *  file then kept a year (vercel.json). */
export function usePreloadStickers(shape: CubeShape, variant: CubeVariant) {
  useEffect(() => {
    if (!tellsSizes(variant) || !SHAPE_MIRROR_SCAN[shape] || !hasCamera()) return
    const saving = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
      ?.saveData
    if (saving) return
    if (typeof requestIdleCallback === 'undefined') {
      const timer = setTimeout(warmStickers, 2000)
      return () => clearTimeout(timer)
    }
    const idle = requestIdleCallback(warmStickers)
    return () => cancelIdleCallback(idle)
  }, [shape, variant])
}
