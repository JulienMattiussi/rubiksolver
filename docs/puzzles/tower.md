# Les tours

Détail des puzzles de la catégorie (modèles : `src/lib/puzzles/tower/`, méthodes : `src/lib/methods/tower/`, dessins : `src/three/puzzles/tower/`). Les principes communs sont dans [AGENTS.md](../../AGENTS.md).

## La tour 2x2x4 (`224`, forme qui se déforme)

La tour (`[2, 4, 2]`, `SHAPE_SHIFTS`) sort de sa boîte : son mécanisme est **un
4x4x4 auquel il manque des pièces**. Ses coups se calculent donc sur la grille
du 4x4 (`turnDims` : `[4, 4, 4]`, coordonnées `{-3,-1,1,3}` qui contiennent
celles de la tour) et seules ses pièces existent :

- **coups larges** (`Rw`, `Uw`...) : la moitié du mécanisme, **toujours
  possibles**. Dans la boîte, `Rw` tourne toute la moitié droite, qui se couche
  et dépasse devant et derrière ;
- **coups externes** (`R`, `U`...) : la tranche d'extrémité du 4x4, possible
  seulement si cette tranche est un **2x2 complet** (`turnAllowed`), quelle
  que soit la hauteur derrière elle. Dans la boîte : U et D seulement ; après
  `Rw`, plus aucun (le haut n'a plus que deux cubes) ;
- **pas de tranches internes** : un coup large puis un coup externe en font
  une, et elles servent rarement.

Le pad grise les coups bloqués, le mélange ne tire que des coups possibles
(il simule l'état depuis le cube courant), et le rendu place linéairement les
pièces sorties de la boîte (`visualPosition`).

**Résolution** (`methods/tower/tower.ts`, méthode **Deux Pockets**, d'après
fan2cube.fr/tower2242.php et domino2.php) : la tour est deux Pockets empilés,
un intérieur (les 8 pièces du milieu) et un extérieur (les 8 coins).

1. **Remettre en forme** (`Uw Dw Rw Fw`) : vue comme un long Pocket dont les
   « sommets » sont des barres (un coin + la pièce du milieu voisine), on
   redresse chaque barre avec la formule de pivot de la page (deux barres à la
   fois), amenée par des coups larges. Clé de recherche : la façon dont chaque
   barre est couchée (3^8 motifs).
2. **Pocket intérieur** (`Uw Dw Rw2 Fw2`), comme un Domino : sommets du bas
   (« descendre un sommet »), puis du haut (« permuter deux sommets »). h et b
   s'y jouent en `Uw`/`Dw`, comme la page le suggère.
3. **Pocket extérieur** (`U D Rw2 Fw2`), mêmes formules. Descendre un sommet
   retourne la moitié avant du Pocket intérieur : la recherche, qui exige le
   Pocket intérieur intact, descend donc les coins **deux par deux**, comme le
   prescrit la page.

Correspondance des notations : H B A P G D = U D F B L R, H\* B\* = Uw Dw, une
face latérale de la tour en est la moitié (A = Fw), « D = D² » en parties II
et III. Les deux pièces du milieu d'une colonne sont **jumelles** (mêmes
couleurs) : objectifs et clés comparent des couleurs, pas des identités
(`pieceSearch` sait suivre des jumelles).

## La tour 2x3x4 (`234`)

La tour 2x3x4 (fan2cube.fr/tower2341 et 2) : 3 de large, 4 de
haut, 2 de profondeur. Ses colonnes de gauche et de droite tournent d'un
quart (`R`, `L`) : debout (4 de haut, 2 de profondeur), une colonne se
couche (2 de haut, 4 de profondeur) et dépasse devant et derrière, la tour
se déforme. Le reste ne tourne que d'un demi-tour : les couches du haut et
du bas et leurs voisines (`U2`, `2U2`), les moitiés (`Uw2`, `Fw2`) ; comme
sur le 2x2x4, une couche (ou sa voisine) ne tourne que si elle est entière,
ses six pièces debout à leur place (`tower234Turns`, le `turnAllowed` de
son modèle), les moitiés et les
colonnes toujours. **Modèle** (`lib/puzzles/tower/tower234.ts`) : la grille du 3x4x2,
chaque pièce large de 1 sur x et de 2 sur y et z, si bien qu'une colonne
couchée met ses pièces en y = ±1, z de -3 à 3 ; le mécanisme
(`TOWER234_MECHANISM`, `[3, 4, 4]`) coupe z comme y. Dans la boîte
(`tower234Boxed`) quand toutes ses pièces sont à |z| <= 1. Rendu : `three/puzzles/tower/tower234Geometry.ts`
(boîtes).

**Résolution** (`methods/tower/tower234.ts`, méthode **Sommets, arêtes,
équateur**, d'après la page) : (A) la forme, le moins de coups pour revenir
dans la boîte (recherche sur la forme seule) ; (B) les centres ; (C) les
sommets par P(H*D.G.H*D)³P et P(H*G'.D'.H*G')³P (D et G, sans exposant, y
sont des quarts de colonne : la page écrit D² quand c'est un demi-tour) ;
(D) les arêtes par (D²H)³, (D²A)³, PB.(D²A)³.BP ; (E) l'équateur par
((D²h)²P)², ((G²h)²P)², hA.(D²h)².Ah, (HA)³. Ces formules restent dans la
boîte et n'atteignent qu'un tiers des équateurs possibles une fois le reste
fait (96 sur 288) : une pièce peut rester échangée de gauche à droite (la
« brick parity » des cuboïdes). Une formule à nous, de 20 coups, qui sort
de la boîte et y revient, les atteint tous (`equatorParity`). Les formules
sont conjuguées par un coup de la boîte qui ne dérange rien d'autre.

## Les tours 3x3x4, 4x4x3, 4x4x5 et 5x5x4 (`334`, `443`, `445`, `554`)

Des cuboïdes réguliers (fan2cube.fr/tower3341, tower4431, tower4451,
tower5541) : base carrée, le haut et le bas et leurs couches intérieures en
quarts de tour, les côtés (et leurs tranches intérieures, sauf sur la 3x3x4)
en demi-tours seulement ; aucune ne se déforme. Le moteur les fait tourner
tels quels (`SHAPE_DIMS`, `movesFor`) ; la tranche du milieu d'un axe impair
n'est nommée qu'une fois, par R, U ou F (`2U` sur la 4x4x3, que le guide
garde ainsi), et la 3x3x4 n'a pas de tranche entre ses côtés (le hook
`layers` de son modèle, `lib/puzzles/tower/models.ts`).

**3x3x4, méthode Double Domino** (`methods/tower/tower334.ts`, d'après la page,
« c'est donc un Super Domino ») : deux Dominos qui partagent leurs côtés,
l'extérieur (H, B) et l'intérieur (h, b), résolus avec les formules du Domino
(`methods/tower/towerLayers.ts`). L'extérieur se lit comme un Domino (projection,
pièces toutes différentes) ; l'intérieur joue les mêmes formules en h et b,
ses pièces allant par jumelles (celle du haut et celle du bas pareilles).
Ses formules tournent aussi les côtés, que l'extérieur partage : chacune
vient deux fois, h ou b tournés entre les deux et défaits après
(`M S M S'` : les côtés d'une formule du Domino se lisent pareil dans les
deux sens, donc deux fois ils s'annulent), sauf celles dont les côtés
s'annulent déjà (les « deux par deux » de la page). La page fait
l'intérieur d'abord ; ici l'extérieur d'abord : ses pièces uniques
laisseraient sinon une parité qu'aucune formule gardant l'intérieur ne
défait, alors que les jumelles de l'intérieur l'absorbent.

**4x4x3, 4x4x5 et 5x5x4, méthode Réduction** (`methods/tower/tower44.ts`,
`methods/tower/tower554.ts`, d'après les pages : « on le transforme d'abord en un
3x3x4 », « transformer la Tour 5x5x4 en 3x3x4 ») : les centres du haut et du
bas, ceux des côtés (4x4x5, 5x5x4), puis les arêtes reformées (deux ailes
ensemble sur les 4x4, autour de leur milieu sur la 5x5x4) ; chaque pièce par
un 3-cycle pur de sa sorte (`methods/tower/towerReduce.ts` : commutateurs d'une
couche intérieure et d'un ou deux tours, `[A, B]`, `[A, BCB']`, `[ABA',
C]`, trouvés au chargement), les
cibles par couleur, bloc par bloc (les pièces d'une sorte peuvent former
deux blocs que les 3-cycles ne mêlent pas). Puis la tour de 3 de large
devenue : la 5x5x4 est un 3x3x4 (projection sur ses pièces des milieux), la
4x4x5 un Domino extérieur, un intérieur et un équateur, la 4x4x3 un Domino
et un équateur (`towerLayers.ts` : l'équateur par son quart de tour, mis en
place par les côtés et défait après, puis ses centres par 3-cycles). D'abord
une **parité** (étape retirée quand elle est vide) : sur la 5x5x4, les ailes
en permutation impaire de leurs milieux (un demi-tour de tranche intérieure
en échange une de chaque bloc, comme la parité d'arête du 5x5) ; sur les
4x4, les « étrangetés » de la page, lues avant de réduire (permutations des
sommets, des ailes et des arêtes du milieu, et sens de ces dernières,
impairs ensemble : un tour de face en change deux, le quart du milieu deux,
une tranche intérieure les ailes seules), réglées par le même demi-tour.

## Le Camouflage 4x4x2 (`camo`)

Le Camouflage 4x4x2 (fan2cube.fr/camouflage4421 et 2) est
un 4x4x4 bandé : vu de dessus un 4x4 aux rangées externes épaisses et
internes fines (un Domino 3x3x2 dont la couche du milieu est coupée en
deux), haut de deux pièces, chacune collée sur une couche fine et une
épaisse du 4x4x4. Le modèle garde le mécanisme du 4x4x4 (`turnDims`),
chaque pièce à sa case des deux couches du milieu (`SHAPE_DIMS`
`[4, 2, 4]`, `SHAPE_SHIFTS`) ; ce qu'elle montre et ce qu'elle bloque est
sa boîte (`lib/puzzles/tower/camo.ts`, `camoBox` : épaisseurs 1 et 0,5, hauteur 1, la
boîte résolue tournée comme la pièce, retrouvée sur sa case et ses
stickers). `isBoxed` lit ces boîtes (`camoBoxed`, le `boxed` de son
modèle) : une pièce peut être dans sa case
mais couchée.

**Coups** (`camoTurns`) : un coup passe quand aucune boîte ne chevauche
une de ses coupes. Chaque pièce n'est haute d'une unité que sur un axe (son
étage), et c'est là seulement qu'elle chevauche la coupe de la couche
externe : les blocs (la moitié du puzzle, H*, A* : `Uw`, `Fw`) tournent
toujours, une couche seule (`R`, `2R`) tant qu'aucune pièce n'est debout
sur son axe de son côté. Dans la boîte, le haut ne tourne donc qu'en bloc ;
les côtés tournent couche par couche, et la déforment.

**Saisie** dans la boîte seulement (`notEnterable`) ; « Modifier » attend qu'il y soit revenu.

**Résolution** (`methods/tower/camo.ts`, méthode **Réduction en Domino**,
d'après la page) : (A) la forme (« au feeling », dit la page) : une
recherche sur la forme seule (`lib/puzzles/tower/camoShape.ts` : case par case, l'axe sur
lequel la pièce est haute ; une couche bloquée par les seules pièces debout
sur son axe), par les deux bouts : de la boîte une fois (gardée), puis de
la forme jusqu'à la rencontre. Les quarts de tour d'une couche peuvent
laisser les ailes en permutation impaire, que les formules suivantes, toutes
paires, ne défont pas : une formule de 10 coups qui sort de la boîte et y
revient (`WING_PARITY`) la change. (B) les centres blancs en haut ; (C) les deux ailes de chaque
arête réunies, une arête après l'autre, avec l'échange D*²H'D²HD*² de la
page et des allers-retours hors de la boîte (`2R Uw 2R'`,
« comme dans le Revenge ») ; (D) c'est alors un Domino 3x3x2, lu sur ses
pièces (une aile par arête, un centre par face) et résolu par sa méthode
(`DOMINO_PLAN`), son haut et son bas devenant les blocs du Camouflage.
La page note X pour X* ou X²
« pour ne pas alourdir » : seules ses formules sans ambiguïté sont reprises.

## Le Domino et la Slim Tower

Le Domino (`[3, 2, 3]`) est un 3x3 sans couche du milieu, et rien n'y est
spécial : ses coups se déduisent de la forme (U et D en quarts de tour, les
faces latérales en demi-tours seulement), ses deux centres sont fixes, ses
pièces sont uniques et sans orientation.

**Résolution** (`methods/tower/domino.ts`, méthode **Coins puis arêtes**, d'après
fan2cube.fr/domino1.php et domino2.php) : (A) coins du bas, descendus un à un
(`F2 U' F2 U F2`) ; (B) coins du haut, échangés deux à deux ; (C) arêtes du
bas, descendues une à une (`D2 R2 (D2 F2)3 R2 D2`, qui ne touche rien
d'autre) ; (D) arêtes du haut, par 3-cycle ou échange. Chaque phase cherche
parmi ses seules formules, U et D plaçant les pièces dessous, avec une
recherche bidirectionnelle vers « ces pièces à leur place ». La tour réutilise
les formules A et B pour ses deux Pockets.

La **Slim Tower** (`[2, 3, 2]`, `methods/tower/slimTower.ts`, d'après
fan2cube.fr/tower2231 et tower2232) est un Domino debout : U et D en quarts de
tour, avec leurs blocs `Uw`/`Dw` (le `H*` de fan2cube, qui fait tourner
l'équateur avec), et les côtés en demi-tours seulement ; elle ne se déforme
pas. Le coup large sur son axe de 3 couches vient de `inner` sur sa carte.
Méthode **Équateur puis coins** : (I) l'équateur, intuitivement ; (II) les coins du bas avec la
formule de descente du Domino, qui échange au passage deux arêtes de
l'équateur, d'où une descente deux par deux ; (III) les coins du haut avec
l'échange du Domino, pur sur ce puzzle.
