# Les torturés

Détail des puzzles de la catégorie (modèles : `src/lib/puzzles/twisted/`, méthodes : `src/lib/methods/twisted/`, dessins : `src/three/puzzles/twisted/`). Les principes communs sont dans [AGENTS.md](../../AGENTS.md).

## Le Purple (`purple`)

Un **2x2x2** dont le coin A (haut, avant, droite) est lui-même coupé en
2x2x2 mini-cubes, et dont le **cœur** est le mini-cube de A tourné vers le
centre, invisible. Ses faces tournent autour de ce cœur, décalé d'un quart
de la largeur : chaque quart de tour sort sa couche de la boîte, il se
**déforme**. Tout violet sauf les trois faces extérieures de A (vert
citron dessus, bleu devant, jaune à droite) : résolu quand il redevient un cube, chaque couleur de A sur une
face (`purpleSolved` ; ses faces n'étant pas unies, `isSolved` lui laisse
la main).

**Modèle entier** (`lib/puzzles/twisted/purple.ts`) : coordonnées en demi-mini-cubes autour
du cœur. Un mini-cube fait 2 de large, centré sur des coordonnées paires
(0 ou 2 une fois résolu, le cœur à l'origine) ; un gros cube 4, sur des
impaires (-3 ou 1). Chaque axe est coupé de part et d'autre du cœur, en -1
et 1, et une face tourne ce qui est au-delà de sa coupe (2 ou plus) :
exactement la tranche externe d'un 5x5 (`dims` `[5, 5, 5]` de sa carte), donc le
moteur des cubes le fait tourner tel quel (`Move`, pad, guide, `shifts` de
sa carte ; le mélange est le sien, voir plus bas). Seul `turnAllowed` lui est propre : un gros cube centré sur
une coupe la chevauche et bloque la face (`purpleTurns`). Résolu, seules L,
D et B tournent. `isBoxed` lit sa propre boîte (de -5 à 3, `purpleBoxed`) ;
une seule symétrie, le tiers de tour autour de sa diagonale par A (3
orientations).

**1 160 formes** atteignables (les gros cubes étant pareils), à 13 coups
au plus, aucune bloquée ; avec les couleurs de A, **41 760 états**, à 30
coups au plus, dont 35 en forme de cube mais pas résolus : testé en
parcourant tout l'espace.

**Mélange** (`purpleStates.ts`) : des coups au hasard se défont l'un
l'autre (la plupart sont bloqués) et le replient en cube, A entier. Le
sien ne repasse jamais par un état déjà vu (départ compris) et continue
au-delà de sa longueur tant que A n'est pas disloqué.

**Rendu** (`three/puzzles/twisted/purpleGeometry.ts`) : chaque pièce est une boîte, violette
sur toutes ses faces (comme le vrai puzzle, aussi celles qu'un coup fait
apparaître) sauf les stickers de A ; `PolyDrawing.offset` recentre la boîte, décalée du cœur autour
duquel tout tourne.

**Résolution** (`methods/twisted/purple.ts`), aucune méthode humaine n'étant
connue : tout vient d'un parcours de tous ses états depuis le résolu
(`purpleStates.ts`, une fois, dans le worker), un arbre
des chemins les plus courts. **Forme puis couleurs** (`shapeFirst`) : (1)
le moins de coups pour redevenir un cube (`purpleToCube`), (2) depuis ce
cube, la suite la plus courte vers le résolu (`solvePurple`,
le chemin de l'arbre défait : un coup qui est passé repasse dans l'autre
sens) ; **Optimale** : la plus courte d'un coup. Le test vérifie sur tout
l'espace que chaque solution a exactement la longueur de sa distance.

**Saisie** : par ses faces d'abord, puis ses couleurs. Ses 388 formes (les
rotations du puzzle entier fusionnées) se distinguent mal en vignettes ;
quatre de ses faces, elles, ne laissent jamais deux formes (mesuré sur ses
1 160 formes tenues des 24 façons). On les reproduit sur des canevas de
5x5 mini-cubes (sa face la plus large), un gros cube sur 2x2, où l'on veut
sur le canevas : le dessin est comparé tel quel, quel que soit l'endroit
(`lib/puzzles/twisted/purpleViews.ts`, l'entrée `faces` de son modèle,
voir « Saisie face par face » dans AGENTS.md). Toutes ses faces sont
violettes, même celles qu'un coup découvre : la palette des faces propose
le violet, et « absent » n'y dit que les trous. Ses formes sont toutes
calculées une fois (un parcours de ses 1 160 formes), puis chacune tenue
des 24 façons, indexée par ses quatre dessins (dans le worker, une seconde
environ la première fois). « Modifier » le saisit tel qu'il est, sans
passer par ses faces. Les gros cubes arrivent déjà
violets (et la palette ne propose pas le violet : `paletteColors` écarte
une couleur que les stickers pré-remplis prennent tous) : `emptyEdit` remplit tout sticker que toutes les pièces qui
tiennent dans son emplacement montrent d'une seule couleur (dans la boîte,
les trois mini-cubes de A à un sticker aussi : ils n'y sont jamais
ailleurs). Une face sans sticker à saisir garde sa couleur dans la vue.

## Le Z-Twist (`twist`)

Un 3x3x3 de forme tordue, _shape mod_ comme le cube miroir : mêmes pièces,
couleurs et coups qu'un 3x3, chaque pièce taillée dans sa case du solide
résolu. Ce solide a le carré du haut en place, celui du bas tourné d'un quart, et
ses arêtes verticales droites entre eux (un peu arrondies, `ROUND`) : chaque
section est un carré, tourné et réduit (un losange par le milieu des faces
à mi-hauteur), jamais hors du cube. Le mécanisme reste celui d'un 3x3, aux
coupes planes : une pièce est sa case du 3x3 découpée dans ce solide
(`three/puzzles/twisted/twistGeometry.ts` : sa part des côtés tordus, colorée comme chaque
côté, si bien qu'une face du cube peut montrer deux couleurs, ses coupes en
plastique), puis portée par la rotation qui l'amène où elle est (lue sur
ses couleurs). Arêtes et coins se reconnaissent à leurs couleurs, mais un
centre de côté montre par sa forme s'il est tourné d'un quart (un demi-tour
ne se voit pas) : `Cubie.spin` (0 ou 1, `lib/puzzles/twisted/twist.ts`), changé par chaque
quart de tour de sa face (`applyMove`) ; résolu, tous à 0. À l'inverse,
les 4 arêtes fines de la couche du milieu ne montrent qu'une couleur : leur
sens ne se voit pas et ne compte pas. `isSolved` (`thinEdgesSolved`) les
accepte dans un sens ou l'autre, la saisie ne propose qu'une pose par
emplacement (`asSeenThin`, aussi pour « Modifier ») et
`buildCube` choisit le sens qui rend la position atteignable
(`withRealThinEdges` : un nombre pair d'arêtes retournées).

**Résolution** (`methods/twisted/twist.ts`) : les méthodes du 3x3 sans tranches (par
couches, CFOP, Petrus, ZZ ; pas Roux, dont les `M` mêleraient centres
orientés et non orientés), jouées sur ses couleurs (`twistPlan` : les centres mis de côté), puis
**Les centres tordus** : des suites qui ne déplacent aucune pièce (un
mélange fixe puis sa résolution 3x3) retournent chacune certains centres ;
assemblées (sur GF(2)), elles en retournent n'importe quel ensemble.
**Saisie** pièce par pièce (ses
pièces montrent les couleurs des côtés tordus, pas des stickers de 3x3) ;
un clic sur un centre de côté le tourne d'un quart (les bascules de sa peinture, `centerToggles`).

## Le Quarter Cube (`quarter`)

Le Quarter Cube (fan2cube.fr/quarter1 et 2) : un 3x3 dont chaque face ne fait qu'aller d'un quart et
revenir (A puis A', jamais A² ni deux A de suite). Chaque centre porte un
repère qui dit où en est sa face : dans le modèle, son `spin` (0 où le
quart horaire passe, le START de la page ; 1 un quart plus loin, où seul
le retour passe), changé par chaque quart de tour de la face, comme les
centres du Z-Twist. `turnAllowed` lit ce repère (`quarterTurns`), le
mélange joue le seul coup permis de faces tirées au hasard, et « résolu »
ne regarde que les couleurs (les faces peuvent rester d'un côté ou de
l'autre). Rendu (`three/puzzles/twisted/quarterGeometry.ts`) : les cubies d'un 3x3, chaque
centre portant le repère des dessins de la page : un anneau ouvert là où
pointe le repère (il tourne avec la face) et un quart d'anneau épais, de là
vers le sens où la face peut aller (horaire au START, retour un quart plus
loin). **Saisie**
des stickers comme un 3x3, centres pré-remplis ; un clic sur un centre
tourne son repère d'un quart (les bascules de sa peinture, comme le Z-Twist).

**Résolution** (`methods/twisted/quarter.ts`, méthode **Les arêtes d'abord**,
d'après la page) : (0) chaque face ramenée au START ; (1) arêtes placées
par le 3-cycle A[DH]A' ; (2) retournées deux à deux par
A[DH]A'.G[HA]G'.D[HP]D' ; (3) coins placés par [[DH], G] ; (4) tournés par
[[DH]², G]. Toutes alternent sur chaque face et la laissent au START ;
des variantes vues de chaque tenue et préparées par un quart de face, seules
celles qui alternent encore sont gardées ; la recherche
(`solvePieces`, ces seules formules) place une pièce après l'autre. Les
permutations restent paires (chaque face tourne autant dans un sens que
dans l'autre), les 3-cycles suffisent. Chaque coup de la solution est
vérifié jouable.

**Scan** : en grille, comme un 3x3 ; l'appareil ne voyant pas le repère
des centres, l'éditeur demande ensuite de les placer d'un clic
(`scanUnseen: 'centerMarks'` sur sa carte).

## Le Latch Cube (`latch`)

Le Latch Cube (fan2cube.fr/latchcube1 et 2, Katsuhiko Okamoto, 2010) : un
3x3 dont chaque arête porte une flèche sur un de ses deux stickers, six
noires et six blanches (`lib/puzzles/twisted/latch.ts`). Une face tourne
dans le sens de ses flèches : horaire avec des blanches, anti-horaire avec
des noires, dans les deux sens sans flèche, et pas du tout avec les deux
(elle se bloque). Les flèches étant sur les pièces, les couleurs d'une arête
disent où est sa flèche : rien à ajouter au modèle que `turnAllowed`. Résolu,
chaque face porte deux flèches d'une sorte sur deux arêtes opposées
(noires en haut, devant et à gauche ; blanches en bas, derrière et à
droite : deux faces opposées tournent dans des sens opposés). Son cœur caché porte une marque (le long
d'une diagonale, d'aucune face) qui le distingue du 3x3, jamais dessinée
ni saisie. Mélange : des coups au hasard parmi ceux qui passent.

**Rendu** (`three/puzzles/twisted/latchGeometry.ts`) : les cubies du 3x3 en
polygones, chaque face imprimée d'un cercle autour de son milieu passant
par ses arêtes (sa part sur chaque sticker), et la flèche de chaque arête
le long de lui, blanche cerclée de noir ou noire. Le pad grise les sens
qui ne passent pas.

**Résolution** (`methods/twisted/latch.ts`, méthode **Les arêtes
d'abord**) : une face non bloquée tourne dans les deux sens (le sens
interdit joué en trois quarts de tour dans l'autre, « D' = D3 » sur la
page), donc une recherche ne demande que les faces bloquées, que disent les
arêtes seules. (1) les arêtes, sommets laissés de côté : la croix du bas une
à une (tout coup), chaque arête du milieu puis les quatre du haut par les
formules du Tori (le 3x3 sans sommets) et H, par une recherche sur les
douze arêtes ; tenu de la première façon où les blocages le permettent,
tout coup en dernier recours ; (2) les sommets placés par le 3-cycle de la
page (HGP) -> (HAG) -> (HPD) = [DH].G'[HD]G, puis tournés par
[DH]².G'[HD]²G : les arêtes en place, leurs flèches sont celles du résolu au
début de chaque formule, donc les variantes qui passent (tenues de chaque
façon, préparées par un ou deux coups) sont triées une fois. La position
START de la page (une croix de flèches noires en bas) n'est pas reprise :
la recherche s'en passe.

**Scan** : en grille, comme un 3x3 : ses flèches suivent ses couleurs.

## Le Fashion-V (`fashion`)

Le Fashion-V (fan2cube.fr/fashioncube1 et 2, Adam Cowan et Jason Smith, 2010) : un 3x3x5 ramené à un cube, ses deux couches du haut (H, h) et du bas
(b, B) moitié moins épaisses que l'équateur (`lib/puzzles/twisted/fashion.ts`).
Il tourne comme un 5x5x5 dont les pièces remplissent le 3x3x5 du milieu,
comme la 2x2x4 comme un 4x4x4 (`shifts`) : un côté par blocs (Rw : la
colonne de cellules du bord), d'un quart de tour, ce qui passe toujours et
met ses paires (une pièce du haut et celle sous elle) debout ; une moitié
entière (H* : H et h) aussi. Une couche fine seule ne tourne que si sa moitié
est couchée (ses deux couches entières, neuf pièces chacune : une arête de
l'équateur, épaisse, n'y entre jamais). Ni l'équateur ni un côté seul ne
tournent : ses centres ne bougent jamais, pré-remplis à la saisie. Mélange :
d'abord dans sa boîte (couches fines, demi-tours des blocs de côté, qui
séparent les paires et échangent haut et bas), puis tout coup qui passe.
Saisie en deux temps, ses formes se comptant par millions
(l'étape `cuts` de son modèle, `lib/puzzles/twisted/fashionEntry.ts`) : d'abord ses demi-cubies, un clic sur une case
faisant défiler leur position (une paire couchée, debout d'un côté ou de
l'autre, ou une arête pleine de l'équateur, quatre en tout), puis la
recherche de forme en trouve un état (aucun : la saisie le dit), sur lequel
on peint les couleurs ; « Modifier » part de l'état où il se trouve.

**Scan** (`scan: 'halves'`, `lib/editor/scan/halves.ts`), proposé dès
l'étape des demi-cubies : chaque face en 6 x 6, chaque case de son 3 x 3
en 2 x 2 (une moitié remplit la part de sa case de son côté de la coupe),
les centres disant les faces, comme un 3x3. Chaque façon dont une case
peut tenir ses pièces fait des pièces des couleurs lues, qu'une vraie
pièce de même rôle (moitié extérieure, intérieure, ou pièce entière)
montre ou non : deux moitiés d'une même couleur se trahissent par leurs
autres faces (vert et blanc n'est jamais une arête pleine, vert et rouge
en est une). La moins chère de chaque case, la moins chère ensemble que la
recherche de forme accepte, donne la forme, lue ensuite comme celle d'une
tour (`classify.ts`) ; l'étape des demi-cubies reprend ses coupes.

**Rendu** (`three/puzzles/twisted/fashionGeometry.ts`) : le cube qu'il reste,
chaque demi-pièce moitié moins épaisse le long de son axe fin (la verticale
qu'elle avait résolue, tournée avec elle : celui où regarde sa couleur du
haut ou du bas, ou celui où aucun sticker ne regarde à travers sa cellule),
une pièce entière (arête de l'équateur, centre de côté) remplissant sa
cellule.

**Résolution** (`methods/twisted/fashion.ts`, méthode **Coucher puis deux
tours**) : (1) coucher toutes les paires, et tourner les arêtes de
l'équateur dans le bon sens, par blocs seuls (`fashionShape.ts`, « passer en
3x3x5 », « comme un Rubik's Cube » dit la page) : la forme se lit cellule
par cellule (l'axe de coupe d'une paire, ou une pièce entière et le sens de
son rouge ou orange) ; trois tables de distances (coupes des arêtes,
126 720 ; arêtes entières, 7 920 ; sommets, 6 561) bornent une recherche
IDA*, comme la première phase de Kociemba ; (2) ranger l'équateur autour de
ses centres, par les demi-tours des blocs (« bien placé et bien orienté ») ;
(3) le Domino du dehors (H, B), puis celui du dedans (h, b), par les
formules du Domino (`towerLayers.ts`), jouées deux fois, les couches
tournées entre (« par paires » : la première descente perturbe l'équateur,
la seconde le remet), si bien qu'aucune autre couche ne les voit et que
l'équateur reste en place. Les pièces du dehors sont uniques (une recherche
par les deux bouts) ; celles du dedans vont par jumelles, qui absorbent
toute parité : les deux « singularités » de la page ne servent pas.
