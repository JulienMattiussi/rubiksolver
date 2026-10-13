import { expect, test, type Page } from '@playwright/test'

/** Choose a puzzle through the picker: open it, its category, then the puzzle. */
async function pickCube(page: Page, category: string, name: string) {
  await page.getByRole('button', { name: /^Choix du cube/ }).click()
  await page.getByRole('button', { name: new RegExp(`^${category},`) }).click()
  await page.getByRole('button', { name, exact: true }).click()
}

test('loads, renders the cube canvas and the controls', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))

  await page.goto('/#/fr/3x3')

  await expect(page.getByRole('heading', { name: 'Rubik Solver' })).toBeVisible()
  await expect(page.locator('canvas:not([aria-hidden])')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Mélanger' })).toBeVisible()

  // No runtime error (e.g. WebGL/R3F failing to mount).
  expect(errors).toEqual([])
})

test('scrambles then solves back to a solved cube', async ({ page }) => {
  // Beginner-method solutions are long; the animation can take a while.
  test.setTimeout(120000)
  await page.goto('/#/fr/3x3')

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

test('mirror cube: the variant is a skin, it keeps the state and renders', async ({ page }) => {
  // A scramble animation plus two cube mounts; slow when the suite runs in parallel.
  test.setTimeout(120000)
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/#/fr/3x3')
  await page.getByLabel('Vitesse').fill('100')

  const scramble = page.getByRole('button', { name: 'Mélanger' })
  await scramble.click()
  await expect(page.getByRole('button', { name: 'Résoudre' })).toBeEnabled({ timeout: 30000 })

  // Same cube, still scrambled: only its rendering changed.
  await pickCube(page, 'Miroirs', '3x3 miroir')
  await expect(page.getByText('Prêt')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Réinitialiser' })).toBeEnabled()

  // A mirror size switch mounts fine too (the 4x4 has middle layers).
  await pickCube(page, 'Miroirs', '4x4 miroir')
  await expect(page.getByText('Cube résolu')).toBeVisible()
  await expect(page.locator('canvas:not([aria-hidden])')).toBeVisible()

  // The editor paints thicknesses instead of colors, and still applies.
  await page.getByRole('button', { name: /Depuis l.?.tat actuel/ }).click()
  await expect(page.getByRole('radiogroup', { name: 'Épaisseurs' })).toBeVisible()
  await expect(page.getByText('96 / 96 stickers')).toBeVisible()
  await page.getByRole('button', { name: 'Utiliser ce cube' }).click()
  await expect(page.getByRole('button', { name: 'Mélanger' })).toBeVisible()

  expect(errors).toEqual([])
})

test('1x2x3: half turns only, scramble then solve optimally', async ({ page }) => {
  test.setTimeout(120000)
  await page.goto('/#/fr/3x3')

  await page.getByLabel('Vitesse').fill('100')
  await pickCube(page, 'Plats', '1x2x3')

  // Its shape allows no quarter turn at all, and nothing on its thin axis:
  // four half-turn buttons, no clockwise/counter-clockwise pair.
  await expect(page.getByRole('button', { name: /Retourner la face/ })).toHaveCount(4)
  await expect(page.getByRole('button', { name: /sens horaire/ })).toHaveCount(0)

  const scramble = page.getByRole('button', { name: 'Mélanger' })
  const solve = page.getByRole('button', { name: 'Résoudre' })

  await scramble.click()
  await expect(solve).toBeEnabled({ timeout: 30000 })

  await solve.click()
  await expect(scramble).toBeEnabled({ timeout: 30000 })
  await expect(solve).toBeDisabled()
})

test('2x2: switch size, scramble, then solve with the optimal method', async ({ page }) => {
  test.setTimeout(120000)
  await page.goto('/#/fr/3x3')

  await page.getByLabel('Vitesse').fill('100')
  await pickCube(page, 'Standards', '2x2 (Pocket)')

  // The 2x2 offers the optimal method; its solutions are at most 11 moves.
  await page.getByLabel('Méthode de résolution').selectOption('optimal')

  const scramble = page.getByRole('button', { name: 'Mélanger' })
  const solve = page.getByRole('button', { name: 'Résoudre' })

  await scramble.click()
  await expect(solve).toBeEnabled({ timeout: 30000 })

  await solve.click()
  await expect(scramble).toBeEnabled({ timeout: 60000 })
  await expect(solve).toBeDisabled()
})

test('4x4: switch size, scramble, then solve by reduction', async ({ page }) => {
  // Reduction solutions run to ~300 turns; even at max speed this takes a while.
  test.setTimeout(300000)
  await page.goto('/#/fr/3x3')

  await page.getByLabel('Vitesse').fill('100')
  await pickCube(page, 'Standards', '4x4')
  await page.getByLabel('Méthode de résolution').selectOption('reduction')

  const scramble = page.getByRole('button', { name: 'Mélanger' })
  const solve = page.getByRole('button', { name: 'Résoudre' })

  await scramble.click()
  await expect(solve).toBeEnabled({ timeout: 60000 })

  await solve.click()
  await expect(scramble).toBeEnabled({ timeout: 240000 })
  await expect(solve).toBeDisabled()
})

test('4x4 cube editor: movable centers count toward the 96 stickers', async ({ page }) => {
  await page.goto('/#/fr/3x3')

  await pickCube(page, 'Standards', '4x4')
  await page.getByRole('button', { name: /Depuis l.?.tat actuel/ }).click()
  await expect(page.getByText('96 / 96 stickers')).toBeVisible()

  const use = page.getByRole('button', { name: 'Utiliser ce cube' })
  await expect(use).toBeEnabled()
  await use.click()
  await expect(page.getByRole('button', { name: 'Mélanger' })).toBeVisible()
})

test('cube editor: enter, fill from current state, apply', async ({ page }) => {
  await page.goto('/#/fr/3x3')

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

test('move guide: every turn of the current puzzle, a jammed one marked', async ({ page }) => {
  await page.goto('/#/fr/3x3')
  await pickCube(page, 'Tours', '2x2x4')
  await page.getByRole('button', { name: 'Guide des mouvements' }).click()
  const guide = page.getByRole('dialog', { name: 'Guide des mouvements' })
  await expect(guide).toBeVisible()
  await expect(
    guide.getByText('On tourne la face du haut d’un demi-tour', { exact: false }),
  ).toBeVisible()
  // In its box, the tower jams its side faces.
  await expect(
    guide.getByText('Ce mouvement n’est pas possible dans cette configuration').first(),
  ).toBeAttached()
  await page.keyboard.press('Escape')
  await expect(guide).toBeHidden()
})

test('move guide: opens on every puzzle, without an error', async ({ page }) => {
  test.setTimeout(120000)
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/#/fr/3x3')
  const puzzles: [string, string][] = [
    ['Standards', '2x2 (Pocket)'],
    ['Standards', '3x3'],
    ['Standards', '4x4'],
    ['Standards', '5x5'],
    ['Miroirs', '3x3 miroir'],
    ['Tours', '2x2x3 (Slim Tower)'],
    ['Tours', '3x3x2 (Domino)'],
    ['Plats', '1x2x3'],
    ['Plats', '3x3x1 (Floppy)'],
    ['Plats', 'Floppy Ghost'],
    ['Pyramides', 'Pyraminx'],
    ['Pyramides', 'Master Pyraminx (4x4)'],
    ['Pyramides', 'Professor Pyraminx (5x5)'],
    ['Pyramides', 'Pyraminx Jing'],
    ['Pyramides', 'Pyramorphinx'],
    ['Octaèdres', "4-Trajber's Octahedron"],
    ['Octaèdres', 'Octahedron VTO'],
    ['Octaèdres', 'GEM-0 (Jewel)'],
    ['Octaèdres', 'Rainbow'],
    ['Étoiles', '2-Star Prism (UFO)'],
    ['Étoiles', '4-Star Prism'],
    ['Engrenages', 'Gear Cube Ultimate'],
    ['Bizarres', 'Violet'],
  ]
  for (const [category, name] of puzzles) {
    await pickCube(page, category, name)
    await page.getByRole('button', { name: 'Guide des mouvements' }).click()
    const guide = page.getByRole('dialog', { name: 'Guide des mouvements' })
    await expect(guide.locator('figure').first()).toBeVisible()
    await page.keyboard.press('Escape')
  }
  expect(errors).toEqual([])
})

/** Puzzles entered from a scrambled state, then solved: their category, name,
 *  and the stickers the editor counts. */
const ENTERED: [string, string, string][] = [
  // One of each kind of model (the others of a kind enter the same way, see
  // the conformance suite in tests/unit/puzzles.test.ts). Not the Gear
  // Cubes: a scramble leaves their gears askew, which they are not entered in.
  ['Standards', '2x2 (Pocket)', '24 / 24 stickers'],
  // Most often out of its box once scrambled: entered in the form it stands in.
  ['Tours', '2x2x4', '40 / 40 stickers'],
  ['Pyramides', 'Pyraminx', '36 / 36 stickers'],
  // Curved pieces.
  ['Pyramides', 'Pyraminx Jing', '28 / 28 stickers'],
  // A 2x2 cut to a tetrahedron, entered by its form.
  ['Pyramides', 'Pyramorphinx', '16 / 16 stickers'],
  // A 4x4x4 cut to an octahedron, one sticker a piece.
  ['Octaèdres', "4-Trajber's Octahedron", '56 / 56 stickers'],
  // Its tips turn on their own.
  ['Octaèdres', 'Octahedron VTO', '72 / 72 stickers'],
  // Corners turning: edges, centers and petals.
  ['Coupes diagonales', 'Rex Cube', '54 / 54 stickers'],
  // Out of its box, its big cubes pre-filled.
  ['Bizarres', 'Violet', '33 / 33 stickers'],
  // Entered piece by piece: its pieces counted.
  ['Plats', 'Floppy Ghost', '10 / 10 pièces'],
  ['Bizarres', 'Z-Twist', '20 / 20 pièces'],
  // Only the stickers one sees count: the inner points' flat faces fill in.
  ['Étoiles', '4-Star Prism', '64 / 64 stickers'],
]

for (const [category, name, complete] of ENTERED) {
  test(`${name}: scramble, enter from the current state, apply, then solve`, async ({ page }) => {
    test.setTimeout(120000)
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/#/fr/3x3')
    await page.getByLabel('Vitesse').fill('100')
    await pickCube(page, category, name)
    await page.getByRole('button', { name: 'Mélanger' }).click()
    const fromCurrent = page.getByRole('button', { name: /Depuis l.?.tat actuel/ })
    await expect(fromCurrent).toBeEnabled({ timeout: 30000 })
    await fromCurrent.click()
    await expect(page.getByText(complete)).toBeVisible()
    await page.getByRole('button', { name: 'Utiliser ce cube' }).click()
    const solve = page.getByRole('button', { name: 'Résoudre' })
    await expect(solve).toBeEnabled()
    await solve.click()
    await expect(page.getByText('Cube résolu')).toBeVisible({ timeout: 90000 })
    expect(errors).toEqual([])
  })
}

test('tower entry: pick the form it stands in, then paint on it', async ({ page }) => {
  await page.goto('/#/fr/3x3')
  await pickCube(page, 'Tours', '2x2x4')
  await page.getByRole('button', { name: 'Saisir un cube' }).click()
  await expect(page.getByText('Dans quelle forme est votre puzzle ?')).toBeVisible()
  await page.getByRole('button', { name: /^Forme 2,/ }).click()
  await expect(page.getByText('0 / 40 stickers')).toBeVisible()
  await page.getByRole('button', { name: 'Changer de forme' }).click()
  await expect(page.getByRole('button', { name: /^Forme 1 / })).toBeVisible()
})

test('address: a link opens its puzzle and language, back returns to the previous one', async ({
  page,
}) => {
  await page.goto('/#/en/floppy-ghost')
  await expect(page.getByRole('button', { name: 'Cube choice : Floppy Ghost' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Scramble' })).toBeVisible()
  await page.getByRole('button', { name: /^Cube choice/ }).click()
  await page.getByRole('button', { name: /^Pyramids,/ }).click()
  await page.getByRole('button', { name: 'Pyraminx', exact: true }).click()
  await expect(page).toHaveURL(/#\/en\/pyraminx$/)
  await page.getByRole('group', { name: 'Language' }).getByRole('button', { name: 'fr' }).click()
  await expect(page).toHaveURL(/#\/fr\/pyraminx$/)
  await page.goBack()
  await page.goBack()
  await expect(page).toHaveURL(/#\/en\/floppy-ghost$/)
  await expect(page.getByRole('button', { name: 'Cube choice : Floppy Ghost' })).toBeVisible()
})

test('home page: a gallery to choose from, the solve block grayed, the title leads back', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/')
  await expect(page).toHaveURL(/#\/fr$/)
  await expect(
    page.getByRole('heading', {
      name: /^Choisissez votre modèle dans la galerie, parmi les \d+ disponibles$/,
    }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Choix du cube : Choisissez un modèle' }),
  ).toBeVisible()
  await expect(
    page.getByText('Choisissez un modèle pour voir les choix de solution.'),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Résoudre' })).toBeDisabled()
  await page.getByRole('button', { name: 'Floppy Ghost' }).click()
  await expect(page).toHaveURL(/#\/fr\/floppy-ghost$/)
  await expect(page.locator('canvas:not([aria-hidden])')).toBeVisible()
  await page.getByRole('button', { name: 'Rubik Solver' }).click()
  await expect(page).toHaveURL(/#\/fr$/)
  await expect(
    page.getByRole('heading', {
      name: /^Choisissez votre modèle dans la galerie, parmi les \d+ disponibles$/,
    }),
  ).toBeVisible()
  expect(errors).toEqual([])
})
