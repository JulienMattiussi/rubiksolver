import * as THREE from 'three'

/** Home camera framing: where the <Canvas> camera starts, looking at the
 *  origin, and where recentering flies it back (see CameraReset). */
export const HOME_POSITION = new THREE.Vector3(4.5, 4.5, 6)
export const HOME_TARGET = new THREE.Vector3(0, 0, 0)
