import { useEffect, useRef, useState } from 'react'

export type CameraStatus = 'starting' | 'on' | 'denied'

/** Whether this browser can open a camera at all. */
export const hasCamera = (): boolean =>
  typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function'

/**
 * The back camera (a laptop's own, facing the user, when it has no other),
 * shown in a video while mounted (stopped when it unmounts), whether to
 * show it mirrored (a camera facing the user, as a mirror moves), and its
 * torch when the phone lets a page light it (Chrome on Android does;
 * Safari does not).
 */
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<CameraStatus>('starting')
  const [track, setTrack] = useState<MediaStreamTrack | null>(null)
  const [torch, setTorchOn] = useState(false)

  useEffect(() => {
    let stream: MediaStream | undefined
    let gone = false
    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
      })
      .then((opened) => {
        if (gone) return opened.getTracks().forEach((t) => t.stop())
        stream = opened
        const video = videoRef.current
        if (video) {
          video.srcObject = opened
          void video.play().catch(() => {})
        }
        setTrack(opened.getVideoTracks()[0] ?? null)
        setStatus('on')
      })
      .catch(() => {
        if (!gone) setStatus('denied')
      })
    return () => {
      gone = true
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const canTorch = !!track && 'torch' in (track.getCapabilities?.() ?? {})
  const mirrored = !!track && track.getSettings().facingMode !== 'environment'
  const setTorch = (on: boolean) => {
    // `torch` is not in the DOM's types yet.
    const lit = { torch: on } as unknown as MediaTrackConstraintSet
    void track
      ?.applyConstraints({ advanced: [lit] })
      .then(() => setTorchOn(on))
      .catch(() => {})
  }
  return { videoRef, status, mirrored, canTorch, torch, setTorch }
}
