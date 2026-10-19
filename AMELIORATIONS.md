# Améliorations futures

Ce qui marche aujourd'hui mais mériterait mieux, avec les pistes déjà
envisagées.

## Tutoriel : apprendre à déplacer une pièce

**Idée.** Sur un modèle donné, un mode d'apprentissage guidé : l'app désigne
une pièce et l'endroit où l'amener (ou la façon de la tourner), l'utilisateur
cherche les coups lui-même, avec des indices gradués (la couche à tourner, puis
le coup, puis la formule et son effet expliqué), et l'app vérifie à chaque coup
qu'il ne défait pas ce qui est déjà en place.

**Pistes.** Les briques existent : les objectifs des étapes (`StepSpec.goal`),
les formules de chaque méthode avec leur effet testé, et la recherche par
pièces (`solvePieces`) pour proposer le coup suivant. Commencer par les étapes
intuitives (croix, premiers coins) du 3x3 et du 2x2, puis par les 3-cycles.

## Tutoriel : les flèches sur un cube miroir

**Constat.** Sur un miroir, la flèche du tutoriel part du centre de la case
de la pièce, une demi-case plus loin (`TutorialArrow`, `FACE`) : elle
s'arrête avant une face fine et traverse une face très épaisse, et son
contournement suppose la boîte d'un cube plein, que les bosses dépassent.

**Pistes.** Faire comme pour les puzzles en polygones (`PolyView`, `onFace`) :
prendre pour bouts le centre réel du sticker, lu sur la boîte de la pièce
(`lib/core/shape.ts`), et pour boîte à contourner celle du cube miroir avec
ses bosses.

## Fuites mémoire : ce qui a été mesuré

**Mesuré** (Playwright, tampons et textures WebGL comptés à leur création et
leur destruction, tas JavaScript après ramasse-miettes forcé) : le Megaminx
mélangé puis résolu trois fois, le 3x3 de même, le guide des mouvements
ouvert une minute, une tournée de six puzzles répétée. Une fuite trouvée et
corrigée : `PolyPiece` créait une géométrie neuve à chaque coup sans libérer
l'ancienne (+62 000 tampons GPU et +35 Mo par mélange résolu sur le
Megaminx) ; elle est maintenant libérée (`dispose`). Depuis, tout est stable :
le tas se remplit au premier tour (caches des formes, bornés par le nombre
de positions d'une pièce) puis ne bouge plus.

**Pas mesuré** : la mémoire du worker de résolution, qui garde ses tables
(formules du Megaminx et du Crystal : quelques dizaines de Mo, une fois par
liste de formules, donc bornées) ; une session de plusieurs heures.

## Mobile : reprendre l'interface

**Constat.** Le mode mobile (panneau repliable, puzzle empilé au-dessus de la
saisie) marche, mais il a de nombreuses lacunes, jamais passées en revue.

**Piste.** Faire le tour de l'app sur un petit écran (accueil, sélecteur,
pad de coups, guide, saisie et ses phases, résolution), lister ce qui gêne,
puis reprendre la mise en page écran par écran.

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

**Piste.** Un coup neutre (`{ triangle, amount, slice? }`) et la coupe
déclarée par le modèle (`cut`), que le moteur lit sur le puzzle :
`applyRainbowMove` et `rainbowTurns` recevraient le puzzle (ou sa coupe).
Coût : réécrire les formules et les tests des six méthodes (l'effet de
chaque formule fan2cube), la notation (les lettres du Dino), le pad et le
guide. Aucun gain visible ; à faire avant d'ajouter un puzzle de cette
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
