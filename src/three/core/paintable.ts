import type { ThreeEvent } from '@react-three/fiber'

/** The pointer props of a mesh clicked to paint (edit mode): the click goes
 *  to it alone, the cursor a pointer over it, and `onHover` told when the
 *  pointer comes and goes (to light its piece up). None without `onSelect`. */
export function paintable(onSelect?: () => void, onHover?: (on: boolean) => void) {
  if (!onSelect) return {}
  return {
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()
      onSelect()
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
