# Le scan à l'appareil photo

Saisir un puzzle en le montrant face par face à la caméra, sur mobile comme
sur un portable ; le résumé est dans [AGENTS.md](../AGENTS.md), les limites
et la suite dans [AMELIORATIONS.md](../AMELIORATIONS.md). La caméra exige
HTTPS : on l'essaie sur un déploiement Vercel.

## Les puzzles scannables

`scannable` (`lib/editor/scan/plan.ts`) : 26 modèles sur 75, et le 3x3 miroir.

- **En grille**, tout se déduit des dimensions (`scanPlan`) : les cubes du
  2x2 au 6x6, les cuboïdes et les plats sans saisie propre (1x2x3, Floppy,
  Domino, tours...). Un modèle troué le déclare (`PuzzleModel.scan:
'grid'`) : le Void Cube, l'Edge Only, leurs trous sautés.
- **En carré** (`scan: 'square'`) : les cubes diagonaux (Skewb, Master
  Skewb, Dino, Rex, Curvy Copter et Copter III). Le modèle dit quels stickers
  sont sur la face et comment elle tourne ; leur dessin dit où chacun se
  voit (`three/core/scanDrawing.ts` : le milieu de son polygone, ses
  contours en filigrane).
- **En anneaux** (`scan` : une fonction du modèle) : le Megaminx
  (`megaminxScan.ts`) et le Holey Megaminx (`holeyScan.ts`), chaque face
  un pentagone, son centre, ses arêtes puis ses coins.
- **Par leur forme** (`scan: 'forms'`) : les tours 2x2x4 et 2x3x4, qui se
  déforment. Elles se scannent comme la boîte où tourne leur mécanisme, et
  le scan trouve leur forme : plus besoin de la choisir parmi les
  vignettes (voir « La forme d'une tour » plus bas).
- **Par ses contours** (`scan` : un `OutlineScan`, `outlines.ts`) : le
  Floppy Ghost, tout argenté, lu d'une seule photo (voir « Par les
  contours » plus bas).
- **Par les tailles de ses stickers** : le 3x3 miroir (`mirrorScan` sur sa
  carte ; voir « Le cube miroir » plus bas).

Restent dehors les puzzles dont une information n'est pas une couleur
(les autres miroirs, super cubes, soudés, engrenages...), les autres puzzles qui se
déforment (Camouflage, Purple, Fashion-V, AI Cube), et le Tori (ses
arêtes, de minces amandes au bord des faces).

Seuls le 2x2, le 3x3 (et son miroir), le 4x4 et la tour 2x2x4 ont été essayés en vrai (`scanTried` sur
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
     le Megaminx) : « le centre vert face à l'objectif, le blanc en haut »,
     chaque couleur précédée de sa pastille (`ColorWords`) ;
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
   ou éloigner le puzzle ; ses découpes en filigrane, la case du centre entourée.
3. **Le tap** (`ScanTake`, au milieu de l'écran ; la barre d'espace sur un
   portable) : rien ne distinguant un puzzle d'un mur, c'est l'utilisateur
   qui dit que le puzzle est en place. Avant, rien n'est lu (pas de points
   qui inciteraient à attendre qu'ils soient tous justes).
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
la console les rectangles trouvés sur chaque face, pour rejouer la lecture.

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
(`ScanFace.mark`), sans points dans les cases ; le cadre est tenu immobile
une seconde (ses 5 x 5 cases, mesurées comme celles d'un Megaminx), puis la
prise garde, avec la photo, la clarté de chaque pixel du cadre
(`useFaceReading`, `scanStore.lights`) que lit `readScan`.

Sur des images synthétiques (tenue quelconque, de face ou de dos, zoom de
plus ou moins 10 %, fond de n'importe quelle clarté, bruit, reflet sombre),
les états sont lus exactement. Reste à régler sur le vrai puzzle la largeur
du cadre noir des stickers (`border`, 2,5 mm estimés sur photos).

## Le cube miroir (3x3)

Tout doré ou argenté, ses pièces se reconnaissent à leurs tailles : sur une
face, chaque sticker est aussi large et aussi haut que les couches qu'il
couvre. Ses épaisseurs sont celles d'un vrai Mirror Blocks mesuré
(`LAYER_THICKNESS.mirror`, 8 à 28 mm, couche du milieu 18 mm).

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
