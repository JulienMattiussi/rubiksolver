# Le scan à l'appareil photo

Saisir un puzzle en le montrant face par face à la caméra, sur mobile comme
sur un portable ; le résumé est dans [AGENTS.md](../AGENTS.md), les limites
et la suite dans [AMELIORATIONS.md](../AMELIORATIONS.md). La caméra exige
HTTPS : on l'essaie sur un déploiement Vercel.

## Les puzzles scannables

`scannable` (`lib/editor/scan/plan.ts`) : 62 modèles sur 78, dont le 2x2 Qiyi
miroir, et le 3x3 miroir.

- **En grille**, tout se déduit des dimensions (`scanPlan`) : les cubes du
  2x2 au 6x6, les cuboïdes et les plats sans saisie propre (1x2x3, Floppy,
  Domino, tours...). Un modèle saisi autrement le déclare (`PuzzleModel.scan:
'grid'`) : le Void Cube, l'Edge Only, leurs trous sautés ; le Barrel, dont
  la saisie choisit le sens de ses arêtes minces ; le Latch Cube, ses
  flèches suivant ses couleurs ; le Quarter Cube, le repère de ses centres
  placé à la main ensuite (`scanUnseen: 'centerMarks'`) ; les soudés sur un
  3x3, leurs soudures déduites des couleurs lues (voir
  [puzzles/bandaged.md](puzzles/bandaged.md)) ; le Windmill, en grille mais encadré
  comme le miroir (`scan: 'centered'`, `centeredFaces` : le centre de la
  face dans la case marquée, les coupes en filigrane, de la marge autour, son
  centre n'étant pas forcément au milieu de son volume) ; le sens de ses
  centres de côté se voit à leur forme, pas à leur couleur : l'éditeur
  demande de le vérifier après le scan (`scanUnseen` sur sa carte), et la
  lecture ne tient compte que des stickers vus (ses repères cachés sur
  aucune face).
- **En carré** (`scan: 'square'`) : les cubes diagonaux (Skewb, Ivy Cube, Master
  Skewb, Dino, Rex, Curvy Copter et Copter III), et le Rainbow par ses six
  carrés seulement (ses pièces s'y reconnaissent, leurs triangles suivent). Le modèle dit quels stickers
  sont sur la face et comment elle tourne ; leur dessin dit où chacun se
  voit (`three/core/scanDrawing.ts` : le milieu de son polygone, ses
  contours en filigrane).
- **En anneaux** (`scan` : une fonction du modèle) : le Megaminx
  (`megaminxScan.ts`) et le Holey Megaminx (`holeyScan.ts`), chaque face
  un pentagone, son centre, ses arêtes puis ses coins ; le Pyraminx
  Crystal, ses pièces, par les gestes du Holey Megaminx, ses coupes passant
  par le milieu de la face (`RingFace.deep`).
- **Par leurs faces planes** (`scan: { flat }`) : les pyramides
  (Pyraminx, Tetraminx, Master et Professor Pyraminx, Jing), quatre faces
  triangulaires (`pyraScan.ts`). Le modèle déclare chaque face (sa normale,
  son haut, son geste) ; le plan en tire ses stickers, les façons de la
  tenir tournée (les orientations du puzzle qui la gardent en place : 3
  pour un triangle) et son cadre, un polygone régulier (`polygonFrame`) ;
  le dessin place les stickers (`drawnFace`, la face convertie dans le
  repère du dessin), la face remplissant le cadre. Une face que ses
  stickers ne remplissent pas (le Tetraminx, pointes coupées : un hexagone ;
  le Jing, côtés bombés ; un carré du Rainbow, sur une pointe) est encadrée
  par leur enveloppe, sans les coins coupés de leurs stickers, au milieu du
  cadre (`drawnFace`). La face
  verte d'abord, pointe en haut ; deux tiers de tour vers la gauche
  (`spin`, 120°), la pointe du haut restant en haut ; puis la pointe
  basculée en arrière, le dessous face à l'objectif (`topple`, 109°), une
  pointe en bas. Une icône de pyramide remplace le cube de la flèche.
- **Par leurs faces planes** aussi, les octaèdres (le 4-Trajber, le VTO, le
  GEM-0, le FTO : `octScan.ts`), huit faces triangulaires : la face rouge d'abord,
  pointe en haut ; trois quarts de tour vers la gauche (`turn`) ; le puzzle
  retourné tête en bas d'un demi-tour vers l'objectif (`upend`) ; trois
  quarts de tour encore. Une icône d'octaèdre dessine leurs gestes (`solid`
  sur leur plan). Les pièces du 4-Trajber ne montrant qu'un sticker chacune
  (et les centres du FTO), rien ne dit dans quel sens une face a été
  tenue : ils se tiennent comme la consigne le dit, pointe en haut.
- **Par leurs faces planes** encore, le Skewb Ultimate (`dodecaScan.ts`),
  douze faces pentagonales de quatre stickers, par les gestes du Holey
  Megaminx, calculés sur ses normales ; aucun de ses tours ne gardant une
  face en place, sa face dit elle-même ses côtés (`FlatFace.sides`), et il
  se tient comme la consigne le dit.
- **Par leurs faces planes** enfin, les prismes en étoile (`starScan.ts`) :
  le dessus, le dessous et des côtés vus en face d'un creux, chacun
  montrant les faces de plusieurs branches (`FlatFace.shown` : où chaque
  sticker se montre sur la photo, au lieu des seuls stickers tournés vers
  elle) ; 4 photos pour le 2-Star, 5 pour le 4-Star (voir
  [puzzles/round.md](puzzles/round.md)).
- **Par leur forme** (`scan: 'forms'`) : les tours 2x2x4 et 2x3x4, qui se
  déforment. Elles se scannent comme la boîte où tourne leur mécanisme, et
  le scan trouve leur forme : plus besoin de la choisir parmi les
  vignettes (voir « La forme d'une tour » plus bas).
- **Par ses engrenages** : les Gear Cubes, leurs engrenages réalignés
  d'abord (`scanBefore` sur leur carte, rappelé sous le bouton) ;
  l'Ultimate et l'Extreme lus aussi sur leurs engrenages (`scan: 'gears'`,
  `gears.ts` ; voir [puzzles/gear.md](puzzles/gear.md)).
- **Par ses moitiés** (`scan: 'halves'`, `halves.ts`) : le Fashion-V,
  chaque face en 6 x 6 pour voir ses demi-cubies, sa forme déduite de ses
  couleurs (voir [puzzles/twisted.md](puzzles/twisted.md)).
- **Par ses contours** (`scan` : un `OutlineScan`, `outlines.ts`) : le
  Floppy Ghost, tout argenté, lu d'une seule photo (voir « Par les
  contours » plus bas).
- **Par ses canevas** (`scan: 'canvas'`, `canvasRead.ts`) : le Meffert's
  Pocket Cube, ses quatre faces lues comme on les dessine sur ses canevas
  (voir « Le Meffert's Pocket Cube » plus bas).
- **Par les tailles de ses stickers** : le 3x3 miroir et le 2x2 Qiyi
  miroir (`mirrorScan` sur leur carte ; voir « Le cube miroir » et « Le 2x2
  miroir » plus bas).

Restent dehors les puzzles dont une information n'est pas une couleur
(les autres miroirs, super cubes, soudés, engrenages...), les autres puzzles qui se
déforment (Camouflage, Fashion-V, AI Cube), et le Tori (ses
arêtes, de minces amandes au bord des faces).

Seuls le 2x2, le 3x3 (et son miroir), le 2x2 Qiyi miroir, le 4x4, les tours 2x2x3 et 2x2x4, le Gear Cube Ultimate, le Skewb, l'Ivy Cube et le Meffert's Pocket Cube ont été essayés en vrai (`scanTried` sur
leur carte) ; sur les autres, le bouton « Utiliser l'appareil photo » porte
une fiole : « Cette fonction n'a pas encore été testée et validée sur ce
modèle ».

## Le parcours

`ScanView` (plein écran), son état dans `scanStore`, la caméra par
`useCamera` (la caméra arrière ; celle d'un portable, tournée vers soi,
montrée en miroir ; une lampe torche quand le téléphone la propose, Chrome
sur Android).

1. **La consigne** (`ScanInstruction`) s'affiche en grand devant l'image,
   puis glisse à sa place en haut, où tenir le puzzle en gras (« **face à
   l'objectif** », « **en haut** »). Elle dit la face à montrer :
   - par ses couleurs, quand les centres disent les faces (`told` : un 3x3,
     le Megaminx ; chaque face a un centre qu'aucun coup ne déplace, ce que
     ne sont pas ceux du dessus et du dessous du Gear Cube Extreme) : « le centre vert face à l'objectif, le blanc en haut »,
     chaque couleur précédée de sa pastille (`ColorWords`), le geste qui y
     mène dessiné au-dessus (`ScanMoveArrow`) ;
   - sinon par un geste (un cube pair, un cuboïde, un Skewb dont les
     centres bougent, le Holey Megaminx) : n'importe quelle face de la forme
     du cadre d'abord, puis tourné vers la gauche, basculé vers l'objectif,
     un demi-tour..., chaque geste fléché avec son angle (`ScanMoveArrow`).
     Une caméra tournée vers l'utilisateur (celle d'un portable, l'image en
     miroir) voit le puzzle de l'autre côté : « tournez vers la gauche »
     y devient « vers la droite », la flèche inversée ; la flèche d'une bascule
     vers l'objectif y part de la face vue par l'utilisateur, par-dessus, vers
     l'écran. Tourné ainsi, le puzzle montre ses faces dans l'image miroir des
     gestes d'un téléphone (gauche et droite échangées : la face de gauche
     après celle de devant, le dessus et le dessous tenus la gauche en
     haut ; constaté sur une tour et sur un miroir) : le plan est alors bâti
     dans cet ordre (`orderFor`, `scanPlan(..., behind)`, `scanStore.behind`),
     pour tous les modèles, faces nommées par leur couleur comprises (un
     3x3 : « vers la droite : le centre orange ») ; consigne, vérification
     du centre à la prise et lecture le suivent. Une face à reprendre
     ne redit pas le geste qui y menait : seulement la face, et sa photo.
2. **Le cadre** (`ScanFrame`), en pointillé, de la forme de la face (grille,
   bande, pentagone, carré), sous la consigne et au-dessus des boutons
   (`frame.ts`) ; il garde sa taille d'une face à l'autre (la place
   réservée à la consigne ne fait que grandir), pour ne pas faire rapprocher
   ou éloigner le puzzle ; ses découpes en filigrane, la case du centre entourée
   (de la forme de la face : un pentagone sur un Megaminx). Une face qu'une
   seule pièce situe (le centre d'un miroir, d'un Windmill, la pièce
   centrale du Floppy Ghost) n'a pas de contour : cette pièce, et ses côtés
   prolongés en traits qui s'estompent (`CenterCuts`).
3. **Le tap** (`ScanTake`, au milieu de l'écran ; la barre d'espace sur un
   portable) : rien ne distinguant un puzzle d'un mur, c'est l'utilisateur
   qui dit que le puzzle est en place. Avant, rien n'est lu (pas de points
   qui inciteraient à attendre qu'ils soient tous justes). Le bouton qui a
   ouvert le scan perd le focus et ne relance pas un scan ouvert : sans
   cela, la barre d'espace pressée entre deux faces le pressait, et le scan
   repartait de zéro.
4. **La prise** (`useFaceReading`, `capture.ts`) : « Tenez le puzzle
   immobile… » ; chaque case montre ce qu'elle lit (un point de sa couleur,
   un anneau quand ce n'est pas sûr) ; la face est prise quand ses couleurs
   restent les mêmes une seconde (le cadre passe au vert). Rien de stable
   en 5 secondes : un tap à refaire.
5. **La vérification** de la face (un loader), puis un 💪 (`Cheer`) et la
   face suivante ; ou « Cube mal détecté » et la même face à reprendre.
6. **La lecture** du puzzle entier (`readScan`), puis l'éditeur, le puzzle
   peint, avec un encadré : « vérifiez bien que le modèle représenté est
   conforme à votre puzzle, puis validez » (`fromScan`). Une face douteuse
   est redemandée, avec la photo prise d'elle : sans couleur qui la nomme (un
   puzzle montré par gestes), c'est ce qui dit laquelle reprendre, et dans
   quel sens.

`?scandebug` dans l'adresse écrit dans chaque case sa mesure (clarté,
saturation, teinte), pour régler les seuils ; sur un miroir, il écrit dans
la console les rectangles trouvés sur chaque face, pour rejouer la lecture ;
sur un puzzle lu par ses contours, il télécharge l'image lue (PNG), et
sur le Meffert's Pocket Cube une seule image à chaque lecture : ses faces
côte à côte telles que prises (pour rejouer la lecture), et dessous chaque sticker
lu encadré de la couleur lue, sa lettre dessus, le cadre affiché en
pointillés (`saveReading`, `store/scanDebug.ts`) ; une face refusée à la
prise est téléchargée seule.

## La lecture d'une face

- **Les mesures** (`sample.ts`) : chaque case lue autour de son point, la
  médiane de ses pixels en Lab. Un reflet ôte la couleur sans en donner :
  quand un quart des pixels sont colorés, la case est lue sur la moitié la
  plus colorée d'entre eux.
- **Les couleurs nommées** (`color.ts`), sur un puzzle aux six couleurs du
  cube : par la teinte, la saturation et la clarté, une couleur « sûre »
  seulement assez loin des limites. Rouge et orange (`TWINS`) ne se
  départagent qu'à la lecture finale : pour la prise, ils sont une même
  famille.
- **Sur un puzzle aux couleurs nombreuses** (le Megaminx), rien n'est
  nommé à la prise : la face est prise quand ses mesures restent stables.
- **La même face deux fois** : une face qui montre encore les couleurs de
  celle qu'on vient de prendre attend que l'image change.

## La lecture du puzzle

- **Les couleurs** (`anchors.ts`) : un premier jet (les centres, chacun la
  couleur de sa face s'il la nomme, sinon celle dont il est le plus
  proche ; sans centres, la teinte, ou les teintes peintes,
  `core/stickerColors.ts`), puis les stickers triés entre les couleurs,
  chacune en prenant autant que le puzzle en a, les plus proches, quelques
  passes de suite. Aucun seuil fixe : chaque couleur telle que cette
  lumière la montre.
- **Les faces tenues tournées** (`orient.ts`) : la rotation de chaque face
  qui fait de vraies pièces des coins et des arêtes, toutes les
  combinaisons essayées (4096 sur un cube) ou, au-delà (le Megaminx), les
  faces placées de proche en proche puis ajustées. À coût égal, la face
  est lue comme la consigne la tient.
- **Les pièces** (`classify.ts`, `assign.ts`) : chaque vraie pièce placée
  au moindre coût (la méthode hongroise, sur les placements et les budgets
  de l'éditeur, `tablesFor`) ; un sticker que cela force loin de ce qu'il
  montrait désigne la face à reprendre.

Une face tenue tournée n'est retrouvée à coup sûr que sur un cube à grille,
le Master Skewb, les Copter et le Megaminx : sur un cuboïde, un plat, le
Dino, le Rex, l'Edge Only, une face lue dans l'autre sens peut encore
faire de vraies pièces (la face est redemandée, ou l'état lu est faux mais
possible) ; il faut le tenir comme la consigne le dit.

## La forme d'une tour

`box.ts`, `forms.ts`. Le bouton « Utiliser l'appareil photo » est offert dès
le choix de la forme. La tour se tient son côté le plus long à la verticale
(toutes ses formes en ont un de 4 : il fixe la taille des cases), chaque
petit cube dans une case ; les six faces de la boîte se scannent par les
gestes d'un 4x4x4, chaque cadre de la taille de la boîte (4 x 4 sur la
2x2x4). Une case montre un sticker, le côté noir d'une pièce ou rien (le
fond) : la prise demande seulement un sticker au moins.

**Le cœur** (`coreOf`) : les cases qu'une pièce remplit quelle que soit la
forme (les quatre petits cubes du milieu de la 2x2x4, qui ne bougent
jamais), encadrées dans le cadre. La consigne demande de les y mettre :
chaque case est alors là où le mécanisme la place, sans décalage à
deviner. Le cœur ne montre que des pièces : ses stickers, sous cette
lumière, disent ce qu'est un sticker autour (une case aussi proche de l'un
d'eux, la clarté comptée entière : un mur gris est un blanc plus sombre),
une case sombre est un côté noir (ou un fond sombre), le reste est le fond.

À la lecture, chaque forme de la tour (102 sur la 2x2x4, 22 sur la 2x3x4,
`formsOf`), tenue de chaque façon qui garde son côté long vertical
(`holdings`), dit ce que montre chaque case (`facesShown`). Chaque forme
est confrontée aux images, un sticker attendu devant ressembler à ceux du
cœur, un côté noir être sombre, le fond n'imposant presque rien. Les
meilleures formes sont lues entières (`readFaces`, sur les tables de
l'éditeur pour cette forme : un sticker caché contre une autre pièce se
déduit de sa pièce), et la lecture la moins coûteuse donne la forme et les
couleurs ; l'éditeur s'ouvre dans cette forme, « Changer la forme » restant
là si elle est fausse.

Sur des images synthétiques, 20 tours mélangées sur 20 sont lues exactement
(chacune des deux), en moins de 0,2 s, la première lecture prenant en plus
le temps d'énumérer les formes (environ 1 s).

## Par les contours : le Floppy Ghost

Le Floppy Ghost est tout argenté : ses pièces se reconnaissent à leur
forme, chaque sticker encadré du plastique noir de sa pièce. Une seule
photo suffit (le dos montre les mêmes contours, en miroir). La lecture
(`outlines.ts`, déclarée par `ghostScan`, `lib/puzzles/flat/ghostScan.ts`)
:

- sépare le clair (un sticker) du sombre (un corps, un joint) par un seuil
  que la photo fixe (Otsu), chaque pixel noté de -1 à 1 selon qu'il est
  aussi sombre ou aussi clair que la moyenne de son côté ;
- trouve le pentagone central (la plage claire autour du milieu du cadre,
  la seule pièce qui ne bouge jamais) : sa surface donne l'échelle, son
  centre la position, son moment d'ordre 5 la rotation à un cinquième de
  tour près ;
- pour chacune des dix tenues (cinq rotations, de face ou de dos), note
  chaque pose de pièce (son contour où elle se trouve,
  `lib/puzzles/flat/ghostShape.ts`) : clair sur son sticker, sombre
  autour (à demi-poids : un fond sombre cache le bord d'une pièce, jamais
  un sticker) ; un état vaut la somme de ses pièces, et les 30 720 sont
  essayés (une fraction de seconde).

Le parcours n'a qu'une face (`move: 'anchored'`) : une grande face face à
l'objectif, sa pièce centrale dans le pentagone tracé dans le cadre
(`ScanFace.mark`, ses côtés prolongés, sans contour), sans points dans les cases ; le cadre est tenu immobile
une seconde (ses 5 x 5 cases, mesurées comme celles d'un Megaminx), puis la
prise garde, avec la photo, la clarté de chaque pixel du cadre
(`useFaceReading`, `light` dans `scanStore.kept`) que lit `readScan`.

Sur des images synthétiques (tenue quelconque, de face ou de dos, zoom de
plus ou moins 10 %, fond de n'importe quelle clarté ou rayé comme une main,
stickers ternes, bruit, reflet sombre),
les états sont lus exactement. Sur le vrai puzzle, la lecture tient à la
géométrie : un pentagramme incliné de 9° au lieu de 5°, ou un pentagone 6 %
trop petit, et un autre état l'emporte de peu. Elle a donc été relevée sur
une photo (`ghostShape.ts`), et la photo d'un Ghost résolu posé sur un
portable aussi clair que ses stickers est figée en test
(`fixtures/ghostSolvedLaptop.json`). Un scan tenu à la main, penché et
éclairé d'un côté, se lit encore mal : voir `AMELIORATIONS.md`.

## Le cube miroir (3x3)

Tout doré ou argenté, ses pièces se reconnaissent à leurs tailles : sur une
face, chaque sticker est aussi large et aussi haut que les couches qu'il
couvre. Ses épaisseurs sont celles d'un vrai Mirror Blocks mesuré
(`MIRROR_BLOCKS`, 8 à 28 mm, couche du milieu 18 mm).

- **Les faces sont nommées par leur épaisseur** (« la face très fine face à
  l'objectif, la très épaisse en haut », `scanMovesSized`) : ses centres
  mesurent tous 1 x 1, et tourner toutes ses autres pièces autour d'eux
  donne encore un cube ; les tailles seules ne peuvent pas dire comment il
  est tenu. On reconnaît une face à son centre, d'autant plus enfoncé
  qu'elle est fine.
- **L'ordre** commence par les deux faces les plus faciles à repérer (leurs
  centres sont les plus enfoncés) : la fine (12 mm) face à l'objectif, la
  très fine (8 mm) en haut ; puis les gestes du scan font le tour
  (`sizedOrder`). Devant une caméra tournée vers soi (un portable), « vers
  la droite » amène les côtés dans l'autre ordre, puis le dessus et le
  dessous à l'envers : les faces y sont nommées dans cet ordre, pour que
  le nom et le geste s'accordent, et la lecture essaie les deux ordres, la
  moins chère l'emportant (un cube montré dans l'autre sens est lu quand
  même).
- **Le cadre** ne trace que le centre (« positionnez le centre de la face dans le cadre »)
  (`ScanFace.mark`), et ses quatre côtés prolongés en traits qui
  s'estompent (`CenterCuts`) : seul le centre est fixe, les autres stickers
  s'appuient sur ces coupes et dépassent d'au plus 2,1 couches du milieu de
  chaque côté (cinq de côté au total). Pas de points dans les cases ; la
  prise attend le tap et une seconde d'immobilité, et garde une image du
  cadre de 480 pixels (`useFaceReading`).
- **Les stickers** sont trouvés par OpenCV dans un worker
  (`workers/stickersWorker.ts`, `stickers.ts`) : le clair séparé du corps
  noir, découpé le long des bords (Canny) pour séparer les stickers
  voisins, chaque région presque rectangulaire gardée ; puis le clair
  entier, pour un sticker qu'une rayure ou de l'encre avait cassé.
  OpenCV.js (9,9 Mo, 3 compressé) est préchargé dès qu'un 3x3 miroir
  s'affiche, la page au repos, sauf en économie de données
  (`usePreloadStickers`), puis gardé en cache un an (`vercel.json`).
- **Le placement** (`sized.ts`) : les coupes sont des plans, donc chaque
  sticker s'appuie sur les droites du centre ; une arête contre un de ses
  côtés, un coin contre deux, chaque rectangle une fois au plus ; un centre
  qu'un reflet ou l'usure a cassé se déduit de ses voisins (la place qu'ils
  laissent, moins les joints, carrée).
- **La lecture** (`sizedRead.ts`) : chaque pièce, connue par ses
  épaisseurs, mise au moindre coût (la méthode hongroise) ; la part du
  liseré noir (propre à chaque marque) et le léger rétrécissement des
  couches épaisses sur la photo sont ajustés sur le scan, et la lecture la
  moins chère qui fait un cube l'emporte.

Sur six photos d'un vrai cube, les arêtes en place et les coins mélangés
(référence figée : `tests/unit/editor/fixtures/mirrorScan.json`), la
lecture retrouve l'état exact, que l'appli a résolu sur le vrai cube ; sur
un scan dans l'appli d'un cube résolu devant la caméra d'un portable
(`mirrorSolvedLaptop.json`), elle le lit résolu ; un cube mélangé, scanné
dans l'appli, a été lu juste.

## Le 2x2 miroir (le Qiyi)

Le 2x2 Qiyi miroir (`mirrorScan: 'cross'`) se scanne avec les mêmes outils
que le 3x3 (les stickers trouvés par OpenCV, les pièces mises au moindre
coût), à trois différences près, faute de centre :

- **Le calage** : on vise le point où les quatre stickers d'une face se
  rejoignent, sur la croix du cadre (`ScanFace.cross`, `CrossCuts`) ; les
  coupes passent par là, donc chaque sticker a son coin intérieur tout
  près (`placeAround`, `sized.ts`).
- **Les faces** ne se nomment pas (ses coins ne disent aucune face) :
  n'importe quelle face d'abord (le geste `crossed`), puis les gestes
  habituels (`orderFor`, `crossFaces`) ; la lecture est le cube tel qu'il
  est tenu, et tout état de ce puzzle se résout.
- **La mesure** : sans centre, rien ne donne l'échelle d'une photo (prise
  plus ou moins près). Ses couches n'ont que deux tailles, loin l'une de
  l'autre (3 et 2 cm) : sur chaque face, un côté est fin ou épais selon ce
  qu'il mesure face aux autres (à partir d'un écart de 1,25) ; une face dont
  tous les côtés se valent est lue des deux façons, et la lecture la moins
  chère l'emporte (`crossRead.ts`, qui reprend l'affectation de
  `sizedRead.ts`).

Lu exactement sur des images synthétiques (chaque face prise plus ou moins
près, caméra de face ou de dos, `crossScan.test.ts`), puis sur le vrai
cube, résolu et mélangé : juste, une seule face à reprendre à chaque fois.

## Le Meffert's Pocket Cube

Il se déforme et il est tout violet, sauf les trois faces de son petit
coin A : ses couleurs ne disent presque rien, ses stickers dessinent sa
forme. Il se scanne comme il se saisit à la main (voir « Saisie » dans
[puzzles/twisted.md](puzzles/twisted.md)) : ses quatre faces dans l'ordre
des canevas, puis ses deux côtés (`canvasFaces`, `planMirrors.ts`), n'importe quelle face
d'abord (le geste `any`, le puzzle entier dans le cadre), puis tourné
vers la gauche trois fois, plus facile en main que basculé vers l'objectif :
chaque image est lue tournée d'un quart (`gridCanvas`, `canvasRead.ts`), la
face suivante venant alors du haut comme sur les canevas. Elle vient de la
droite de l'image ou de sa gauche selon la caméra et la main : les deux
sens sont lus, celui attendu d'abord, et le premier qui montre un état
l'emporte (le 2026-11-04, tourné comme demandé, elle venait de la gauche,
le sens attendu d'une caméra qui fait face).

**Une face se lit sticker par sticker**, puis se pose sur sa grille, comme
on la saisit à la main : une case par mini-cube, un gros cube en couvre
deux sur deux. Le cadre montre en direct un point de la couleur vue là où
il voit un sticker (`cellColor`, `ScanFrame`), rien sur le corps noir ou
le fond. La prise attend le tap et une seconde d'immobilité, et garde
l'image du cadre avec 15 % de marge (`CANVAS_ROOM`, `useFaceReading.ts`).
Cette immobilité est lâche (`STILL_SHARE`, `capture.ts`) : 70 % des cases
seulement doivent rester stables, car les autres tombent au bord d'un
sticker, et la main la plus calme les fait basculer.

- **Les stickers** (`readGrid`, `canvasRead.ts`) : un pixel en est un
  s'il a la teinte d'une des couleurs du puzzle, assez saturée (rien
  sinon : le corps, le mur, la peau, un t-shirt bleu-vert, sous une
  lumière chaude aussi) ; un sticker est un ensemble de ces pixels d'un
  seul tenant, séparé des autres par son liseré noir, avec les pixels
  pâles reliés à eux sans franchir de noir (un reflet délavait la moitié
  d'un gros cube, et un mini vert citron sortait presque blanc, le
  2026-11-05 ; le mur pâle, lui, est séparé des stickers par le corps
  noir), assez carré et
  assez grand, ni coupé par le bord de l'image, ni contenu dans un autre
  (le logo d'un gros cube). Un sticker trop long est coupé à son
  étranglement, s'il en a un : un reflet qui déborde par-dessus le liseré
  noir soudait deux gros cubes l'un au-dessus de l'autre (le 2026-11-05,
  une face refusée à chaque prise). Une face refusée à la prise montre sa
  photo dans l'alerte.
- **Gros ou mini, à la taille**, jamais à la teinte : sous la lumière du
  jour, le violet a la teinte même du bleu (285 à 295 degrés, le
  2026-11-05). Les tailles se séparent au premier écart d'au moins 1,5 ;
  sans écart, tous sont gros (une face de gros cubes).
- **Chacun posé par son centre** : déformé, le puzzle a ses pièces à des
  profondeurs différentes, et aucune grille ne tombe sur tous leurs
  stickers à la fois (le 2026-11-05, une colonne d'un mélangé décalée
  d'une demi-case sur l'autre : une grille rigide perdait ses minis). La
  taille de case vient des stickers (moins leur liseré), l'origine de la
  grille de la moyenne de leurs positions, et chaque sticker prend les
  cases les plus proches de lui. Le puzzle peut donc être tenu plus ou
  moins près, et pas exactement dans le cadre.
- **Les règles** servent de garde-fous à chaque prise : chaque sticker
  tient sur ses cases, sans en prendre une d'un autre, la face tient dans
  le canevas de 5 sur 5, et elle montre au moins trois gros cubes, quatre
  sans mini (`FaceEntry.bigs`). Sinon, la face est redemandée aussitôt,
  plutôt qu'à la lecture, où l'on ne sait plus laquelle reprendre.
- **Les couleurs** (`gridColors`), de toutes les faces à la fois : un gros
  sticker est violet, un mini prend la couleur de A la plus proche en
  teinte, et aucune couleur n'est lue sur plus de stickers que le puzzle
  n'en a (sous une lumière qui les verdit, des jaunes étaient lus verts,
  six verts pour quatre ; les plus jaunes reprennent le jaune).
- **Mesuré sur les vraies photos** des 2026-11-04 et 05 (dix-sept scans,
  résolus et mélangés, une capture en lumière chaude, la lumière du jour,
  le puzzle tenu en remplissant le cadre) : 103 faces lues justes sur 103,
  leurs couleurs aussi (105 avec les deux faces aux reflets). Une grille rigide posée sur l'image en lisait 101,
  et perdait les minis d'un mélangé dont les pièces sont à des
  profondeurs différentes. La recherche de stickers d'OpenCV,
  employée avant (comme pour un miroir), en manquait 7 et ne passait ni le
  liseré fin d'une face devant le mur, ni la lumière chaude. Les seuils
  ont peu de marge (`CHROMA` : un mini à l'ombre est perdu au-delà de 28,
  le mur chaud est à 20 ; `HUE_OFF` : un vert citron pâle, sous la lumière
  du jour, est perdu en deçà de 32 degrés, un mini bleu se fond dans son
  liseré à 36).
- **La forme** est cherchée comme celle des canevas saisis à la main
  (`scanned`, `store/faceSearch.ts`), chaque façon de lire les faces essayée,
  la meilleure d'abord : l'éditeur s'ouvre sur ses couleurs, celles que les
  photos montrent déjà peintes, pourvu qu'elles fassent de vraies pièces
  (un sticker manqué avait peint un mini violet : la face la plus éloignée
  est alors redemandée). Une même forme tenue de plusieurs façons
  dessine souvent les mêmes faces : c'est celle où ces couleurs font de
  vraies pièces qui est prise (`realPieces`, `modes/colors.ts` : pas plus
  de stickers d'une couleur que le puzzle n'en a ; tenu autrement, le
  résolu en montrait cinq jaunes, le 2026-11-04). Les stickers qu'aucune
  photo ne montre sont ensuite déduits des pièces (`completed`,
  `modes/colors.ts`) : chaque façon de placer les pièces qui collent aux
  stickers vus, chacune une seule fois, est essayée, et un sticker sur
  lequel toutes s'accordent est peint (sur quatre faces seulement, deux
  stickers d'un mélangé restaient indécidables, le 2026-11-04 : d'où ses
  six faces). Aucune ne montrant d'état (un sticker
  manqué, un reflet), l'état le plus proche (`near`, `drawingDistance` :
  les cases et les joints qui diffèrent, 6 au plus, un gros cube manqué
  en coûtant 4), à vérifier. Rien d'assez proche : le scan redemande la
  face la plus éloignée de l'état le plus proche (`Nearest.off`), celle où
  des stickers ont sans doute été manqués, puis la suivante si la reprendre
  n'a rien changé (chaque face à son tour, ses côtés en dernier : une face
  mal lue ailleurs faisait reprendre la même en boucle, le 2026-11-04) ;
  les canevas lus ne s'affichent,
  à corriger à la main, que si aucun état n'a pu être comparé.
- **Ses deux côtés** : ses faces noires cachent parfois ce qui distingue
  deux formes (le résolu compris), et des stickers se trouvent sur les
  côtés que les quatre faces ne montrent pas. Le scan prend donc toujours
  ses six faces : après les quatre, le haut du puzzle basculé vers
  l'objectif, puis le dessous (un demi-tour). Ce sont ses faces de gauche
  et de droite selon le sens où il a été tourné, chacune comparée sous ses
  quatre orientations (`modes/sides.ts`), à 2 cases près, et ses couleurs
  reportées dans ce sens (`asDrawn`). Rien n'est à peindre après le scan.

Lu exactement sur des images synthétiques (chaque face prise plus ou moins
près, stickers décalés, `canvasScan.test.ts`), sur des états dont toutes
les faces de pièces se voient entières (sur le vrai, à corps noir, un
sticker n'est jamais en partie caché : une face découverte est noire).
Essayé en
vrai sur le puzzle résolu : un gros sticker manqué sous un reflet, il est
lu par l'état le plus proche (ses rectangles figés dans le même test) ;
puis mélangé, tourné vers la gauche, les deux gros stickers du haut de sa
dernière face manqués : c'est elle que le scan redemande (même test). Au
fil des essais du 2026-11-04 (stickers vus de biais, jaune lu vert, minis
manqués sous un reflet, couleurs posées sur le puzzle tenu autrement),
un mélangé est lu en entier, ses six faces, sans rien à peindre ensuite.
