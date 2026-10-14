# Les troués

Détail des puzzles de la catégorie (modèles : `src/lib/puzzles/holey/`, méthodes : `src/lib/methods/holey/`, dessins : `src/three/puzzles/holey/`). Les principes communs sont dans [AGENTS.md](../../AGENTS.md).

## Le Holey Megaminx (`holey`)

Le Holey Megaminx (fan2cube.fr/holeymegaminx1) est le
Megaminx sans ses centres, des trous à leur place : 50 pièces, mêmes coups,
même méthode (**L'étoile prolongée**), même dessin. Son modèle
(`lib/puzzles/holey/models.ts`) reprend celui du Megaminx, voir
[polyhedron.md](polyhedron.md). Sans
centres, la cible est la tenue du puzzle résolu avec laquelle s'accordent le
plus d'étapes, puis le plus de pièces ; ses tours étant des permutations
paires, les 60 tenues sont atteignables.

## Le Tori (`tori`)

Le Tori (fan2cube.fr/tori1 et 2) est « un Rubik's Cube sans
sommets » : 6 centres fixes et 12 arêtes. Le
modèle est celui du 3x3 sans ses coins (`solvedCube`), coups compris.

**Rendu** (`three/puzzles/holey/toriGeometry.ts`) : le solide est un cube arrondi
(|x|³ + |y|³ + |z|³ <= R³), coupé par les plans du 3x3 assez loin du
centre pour qu'il ne reste rien là où seraient les coins. Chaque centre est
un grand carré arrondi, percé jusqu'au cœur (un anneau, coloré jusque dans
le trou comme le plastique du vrai puzzle), chaque arête une mince amande
le long d'une arête du cube, de la couleur de chaque face de part et
d'autre de son arête vive. La surface est maillée en polaire autour du
milieu de chaque face (trous ronds), normales lissées.

**Résolution** (`methods/holey/tori.ts`, méthode **Croix prolongée**, d'après
la page) : comme un Rubik's Cube dont on ignore les coins. (1) croix du
bas : A², BDB'A et DHD' ; (2) arêtes du milieu, d'un simple commutateur,
[H'A'] ou [HD], aucun coin à préserver ; (3) croix du haut, deux arêtes
retournées à la fois par A[HD]A'H' ; (4) arêtes du haut par deux 3-cycles.
H place les pièces dessous. Saisie des stickers comme un 3x3, centres
pré-remplis.

## L'Edge Only (`edge`)

L'Edge Only (fan2cube.fr/edgeonly1 et 2) : « comme le
Void Cube mais sans sommets », les 12 arêtes d'un 3x3 seules, chaque face
percée d'un trou carré. Le modèle est le 3x3 réduit à ses arêtes et à son
cœur caché : sans lui, rien ne le distinguerait du Dino Cube (12 pièces à
deux stickers aux mêmes places). Rendu (`three/puzzles/shared/dinoGeometry.ts`) : les
pièces du Dino, le cube coupé le long des diagonales de ses faces, chacune
coupée en plus par le trou (un tiers de la face) : un prisme le long de son
arête, un trapèze sur chacune de ses deux faces.

**Résolution** (`methods/holey/edgeOnly.ts`, méthode **Croix prolongée**) : la
page le résout « comme un Void Cube en ignorant les sommets », c'est-à-dire
comme le Tori, dont il reprend les formules. Sans centres, rien ne fixe les
couleurs : la cible est la tenue du puzzle résolu la plus proche parmi
celles que ses arêtes peuvent atteindre (même parité de retournements),
et l'Edge Only est lu comme le Tori qu'il serait avec les centres de cette
tenue, ses couleurs renommées ; le plan du Tori le résout, mêmes coups. Une
arête retournée seule reste impossible, quelle que soit la tenue (testé).
