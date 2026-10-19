# Les engrenages

Détail des puzzles de la catégorie (modèles : `src/lib/puzzles/gear/`, méthodes : `src/lib/methods/gear/`, dessins : `src/three/puzzles/gear/`). Les principes communs sont dans [AGENTS.md](../../AGENTS.md).

## Les Gear Cubes (`gearU`, `gearCube`, `gearX`)

Les Gear Cubes (fan2cube.fr/gearcube1 et 2, Jaap) sont
des 3x3x3 dont les arêtes sont des engrenages : les deux faces d'un axe sont
des planétaires, la tranche entre elles leur porte-satellites, ses quatre
arêtes les satellites. La tranche reste donc toujours à mi-chemin de ses
faces : un **demi-tour de face** (l'opposée tenue) la fait tourner d'un
**quart**, dans le même sens. C'est le seul coup (`GearMove`, le D² de
fan2cube, le R de Jaap) : un quart de tour de face laisserait la tranche à
45°, où plus rien ne tourne. L'**Ultimate** (le vrai, à 12 engrenages) a la
mécanique du Gear Cube, mais ses engrenages ne retrouvent la forme du cube que tous
les trois coups (six quarts de tour de face).

**Modèle** (`lib/puzzles/gear/gear.ts`) : un 3x3x3, chaque arête un engrenage. Ses
couleurs sont celles du vrai puzzle (`scheme` sur sa carte, lu par `faceColorsOf`) : vert foncé devant,
violet à la place du rouge, rouge à la place de l'orange. Les quatre
engrenages de la tranche pivotent sur leurs agrafes de cinq sixièmes de
tour par coup (300°, `GEAR_SPIN`), dans le même sens pour un coup horaire de
l'une ou l'autre face : ce pivot, qu'aucune rotation du cube ne dit, est
`Cubie.spin` (en sixièmes), gardé par la clé d'état, le mémorisé (`@n`) et
les rotations du puzzle entier ; « résolu » l'exige à zéro. Les stickers des
arêtes sont leur base (les « agrafes ») ; l'engrenage porte les mêmes
couleurs, tourné de son pivot : au bout de trois coups (900°), il est
retourné sur ses agrafes, ses couleurs à l'envers des leurs. Le
modèle est vérifié contre Jaap : 4 × 41 472 et 4 × 165 888 positions (le
facteur 4 : les tenues que les coups atteignent, la « téléportation » de
fan2cube). Effets testés : `R2 R2 R2` laisse les 4 engrenages de la
tranche retournés sur leurs agrafes, `(F2 R2)³` n'échange que les agrafes,
G'²D² retourne le cube.

**Animation à deux vitesses** : `halfTurnedBy` donne les pièces qui tournent
à moitié (la tranche), dans leur propre groupe (`halfRef`) ; leurs
engrenages pivotent en suivant l'avancement du coup (`turnSpin`,
`progress`). **Rendu** : la face est dessinée à plat, pièce par pièce, par
`scripts/gear_face.py` (13 pièces : coins, engrenages, carré central,
agrafes), qui produit aussi les masques de `src/assets/gear` et
`outlines.json`. En 3D (`gearFace.ts`, `GearPlate.tsx`), chaque pièce
est une plaque sur sa face, découpée par le masque de sa sorte tourné à sa
place (alpha test), sur un corps noir à sa forme (`pieceBody` : le contour
de sa sorte, enfoncé dans le
cube sous chacune de ses faces : un bloc cacherait les dents des engrenages
qui sortent), un noyau noir comblant le milieu. La vignette du sélecteur
dessine la même face (`drawGear`, depuis `outlines.json`). Le guide montre
aussi chaque coup trois fois de suite (`3U2`, `GearMove.times`) : les
engrenages font deux tours et demi et le cube reprend sa forme. L'engrenage
d'une arête (ses deux plaques et son corps) pivote autour de l'axe de
l'arête (du centre du cube à travers elle) : hors de sa place il sort du
cube en biais, et ne s'y réemboîte qu'à un demi-tour près, tous les trois
coups ; ses agrafes suivent la pièce, pas l'engrenage.

**Résolution** (`methods/gear/gear.ts`, méthode **Coins d'abord**, d'après
fan2cube.fr/gearcube2) : chaque étape cherche parmi les seules formules de
la page, qui laissent les étapes d'avant intactes : (1) coins, par tous les
coups ; (2) arêtes placées, D⁴ et P²D⁴P'² ; (3) agrafes, (A²D²)³ (échange
les agrafes des 8 arêtes du haut et du bas, engrenages revenus tels quels) ;
(4) engrenages, D⁸ (pivote d'un tiers les 4 engrenages d'une tranche). Les
centres suivent. **Saisie** dans tout état : d'abord le pivot des
engrenages (une étape de bascules, `lib/puzzles/gear/gearEntry.ts` : un clic fait pivoter d'un
sixième les quatre engrenages d'une tranche, qui le partagent toujours ; ce
qui se voit, `shownSpin`, un engrenage étant le même un demi-tour plus
loin), puis les stickers comme un 3x3, centres pré-remplis
(`fixedPieces`), sur ses propres pièces (sa vue de saisie,
`GearEditView`, les dessine comme en jeu, un clic sur le corps d'une pièce
la peint). Agrafes et engrenages se peignent à
part : les agrafes sont les stickers, les engrenages des couleurs gardées
à côté (les parties de sa peinture, `parts`, par les mêmes identifiants). Un
engrenage porte la paire de ses agrafes dans un sens ou dans l'autre : une
fois celle-ci connue, une face de l'engrenage donne l'autre et une couleur
hors de la paire est refusée (`completeGears`). À la validation, son
modèle (`built`) dit quels engrenages sont retournés sur leurs agrafes (ou
refuse un engrenage qui n'a pas leurs couleurs), et les pose
(`withTurnedGears` ; ses parties lues sur un état en sens inverse, `of`). « Modifier » est grisé tant qu'un engrenage est
de travers (`gearsAligned` : pivot nul ou d'un demi-tour). Le décompte et la palette comptent aussi les faces des
engrenages (le décompte des parties, `count`).

**Le Gear Cube** (`gearCube`) : la même mécanique, agrafes sans couleur
(noires) et couleurs standard. Seul l'engrenage se voit : des agrafes
retournées d'un demi-tour, l'engrenage d'un demi-tour en arrière dessus,
c'est la même arête. Ses arêtes portent `Cubie.plainClips` (ce qui le
distingue de l'Ultimate pour `cubeShape`, et `*` dans le mémorisé), et
`applyGearMove` les écrit toujours pivot sous 3 (`asSeen` : la pièce
retournée sur son axe, le pivot moins 3). La méthode perd l'étape des agrafes ((A²D²)³ n'y change rien de
visible) ; ses arêtes se placent dans le bon sens avec D⁴ et D⁸. Saisie :
les engrenages sont les stickers (`hasColoredClips` décide de la saisie à
part de l'Ultimate).

**Le Gear Cube Extreme** (`gearX`, fan2cube.fr/gearultimate1 et 2, qui le
nomment Ultimate) : la tranche du milieu n'a pas d'engrenages, ses quatre
arêtes sont des blocs (`gearAt`, dessinés comme un bloc qui finit en
agrafe : la sorte `block` de `scripts/gear_face.py`). Le haut et le bas
tournent donc d'un quart, comme sur un 3x3 (des `Move` parmi les coups
d'engrenage, `gearTurnsOf` ; `applyMove` garde le pivot des pièces), les
côtés par engrenages, comme l'Ultimate (trois coups pour retrouver la
forme). Méthode **Équateur puis coins** (`methods/gear/gearExtreme.ts`, d'après
la page) : (A) l'équateur et les centres, par tous les coups ; (B) les coins
du bas descendus un à un, (D²H)².(D²H²)² ; (C) ceux du haut, 3-cycle et
échange ; (D) les arêtes du bas isolées en bas, (BG²B'G'²)⁵ ; (E) toutes
placées, (HA,HD)(BA,BD) ; (F) les agrafes, D²(D²H)¹²D'² ; (G) les
engrenages, (D²H)².D⁸.(H'D'²)². Les formules sont aussi jouées à l'envers,
préparées par des tours du haut et du bas, sur
les seules pièces de l'étape, une pièce à la fois (`parseGearFormula` lit
la notation de la page). L'étape (G) cherche autrement
(`methods/gear/spinSearch.ts`) : chaque variante de la formule ne fait que
faire pivoter des engrenages, toujours des mêmes sixièmes quel que soit
l'état (testé), donc elle est notée une fois par ce qu'elle ajoute aux 8
pivots, et la recherche porte sur ces seuls pivots, une variante une
addition (6⁸ états au plus) : la plus courte suite de variantes, en une
fraction de seconde, là où rejouer chaque variante coup par coup prenait
de 8 à 27 s (et deux à trois fois plus de coups). **Saisie** comme l'Ultimate, pivot des
engrenages d'abord, mais chacun le sien (`spinMates` : le haut et le bas
font passer les engrenages d'une tranche à l'autre), ses blocs peints comme
des stickers ;
ses centres se peignent (les tranches les sortent du haut et du bas, que sa
couche du milieu, immobile, tient en place).
