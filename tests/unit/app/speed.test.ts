import { describe, expect, it } from 'vitest'
import {
  durationFromSlider,
  MAX_TURN_DURATION,
  MIN_TURN_DURATION,
  sliderFromDuration,
} from '@/lib/app/speed'

describe('speed mapping', () => {
  it('maps slider extremes to duration extremes', () => {
    expect(durationFromSlider(0)).toBeCloseTo(MAX_TURN_DURATION)
    expect(durationFromSlider(100)).toBeCloseTo(MIN_TURN_DURATION)
  })

  it('clamps out-of-range positions', () => {
    expect(durationFromSlider(-50)).toBeCloseTo(MAX_TURN_DURATION)
    expect(durationFromSlider(200)).toBeCloseTo(MIN_TURN_DURATION)
  })

  it('changes speed by the same factor at every step (the middle: their geometric mean)', () => {
    expect(durationFromSlider(50)).toBeCloseTo(Math.sqrt(MIN_TURN_DURATION * MAX_TURN_DURATION))
    expect(MAX_TURN_DURATION).toBe(2.5)
  })

  it('round-trips slider -> duration -> slider', () => {
    for (const pos of [0, 25, 50, 75, 100]) {
      expect(sliderFromDuration(durationFromSlider(pos))).toBeCloseTo(pos)
    }
  })
})
