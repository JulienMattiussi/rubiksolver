# Les pyramides

Détail des puzzles de la catégorie (modèles : `src/lib/puzzles/pyramid/`, méthodes : `src/lib/methods/pyramid/`, dessins : `src/three/puzzles/pyramid/`). Les principes communs sont dans [AGENTS.md](../../AGENTS.md).

## Le Pyraminx (`src/lib/puzzles/pyramid/pyraminx.ts`)

Un tétraèdre dont chaque sommet tourne par tiers de tour : toute la
**couche** sous le sommet (sa pointe, son centre et ses trois arêtes) ou sa
**pointe** seule. 14 pièces : 4 pointes et 4 centres (trois triangles d'une
seule pièce, un octaèdre) qui ne font que pivoter sur place, 6 arêtes qui
voyagent, plus le noyau caché.

Le modèle reste **entier et exact** : les sommets sont aux coins alternés
d'un cube (`PYRA_CORNERS` : U (1,1,1), L, R, B), donc un tiers de tour
autour de l'un d'eux est une permutation signée des coordonnées
(`(x, y, z) -> (y, z, x)` autour de (1,1,1), conjuguée par les signes du
sommet pour les autres). Découpé en cellules unitaires : pointes en 2v,
centres en v, arêtes en v + w, noyau à l'origine ; une couche prend ce qui
est du côté du sommet (produit scalaire positif), une pointe ce qui est au
bout (produit scalaire 6). Les normales des faces sont `TET_NORMALS`
(indices 12 à 15). Couleurs : jaune dessous, vert devant, rouge à droite,
bleu à gauche. Un coup est un `PyraMove` (`vertex`, `amount` 1 ou 2,
`tip`).

**Notation hybride**, chacune selon son usage : en international (WCA), la
couche est la majuscule (`R`) et la pointe la minuscule (`r`) ; en français,
comme l'écrit fan2cube, la pointe (« sommet ») est la majuscule et la couche
(« tranche ») la minuscule, sommets H G D P (Haut, Gauche, Droite,
Postérieur). `parsePyraMoves` (`pyraNotation.ts`) lit les formules du site telles quelles
(`[gd'][h'd]`, `dhd'hdhd'`, `²`).

**Résolution** (`methods/pyramid/pyraminx.ts`, méthode **Centres d'abord**, d'après
fan2cube.fr/pyraminx2) : pointes et centres ne quittent jamais leur sommet,
donc disent quelle couleur prend chaque face (celle qui manque au centre du
sommet opposé), ce qui accepte un puzzle tenu dans n'importe quel sens.
(1) **centres** : un tour de chaque couche ; (2) **pointes** : un tour de
chaque pointe ; (3) **arêtes du bas** avec le crochet `[gd']`
((AG)->(BA)->(AD)), aussi précédé d'un `h` défait ensuite ; (4) **arêtes du
haut** placées par `d h d' h d h d'` ((AG)->(AD)->(GD)) ; (5) **retournées**
deux par deux par `[gd'][h'd]`. Chaque formule est jouée depuis les trois
côtés autour du haut, et ne touche ni centres ni pointes (chaque couche
revient). Les recherches ne portent que sur les 6 arêtes (11 520 états) et
s'épuisent sur un puzzle impossible, ce dont la validation se sert. Le
superflip de la page, `(hd'g)3`, est testé aussi.

**Rendu** (`three/puzzles/pyramid/pyraGeometry.ts`) : chaque pièce est la
cellule du modèle (petit tétraèdre ou octaèdre) ramenée à l'écran par
`pyraToCartesian`. Saisie des 36 stickers (aucune pièce fixe).

**Le Tetraminx** (`tetra`, fan2cube.fr/tetraminx1) : « exactement un
Pyraminx sans sommets ». Ses pièces sont celles du Pyraminx moins les quatre
pointes (`solvedPyra`), ses coups ses couches seules (`PYRA_LAYERS`), et
sa méthode celle du Pyraminx sans l'étape des pointes (`centersFirst`,
`TETRAMINX_PLAN`). Le dessin reprend les mêmes cellules ; chaque pointe tronquée y porte une
couleur voisine, chacune la sienne (celle de la face opposée au sommet
suivant, U L R B ; `pyraPolygons(3, true)`).

## Le Master Pyraminx (`pyra4`)

Le Pyraminx 4x4 (fan2cube.fr/pyraminx41) : quatre tranches par sommet, qui
tournent **une à une** (`PyraMove.slice` 1 à 3, `tip` pour la pointe), la
troisième étant la face opposée. Même modèle que le Pyraminx, tétraèdre de 4
couches : les cellules de surface sont les sommes de 3 vecteurs de sommets
(petits tétraèdres : pointes en 3v, ailes en 2v + w, centres en u + v + w)
et de 2 (octaèdres : co-sommets en 2v, co-ailes en v + w), 30 pièces ; une
tranche est l'intervalle entre deux plans espacés de 4 en produit scalaire
(`pyraTurns`, commun à toute la famille, la taille lue sur `SHAPE_DIMS` par
`pyraSize`). Les 12 ailes sont des jumelles deux à deux, distinguées par
leur chiralité (le signe du déterminant position / normales, qu'un tour
conserve) ; les 4 centres voyagent de face en face.

**Notation** : en français, celle de fan2cube, tranches numérotées
(`H'₁`, `D₂`, `P₃` pour la face soulignée du site ; `h` = `H₁` et `H'1` se
lisent aussi) ; en international, préfixe SiGN comptant la pointe comme
première couche (`u`, `2U`, `3U`, `4U`).

**Résolution** (`methods/pyramid/pyraminx4.ts`, méthode **Ailes puis co-ailes**,
d'après fan2cube.fr/pyraminx42), sans jamais tourner une face (une face,
c'est tout le puzzle tourné avec les trois autres tranches, ce que
`faceColors` absorbe) : (1) co-sommets et (2) pointes tournés en place ;
(3) centres placés en 2e tranche, car les formules des co-ailes ne les
échangent que deux à deux ; (4) **ailes** une à une par 3-cycles :
`[H'₁ D₂]`, `[H₁ G'₂]`, `[H₂ G'₁]`, `[H'₂ D₁]`, jusqu'à couvrir les 440
3-cycles (`wingCycles`) ;
(5) **co-ailes** placées par `[H'₂ D₂]` et `D₂ H₂ D'₂ H₂ D₂ H₂ D'₂`, puis
retournées par `[G₂ D'₂][H'₂ D₂]` ; (6) centres finis par `[G₂ D'₂]³`
(A,B)(G,D). Ailes et co-ailes portant les mêmes couleurs, `solvePieces`
prend un filtre `among` pour ne suivre qu'une sorte de pièce.

## Le Professor Pyraminx (`pyra5`)

Le Pyraminx 5x5x5 (fan2cube.fr/profpyraminx1 et 2) :
le même modèle que le Master, à 5 couches (positions jusqu'à ±4, que couvre
`stateKey`), cinq tranches par sommet (`PyraMove.slice` 1 à 4, la
4e étant la face opposée, `isOppositeFace` : « Faces » dans le pad et le
guide, comme la 3e du Master). 54 pièces de sept sortes, 25 stickers par
face : pointes et co-sommets (qui ne font que pivoter), 12 ailes et 12
co-ailes (jumelles deux à deux, départagées par leur chiralité), 6 arêtes,
12 co-centres (3 par couleur, interchangeables) et 4 centres. Notation :
`H'₁`, `D₃`, `G₄` en français, `2U'`, `4R`, `5L` en anglais.

**Résolution** (`methods/pyramid/pyraminx5.ts`, méthode **Ailes puis co-ailes**,
d'après la page) : co-sommets, pointes, centres placés en 3e tranche,
puis les **ailes** (`[H'₁ D₃]`...), les **co-ailes** (`[H'₂ D₃]`..., qui
brassent les co-centres), les **arêtes** (`[G₂ D'₂]`, `D₂H₂D'₂H₂D₂H₂D'₂`,
retournées par `[G₂ D'₂][H'₂ D₂]`), les **co-centres**
(`[H₃ G'₃]² G₄ [H₃ G'₃] G'₄` : le `G` seul de la page est la face opposée
au sommet gauche, son « G(auche-opposé) » ; c'est la seule étape qui tourne
une face, aussitôt remise) et enfin les centres (`[G₃ D'₃]³`). Ailes,
co-ailes et co-centres se placent un à un par 3-cycles ; des co-centres
d'une couleur étant interchangeables, deux restants échangés passent par un
emplacement juste.

## Le Pyraminx Jing (`jing`)

Le Jing (fan2cube.fr/pyraminxjing1) coupe **au-delà du centre** : chaque
sommet tourne sa moitié du puzzle (`PyraMove.deep`), soit son coin, ses
trois arêtes et les trois centres autour. 14 pièces : 4 coins qui ne font
que pivoter, 6 arêtes, 4 centres qui voyagent (plus le cœur, caché). Une
pièce est l'ensemble des moitiés auxquelles elle appartient, posée à la
somme de leurs sommets : coin en v, arête en (v + w) / 2 (un axe unitaire),
centre en u + v + w (moins le sommet absent) ; un tour prend donc ce qui est
du côté du sommet, comme la couche du Pyraminx. Notation : majuscules dans les deux notations
(`D`, `R`), comme fan2cube.

**Rendu courbe** (`three/puzzles/pyramid/jingGeometry.ts`) : un tétraèdre aux faces bombées
et aux pointes arrondies en dômes, maillé finement. Chaque coupe est une
**sphère** centrée sur l'axe de son sommet, loin derrière la pointe (une
sphère autour de l'axe tourne en elle-même, comme la moitié qu'elle borde) :
ses joints courbent un peu plus que le contour du puzzle, comme des cercles
vers leur centre. Chaque petit triangle est **coupé exactement** le long de
ces sphères et des arêtes du tétraèdre, puis attribué à la pièce des
moitiés où il se trouve, avec des normales lissées par sommet
(`PiecePolygon.normals` : pas de facettes dans les reflets). Les bandes le
long des coupes sont les joints sombres, enfoncées sous la surface en
rainures (`GROOVE` : à fleur, elles dépasseraient de l'autre moitié pendant
un tour), chaque sticker est doublé vers
l'intérieur en plastique ; pendant qu'une moitié tourne, sa sphère de
coupe est dessinée, immobile (`PolyDrawing.cut`) : une seule calotte ferme
les deux parties, comme la surface de coupe du vrai puzzle. La vignette du
sélecteur prend un maillage plus grossier, sans doublure
(`PolyDrawing.thumbnail`).

**Résolution** (`methods/pyramid/jing.ts`, méthode **Sommets d'abord**, d'après
fan2cube.fr/pyraminxjing2) : (1) sommets tournés en place ; (2) arêtes
placées par le crochet `[DH]` ((BA)->(AD)->(GD)) ; (3)
retournées par `[DH'][G'H]` ; (4) centres par `[DH]³` (B,A)(G,D). Les
crochets échangent aussi les centres deux à deux, ce que (4) règle : coins
en place, les centres ne peuvent être que deux à deux mal placés (loi des
twists de la page, testée).

## Le Pyramorphinx (`morph`)

Le Pyramorphinx (fan2cube.fr/pyramorphinx1, le « Mini Pyraminx ») est un
**2x2 taillé dans le tétraèdre inscrit** : mêmes positions, mêmes coups
(`SHAPE_DIMS` `[2, 2, 2]`, pad du 2x2), mais 4 cubies gardent un coin du
tétraèdre (3 stickers) et 4 le milieu d'une face (1 sticker). Les stickers
regardent selon les diagonales (`TET_NORMALS`, et après un quart de tour
leurs opposées, indices 16 à 19). Une grosse pièce posée à la place d'une
petite le **déforme** : c'est un puzzle déformable (`SHAPE_SHIFTS`), saisi
par sa forme comme la tour, avec **7 formes** seulement. `isSolved`
compte aussi les faces : un quart de tour laisse chaque moitié unie, mais
sur deux tétraèdres (8 faces au lieu de 4).

**Rendu** (`three/puzzles/pyramid/morphGeometry.ts`, `isPolyDrawn`) : chaque pièce est sa
case du 2x2 coupée par le tétraèdre, un polyèdre convexe calculé depuis ses
plans ; dessinée tournée comme la pièce, dans le repère du modèle que
`PolyDrawing.orient` pose sur une face (ses coups restent ceux d'un 2x2).

**Résolution** (`methods/pyramid/morph.ts`, méthode **Comme un Pocket**, d'après
fan2cube.fr/pyramorphinx3) : lu comme le 2x2 qu'il est (chaque pièce reçoit
les couleurs de son cubie, tournée comme elle se tient), résolu par le
solveur optimal du 2x2, et les mêmes coups le résolvent. Un milieu de face
étant symétrique autour de son sticker, sa vrille ne se voit pas : on essaie
les 81 lectures jusqu'à un 2x2 réel (vrilles des coins de somme nulle).
D'où la « singularité » de fan2cube : un coin vrillé seul est légal.

## Le Master Morphinx (`mmorph`)

Le Master Morphinx (fan2cube.fr/mastermorphinx1 et 2) est « un Super 3x3x3
déguisé » : le mécanisme d'un 3x3x3 taillé dans un tétraèdre, comme le
Pyramorphinx l'est d'un
2x2. Ses 4 gros sommets portent les pointes du tétraèdre (trois couleurs),
ses 4 petits sont au milieu de ses faces (une couleur : leur rotation ne se
voit pas), ses 6 centres sur ses arêtes (deux couleurs : chaque quart de tour
se voit), ses 12 arêtes entre eux ; il se déforme, sans blocage. Modèle
(`lib/puzzles/pyramid/mmorph.ts`) : le 3x3, chaque centre marqué d'un sticker caché (comme
le Fisher Cube) ; « résolu » ignore la rotation des petits sommets et accepte
toute tenue (les 24 du 3x3, le tétraèdre tournant avec). Le dessin est
droit (le vrai puzzle est bombé ; `three/puzzles/pyramid/mmorphGeometry.ts`, chaque
case du 3x3 coupée par le tétraèdre, `cutSolid.ts`), posé sur une face comme
le Pyramorphinx. **Saisie** pièce par pièce, les petits sommets d'un seul
sens (`asSeenMorphinx`), leur rotation choisie pour rendre la position
atteignable (`withRealCorners`).

**Résolution** (`methods/pyramid/mmorph.ts`, « style Rubik's Cube », la première
méthode de la page) : une méthode du 3x3 (par couches, CFOP, Petrus, ZZ) sur
ses couleurs, puis **Centres tournés** par les formules de la page,
(H)+(G)- = Hd'h'd.H'd'hd et (H)2+ = (H.DGH²D'G')² (recherche sur les
seuls centres).
