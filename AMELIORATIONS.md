# Améliorations futures

Ce qui marche aujourd'hui mais mériterait mieux, avec les pistes déjà
envisagées.

## Le scan à l'appareil photo : réglages et autres formes

**Constat.** Le scan (`lib/editor/scan/`, détail dans `docs/scan.md`) n'a
été essayé en vrai que sur le 2x2, le 3x3, le 4x4, la tour 2x2x4 et le 3x3
miroir ; les autres (cuboïdes, plats, troués, diagonaux, Megaminx, tour
2x3x4, Floppy Ghost) ne l'ont été que sur images synthétiques, leur bouton
marqué d'une fiole. Ses seuils (bandes de teinte et marges de `color.ts`,
`HOLD_MS` et `DRIFT` dans `capture.ts`, `FORCED` dans `classify.ts`,
`TURNED` dans `orient.ts`, `border` du Ghost estimé sur des photos de
commerçant) ne sont réglés que sur ces quelques essais.

- **Une face tenue tournée** n'est retrouvée à coup sûr que sur un cube à
  grille : sur un cuboïde, un plat, le Dino, le Rex ou l'Edge Only, une
  face lue dans l'autre sens peut encore faire de vraies pièces (état faux
  mais possible) ou être redemandée ; sur le Skewb, une fois sur dix
  environ quand toutes ses faces sont tournées, l'état lu est faux.
- **Le sens de rotation** : le plan suit la caméra (gestes en miroir sur un
  portable, `orderFor`), mais un utilisateur qui tourne quand même dans
  l'autre sens n'est rattrapé que sur le miroir (sa lecture essaie les deux
  ordres) ; ailleurs, la face est redemandée ou l'état lu faux.
- **« Rien de stable »** s'affiche aussi quand le puzzle est immobile mais
  montre une autre face que celle demandée (un mauvais centre) : un message
  propre l'aiderait.
- **Les formes d'une tour** sont énumérées à l'ouverture du scan (environ
  1 s, le fil de l'interface bloqué pendant l'annonce de la première face) :
  à faire dans un worker.
- **Le miroir** : seul le 3x3 se scanne (le 2x2 n'a pas de centre pour
  étalon, le 4x4 en a quatre) ; la correction de perspective par la
  profondeur des pièces n'est pas faite ; la détection (OpenCV) n'est pas
  testée sous Vitest (son chargement y reste bloqué), seulement par les
  rectangles figés de deux vrais scans et l'usage.
- **Restent hors du scan** le Tori (ses arêtes, de minces amandes au bord
  des faces), les autres miroirs, les super cubes, les soudés, les
  engrenages, et parmi ceux qui se déforment le Camouflage, le Purple, le
  Fashion-V et l'AI Cube (qui pourraient suivre le chemin des tours).

**Pistes.** Régler les seuils sur de vraies photos (lampe chaude, reflets)
et en faire des tests, comme les rectangles figés du miroir. Essayer les
deux sens de rotation sur toute lecture par gestes, comme le miroir, et
garder la moins chère. Le Ghost, dès le puzzle reçu.

## Les puzzles « Rainbow » : la coupe dans le coup

**Constat.** Le Rainbow, le Dino Cube, le Rex Cube, le Skewb, le Master
Skewb et le FTO tournent tous d'un tiers de tour autour d'une diagonale et
partagent un type de coup (`RainbowMove`) et un moteur
(`lib/puzzles/shared/rainbow.ts`). Ce qui les distingue, la profondeur de
la coupe, est écrit dans chaque coup par des drapeaux (`dino`, `rex`,
`skewb`, `master`, `fto`), que lisent le moteur (`rainbowTurns`), la
notation, le pad Rainbow, le guide et ses phrases : la dernière trace du
« quel puzzle est-ce ? » dans le code commun, cachée dans la donnée. Un
nouveau puzzle de cette famille demande un drapeau de plus et de toucher
une douzaine de fichiers.

**Piste** (revue le 2026-10-21). La coupe ne peut pas être lue sur le
modèle : la recherche par pièces (`pieceSearch`) joue les coups sur
quelques pièces seulement, qui ne disent pas de quel puzzle il s'agit.
Elle reste donc dans le coup, mais en donnée : une plage de profondeur le
long de la diagonale (`cut: { min, max }`) au lieu des drapeaux, chaque
puzzle déclarant les siennes dans son module (le Rex « 4 et plus », une
tranche du FTO « entre -1 et 1 »), le moteur ne testant plus que « la pièce
est-elle dans la plage ? ». La notation, les titres du pad et les phrases
du guide, eux, se lisent sur le modèle (ces endroits connaissent le puzzle
affiché ; vérifier que chaque appel à `formatMove` reçoit sa forme). Coût :
une quinzaine de fichiers source et huit de test (28 coups écrits avec un
drapeau, le décodage des formules fan2cube, la notation, les deux pads, le
guide). Aucun gain visible ; à faire avant d'ajouter un puzzle de cette
famille.

## Le blanc d'abord, puis le cube retourné

**Constat.** Les méthodes et les tutoriels des cubes font leur première
couche en jaune, en bas, et finissent par le blanc, en haut : le repère
commun (« jaune = face D ») vient du cube présenté blanc en haut. Un
habitué fait l'inverse : il commence par le blanc, et le manuel du 2x2
(QiYi, 4 étapes, 3 formules) aussi.

**Piste.** Le puzzle reste présenté blanc en haut ; on résout d'abord la
couche blanche, en haut ; une fois faite, on retourne le cube (`x2` ou
`z2`) : blanc en bas, la suite avec le jaune en haut. Le faire par une
brique commune plutôt que méthode par méthode : chaque méthode et chaque
tutoriel décrit sa première couche avec la couleur de départ en haut, puis
une étape « retourner le cube » (un coup du cube entier) ; les couleurs ne
sont plus écrites en dur (« jaune ») mais lues sur le repère déclaré, comme
le 2x2 et le miroir le font déjà.

Touché : le repère des méthodes du 3x3 (par couches, CFOP, Roux, Petrus,
ZZ) et des puzzles qui reprennent leurs plans (Void Cube, Fisher, Windmill,
Master Morphinx, 4x4, 5x5, 6x6, super cubes) ; les tutoriels (croix et
coins, textes FR/EN et miroir, golden du 3x3 à réécrire) ; le retournement
déjà présent du 2x2 et du Pyramorphinx. Inchangés : les puzzles sans faces
blanche et jaune en couches (Pyraminx, Megaminx, étoiles...). Gros
chantier, au moins celui de la saisie.

**Déjà prêt.** Le 2x2 suit le manuel QiYi (4 étapes, 3 formules), sa
première couche en jaune construite en haut puis le cube retourné : passer
au blanc d'abord n'y demande que d'échanger ses deux couleurs (`FIRST` et
`LAST`, `lib/tutorials/standard/cube2.ts`) et ses textes.
