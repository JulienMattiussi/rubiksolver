import { test } from '@playwright/test'
test('logo', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 })
  await page.goto('/#/fr/violet')
  await page.waitForTimeout(2000)
  await page.mouse.move(700, 450)
  await page.mouse.down()
  await page.mouse.move(800, 380, { steps: 20 })
  await page.mouse.up()
  await page.waitForTimeout(800)
  await page.screenshot({ path: '/tmp/claude-1000/-home-julien-Documents-MyRepos-rubiksolver/f7edbf10-715a-4abd-be6a-2786e6913f26/scratchpad/logo4.png', clip: { x: 450, y: 450, width: 280, height: 260 } })
})
