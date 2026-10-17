import { useCallback, useEffect, useRef, useState } from 'react'
import { solvedByTurn, useCube } from '@/store/cubeStore'
import { useTutorialStore } from '@/store/tutorialStore'
import { COLOR_HEX } from '@/three/core/colors'

/** The sparks' colors: the cube's. */
const COLORS = ['W', 'Y', 'G', 'B', 'O', 'R'].map((c) => COLOR_HEX[c as keyof typeof COLOR_HEX])

const ROCKETS = 7
const SPARKS = 80
const GRAVITY = 220 // px/s²
const DURATION = 3.6 // s
/** A rocket's climb before it bursts, s. */
const CLIMB = 0.45

/** A rocket: from the bottom of the screen up to where it bursts. */
interface Rocket {
  readonly fromX: number
  readonly x: number
  readonly y: number
  /** When it is launched, s. */
  readonly launch: number
}

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  /** Seconds before it shows (a rocket's flight). */
  delay: number
  /** Its lifetime, s. */
  life: number
}

/** A show: rockets climbing one after another, each bursting into a full
 *  sheaf of sparks of two colors, spread over the screen's upper half. */
function show(width: number, height: number): { rockets: Rocket[]; sparks: Spark[] } {
  const rockets: Rocket[] = []
  const sparks: Spark[] = []
  for (let r = 0; r < ROCKETS; r++) {
    const x = width * (0.2 + 0.6 * Math.random())
    const y = height * (0.15 + 0.3 * Math.random())
    const launch = r * 0.3 + Math.random() * 0.15
    rockets.push({ fromX: x + (Math.random() - 0.5) * 120, x, y, launch })
    const delay = launch + CLIMB
    const speed = 170 + Math.random() * 110
    const palette = [COLORS[r % COLORS.length]!, COLORS[(r + 3) % COLORS.length]!]
    for (let i = 0; i < SPARKS; i++) {
      const angle = Math.random() * 2 * Math.PI
      // Spread over the whole disc, not a ring: a full sheaf.
      const v = speed * Math.sqrt(0.15 + 0.85 * Math.random())
      sparks.push({
        x,
        y,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v,
        color: palette[i % 2]!,
        delay,
        life: 1.5 + Math.random() * 0.8,
      })
    }
  }
  return { rockets, sparks }
}

/** Play a show on `canvas`, then call `onEnd`; returns how to stop it. */
function play(canvas: HTMLCanvasElement, onEnd: () => void): () => void {
  const context = canvas.getContext('2d')
  if (!context) {
    onEnd()
    return () => {}
  }
  let frame = 0
  const ratio = window.devicePixelRatio || 1
  const [width, height] = [window.innerWidth, window.innerHeight]
  canvas.width = width * ratio
  canvas.height = height * ratio
  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  const { rockets, sparks } = show(width, height)
  const start = performance.now()
  const draw = (now: number) => {
    const t = (now - start) / 1000
    context.clearRect(0, 0, width, height)
    context.globalCompositeOperation = 'lighter'
    // The rockets climbing, a fading streak behind each.
    for (const r of rockets) {
      const climb = (t - r.launch) / CLIMB
      if (climb < 0 || climb > 1) continue
      const ease = 1 - (1 - climb) ** 2
      const x = r.fromX + (r.x - r.fromX) * ease
      const y = height + (r.y - height) * ease
      const tail = context.createLinearGradient(x, y, x, y + 60)
      tail.addColorStop(0, 'rgba(255, 236, 200, 0.9)')
      tail.addColorStop(1, 'rgba(255, 236, 200, 0)')
      context.strokeStyle = tail
      context.lineWidth = 2
      context.beginPath()
      context.moveTo(x, y)
      context.lineTo(x - (r.x - r.fromX) * 0.08, y + 60)
      context.stroke()
    }
    for (const s of sparks) {
      const age = t - s.delay
      if (age < 0 || age > s.life) continue
      // Ballistic flight, slowed a little by the air.
      const drag = 1 - 0.35 * Math.min(age / s.life, 1)
      const x = s.x + s.vx * age * drag
      const y = s.y + s.vy * age * drag + 0.5 * GRAVITY * age * age
      const fade = 1 - age / s.life
      // A white flash as it bursts, then its own color.
      context.globalAlpha = fade
      context.fillStyle = age < 0.08 ? '#ffffff' : s.color
      context.beginPath()
      context.arc(x, y, 1.6 + 2.2 * fade, 0, 2 * Math.PI)
      context.fill()
      // Its glow: a wide faint disc around it.
      context.globalAlpha = fade * 0.18
      context.beginPath()
      context.arc(x, y, 4 + 5 * fade, 0, 2 * Math.PI)
      context.fill()
      // A short tail behind it.
      context.globalAlpha = fade * 0.35
      context.beginPath()
      context.arc(x - s.vx * 0.03, y - s.vy * 0.03, 1 + fade, 0, 2 * Math.PI)
      context.fill()
    }
    context.globalAlpha = 1
    if (t < DURATION) frame = requestAnimationFrame(draw)
    else onEnd()
  }
  frame = requestAnimationFrame(draw)
  return () => cancelAnimationFrame(frame)
}

/** One show: its own canvas, letting every click through, for its length. */
function Show({ onEnd }: { onEnd: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => (canvasRef.current ? play(canvasRef.current, onEnd) : undefined), [onEnd])
  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
    />
  )
}

/**
 * A little fireworks show over the whole app when a turn solves the puzzle
 * (`solvedByTurn`), gone after three seconds: its canvas only exists while
 * it plays. In the tutorial, only at its end (`cheers`: its last stage
 * shown, the cup with it), never at a turn, the stages the puzzle already
 * meets still to show. Skipped for who asks for reduced motion.
 */
export function Fireworks() {
  // Each show its own key, so a new one starts afresh.
  const [show, setShow] = useState(0)
  const end = useCallback(() => setShow(0), [])
  useEffect(() => {
    const fire = () => {
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
      setShow((n) => n + 1)
    }
    const turns = useCube.subscribe((next, prev) => {
      if (!solvedByTurn(prev, next)) return
      if (useTutorialStore.getState().active) return
      fire()
    })
    const steps = useTutorialStore.subscribe((next, prev) => {
      if (next.cheers !== prev.cheers) fire()
    })
    return () => {
      turns()
      steps()
    }
  }, [])
  return show ? <Show key={show} onEnd={end} /> : null
}
