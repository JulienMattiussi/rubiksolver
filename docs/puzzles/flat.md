# Les puzzles plats

Détail des puzzles de la catégorie (modèles : `src/lib/puzzles/flat/`, méthodes : `src/lib/methods/flat/`, dessins : `src/three/puzzles/flat/`). Les principes communs sont dans [AGENTS.md](../../AGENTS.md).

## Le 1x2x3 (`123`)

Le 1x2x3 est `[3, 2, 1]` : 3 de large, 2 de haut et 1 d'épaisseur, si bien
que le rectangle 3x2 qu'on regarde est sa face avant. Tout se déduit de ces
trois nombres (voir « Une forme, trois nombres » dans AGENTS.md) : exactement
**U2, D2, L2, R2**, 4 orientations, des faces de 2, 3 et 6 stickers (22 en
tout).

Comme son axe fin expose ses deux côtés, les pièces d'extrémité du 1x2x3 portent
**quatre stickers** (les autres trois) : elles restent des « coins » pour la
saisie, c'est-à-dire des pièces uniques et orientées.

**Résolution** : 96 états seulement, diamètre 6, donc une BFS exhaustive
(`solveExhaustively`, `solve/exhaustive.ts`, partagé avec le Floppy et le Floppy Ghost) rend
la solution la plus courte, exposée par la méthode **Optimale**. La borne de recherche vaut 7 : un état
solvable est toujours trouvé avant, donc l'échec prouve un puzzle impossible,
ce dont la validation se sert. Le test parcourt **tout l'espace d'états** et
vérifie que chacun se résout, et que 6 coups suffisent toujours.

**Coins puis arêtes** (son tutoriel, `lib/tutorials/flat/cube123.ts`, la
méthode qu'il enseigne) : ses deux arêtes (les pièces du milieu, en haut et
en bas) ne quittent jamais leur rangée, un demi-tour du haut ou du bas les
retournant seulement ; celle du haut dit comment le tenir (le blanc en
haut, sa couleur de devant face à soi, `frameOf`). (1) Les coins un à un, en
demi-tours qui gardent ceux placés et l'arête du haut (cinq au plus ; le
quatrième vient avec le troisième) ; (2) l'arête du bas retournée, une fois
sur deux, par `U2 L2 U2 R2 D2 R2`, qui ne touche qu'elle. Le test parcourt
les 96 états.

> La tranche du milieu (la colonne centrale) n'est volontairement pas proposée :
> la tourner équivaut à `L2 R2` suivi d'une rotation du puzzle entier, qui ne
> change pas ce que « résolu » veut dire (pas de centre fixe pour ancrer un
> repère). Aucun état n'est donc perdu.

## Le Floppy 3x3x1 (`331`)

Le Floppy (`[3, 1, 3]`, `methods/flat/floppy.ts`, d'après fan2cube.fr/floppy1)
est un 3x3 d'une seule couche : seulement `R2 L2 F2 B2`, 192 états, diamètre
8 (tout est vérifié en parcourant l'espace entier). Les arêtes ne quittent
jamais leur place, un demi-tour les retourne ; seuls les coins voyagent. Méthode **Coins puis arêtes**, celle de son tutoriel
(`lib/tutorials/flat/floppy.ts`) : (1) coins placés un à un en demi-tours,
(2) arêtes retournées deux par deux par `(F2 R2)3`, qui retourne l'avant et
la droite sans rien toucher d'autre : tenu les deux à l'envers devant et à
droite, ou, opposées, l'une devant (elles finissent côte à côte), ou toutes
les quatre, n'importe comment. Le test parcourt les 192 états. En saisie,
ses arêtes (qui se retournent) se peignent.

**Ce que partagent leurs tutoriels** (`lib/tutorials/flat/flatKit.ts`) :
une pièce s'y nomme par sa place (`flatPieceKind`) et par les couleurs de
son pourtour, les deux grandes faces à part (`flatOutside`), et chaque côté
par sa couleur dans le repère que disent les pièces qui ne bougent pas
(`frameOf`, `frameColor`) ; les coins se placent par la même étape
(`cornerStage`).

## Le Floppy Ghost (`ghost`)

Le Floppy Ghost (fan2cube.fr/floppyghost1, le Floppy Megaminx Ghost) est
une plaque carrée découpée le long des cinq droites d'un **pentagramme**.
Sa mécanique est un Floppy Megaminx : un centre fixe (le pentagone), cinq
arêtes (les branches de l'étoile) et cinq sommets (entre deux branches). Un
coup **retourne un côté** d'un demi-tour, autour de l'axe qui passe par le
centre perpendiculairement à sa coupe : son arête se retourne sur place,
ses deux sommets s'échangent en se retournant. Le pentagramme est incliné
(9° comme sur le schéma de la page) et un peu décentré : chaque pièce a sa
forme, qu'un coup couche de travers, donc le puzzle se déforme.

**Modèle entier** (`lib/puzzles/flat/ghost.ts`, puzzle sans grille, `isGridless`) : 10
emplacements tous les 36° autour du centre (pairs : arêtes, impairs :
sommets), des positions entières qui ne servent qu'à les distinguer
(`GHOST_SLOTS`, `SHAPE_DIMS` `[7, 7, 1]`). Les normales des côtés sont des
directions du plan tous les 18° (`PLANE_NORMALS` de geometry.ts, indices 20
à 35 hors des 4 faces du cube), devant et derrière restent `F` et `B`. Le
demi-tour du côté k est une **réflexion** : emplacement m -> 4k - m (mod 10),
direction j -> 9 - 8k - j (mod 20), z -> -z. Un seul sens de tenue
(`symmetries: []` dans son modèle, que lit `cubeOrientations` : le carré
n'a aucune symétrie qui garde la mécanique).
Les couleurs (celles du cube, dessinées en argent) ne servent qu'à identifier
les pièces ; deux paires arête/sommet partagent les mêmes, d'où les arêtes
listées avant les sommets (elles ne quittent jamais leur emplacement et
prennent les leurs en premier dans `pieceSearch`).

**30 720 états**, diamètre 15, tout l'espace parcouru par les tests (la
page, qui en annonce 1 920, ignore le sens des sommets).

**Notation** : lettres de fan2cube en français (H, D, B, P, G : haut,
droite, bas à droite, bas à gauche, gauche), U R D B L en anglais, toujours
avec `2` (un demi-tour, le `H²` de la page). `parseGhostMoves` lit les
formules de la page.

**Rendu** (`three/puzzles/flat/ghostGeometry.ts`) : chaque pièce est sa région du carré
(découpée par demi-plans), extrudée, dessinée chez elle puis posée par
l'élément du groupe diédral qui l'a amenée (rotation d'un cinquième ou
retournement autour d'un axe), retrouvé depuis son emplacement et le sens de
son sticker avant. Tout est argenté (`PolyDrawing.skin`). Un test vérifie
que la géométrie donne à chaque pièce les côtés du carré que disent ses
stickers, et que **chaque pose d'un emplacement a sa propre forme** :
l'argent suffit à tout distinguer.

**Résolution** (méthode **Coins puis arêtes**, d'après la page, celle de
son tutoriel, `lib/tutorials/flat/ghost.ts` ; ses formules dans
`methods/flat/ghost.ts`) : (1) sommets placés un à un, par un coup ou le
3-cycle `(H²D²)²` ; (2) sommets retournés deux par deux avec
`D²B²P²G².P²B²D²H²` (retourne les deux sommets du haut, et deux arêtes) ;
(3) arêtes retournées deux par deux avec `(H²D²)³`. Chaque formule sert
depuis les cinq côtés (la mécanique est la même vue de chacun,
`aroundGhost`) ; chaque pas joue la plus courte suite de formules qui
amène la pièce choisie, les pièces placées gardées.

**Sa légende** : tout argenté, ses pièces se nomment par une légende
(`Tutorial.legend`, voir AGENTS.md) : coins A à E et arêtes 1 à 5, dans le
sens horaire depuis le haut, chacun dessiné seul, à l'endroit et à
l'envers. Il ne se tient que d'une façon (une seule tenue).

**Saisie pièce par pièce** (voir AGENTS.md) : des milliers de formes,
impossibles à proposer en vignettes.
