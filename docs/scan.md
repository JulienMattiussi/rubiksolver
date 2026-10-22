# Le scan à l'appareil photo

Saisir un puzzle en le montrant face par face à la caméra, sur mobile comme
sur un portable ; le résumé est dans [AGENTS.md](../AGENTS.md), les limites
et la suite dans [AMELIORATIONS.md](../AMELIORATIONS.md). La caméra exige
HTTPS : on l'essaie sur un déploiement Vercel.

## Les puzzles scannables

`scannable` (`lib/editor/scan/plan.ts`) : 23 modèles sur 75.

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

Restent dehors les puzzles dont une information n'est pas une couleur
(miroirs, super cubes, soudés, engrenages...), ceux qui se déforment, et
le Tori (ses arêtes, de minces amandes au bord des faces).

Seuls le 2x2, le 3x3 et le 4x4 ont été essayés en vrai (`scanTried` sur
leur carte) ; sur les autres, le bouton « Utiliser l'appareil photo » porte
une fiole : « Cette fonction n'a pas encore été testée et validée sur ce
modèle ».

## Le parcours

`ScanView` (plein écran), son état dans `scanStore`, la caméra par
`useCamera` (la caméra arrière ; celle d'un portable, tournée vers soi,
montrée en miroir ; une lampe torche quand le téléphone la propose, Chrome
sur Android).

1. **La consigne** (`ScanInstruction`) s'affiche en grand devant l'image,
   puis glisse à sa place en haut. Elle dit la face à montrer :
   - par ses couleurs, quand les centres disent les faces (`told` : un 3x3,
     le Megaminx) : « le centre vert face à l'objectif, le blanc en haut »,
     chaque couleur précédée de sa pastille (`ColorWords`) ;
   - sinon par un geste (un cube pair, un cuboïde, un Skewb dont les
     centres bougent, le Holey Megaminx) : n'importe quelle face de la forme
     du cadre d'abord, puis tourné vers la gauche, basculé vers l'objectif,
     un demi-tour..., chaque geste fléché avec son angle (`ScanMoveArrow`).
2. **Le cadre** (`ScanFrame`), en pointillé, de la forme de la face (grille,
   bande, pentagone, carré), sous la consigne et au-dessus des boutons
   (`frame.ts`), ses découpes en filigrane, la case du centre entourée.
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
   est redemandée.

`?scandebug` dans l'adresse écrit dans chaque case sa mesure (clarté,
saturation, teinte), pour régler les seuils.

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
