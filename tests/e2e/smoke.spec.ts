import { expect, test, type Page } from '@playwright/test'

/** Choose a puzzle through the picker: open it, its category, then the puzzle. */
async function pickCube(page: Page, category: string, name: string) {
  await page.getByRole('button', { name: /^Choix du cube/ }).click()
  await page.getByRole('button', { name: new RegExp(`^${category},`) }).click()
  await page.getByRole('button', { name, exact: true }).click()
}

/** Choose a solving method in its dropdown (a method with a tutorial says
 *  so after its name). */
async function chooseMethod(page: Page, name: RegExp) {
  await page.getByRole('combobox', { name: /^Méthode de résolution/ }).click()
  await page.getByRole('option', { name }).click()
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
  await pickCube(page, 'Miroirs', '4x4 (Revenge) miroir')
  await expect(page.getByText('Cube résolu')).toBeVisible()
  await expect(page.locator('canvas:not([aria-hidden])')).toBeVisible()

  // The editor paints thicknesses instead of colors, and still applies.
  await page.getByRole('button', { name: 'Modifier', exact: true }).click()
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
  await chooseMethod(page, /^Optimale/)

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
  await pickCube(page, 'Standards', '4x4 (Revenge)')
  await chooseMethod(page, /^Réduction par couches/)

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

  await pickCube(page, 'Standards', '4x4 (Revenge)')
  await page.getByRole('button', { name: 'Modifier', exact: true }).click()
  await expect(page.getByText('96 / 96 stickers')).toBeVisible()

  const use = page.getByRole('button', { name: 'Utiliser ce cube' })
  await expect(use).toBeEnabled()
  await use.click()
  await expect(page.getByRole('button', { name: 'Mélanger' })).toBeVisible()
})

test('cube editor: enter, fill from current state, apply', async ({ page }) => {
  await page.goto('/#/fr/3x3')

  // Blank entry shows the palette, then cancel back to play.
  await page.getByRole('button', { name: 'Saisir', exact: true }).click()
  await expect(page.getByRole('radiogroup', { name: 'Couleurs' })).toBeVisible()
  await page.getByRole('button', { name: 'Annuler' }).click()
  await expect(page.getByRole('button', { name: 'Mélanger' })).toBeVisible()

  // Enter pre-filled from the current (solved) cube: 54/54, complete and valid.
  await page.getByRole('button', { name: 'Modifier', exact: true }).click()
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
    ['Standards', '4x4 (Revenge)'],
    ['Standards', '5x5 (Professor)'],
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
    ['Polyèdres', "4-Trajber's Octahedron"],
    ['Polyèdres', 'Octahedron VTO'],
    ['Polyèdres', 'GEM-0 (Jewel)'],
    ['Polyèdres', 'Rainbow'],
    ['Cylindriques', '2-Star Prism (UFO)'],
    ['Cylindriques', '4-Star Prism'],
    ['Engrenages', 'Gear Cube Ultimate'],
    ['Torturés', 'Purple'],
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
  // the conformance suite in tests/unit/puzzles.test.ts).
  ['Standards', '2x2 (Pocket)', '24 / 24 stickers'],
  // Most often out of its box once scrambled: entered in the form it stands in.
  ['Tours', '2x2x4', '40 / 40 stickers'],
  ['Pyramides', 'Pyraminx', '36 / 36 stickers'],
  // Curved pieces.
  ['Pyramides', 'Pyraminx Jing', '28 / 28 stickers'],
  // A 2x2 cut to a tetrahedron, entered by its form.
  ['Pyramides', 'Pyramorphinx', '16 / 16 stickers'],
  // A 4x4x4 cut to an octahedron, one sticker a piece.
  ['Polyèdres', "4-Trajber's Octahedron", '56 / 56 stickers'],
  // Its tips turn on their own.
  ['Polyèdres', 'Octahedron VTO', '72 / 72 stickers'],
  // Corners turning: edges, centers and petals.
  ['Coupes diagonales', 'Rex Cube', '54 / 54 stickers'],
  // Edges turning: curved pieces drawn ray by ray.
  ['Coupes diagonales', 'Curvy Copter III', '102 / 102 stickers'],
  // Out of its box, its big cubes pre-filled.
  ['Torturés', 'Purple', '33 / 33 stickers'],
  // Entered piece by piece: its pieces counted.
  ['Plats', 'Floppy Ghost', '10 / 10 pièces'],
  ['Torturés', 'Z-Twist', '20 / 20 pièces'],
  // Its halves entered cell by cell first, from where they stand.
  ['Torturés', 'Fashion-V', '78 / 78 stickers'],
  // Only the stickers one sees count: the inner points' flat faces fill in.
  ['Cylindriques', '4-Star Prism', '64 / 64 stickers'],
  // Its blocks' marks unseen: found again from its colors.
  ['Soudés', 'Fused', '54 / 54 stickers'],
  // Its joints taken from its state, then its colors.
  ['Soudés', 'Stripe', '54 / 54 stickers'],
  // Out of its box, entered as it stands.
  ['Tours', 'Camouflage 4x4x2', '64 / 64 stickers'],
  // Its gears askew, their pivots taken from its state; gears painted apart.
  ['Engrenages', 'Gear Cube Ultimate', '78 / 78 faces'],
]

for (const [category, name, complete] of ENTERED) {
  test(`${name}: scramble, enter from the current state, apply, then solve`, async ({ page }) => {
    test.setTimeout(180000)
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/#/fr/3x3')
    await page.getByLabel('Vitesse').fill('100')
    await pickCube(page, category, name)
    await page.getByRole('button', { name: 'Mélanger' }).click()
    const fromCurrent = page.getByRole('button', { name: 'Modifier', exact: true })
    await expect(fromCurrent).toBeEnabled({ timeout: 30000 })
    await fromCurrent.click()
    await expect(page.getByText(complete)).toBeVisible()
    await page.getByRole('button', { name: 'Utiliser ce cube' }).click()
    // Its solution computed first (some puzzles take a while: the Z-Twist,
    // the Fashion-V), the button saying so meanwhile.
    const solve = page.getByRole('button', { name: 'Résoudre' })
    await expect(solve).toBeEnabled({ timeout: 60000 })
    await solve.click()
    await expect(page.getByText('Cube résolu')).toBeVisible({ timeout: 90000 })
    expect(errors).toEqual([])
  })
}

test('tower entry: pick the form it stands in, then paint on it', async ({ page }) => {
  await page.goto('/#/fr/3x3')
  await pickCube(page, 'Tours', '2x2x4')
  await page.getByRole('button', { name: 'Saisir', exact: true }).click()
  await expect(page.getByText('Dans quelle forme est votre puzzle ?')).toBeVisible()
  await page.getByRole('button', { name: /^Forme 2,/ }).click()
  await expect(page.getByText('0 / 40 stickers')).toBeVisible()
  await page.getByRole('button', { name: 'Changer de forme' }).click()
  await expect(page.getByRole('button', { name: /^Forme 1 / })).toBeVisible()
  // Back on the same form: its colors kept.
  await page.getByRole('button', { name: /^Forme 2,/ }).click()
  await expect(page.getByText('0 / 40 stickers')).toBeVisible()
})

test('address: a link opens its puzzle and language, back returns to the previous one', async ({
  page,
}) => {
  await page.goto('/#/en/floppy-ghost')
  await expect(page.getByRole('button', { name: 'Cube choice: Floppy Ghost' })).toBeVisible()
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
  await expect(page.getByRole('button', { name: 'Cube choice: Floppy Ghost' })).toBeVisible()
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

test('Camouflage entry: its shape face by face, then the stickers left to paint', async ({
  page,
}) => {
  test.setTimeout(120000)
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/#/fr/camouflage')
  await page.getByLabel('Vitesse').fill('100')
  await page.getByRole('button', { name: 'Mélanger' }).click()
  const fromCurrent = page.getByRole('button', { name: 'Modifier', exact: true })
  await expect(fromCurrent).toBeEnabled({ timeout: 30000 })
  await fromCurrent.click()
  // Its four faces, as it stands, tilted toward us one after the other.
  await page.getByRole('button', { name: 'Changer la forme' }).click()
  const next = page.getByRole('button', { name: 'Saisir la face suivante' })
  for (const face of [1, 2, 3]) {
    await expect(page.getByText(`Face ${face} / 4`)).toBeVisible()
    await next.click()
  }
  await page.getByRole('button', { name: 'Revenir à la face précédente' }).click()
  await expect(page.getByText('Face 3 / 4')).toBeVisible()
  await next.click()
  await page.getByRole('button', { name: 'Trouver la forme' }).click()
  // Found: the stickers the faces show already painted, its sides left.
  await expect(page.getByText(/^\d+ \/ 64 stickers$/)).toBeVisible({ timeout: 20000 })
  await expect(page.getByText('64 / 64 stickers')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('bandaged entry: its joints first, a form it cannot take refused', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/#/fr/stripe')
  await page.getByRole('button', { name: 'Saisir', exact: true }).click()
  // Its three bars left to fuse, no 2x2.
  await expect(page.getByLabel('Pièces 2x1 à souder : 3')).toBeVisible()
  await expect(page.getByLabel(/^Pièces 2x2/)).toHaveCount(0)
  await page.getByRole('button', { name: 'Valider les soudures' }).click()
  await expect(page.getByRole('alert')).toContainText('aucune forme')
  await page.getByRole('button', { name: 'Annuler' }).click()
  await expect(page.getByRole('button', { name: 'Saisir', exact: true })).toBeVisible()
  // From its state, its joints are known: straight to its colors.
  await page.getByRole('button', { name: 'Modifier', exact: true }).click()
  await expect(page.getByText('54 / 54 stickers')).toBeVisible()
  await page.getByRole('button', { name: 'Changer les soudures' }).click()
  await expect(page.getByLabel('Pièces 2x1 à souder : 0')).toBeVisible()
  // Its colors again, kept; then Cancel: out of the entry, whatever the step.
  await page.getByRole('button', { name: 'Valider les soudures' }).click()
  await expect(page.getByText('54 / 54 stickers')).toBeVisible()
  await page.getByRole('button', { name: 'Annuler' }).click()
  await expect(page.getByRole('button', { name: 'Saisir', exact: true })).toBeVisible()
  expect(errors).toEqual([])
})

test('tutorial: a formula applied, looked at, undone; a move by hand finished', async ({
  page,
}) => {
  test.setTimeout(90000)
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/#/fr/3x3')
  await page.getByLabel('Vitesse').fill('100')
  // Solved: nothing to learn yet.
  const tutorial = page.getByRole('button', { name: 'Tutoriel', exact: true })
  await expect(tutorial).toBeDisabled()
  await page.getByRole('button', { name: 'Mélanger' }).click()
  await expect(tutorial).toBeEnabled({ timeout: 30000 })
  await tutorial.click()

  const panel = page.getByRole('region', { name: 'Tutoriel' })
  // The words first (step 0): one on, then past them.
  await expect(panel.getByRole('heading', { name: 'Le vocabulaire' })).toBeVisible()
  await panel.getByRole('button', { name: 'Suivant' }).click()
  await expect(panel.getByText(/^Une arête/)).toBeVisible()
  await panel.getByRole('button', { name: 'Passer' }).click()
  await expect(panel.getByText('Construire la croix jaune')).toBeVisible()
  // The cube it follows cannot be replaced meanwhile.
  await expect(page.getByRole('button', { name: 'Mélanger' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Réinitialiser' })).toBeDisabled()
  const moves = panel.locator('ol ol button')
  const formula = async () => (await moves.allTextContents()).join(' ')
  const before = await formula()

  // Applied: a stop on it, then undone back to the same formula.
  await page.getByRole('button', { name: 'Appliquer la formule' }).click()
  await expect(page.getByRole('button', { name: 'Suivant' })).toBeVisible()
  await page.getByRole('button', { name: 'Annuler le déplacement' }).click()
  await expect(page.getByRole('button', { name: 'Appliquer la formule' })).toBeEnabled()
  expect(await formula()).toBe(before)

  // Its first move by hand, then the rest of it played to the stop.
  await moves.first().click()
  await page.getByRole('button', { name: 'Valider le déplacement' }).click()
  await expect(page.getByRole('button', { name: 'Suivant' })).toBeVisible()
  await page.getByRole('button', { name: 'Suivant' }).click()

  await page.getByRole('button', { name: 'Quitter le tutoriel' }).click()
  await expect(page.getByRole('button', { name: 'Résoudre' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Mélanger' })).toBeEnabled()
  expect(errors).toEqual([])
})

test('tutorial: Space and the arrows press its buttons on and back', async ({ page }) => {
  test.setTimeout(90000)
  await page.goto('/#/fr/3x3')
  await page.getByLabel('Vitesse').fill('100')
  await page.getByRole('button', { name: 'Mélanger' }).click()
  const tutorial = page.getByRole('button', { name: 'Tutoriel', exact: true })
  await expect(tutorial).toBeEnabled({ timeout: 30000 })
  await tutorial.click()
  const panel = page.getByRole('region', { name: 'Tutoriel' })
  // The words: on, then back.
  await page.keyboard.press('ArrowRight')
  await expect(panel.getByText(/^Mot 2 sur/)).toBeVisible()
  await page.keyboard.press('Backspace')
  await expect(panel.getByText(/^Mot 1 sur/)).toBeVisible()
  // A step: its formula applied, then undone.
  await panel.getByRole('button', { name: 'Passer' }).click()
  await page.keyboard.press(' ')
  await expect(page.getByRole('button', { name: 'Suivant' })).toBeEnabled({ timeout: 30000 })
  await page.keyboard.press('ArrowLeft')
  await expect(page.getByRole('button', { name: 'Appliquer la formule' })).toBeEnabled({
    timeout: 30000,
  })
})

test('phone: scrambling or solving from the open panel folds it', async ({ page }) => {
  test.setTimeout(90000)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/fr/3x3')
  await expect(page.getByRole('button', { name: 'Replier le menu' })).toBeVisible()
  await page.getByRole('button', { name: 'Mélanger' }).click()
  const unfold = page.getByRole('button', { name: 'Déplier le menu' })
  await expect(unfold).toBeVisible()
  await unfold.click()
  const solve = page.getByRole('button', { name: 'Résoudre' }).last()
  await expect(solve).toBeEnabled({ timeout: 60000 })
  await solve.click()
  await expect(unfold).toBeVisible()
})

test('phone: the folded bar stops a scramble or a solution in Solve’s place', async ({ page }) => {
  test.setTimeout(90000)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/fr/3x3')
  await page.getByRole('button', { name: 'Replier le menu' }).click()
  await page.getByRole('button', { name: 'Mélanger' }).click()
  const stop = page.getByRole('button', { name: 'Arrêter' })
  await expect(stop).toBeVisible()
  // A few moves in, so the cube is no longer solved.
  await page.waitForTimeout(600)
  await stop.click()
  const solve = page.getByRole('button', { name: 'Résoudre' })
  await expect(solve).toBeEnabled({ timeout: 30000 })
  await solve.click()
  await expect(stop).toBeVisible({ timeout: 30000 })
  await stop.click()
  await expect(solve).toBeVisible({ timeout: 30000 })
})
