import { expect, test } from '@playwright/test'

const DIR =
  '/tmp/claude-1000/-home-julien-Documents-MyRepos-rubiksolver/87d59856-3e3f-4135-966e-be38a166d9ef/scratchpad'

test('progress count colors', async ({ page }) => {
  test.setTimeout(240000)
  await page.setViewportSize({ width: 1400, height: 900 })
  await page.goto('/#/fr/5x5')
  await page.getByLabel('Vitesse').fill('100')
  const tutorial = page.getByRole('button', { name: 'Tutoriel', exact: true })
  await page.getByRole('button', { name: 'Mélanger' }).click()
  await expect(tutorial).toBeEnabled({ timeout: 60000 })
  await tutorial.click()
  const panel = page.getByRole('region', { name: 'Tutoriel' })
  await panel.getByRole('button', { name: 'Passer' }).click()
  for (let n = 0; n < 24; n++) {
    const apply = page.getByRole('button', { name: 'Appliquer la formule' })
    await apply.click()
    await expect(page.getByRole('button', { name: 'Suivant' })).toBeVisible({ timeout: 30000 })
    await page.getByRole('button', { name: 'Suivant' }).click()
    if (n === 0 || n === 23) {
      await page.waitForTimeout(500)
      await panel.screenshot({ path: `${DIR}/count${n}.png` })
    }
  }
})
