# Améliorations futures

Ce qui marche aujourd'hui mais mériterait mieux, avec les pistes déjà
envisagées.

## À faire (notes du 2026-11-03)

- **Le référencement Google** : `yavadeus.dev` est déclaré dans Search
  Console (validé par le DNS d'Infomaniak) et le `sitemap.xml` soumis le
  2026-11-05. Reste à le présenter là où sont les cubeurs (forums, Reddit)
  pour obtenir des liens, puis à lire dans Search Console sur quelles
  recherches il apparaît. En mineur, une image de partage par puzzle
  (aujourd'hui la même partout).

## Le scan à l'appareil photo : réglages et autres formes

**Constat.** Le scan (`lib/editor/scan/`, détail dans `docs/scan.md`) n'a
été essayé en vrai que sur les puzzles dont la carte porte `scanTried`
(2x2, 2x2 Qiyi, 3x3, 4x4, tours 2x2x3 et 2x2x4, Megaminx, Pyraminx,
Gear Cube Ultimate, Skewb, Ivy Cube, Meffert's Pocket Cube, Floppy, Floppy Ghost) et le 3x3 miroir ; les
autres ne l'ont été que sur images synthétiques, leur bouton marqué d'une
fiole. Ses seuils (bandes de teinte et marges de `color.ts`,
`HOLD_MS` et `DRIFT` dans `capture.ts`, `FORCED` dans `classify.ts`,
`TURNED` dans `orient.ts`, `SLIDE` et `DEPTH` du Ghost dans `outlines.ts`)
ne sont réglés que sur ces quelques essais.

- **Une face tenue tournée** n'est retrouvée à coup sûr que sur un cube à
  grille : sur un cuboïde, un plat, le Dino, le Rex ou l'Edge Only, une
  face lue dans l'autre sens peut encore faire de vraies pièces (état faux
  mais possible) ou être redemandée ; sur le Skewb, une fois sur dix
  environ quand toutes ses faces sont tournées, l'état lu est faux.
- **Le miroir** : seuls le 3x3 et le 2x2 Qiyi se scannent (le 2x2 calé où
  ses stickers se rejoignent, `crossRead.ts`), pas le 4x4 (quatre centres
  par face, aucun seul pour étalon) ; la correction de perspective par la
  profondeur des pièces n'est pas faite ; la détection (OpenCV) n'est pas
  testée sous Vitest (son chargement y reste bloqué), seulement par les
  rectangles figés de deux vrais scans et l'usage.
- **Restent hors du scan** le Tori (ses arêtes, de minces amandes au bord
  des faces), les autres miroirs, les super cubes, les soudés, les
  engrenages, et parmi ceux qui se déforment le Camouflage, le
  Fashion-V et l'AI Cube (qui pourraient suivre le chemin des tours).

**Pistes.** Régler les seuils sur de vraies photos (lampe chaude, reflets)
et en faire des tests, comme les rectangles figés du miroir.

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
