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

## Le Void Cube (`void`)

Le Void Cube (fan2cube.fr/voidcube1 et 2, Katsuhiko Okamoto, 2007) : un
3x3 sans centres, 8 sommets et 12 arêtes autour d'un cœur caché (sans lui,
rien ne le distinguerait du Dino Cylinder : autant de pièces et de
stickers). Ses tranches tournent (`inner: ['slice', 'wide']`) et entrent
dans le mélange : une tranche déplace quatre arêtes sans aucun sommet, d'où
la « singularité », deux arêtes à échanger, dans à peu près un mélange sur
deux. Résolu quand chaque face est d'une couleur, quelle que soit la tenue.
Dessiné en cubies, le cœur caché n'est pas dessiné (`CubeModel` : un puzzle
à grille sans centres est creux), on voit au travers.

**Résolution** (`methods/holey/voidCube.ts`, méthode **Les sommets du bas
d'abord**, la page 2) : sans centres, les couleurs viennent du sommet en DBL,
comme sur le 2x2 (`frame2`) ; le Void Cube est lu comme le 3x3 qu'il serait
avec ces centres, ses couleurs renommées. (1) sommets du bas « comme le
Pocket », par [DH] ; (2) arêtes du bas par [Hd], dHd'H et [HD][H'A'] (les
tranches gardent les sommets) ; (3) arêtes du milieu comme sur un 3x3 ; (4)
la singularité s'il y en a une (arêtes et sommets permutés de parités
différentes) : X = (aH)²(aH')²aH²(aH')² échange (HA) et (HD) ; (5) le haut
comme sur un 3x3 (débutant). La singularité est levée avant le haut, et non
à la fin comme sur la page : les étapes du haut d'un 3x3 ne savent pas
échanger deux arêtes seules. La formule Y (une singularité de sommets
changée en singularité d'arêtes) n'est donc pas reprise.

**Les méthodes du 3x3** (`methods/holey/voidFrames.ts`, `voidPlan`) : par
couches, CFOP, Roux, Petrus et ZZ, telles quelles. Sans centres, on choisit
leurs couleurs : chaque étape lit le Void Cube comme l'un des 3x3 qu'il
pourrait être (24 façons de nommer ses couleurs), sans singularité, et où
l'étape d'avant tient (ses phases sur la même lecture). Un quart de tour des
couleurs fait trois 4-cycles d'arêtes et deux de sommets : la moitié des
lectures n'ont pas de singularité, c'est « la signature des centres = la
signature des arêtes ». Une tranche (le M de Roux) tourne quatre arêtes
sans sommet : sur un 3x3 elle tourne aussi quatre centres, alors les
centres lus peuvent être là où les tranches de la méthode les laissent
(`centerSets`), la parité d'un 3x3 (arêtes et sommets ensemble comme les
centres) en tenant compte.

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
