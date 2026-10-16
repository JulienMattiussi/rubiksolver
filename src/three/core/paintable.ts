import type { ThreeEvent } from '@react-three/fiber'

/** The pointer props of a mesh clicked to paint (edit mode): the click goes
 *  to it alone (`onSelect` told where, in the mesh's own frame: the
 *  puzzle's), the cursor a pointer over it, and `onHover` told when the
 *  pointer comes and goes (to light its piece up). None without `onSelect`. */
export function paintable(
  onSelect?: (at: [number, number, number]) => void,
  onHover?: (on: boolean) => void,
) {
  if (!onSelect) return {}
  return {
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()
      // The end of a drag turning the view: no click.
      if (e.delta > 4) return
      const at = e.object.worldToLocal(e.point.clone())
      onSelect([at.x, at.y, at.z])
    },
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      document.body.style.cursor = 'pointer'
      onHover?.(true)
    },
    onPointerOut: () => {
      document.body.style.cursor = 'default'
      onHover?.(false)
    },
  }
}
