import { expect, test, type Page } from '@playwright/test'
import { shareCard } from './shareCard'

// `make branding`: redraws the share preview (public/og.png), the touch icon
// and the README's banner and screenshots (docs/images/), in English except
// the share preview (the site's default language, French).

const SCREEN = { width: 1440, height: 860 }

/** The site's logo, as served. */
const logo = async (page: Page) => (await page.request.get('/favicon.svg')).text()

/** The home page's heading, which holds the number of puzzles. */
const homeHeading = (page: Page) => page.getByRole('heading', { name: /^Choose your model/ })

test.use({ locale: 'en-US', deviceScaleFactor: 1 })
test.describe.configure({ mode: 'serial' })

/** Scramble the puzzle at the given address, then wait for its solution. */
async function scrambled(page: Page, address: string) {
  await page.goto(address)
  await page.getByLabel('Speed').fill('100')
  await page.getByRole('button', { name: 'Scramble' }).click()
  await expect(page.getByRole('button', { name: 'Solve', exact: true })).toBeEnabled({
    timeout: 60000,
  })
  await expect(page.getByText(/^\d+ turns$/).first()).toBeVisible({ timeout: 60000 })
  await page.waitForTimeout(1500) // the last turn's animation
}

test('share preview and README banner', async ({ page }) => {
  await page.goto('/#/en')
  const count = Number(await homeHeading(page).locator('span').textContent())
  // One drawing per category: the first of each card of the picker.
  await page.getByRole('button', { name: /^Cube choice/ }).click()
  const cards = page.getByRole('button', { name: /, \d+ puzzles?$/ })
  const icons = await Promise.all(
    (await cards.all()).map((card) =>
      card
        .locator('svg')
        .first()
        .evaluate((svg) => svg.outerHTML),
    ),
  )
  expect(icons).toHaveLength(12)

  await page.setViewportSize({ width: 1200, height: 630 })
  const svg = await logo(page)
  await page.setContent(shareCard('fr', count, icons, svg))
  await page.screenshot({ path: 'public/og.png' })
  await page.setContent(shareCard('en', count, icons, svg))
  await page.screenshot({ path: 'docs/images/banner.png' })
})

test('touch icon', async ({ page }) => {
  await page.setViewportSize({ width: 180, height: 180 })
  // Square: iOS rounds the corners itself.
  const square = (await logo(page)).replace(/ rx="\d+"/, '')
  await page.setContent(
    `<style>*{margin:0}svg{display:block;width:180px;height:180px}</style>${square}`,
  )
  await page.screenshot({ path: 'public/apple-touch-icon.png' })
})

test('README screenshots', async ({ page }) => {
  test.setTimeout(240000)
  await page.setViewportSize(SCREEN)
  await page.goto('/#/en')
  await expect(homeHeading(page)).toBeVisible()
  await page.screenshot({ path: 'docs/images/home.png' })
  await page.getByRole('button', { name: /^Cube choice/ }).click()
  await page.waitForTimeout(500) // the dialog's fade-in
  await page.screenshot({ path: 'docs/images/picker.png' })

  await scrambled(page, '/#/en/3x3')
  await page.screenshot({ path: 'docs/images/solve.png' })
  // The tutorial on that scramble: its first step, its arrow.
  await page.getByRole('button', { name: 'Tutorial', exact: true }).click()
  await page.getByRole('button', { name: 'Skip' }).click() // the words, known
  await page.waitForTimeout(2000) // the view turns to the center to hold
  await page.screenshot({ path: 'docs/images/tutorial.png' })
  await page.getByRole('button', { name: 'Leave the tutorial' }).click()
  await page.getByRole('button', { name: /^Move guide/ }).click()
  await page.waitForTimeout(2500) // the first moves play
  await page.screenshot({ path: 'docs/images/guide.png' })

  await scrambled(page, '/#/en/megaminx')
  await page.screenshot({ path: 'docs/images/megaminx.png' })
})
