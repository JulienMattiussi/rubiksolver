# Améliorations futures

Ce qui marche aujourd'hui mais mériterait mieux, avec les pistes déjà
envisagées.

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
