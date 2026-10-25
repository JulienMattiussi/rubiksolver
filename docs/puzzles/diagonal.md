# Les coupes diagonales

Détail des puzzles de la catégorie (modèles : `src/lib/puzzles/diagonal/`, méthodes : `src/lib/methods/diagonal/`, dessins : `src/three/puzzles/diagonal/`). Les principes communs sont dans [AGENTS.md](../../AGENTS.md).

## Le Dino Cube (`dino`)

Le Dino Cube (fan2cube.fr/dinocube1 et 2) a la mécanique du Rainbow : chaque sommet tourne d'un tiers de tour et
fait un 3-cycle des trois arêtes autour de lui. Ses 12 pièces sont ces
arêtes, deux triangles chacune (les faces coupées le long de leurs
diagonales), sans centre. Le modèle est celui du Rainbow
(`lib/puzzles/shared/dinoRex.ts` : `solvedDino` garde ses arêtes et leurs carrés, `RainbowMove.dino` sa
notation : les lettres de fan2cube, A D P G en haut, B E H O en bas ; UFR...
en anglais). Rendu (`three/puzzles/shared/dinoGeometry.ts`) :
chaque arête est la part du cube où ses deux coordonnées sont les plus
grandes.

**Résolution** (`methods/diagonal/dino.ts`, méthode **Par couches**) : une seule
formule, [GA'] = GA'G'A ((HA)->(HD)->(HG)) : le haut, l'équateur,
le bas. Rien n'est fixe : la cible est la tenue du puzzle résolu la plus
proche ; et il se résout de deux façons (gauche et droite échangées, un
miroir), dont une seule à un nombre pair d'échanges, celle qu'on vise.

## Le Skewb (`skewb`)

fan2cube.fr/skewb1 à 4 (Tony Durham, 1982) : le mécanisme du Skewb
Ultimate (`lib/puzzles/shared/skewbs.ts`, `solvedSkewb`) sur un cube. Chaque
sommet tourne par tiers la moitié du cube de son côté : lui-même, ses trois
voisins et les trois centres autour. 6 centres d'une couleur, 8 sommets de
trois ; même notation que le Dino (A, D, P, G en haut, B, E, H, O en bas).
Ses sommets forment deux clans de quatre (le signe du produit de leurs
coordonnées) qu'aucun coup ne mélange. 24 tenues (`SKEWB_CUBE_SYMMETRIES`).

**Mélange** : des tours des quatre sommets d'un même clan (jamais deux
opposés : un sommet puis son opposé dans l'autre sens tourneraient le cube
entier, résolu pour ses couleurs ; partagé avec le Skewb Ultimate).

**Rendu** (`three/puzzles/diagonal/skewbGeometry.ts`) : le cube coupé par
ses quatre plans diagonaux passant par son centre ; un sommet est ce qui est
au-delà des trois plans voisins du sien (un triangle sur chaque face), un
centre ce qui reste autour de son axe (un losange).

**Résolution** (`methods/diagonal/skewb.ts`, méthode **Le haut d'abord**,
la page 2) : seuls les quatre sommets du bas tournent, le centre du haut ne
bouge pas et dit comment le tenir (blanc en haut, et les sommets dans leur
clan : `skewbKit`, partagé avec le Skewb Ultimate). (1) sommets du haut
placés, puis tournés ([B'O'], de chaque côté : t H) ; (2) centres placés
([B'E'][HE], [H'E'][HO]) : les sommets du bas sont alors placés ; (3)
sommets du bas tournés ([BO']²). L'« algorithme minimal » de la page 3 (la
seule formule [DG']) n'est pas repris. Ce plan (`skewbFirst`) est la
première étape du Master Skewb ; le Skewb a pour méthode son tutoriel joué
jusqu'au bout (ci-dessous), qui valide aussi sa saisie, sur les mêmes
formules (`methods/diagonal/skewb.ts`, avec `CENTER_SWAP` de francocube).

**Tutoriel** (`lib/tutorials/diagonal/skewb.ts`, la méthode de
francocube.com, cyril/skewb_index, très proche de celle de fan2cube) : la
face du centre qui est en haut se construit d'abord, quelle que soit sa
couleur ; le but est le Skewb résolu tourné pour que ce centre soit en haut
et chaque sommet dans son clan (des deux tenues possibles, celle avec
laquelle les sommets du haut s'accordent le plus). Tenues autour du haut,
le côté devant (`skewbHolds.ts`, un quart de tour de l'une à l'autre). (1)
sommets du haut placés, par des tours des sommets du bas, quatre au plus ;
(2) tournés, chacun tenu devant à droite, par [B'O'] (2'-1-2-1' de
francocube) ou son inverse ; (3) centres, par [O'B] (1-2-1'-2') : le centre
du bas échangé avec celui de devant, ceux de gauche et de droite entre eux,
les sommets du haut gardés ; (4) sommets du bas tournés, [O'B] deux fois ou
son inverse, depuis un côté puis un autre (trois fois au plus). Le côté
devant n'est nommé qu'une fois un sommet du haut placé : sa couleur se lit
sur lui, le centre de ce côté pouvant être ailleurs.

## L'Ivy Cube (`ivy`)

ruwix.com/twisty-puzzles/ivy-cube (Eitan Cher, 2009) : un Skewb réduit à un
seul clan de sommets (`lib/puzzles/shared/skewbs.ts`, `solvedIvy`,
`IVY_CORNERS`) : L, R, u et d (le produit de leurs coordonnées vaut -1), les
quatre autres pris dans les feuilles des centres : là où se rejoignent sans
sommet les feuilles jaune, rouge et bleue, comme sur un vrai. Chaque sommet tourne par tiers la moitié du cube
de son côté : lui-même, sur place, et les trois centres autour
(`IVY_TURNS`, les tours du Skewb de ce clan). Ses sommets ne quittent
jamais leur place, ils ne font que tourner : 3^4 × 6!/2 = 29 160 états. 12
tenues, celles qui gardent les places de ses sommets (`SKEWB_SYMMETRIES`,
celles du Skewb Ultimate). Notation et pavé du Dino, réduits à ses quatre
sommets (le haut L, u ; le bas R, d). Mélange : des tours de ses sommets, jamais
deux fois le même de suite (`scrambleIvy`).

**Rendu** (`three/puzzles/diagonal/ivyGeometry.ts`) : sur chaque face, ses
deux sommets à deux coins opposés du carré, chacun la partie de la face
au-delà du cercle de rayon 2 centré sur l'autre ; entre eux, à l'intérieur
des deux cercles, la feuille du centre. Ce que prend le tour d'un sommet est la partie du cube dans la sphère de
rayon 2 centrée sur lui (ses arcs sur les faces). Les calottes de ces
sphères, à l'intérieur du cube, en plastique, ferment les coupes : chaque
morceau est porté par la pièce qui occupe cet endroit (`capsOf`), dans
aucune autre sphère par le sommet, dans celle d'un autre sommet par leur
feuille commune, dans deux autres par la feuille de ces deux-là, dans les
trois (le cœur) par aucune. Ainsi, pendant un tour, tout ce qui est dans
la sphère du sommet tourne avec lui, et rien de fixe ne traverse le morceau
qui tourne. Chaque région est un éventail de
triangles (`faceFan.ts`, partagé avec les Curvy Copters), un sommet depuis
son coin, une feuille depuis son milieu.

**Résolution** (`methods/diagonal/ivy.ts`, méthode **Face par face**,
d'après ruwix) : ses sommets ne bougeant pas, ils disent comment le tenir
(`skewbKit`, la tenue calée sur eux plutôt que sur le centre du haut). (1)
la face blanche : ses deux sommets tournés blanc en haut, puis son centre ;
(2) la face jaune, en face, de même ; (3) les quatre centres restants, un à
un. Chaque étape joue le moins de tours possible ; la correction finale de
la page (un sommet décalé d'un tiers) n'arrive jamais, les sommets étant
tournés d'abord. Ses formules (`L' U U L`, `R U R' U'`), dans une notation
que la page ne définit pas, ne sont pas reprises.

**Scan** : en carré, comme le Skewb, chaque sticker où son dessin le montre.

## Le Master Skewb (`masterSkewb`)

fan2cube.fr/masterskewb1 à 3 (Katsuhiko Okamoto, 2003) : le Skewb et le Rex
Cube en un (`solvedMasterSkewb`, grille ×4 comme le Rex). 8 sommets, 6
centres, 12 arêtes de deux couleurs et 24 pétales d'une couleur, en deux
familles de douze (le signe du produit de leurs coordonnées) qu'aucun coup
ne mélange. Chaque sommet tourne par tiers sa couche extérieure (comme un
sommet du Skewb) ou une tranche (le triangle des pétales et arêtes voisins,
en minuscules : `MASTER_SLICE_LETTERS`) ; une tranche du haut se nomme par
le triangle du bas opposé, sens inversé (`canonicalSlice`). 24 tenues.

**Mélange** : 30 tours de couches ou de tranches, jamais deux fois de suite
le même axe.

**Rendu** (`three/puzzles/diagonal/masterSkewbGeometry.ts`) : le cube coupé
à ±2 sur ses quatre diagonales.

**Résolution** (`methods/diagonal/masterSkewb.ts`, méthode **Le Skewb
d'abord**, la page 3) : (1) sommets et centres comme ceux d'un Skewb, par les
mêmes étapes (`skewbFirst`, les couches extérieures seules) ; (2) arêtes par
o'(P'DP)o(P'D'P) et son miroir ; (3) pétales par e(D'GD)e'(D'G'D) et son
miroir, famille par famille (deux pétales d'une couleur sont pareils, chaque
place veut la couleur de sa face). Chaque formule vue de chaque côté du haut
et préparée par un coup de couche ou de tranche (`cycleTable`), jusqu'à
couvrir tous les 3-cycles, comme sur le Rex.

## Les Curvy Copters (`copter`, `copter3`)

fan2cube.fr/curvycopter1 et 2 (Tom van der Zanden, 2010) et curvycopterIII1
et 2 (Fok, 2013) : le mécanisme de l'Helicopter Cube, chaque arête tournant
d'un demi-tour autour de l'axe par son milieu (`lib/puzzles/diagonal/copter.ts`,
`CopterMove`). Un coup emporte les pièces dans un cône autour de son axe
(cos² de leur angle à lui d'au moins 0,4) ; son demi-tour v -> (v.e) e - v
est entier. Les coups à 60° (« jumbling »), qui sortent du cube, ne sont pas
repris : la page conseille des mélanges cubiques, et sans eux aucune parité.

- **Curvy Copter** (échelle 4) : 8 sommets, 12 arêtes qui ne font que
  pivoter, 24 feuilles (quatre par face, vers ses coins), en 4 orbites de 6
  (une feuille de chaque couleur). Un coup : 2 sommets, son arête, 4 feuilles.
- **Curvy Copter III** (échelle 6) : en plus 6 centres et 24 pétales (quatre
  par face, vers ses arêtes, une seule orbite). Un coup emporte aussi 2
  centres et 6 pétales, ce que dessinent les coupes de la page (des cercles
  autour de chaque arête, qui passent le milieu de la face).

Notation : la lettre de fan2cube de l'arête (A, P, G, D en haut ; O, E, N, S
au milieu ; B, H, C, T en bas), ou ses deux faces en notation internationale
(UF...). Mélange : des arêtes au hasard, jamais deux fois la même de suite.

**Rendu** (`three/puzzles/diagonal/copterGeometry.ts`) : sur chaque face,
quatre cercles autour des milieux de ses arêtes (rayon 1 sur le Curvy
Copter, où ils se rejoignent au milieu ; un peu plus sur le III) et un quart
de disque à chaque coin. Un point appartient à la pièce que disent les
cercles où il est (un : une arête ; deux voisins : une feuille ; trois : un
pétale ; quatre : le centre). Chaque région est tracée rayon par rayon
depuis un point intérieur et dessinée en éventail de triangles, son corps
noir un peu plus large juste sous la face (l'intérieur ne se voit pas par
les coupes).

**Résolution** (`methods/diagonal/copter.ts`, méthode **Les arêtes
d'abord**) : les arêtes ne quittent pas leur place et disent comment le
puzzle est tenu (ses couleurs renommées d'après elles). (1) chaque arête à
l'endroit, par son propre coup ; (2) les centres du III, (DA)² ; (3) les
sommets placés, (DA)², ou (DADP)² et Q = (PGPD)²(PDPG)², puis tournés,
(DA)².G(DP)²G ou (DADP)²(ADAG)² ; (4) les feuilles, (DEAE)², ou (AEDE)² et
V = ((AD)²E)4, chacune dans son orbite ; (5) les pétales du III, T = (DG)²
PAP (GD)² PAP et son miroir X. Chaque formule vue de chaque côté et
préparée par un coup (`cycleTable`). Toutes tournent chaque arête un nombre
pair de fois. Un coup échange deux sommets et retourne une arête («
dir(arêtes) = sig(sommets) ») : les arêtes à l'endroit, sommets et centres
sont permutés pairement, ce que placent des 3-cycles. Les formules de
parité de la page (après des coups à 60°) ne servent donc pas.

## Le Rex Cube (`rex`)

Le Rex Cube (fan2cube.fr/rexcube1 et 2) est le Dino
coupé plus profond : un tiers de
tour d'un sommet emporte ses 3 arêtes, les 3 centres autour et 9 pétales
(testé). 12 arêtes, 6 centres, 24 pétales. Même modèle (`solvedRex`, `RainbowMove.rex` : un sommet tourne ce
qui est à au moins 4 le long de sa diagonale, en quarts de demi-côté : centres
à 4, arêtes en (3, 3, 0), pétales en (2, 4, 2)), même notation que le Dino,
boîte de 9 (`dims` de sa carte). Rendu (`three/puzzles/diagonal/rexGeometry.ts`) : chaque face
coupée par quatre cercles, chacun passant par les deux coins voisins du sien,
son centre au-delà du coin (le carré central fait moitié moins que s'il y était) ; une
région est tracée par rayons depuis un point intérieur, puis posée en plaque
épaisse. Pendant un tour, la sphère de coupe du sommet (celle qui porte ses
cercles) est dessinée, immobile, comme sur le Jing (`rexCut`).

**Résolution** (`methods/diagonal/rex.ts`, méthode **Arêtes, centres, pétales**,
d'après la page) : (1) les arêtes par 3-cycles, [GA'] ; (2) les centres par
3-cycles, [DG'] ; (3) les pétales, avec [DG'][D'B], qui échange deux paires
de pétales d'une même face (rien de visible sur une face finie) : préparé
par un ou deux tours puis rejoué, il donne des 3-cycles de pétales. Les
pétales forment deux familles de 12 que rien ne mélange (ceux qui pointent
vers les sommets d'un tétraèdre ou de l'autre) : chacune se place à son
tour, les pétales d'une couleur étant interchangeables. Cible choisie comme
sur le Dino (tenue, et gauche et droite échangées), à permutations paires
d'arêtes et de centres.

## Le Fisher Cube et le Windmill (`fisher`, `windmill`)

Le Fisher Cube (fan2cube.fr/fishercube1 et 2) est « un
Rubik's Cube déguisé » : le mécanisme d'un 3x3x3, taillé dans un cube tourné
d'un huitième autour de la verticale. Vu
de dessus, son carré du haut est posé sur une pointe de la grille du
mécanisme : le centre du haut et celui du bas sont des carrés, dont le quart
de tour ne se voit pas ; les centres de côté sont des coins le long de ses
arêtes verticales, qui montrent le leur (tourné, un coin se couche) ; les
arêtes du milieu sont au milieu de ses faces, d'une seule couleur, sans sens
visible (comme au Barrel). Il se déforme, sans blocage. Modèle
(`lib/puzzles/diagonal/fisher.ts`) : le 3x3, chaque centre de côté portant un sticker caché,
son repère (couleur `H`, jamais dessiné), pointé vers le centre blanc une
fois résolu : tout coup le porte (une tranche aussi), rien d'autre n'a à le
savoir ; ces stickers en plus le distinguent pour `cubeShape`. Rendu
(`three/puzzles/diagonal/fisherGeometry.ts`, `cutSolid.ts`), tourné d'un seizième pour
montrer deux faces. **Saisie** pièce par pièce (un centre de côté prend ses
quatre sens).

**Résolution** (`methods/diagonal/fisher.ts`) : « exactement comme un Rubik's Cube »,
une méthode du 3x3 (par couches, CFOP, Petrus, ZZ) jouée sur ses couleurs
(les repères mis de côté, après « Centres remis en place »), puis **Centres
tournés** avec la formule de la page (H)+(G)- = Hd'h'd.H'd'hd : elle
tourne le centre de gauche et celui du haut, un carré qui n'en montre rien,
donc un centre de côté seul ; jouée aussi à l'envers, elle tourne
n'importe lequel dans un sens ou l'autre.

Le **Windmill** (`windmill`, fan2cube.fr/windmill1 et 2), le jumeau du
Fisher Cube : le même
mécanisme, son cube tourné seulement de l'angle qui pose chacune de ses
arêtes verticales sur une coupe (cos − sin = 1/3, environ 31,4°,
`three/puzzles/diagonal/windmillGeometry.ts`). Chaque côté montre deux colonnes du
mécanisme : celle d'un coin (ses sommets, qui n'y montrent que deux
couleurs, et son arête du milieu, une seule) et celle d'un centre (son
centre, un rectangle, et ses deux arêtes). Ses centres de côté sont
taillés dans les côtés penchés : tournés, même d'un demi-tour, ils
dépassent ; ils portent le repère du Fisher Cube, plus un second le long de
leur face, qui le suit sans rien dire de plus mais distingue le Windmill
pour `cubeShape`. Ses arêtes du milieu montrent aussi leur sens, sa géométrie
suivant la pièce (`cutSolid.ts` retrouve la rotation d'une pièce sticker
par sticker, ses deux repères ayant la même couleur). Mêmes méthodes, même
saisie que le Fisher Cube, l'« état singulier » de la page (un centre seul
tourné d'un quart) compris. Il se scanne en grille, comme un 3x3, le cadre centré sur le centre de la
face comme celui du miroir ; le sens de ses centres
de côté ne se voyant qu'à leur forme, l'éditeur demande de le vérifier après
le scan.
