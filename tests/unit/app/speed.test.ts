import { describe, expect, it } from 'vitest'
import {
  durationFromSlider,
  sayDuration,
  MAX_TURN_DURATION,
  MIN_TURN_DURATION,
  pauseBetweenTurns,
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

describe('pause between turns', () => {
  it('waits as long as a turn at the slowest speed only', () => {
    expect(pauseBetweenTurns(durationFromSlider(0))).toBe(MAX_TURN_DURATION)
    expect(pauseBetweenTurns(durationFromSlider(1))).toBe(0)
    expect(pauseBetweenTurns(MIN_TURN_DURATION)).toBe(0)
  })
})

describe('a duration said', () => {
  it('in milliseconds under a second, else in seconds', () => {
    expect(sayDuration(0.06)).toEqual({ value: 60, unit: 'ms' })
    expect(sayDuration(0.3456)).toEqual({ value: 346, unit: 'ms' })
    expect(sayDuration(2.5)).toEqual({ value: 2.5, unit: 's' })
    expect(sayDuration(5)).toEqual({ value: 5, unit: 's' })
  })
})
