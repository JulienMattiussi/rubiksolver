# Les polyèdres

Détail des puzzles de la catégorie (modèles : `src/lib/puzzles/polyhedron/`, méthodes : `src/lib/methods/polyhedron/`, dessins : `src/three/puzzles/polyhedron/`). Les principes communs sont dans [AGENTS.md](../../AGENTS.md).

## Le 4-Trajber's Octahedron (`oct4`)

Un **4x4x4 taillé en octaèdre** (fan2cube.fr/4-trajber-oct1 et 2) : les six sommets de l'octaèdre sont les six faces du cube
(H, B, G, D, A, P), et il tourne exactement comme un 4x4x4. Le moteur des
cubes le fait donc tourner tel quel (`SHAPE_DIMS` `[4, 4, 4]`, pad, guide,
mélange) ; seules ses pièces diffèrent (`lib/puzzles/polyhedron/oct4.ts`) : un seul sticker
chacune, sur la face de l'octaèdre de leur octant (les diagonales,
`TET_NORMALS` et leurs opposées). Les 8 coins du cube sont les triangles
au milieu des faces (les « centres » de la page), ses 24 ailes les pièces le
long des arêtes (« arêtes »), ses 24 centres celles des sommets
(« sommets ») ; ses 8 cubies intérieurs, cachés, sont omis. 8 couleurs, les
faces opposées par paires. Pas de coup large : il tourne quatre faces
entières (le puzzle reste résolu, couleurs permutées), la page n'en use que
comme raccourci (`A* = A a`) ; son `inner` n'a que la tranche.

**Rendu** (`three/puzzles/polyhedron/octGeometry.ts`) : chaque pièce est sa case du 4x4x4
(ouverte vers l'extérieur sur les couches externes) coupée par l'octaèdre
`|x| + |y| + |z| <= 8`, un polyèdre convexe calculé depuis ses plans
(`three/core/polyhedron.ts`) ; une forme ne dépend que de
l'emplacement, donc la pièce est dessinée où elle est.

**Résolution** (`methods/polyhedron/oct4.ts`, méthode **Sommets d'abord**) : rien n'est
fixe, la couleur de chaque face se lit sur les centres (la tenue du puzzle
résolu qui en place le plus, figée au début de chaque étape ; aucun 3-cycle
de sommets ou d'arêtes ne les bouge). (0) **Parité** : un quart de tour si
les centres sont dans une permutation impaire (les 3-cycles sont pairs). (1) **Sommets**, (2) **arêtes**, (3)
**centres**, par 3-cycles purs (`cycleLibrary`, `placeAll`, en empruntant un ou deux emplacements justes quand il ne reste
que deux pièces d'une même arête de l'octaèdre). Les sommets se font avec
des commutateurs de la forme de ceux de la page (T, K, pris au Super Revenge :
`[A, X Y X']`, A et Y des tranches, X un coup externe) ; les arêtes, une à une par commutateurs
de tranches (comme les ailes du 5x5), et non par paires avec les formules
du VTO de la page, dont l'effet est tout de même vérifié en test.

## L'Octahedron VTO (`vto`) et le GEM-0 (`gem`)

Le Vertex Turning Octahedron (fan2cube.fr/VTO1 et 2) est un **3x3x3 taillé
en octaèdre**, à la profondeur de ses coupes (un tiers depuis chaque sommet)
: chaque face se découpe comme celle d'un Pyraminx, en 9 triangles. Ses six
sommets sont les centres du cube et tournent d'un quart de tour, avec leur
pointe, les quatre triangles qui l'entourent (les « centres » de la page) et
leurs quatre arêtes ; les **pointes tournent aussi seules**.
Il tourne donc sur la grille d'un 5x5 (`SHAPE_DIMS` `[5, 5, 5]`) : pointe à
2 sur son axe, triangles à 1, arêtes du cube en (1, 1, 0) ; le coup large
(`Rw`) est celui du sommet, l'externe (`R`) celui de la pointe seule. Le pad
les présente en onglets « Sommets » (d'abord) et « Pointes ». Les coins du
cube, cachés (ils ne touchent les faces qu'en leur milieu), sont omis avec
le cœur. Les cases n'ont pas la même taille (`VTO_CELL` : 1/2 autour du
cœur, de 1/2 à 1, puis la pointe au-delà, dans les unités de l'octaèdre
|x| + |y| + |z| <= 3/2) ; une pièce porte un sticker par face dont le plan
coupe sa case, aux couleurs du 4-Trajber (`OCT_FACE_COLOR`).

Le **GEM-0** (Jewel, fan2cube.fr/GEM-O1 et 2) est
« un VTO sans sommet » : ses pointes sont rabotées en carrés (|x|, |y|, |z|
<= 1, `truncate`), dorés avec un emblème rond comme sur le vrai puzzle
(`gemEmblem.ts`, posé par `PolyDrawing.decal`). Sans pointes, il tourne
comme un 3x3x3 (`GEM_CELL`), et chaque centre porte son carré en plus de
ses quatre triangles. La page annonce des tours de 120°, mais son propre
décompte (4⁶ orientations de centres) et le mécanisme donnent des quarts.

**Rendu** (`octGeometry.ts`, partagé avec le 4-Trajber) : chaque pièce est
sa case coupée par l'octaèdre (et, au GEM-0, par les plans des carrés) ; les
vignettes n'en gardent que les faces extérieures (`outside`), sans quoi les
faces entre pièces passent devant dans l'ordre du peintre.

**Résolution** (`methods/polyhedron/vto.ts`, `centersThenEdges`, d'après les pages) :
la page du VTO tient le puzzle une face vers soi, le sommet P en haut, G en
bas à gauche, D en bas à droite, soit U, F et R du cube ; celle du GEM-0
nomme ses carrés comme nos lettres françaises (A, D, H = F, R, U). (1) chaque
sommet tourné jusqu'à ce que ses triangles aillent avec leurs faces (la
tenue se lit sur eux, qui ne quittent jamais leur place) ; (2) arêtes
placées par 3-cycles (`cycleTable.ts`) : au VTO `[G D']` et `G'PG.P.G'P²G`,
au GEM-0 `[H D]` ((HP) -> (HD) -> (AD)) ;
(3) retournées deux par deux, `[G D'][P' D]` (`[A D'][H' D]` au GEM-0) ;
(4) au VTO, les pointes tournées seules. Les sommets faits, les arêtes sont
en permutation paire (un quart de tour est un 4-cycle d'arêtes et un quart
de sommet) : les 3-cycles suffisent.

## Le FTO (`fto`)

Le FTO, Face Turning Octahedron (fan2cube.fr/FTO1 et 2) : un octaèdre comme le VTO, mais ce sont ses huit faces qui tournent,
par tiers de tour. Chaque face est découpée en 9 triangles par les coupes
des faces voisines, au tiers de la profondeur : 6 sommets (quatre
triangles), 12 arêtes (deux, sans sens) et 24 centres (un, en deux
familles que rien ne mélange), et entre chaque face et son opposée une
tranche qui tourne aussi. **Modèle** (`lib/puzzles/polyhedron/fto.ts`) : celui du Rainbow
(`RainbowMove.fto`, `slice` pour une tranche), les faces regardant les
diagonales du cube ; l'octaèdre |x| + |y| + |z| <= 6, coupé à 2 le long de
chaque diagonale ; une pièce tient en un point de sa case (sommets en
(3, 0, 0), arêtes en (2, 2, 0), centres en (2, 1, 1)...), une face prend ce
qui est à au moins 2 le long de sa diagonale, sa tranche ce qui est à moins
de 2 du milieu (`rainbowTurns`). Couleurs du 4-Trajber, 24 tenues (les
rotations du cube). **Notation** de la page : H, A, G, D, P, B et les
faces opposées à G et D, soulignées ; tranches h, a, g, d ; en anglais
celle de la WCA (U, F, L, R, B, D, BR, BL ; u, f, l, r). Une tranche
nommée par la face opposée est la même, à l'envers (`namedSlice`). **Rendu**
(`three/puzzles/polyhedron/ftoGeometry.ts`) : chaque pièce est l'octaèdre coupé par ses
couches le long des quatre axes, posé sur sa face du bas (`FTO_ORIENT`),
comme la page le tient. **Saisie** des couleurs, comme les cubes (24 tenues).

**Résolution** (`methods/polyhedron/fto.ts`, méthode **Sommets, centres, arêtes**, la
méthode 2 de la page) : (1) les sommets placés et tournés, le moins de
coups sur les seuls sommets (la page joue O1 = [D A'] et O2 = HD'H'.AHD) ;
leur tenue dit celle du puzzle résolu ; (2) les centres par O4 =
AhA'.B.Ah'A'.B', un 3-cycle de centres qui ne touche rien d'autre, une
famille après l'autre, ceux d'une couleur pareils (comme les pétales du
Rex) ; (3) les arêtes par O3 = dHd'h.dH'd'h', un 3-cycle d'arêtes pur.

## Le Rainbow (`rainbow`)

Le Rainbow (fan2cube.fr/rainbow1 et 2) est un **cuboctaèdre** : 6 carrés et
8 triangles. Chaque triangle tourne par tiers de tour, son centre fixe, et
emporte les trois pièces de ses coins : un 3-cycle. Les 12 pièces sont aux
sommets du cuboctaèdre et montrent quatre couleurs (un quart de deux carrés,
un coin de deux triangles) ; une pièce n'a qu'une pose par emplacement, d'où
12!/2 états (chaque tour est un 3-cycle, donc pair).

**Modèle entier** (`lib/puzzles/shared/rainbow.ts`, puzzle sans grille) : les carrés
regardent les axes du cube, les triangles ses diagonales (`TET_NORMALS` et
leurs opposées) ; les pièces sont aux milieux des arêtes du cube
(`(1, 1, 0)`...), les 8 centres fixes à ses coins. Un tiers de tour autour
d'une diagonale est une permutation signée des coordonnées ; il prend ce dont
le produit scalaire avec la diagonale vaut au moins 2. Couleurs : les carrés aux couleurs du cube, chaque
triangle la sienne (violet en haut, comme sur la page ; puis rose, bleu
foncé, turquoise, rose pâle, vert citron, vert foncé, marron, les six
dernières propres au Rainbow) ; les centres fixes tiennent le repère. Les
triangles de devant touchent tous le carré vert, ceux de derrière le bleu :
le bleu foncé est devant, le vert foncé derrière. Le puzzle est tenu un carré devant, tourné d'un
huitième pour avoir des triangles en haut, en bas et sur les côtés.

**Notation** : celle de fan2cube en français, H B G D pour les triangles de
devant, h b g d pour ceux de derrière ; U D L R / u d l r en anglais ; `'`
pour le sens inverse. `parseRainbowMoves` lit les formules de la page
(`[H' G']`).

**Rendu** (`three/puzzles/polyhedron/rainbowGeometry.ts`) : le solide est le cuboctaèdre
(`polyhedron.ts`), chaque pièce sa cellule de Voronoï autour de son sommet,
coupée par les plans qui la séparent des centres ; un centre fixe est le
reste sous ses trois coupes.

**Résolution** (`methods/polyhedron/rainbow.ts`, méthode **Triangle prolongé**,
d'après la page) : (1) le triangle du haut, ses trois pièces placées par
recherche (`solvePieces`) ; (2) les autres par 3-cycles, avec les deux
commutateurs de la page, « placer à gauche » `[H' G']` et « placer à
droite » `[H D]`.

## Le Megaminx (`megaminx`)

Le Megaminx (fan2cube.fr/megaminx1 et 2) : un dodécaèdre dont les douze
faces tournent par cinquièmes de tour, 12 centres fixes, 30 arêtes et 20
sommets. Aucune grille entière ne lui va : le
modèle (`lib/puzzles/polyhedron/megaminx.ts`) est combinatoire. Un emplacement est l'ensemble
des faces qu'il touche, un sticker regarde une des douze faces ; le tour
d'une face fait avancer d'un cran les faces autour d'elle (dans le sens
horaire vu d'elle), ce qui envoie chaque emplacement et chaque sticker de sa
couche : une permutation exacte. Pour le reste du code, un emplacement a une
position entière (son numéro, qui ne dit rien de sa place) et une face une
normale de la table des cubes (des étiquettes). Tenu le haut (U) en haut, F
devant, puis L, BL, BR, R autour du haut, la couronne du bas (DR sous F et R,
DBR, B, DBL, DL) et D ; 60 façons de le tenir (`MEGA_SYMMETRIES`). Les axes
réels des faces ne servent qu'à l'animation et au dessin (`MEGA_AXES`).
Notation : U F R... en anglais (`R2'` deux cinquièmes à l'envers) ; en
français, celle de la page, A devant, H au-dessus, puis D, B, P (souligné),
G autour de A dans le sens horaire, P derrière H et D, les faces opposées
soulignées (un trait bas combinant). Rendu (`three/puzzles/polyhedron/megaGeometry.ts`) :
chaque pièce est le dodécaèdre coupé par les plans de ses couches, dessinée
où elle est ; pad dédié (`MegaPad` : moitié haute, moitié basse). **Saisie**
des couleurs, comme les cubes : ses 60 tenues donnent les placements
valides, ses centres restent pré-remplis.

**Résolution** (`methods/polyhedron/megaminx.ts`, méthode **L'étoile prolongée**,
d'après la page) : l'étoile du dessous (A², A.H'DH), ses sommets (D'B'D,
tournés par D'BD.ABA'), l'équateur bas ([H'A'][HD], [HD][H'A']), les cinq
faces voisines (H'A'²HA², H'A'H²A, HD²H'D'², HDH'²D', HDH'D'), l'équateur
haut, puis le haut : arêtes placées (A[HD]A') et retournées
(A[HD]HA'HA.H³A'), sommets placés ([HA].P'[AH]P) et tournés
((D'BDABA').H'(AB'A'D'B'D)H). Chaque formule est vue des 60 tenues, seule ou
préparée par un coup défait ensuite (X F X'), et son effet, qui ne dépend
pas de l'état, est lu une fois sur le puzzle résolu sous forme de table
(emplacement et face du premier sticker d'une pièce). Une pièce rentre par le
plus court enchaînement de celles qui laissent en place tout ce qui est fait
(Dijkstra sur ses places), pièce après pièce. La cible est la tenue que
disent ses centres.

Le **Pyraminx Crystal** (`crystal`, fan2cube.fr/pyraminxcrystal1 et 2) est le Megaminx coupé plus profond : chaque coupe passe par
le centre des faces voisines, si bien qu'il n'a plus de centres (20 sommets,
30 arêtes, un cœur caché qui le distingue du Holey Megaminx, voir
[holey.md](holey.md)). Une face
emporte ses 5 sommets, ses 5 arêtes et les 5 arêtes qui partent de ses
sommets : les mêmes emplacements et la même notation que le Megaminx, le coup
marqué `MegaMove.crystal` (`megaTurns`). Dessin : `megaGeometry.ts`, coupe à
1/√5. Méthode **Les sommets d'abord** (d'après la page, « calquée sur le
Mégaminx ») : sommets puis arêtes du dessous, sommets des équateurs bas et
haut, arêtes des cinq faces voisines, sommets du haut placés ([HA].P'[AH]P)
et tournés (D'BDABA'.H'.AB'A'D'B'D.H), équateur haut, arêtes du haut placées
([G'P], un 3-cycle pur de trois arêtes non voisines ; avec son inverse tourné
d'un cran du haut, il en fait un de trois voisines) et retournées
(([G'P]H')².([PG']H)², la formule n'étant que dans une image de la page).
Sur les étapes du haut, seules les formules tenues le haut en haut servent
(tout le reste est fait), ce qui garde le calcul court.

## Le Skewb Ultimate (`skewbU`)

Le Skewb Ultimate (fan2cube.fr/skewbultimate1 et 2) est un
Skewb taillé en dodécaèdre : chaque sommet
du cube (aussi sommet du dodécaèdre) tourne d'un tiers de tour toute la moitié
du puzzle de son côté. 6 centres montrant chacun les quatre faces penchées
vers leur axe, 8 sommets les trois faces qui s'y rejoignent. Modèle entier,
celui du Dino (`lib/puzzles/shared/skewbs.ts` : `solvedSkewbU`, `RainbowMove.skewb`, notation
des sommets de fan2cube) : centres sur les axes, sommets en (1, 1, 1)..., un
tour prend ce qui a un produit scalaire positif avec sa diagonale. Les 12
faces ont pour normales (0, ±1, ±2) et leurs permutations circulaires (2 pour
φ), que les tiers de tour permutent comme les vraies (`DODECA_NORMALS`,
indices 36 à 47 : deux chiffres en base 36 dans `stateKey` et le mémorisé) ;
12 tenues seulement (`SKEWB_SYMMETRIES` : les quarts de tour du cube ne
gardent pas le dodécaèdre). Rendu (`three/puzzles/polyhedron/skewbUGeometry.ts`) : le dodécaèdre
coupé par les quatre plans du Skewb.

**Résolution** (`methods/polyhedron/skewbU.ts`, méthode **Le haut d'abord**, d'après la
page) : seuls les sommets du bas tournent (B, O, H, E), le centre du haut ne
bouge jamais et dit comment le tenir (le puzzle est lu dans cette tenue, les
coups trouvés rejoués depuis la sienne) ; (1) sommets du haut placés, (2)
tournés par [BO], [O'B'], [OH], [B'E'] ; (3) centres placés par [OH'],
[BO'], [B'E'][HE], [H'E'][HO] ; (4) retournés par [HE']²[EB']² (conjugué par
les précédentes) ; (5) sommets du bas tournés par K = [BO']⁴ et Z = [OH']⁴,
déjà à leur place (« les sommets libres suivent les sommets liés »).
