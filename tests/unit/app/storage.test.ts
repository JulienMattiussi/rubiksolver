import { beforeEach, describe, expect, it } from 'vitest'
import { readStored, writeStored } from '@/lib/app/storage'
import { stubStorage } from '../../helpers'

const isNumber = (value: unknown): value is number => typeof value === 'number'

beforeEach(stubStorage)

describe('kept between visits', () => {
  it('reads back what was written', () => {
    writeStored('k', 1.5)
    expect(readStored('k', isNumber, 0)).toBe(1.5)
  })

  it('falls back on nothing kept, a value refused, or anything not JSON', () => {
    expect(readStored('k', isNumber, 7)).toBe(7)
    writeStored('k', 'fast')
    expect(readStored('k', isNumber, 7)).toBe(7)
    localStorage.setItem('k', '{oops')
    expect(readStored('k', isNumber, 7)).toBe(7)
  })
})
