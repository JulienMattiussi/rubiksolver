import { expect, test } from '@playwright/test'

test('loads, renders the cube canvas and the controls', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))

  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Rubik Solver' })).toBeVisible()
  await expect(page.locator('canvas')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Mélanger' })).toBeVisible()

  // No runtime error (e.g. WebGL/R3F failing to mount).
  expect(errors).toEqual([])
})

test('scrambles then solves back to a solved cube', async ({ page }) => {
  // Beginner-method solutions are long; the animation can take a while.
  test.setTimeout(120000)
  await page.goto('/')

  // Fastest animation so the whole flow runs quickly.
  await page.getByLabel('Vitesse').fill('100')

  const scramble = page.getByRole('button', { name: 'Mélanger' })
  const solve = page.getByRole('button', { name: 'Résoudre' })

  await scramble.click()
  await expect(solve).toBeEnabled({ timeout: 30000 }) // scramble finished

  await solve.click()
  // The method's named steps appear as soon as the solve is computed.
  await expect(page.getByText(/rotations?/).first()).toBeVisible()

  // When the solve animation finishes the cube is solved again, which disables
  // both Solve and Reset and re-enables Scramble.
  await expect(scramble).toBeEnabled({ timeout: 90000 })
  await expect(solve).toBeDisabled()
})

test('cube editor: enter, fill from current state, apply', async ({ page }) => {
  await page.goto('/')

  // Blank entry shows the palette, then cancel back to play.
  await page.getByRole('button', { name: 'Saisir un cube' }).click()
  await expect(page.getByRole('radiogroup', { name: 'Couleurs' })).toBeVisible()
  await page.getByRole('button', { name: 'Annuler' }).click()
  await expect(page.getByRole('button', { name: 'Mélanger' })).toBeVisible()

  // Enter pre-filled from the current (solved) cube: 54/54, complete and valid.
  await page.getByRole('button', { name: /Depuis l.?.tat actuel/ }).click()
  await expect(page.getByText('54 / 54 stickers')).toBeVisible()

  const use = page.getByRole('button', { name: 'Utiliser ce cube' })
  await expect(use).toBeEnabled()
  await use.click()

  // Back to play mode.
  await expect(page.getByRole('button', { name: 'Mélanger' })).toBeVisible()
})
