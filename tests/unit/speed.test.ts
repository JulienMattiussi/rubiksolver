import { describe, expect, it } from 'vitest'
import {
  durationFromSlider,
  MAX_TURN_DURATION,
  MIN_TURN_DURATION,
  sliderFromDuration,
} from '@/lib/speed'

describe('speed mapping', () => {
  it('maps slider extremes to duration extremes', () => {
    expect(durationFromSlider(0)).toBeCloseTo(MAX_TURN_DURATION)
    expect(durationFromSlider(100)).toBeCloseTo(MIN_TURN_DURATION)
  })

  it('clamps out-of-range positions', () => {
    expect(durationFromSlider(-50)).toBeCloseTo(MAX_TURN_DURATION)
    expect(durationFromSlider(200)).toBeCloseTo(MIN_TURN_DURATION)
  })

  it('round-trips slider -> duration -> slider', () => {
    for (const pos of [0, 25, 50, 75, 100]) {
      expect(sliderFromDuration(durationFromSlider(pos))).toBeCloseTo(pos)
    }
  })
})
