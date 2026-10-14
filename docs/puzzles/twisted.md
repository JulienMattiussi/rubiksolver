# Les torturés

Détail des puzzles de la catégorie (modèles : `src/lib/puzzles/twisted/`, méthodes : `src/lib/methods/twisted/`, dessins : `src/three/puzzles/twisted/`). Les principes communs sont dans [AGENTS.md](../../AGENTS.md).

## Le Violet (`violet`)

Un **2x2x2** dont le coin A (haut, avant, droite) est lui-même coupé en
2x2x2 mini-cubes, et dont le **cœur** est le mini-cube de A tourné vers le
centre, invisible. Ses faces tournent autour de ce cœur, décalé d'un quart
de la largeur : chaque quart de tour sort sa couche de la boîte, il se
**déforme**. Tout violet sauf les trois faces extérieures de A (vert
citron dessus, bleu devant, jaune à droite) : résolu quand il redevient un cube, chaque couleur de A sur une
face (`violetSolved` ; ses faces n'étant pas unies, `isSolved` lui laisse
la main).

**Modèle entier** (`lib/puzzles/twisted/violet.ts`) : coordonnées en demi-mini-cubes autour
du cœur. Un mini-cube fait 2 de large, centré sur des coordonnées paires
(0 ou 2 une fois résolu, le cœur à l'origine) ; un gros cube 4, sur des
impaires (-3 ou 1). Chaque axe est coupé de part et d'autre du cœur, en -1
et 1, et une face tourne ce qui est au-delà de sa coupe (2 ou plus) :
exactement la tranche externe d'un 5x5 (`dims` `[5, 5, 5]` de sa carte), donc le
moteur des cubes le fait tourner tel quel (`Move`, pad, guide, `shifts` de
sa carte ; le mélange est le sien, voir plus bas). Seul `turnAllowed` lui est propre : un gros cube centré sur
une coupe la chevauche et bloque la face (`violetTurns`). Résolu, seules L,
D et B tournent. `isBoxed` lit sa propre boîte (de -5 à 3, `violetBoxed`) ;
une seule symétrie, le tiers de tour autour de sa diagonale par A (3
orientations).

**1 160 formes** atteignables (les gros cubes étant pareils), à 13 coups
au plus, aucune bloquée ; avec les couleurs de A, **41 760 états**, à 30
coups au plus, dont 35 en forme de cube mais pas résolus : testé en
parcourant tout l'espace.

**Mélange** (`violetStates.ts`) : des coups au hasard se défont l'un
l'autre (la plupart sont bloqués) et le replient en cube, A entier. Le
sien ne repasse jamais par un état déjà vu (départ compris) et continue
au-delà de sa longueur tant que A n'est pas disloqué.

**Rendu** (`three/puzzles/twisted/violetGeometry.ts`) : chaque pièce est une boîte, violette
sur toutes ses faces (comme le vrai puzzle, aussi celles qu'un coup fait
apparaître) sauf les stickers de A ; `PolyDrawing.offset` recentre la boîte, décalée du cœur autour
duquel tout tourne.

**Résolution** (`methods/twisted/violet.ts`), aucune méthode humaine n'étant
connue : tout vient d'un parcours de tous ses états depuis le résolu
(`violetStates.ts`, une fois, dans le worker), un arbre
des chemins les plus courts. **Forme puis couleurs** (`shapeFirst`) : (1)
le moins de coups pour redevenir un cube (`violetToCube`), (2) depuis ce
cube, la suite la plus courte vers le résolu (`solveViolet`,
le chemin de l'arbre défait : un coup qui est passé repasse dans l'autre
sens) ; **Optimale** : la plus courte d'un coup. Le test vérifie sur tout
l'espace que chaque solution a exactement la longueur de sa distance.

**Saisie** : comme la tour, par sa forme (388, les rotations du puzzle
entier fusionnées), puis ses couleurs. Les gros cubes arrivent déjà
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
emplacement (`asSeenThin`, aussi pour « Depuis l'état actuel ») et
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
un clic sur un centre de côté le tourne d'un quart (`twisted` de l'éditeur).

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
tourne son repère d'un quart (`twisted` de l'éditeur, comme le Z-Twist).

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

## L'AI Cube (`ai`)

L'AI Cube (fan2cube.fr/AIcube1 et 2) est « un bandaged du Revenge 4x4x4 » :
des huit octants du 4x4x4 (2x2x2 chacun), les quatre d'un tétraèdre sont
soudés en gros blocs, en quinconce une fois résolu ; les quatre autres
restent en petits cubes (un petit sommet, trois arêtes, une par arête du
cube, et trois centres, deux par couleur). Modèle (`lib/puzzles/twisted/ai.ts`) : les petits
cubes du 4x4x4, un gros bloc étant un seul cubie au milieu de son octant
((2, 2, 2)...) ; un coup ne passe que s'il ne coupe aucun gros bloc
(`aiTurns`) : une moitié du cube toujours, une couche externe ou une tranche
seulement quand aucun bloc n'est à cheval sur ses coupes. Les blocs changeant
d'octant, les emplacements à peindre dépendent de l'état : il est déclaré
déformable (`shifts` de sa carte), saisi en choisissant d'abord sa forme (7). Le
mélange (`scrambleAi`) joue surtout des couches fines dès qu'il le peut, et
libère une moitié de ses blocs quand aucune ne passe (au hasard, il ne
tournerait presque que des moitiés), et finit les gros blocs dispersés, deux
par moitié du cube sur chaque axe. Rendu (`three/puzzles/twisted/aiGeometry.ts`) : des
boîtes d'une case ou de deux.

**Résolution** (`methods/twisted/ai.ts`, méthode **des blocs**, d'après la page) :
(0) les quatre gros blocs en bas, par demi-cubes (la position standard de la
page : le haut tourne alors seul, H, et sa tranche, h) ; (1) chaque petit
octant reconstitué autour de son petit sommet, les arêtes d'abord (recherche
par les deux bouts sur les pièces suivies, avec H, h et T = D'BD.ABA', qui
pivote un octant, vu de chaque coin ; un h d'abord si leur permutation est
impaire), (2) puis les centres par 3-cycles purs : C =
Th².(Th²T'h²)².T'h².(T'h²Th²)², préparé de deux coups, et les produits de
deux d'entre eux qui ne bougent que trois centres (tous les trios), les deux
centres d'une couleur affectés pour une permutation paire ; (3) les huit
octants résolus comme un Pocket (solveur optimal du 2x2), par demi-cubes.
Les centres font l'essentiel de la longueur.

## Le RoadBlock-I (`roadblock`)

Le RoadBlock-I (fan2cube.fr/roadblock-I1 et 2) est un 5x5x5
dont les neuf centres de chaque face sont soudés trois par trois en barres
parallèles (les « I »), ses couches externes épaisses et les trois
internes fines. Une face tourne toujours ; une tranche seulement si elle
ne coupe aucune barre, c'est-à-dire si aucune barre qu'elle emporte n'est
dans l'axe du coup (`roadblockTurns`). Modèle (`lib/puzzles/twisted/roadblock.ts`) : les
cubies du 5x5x5, chaque centre portant un sticker caché (`H`, jamais
dessiné ni peint, comme les marques du Fisher Cube) le long de sa barre.
Le sens des barres d'une face ne change qu'avec ses quarts de tour : en
position **START** (le résolu), les barres des côtés sont horizontales et
les trois tranches de l'équateur tournent ; quelques quarts de tour des
faces autour d'un autre axe y couchent leurs barres en travers, ses
tranches tournent, et les mêmes quarts défaits ramènent START. « Résolu »
ne regarde que les couleurs : une face unie l'est, ses barres dans un sens
ou dans l'autre. Le mélange (`scrambleRoadblock`)
joue surtout des tranches permises, et libère un axe quand aucune ne
l'est. **Saisie** dans tout état (`lib/editor/roadblockEditor.ts`) : les stickers d'un
5x5, sans centre fixe (les tranches du milieu les déplacent) ; un clic sur
un centre peint sa barre entière (`paintBar`, `barCells`), et six boutons
disent quelles faces ont leurs barres tournées d'un quart par rapport à
START (`BarToggles`, l'état `twisted` de l'éditeur ; basculer une face
tourne ses centres d'un quart avec leurs couleurs, `turnFace`). « Depuis
l'état actuel » les lit sur le cube (`barsTurned`), `buildCube` les pose
(`withBars`) ; la validation refuse un sens des barres impossible. Rendu (`three/puzzles/twisted/roadblockGeometry.ts`) : couches externes
épaisses, un sticker par barre.

**Résolution** (`methods/twisted/roadblock.ts`, méthode **des centres**, d'après la
page) : chaque formule va de START à START (`legal`, qui la rejoue en
suivant le sens des barres), jouée dans le « mode » qui couche les barres
en travers de l'axe de sa tranche (`SETUP`). (0) START ; (1) les barres du
milieu (le centre de chaque face), par les tranches du milieu ; (2) la
parité : les ailes sont en permutation impaire de leur place près de leur
milieu une fois sur deux, ce que les 3-cycles ne corrigent pas ; un quart
de tranche de l'équateur (un 4-cycle d'ailes, START gardé) la change ; (3)
les autres barres par 3-cycles purs (commutateurs d'une tranche et d'un
coup de son mode) ; (4) les deux ailes de chaque arête amenées près de son
milieu par 3-cycles d'ailes (commutateurs d'une tranche interne et d'un
`F U F'` de son mode, leurs produits, et au besoin conjugués l'un par
l'autre) ; (5) comme un 3x3 (`projectPlan`, la projection du 5x5), ses
barres finissant dans un sens ou dans l'autre. Les tables se construisent
au premier calcul.
