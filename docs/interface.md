# L'interface

Détail de l'interface ; le résumé est dans [AGENTS.md](../AGENTS.md).

Panneau d'overlay en **deux blocs** (sur desktop, deux cartes séparées : le
titre et l'initialisation à gauche, la langue et la résolution à droite ; sur
mobile et en saisie, une seule carte) :

- **Initialisation** (titre non affiché, `aria-label` seulement) : **choix du
  cube** : un bouton montre le puzzle courant (vignette + nom) et ouvre un
  sélecteur en modale, d'abord les **catégories** en vignettes, puis les
  **puzzles** de la catégorie choisie (toujours ouvert sur les catégories ; le
  puzzle courant et sa catégorie sont mis en évidence ; la vignette d'une catégorie montre trois
  de ses puzzles, devant le 3x3, le 4-Star Prism ou le Megaminx s'il en est, `COVERS`).
  Catégorie : `cubeCategory` (le dossier de la carte du puzzle, ou les
  miroirs) ; l'ordre des catégories et des puzzles est celui de
  `lib/puzzles/catalog.ts`. Les vignettes sont des SVG **dessinés par le code** (`three/core/isometric.ts`)
  depuis la forme et la variante : un nouveau puzzle a la sienne sans dessin.
  Changer de forme réinitialise le cube et rabat la méthode si besoin, changer
  de variante conserve l'état.
- **Actions** : le **statut** sur la ligne du choix du cube, mélanger /
  réinitialiser, saisie d'un cube (« Saisir » : vierge ; « Modifier » : depuis
  l'état courant ; leurs infobulles le disent en entier),
  **Mémoriser / Restaurer** (un état par forme, gardé entre deux visites,
  pour comparer deux méthodes sur le même mélange ; remplacer un autre état
  mémorisé demande confirmation dans une modale), vitesse
  d'animation (au plus lent, une pause aussi longue qu'un coup sépare deux
  coups, le temps de le refaire sur un vrai puzzle : `pauseBetweenTurns`),
  **recentrage caméra animé** et **bascule de notation FR/US**.
- **Pad de rotations**, construit à partir des coups que la
  forme autorise, lus dans `movesFor` (une gâchette horaire + une anti-horaire
  par face ; un seul bouton de demi-tour là où la forme n'a pas de quart de
  tour ; rien pour une face dont l'axe n'a qu'une couche). Les sortes de
  coups de la forme (Externe / Tranche / Large, plus « Avancé » sur le 3x3 :
  `M`, `E`, `S`, coups larges) sont **empilées**, chacune sous son nom,
  quand elles tiennent en six rangées au plus (`STACKED_ROWS`, autant que le
  pad du Megaminx) : 3x3, 4x4, 5x5, tours, AI Cube, Pyraminx (son pad
  aussi). Au-delà (6x6, RoadBlock-I, Master et Professor Pyraminx), deux
  onglets, chacun empilé : « Externes » (la face seule ou avec les couches
  derrière elle : externe, large ; sur le Pyraminx, les pointes et les faces
  opposées) et « Internes » (les tranches) ; en arrivant sur un puzzle, le
  pad s'ouvre sur le premier onglet où un coup passe. Des libellés de quatre
  caractères (`3Uw'`) mettent deux paires par rangée au lieu de trois. Un
  coup que l'état bloque (tours qui se déforment, Purple, soudés...) reste
  grisé ; un puzzle
  qui ne tourne pas comme un cube a son propre pad, nommé par le `pad` de sa
  carte et construit par `padFor`).
- **Résolution** : choix de la **méthode** (liste déroulante, filtrée par
  forme via `methodsFor`), **Tutoriel** à côté de Résoudre sur les puzzles
  qui en ont un (voir plus bas), **Résoudre**
  (joue le reste de la solution), puis la solution parcourue dans les deux
  sens : **étape précédente / suivante** et **coup précédent / suivant** (le
  coup en cours ou le prochain est surligné dans sa
  séquence, ceux déjà joués s'estompent). Au milieu d'une étape, ses boutons
  deviennent **Défaire l'étape** et **Finir l'étape**. Reculer rejoue les
  coups à l'envers, sans quitter la solution. Pendant qu'elle joue,
  Résoudre devient **Arrêter** (dans ce même panneau) : le mouvement en
  cours se termine, la suite attend, et les boutons reprennent de là ;
  l'Arrêter de gauche ne sert plus qu'au mélange, et la **liste des étapes**
  nommées avec le total de rotations et le surlignage de l'étape en cours ;
  sur desktop, seule cette liste défile (le reste du panneau reste en place),
  et elle suit le coup en cours pendant que la solution joue.
  Les étapes s'affichent sans attendre : le **plan** de la méthode dès son
  choix (`PlanOutline`, « si nécessaire » sur les étapes qu'on saute
  souvent : `StepSpec.optional` ; celles du début que le cube remplit déjà
  sont omises, comme le recentrage du 3x3 tant qu'aucune tranche n'a
  bougé ses centres), puis la **vraie solution** dès que le cube
  est au repos, calculée d'avance dans un worker (`useAutoPlan`,
  `workers/solveWorker.ts`) pour ne jamais figer la page ; Résoudre et Pas à
  pas la réutilisent tant qu'elle vaut pour l'état et la méthode
  (`planKey`) ; tant qu'elle n'est pas prête, Résoudre dit « Calcul… », un
  rouage tournant à la place de son icône (« Calcul de la solution… » dans
  son infobulle : le bouton garde sa taille à côté de Tutoriel), et ses
  boutons restent grisés (`useAutoPlan` le renvoie). Un calcul qui dure plus de 4 s
  (le Z-Twist, le Fashion-V) fait apparaître un grand rouage tournant par-dessus
  le plan (`SlowCog`), qui grandit en se dévoilant : la page ne semble pas
  bloquée. Pendant un mélange, Mélanger porte lui aussi un rouage tournant
  (`ScrambleButton`, `selectScrambling`).
  **Clavier** (`useSolveShortcuts`, rappelé dans l'infobulle de chaque bouton) :
  flèches droite / gauche un coup en avant / en arrière, Page suivante /
  précédente une étape (en arrière, une solution qui joue s'arrête d'abord,
  puis le dernier coup ou l'étape sont défaits), Espace met en pause ou reprend, Entrée joue tout le
  reste ; rien pendant une saisie, dans un champ ou une fenêtre ouverte, ni
  ce que le bouton correspondant ne pourrait pas faire.

**Mobile** : le panneau se **replie** en une barre compacte (Mélanger +
Résoudre) ; en mode saisie, le cube est empilé **au-dessus** du panneau pour
rester entièrement visible pendant la peinture.

**Forme d'un puzzle déformable** (`FormPicker`) : les formes de `formsOf` en
vignettes (`formDrawing`), groupées par nombre de petits cubes isolés aux
pointes (pièces qui n'en touchent qu'une autre : ce qu'on remarque d'abord
sur une tour déformée), puis par éloignement de la boîte ; survoler une
vignette montre la forme en 3D.

**Guide des mouvements** (bouton au-dessus du pad, modale) : chaque coup de
la forme, montré **sur le cube dans son état actuel**, avec sa notation et une
phrase qui le décrit. Une ligne par couche et par sens : le coup et son
opposé côte à côte (`R` / `R'`, `1` / `-1`), puis le coup quantifié (`R2` ;
`2` / `-2` puis `3` sur l'étoile, où trois crans font un demi-tour dans les
deux sens). Les couches sont celles du pad (« Avancé » compris) plus
celles que tournent les méthodes de la forme (`methodTurns`), groupées par sections (faces, tranches du milieu,
tranches internes, coups larges ; étages et slash sur l'étoile), sans
sélecteur : tout défile verticalement. Le contenu est **pur et dérivé**
(`lib/app/moveGuide.ts`) : `moveGuide(shape)` et `describeMove` (une description
structurée, `core/guide.ts`, que `t.describeMove` met en phrase). Un cube a
son guide sans travail ; un puzzle qui ne tourne pas comme un cube le déclare
dans son modèle (`guide`, construit par `lib/puzzles/guides.ts`), et la sorte
de ses coups dit ce que fait chacun (`MoveKind.describe`), son modèle
pouvant préciser (`describe` : le Fashion-V, le Curvy Copter III). Rendu : **un seul contexte WebGL** (`GuideCanvas`, posé
sous la liste, transparent) ; chaque vignette a sa scène et sa caméra et se
dessine en scissor dans sa boîte DOM, les vignettes hors de la zone visible
sont sautées. Seules les lignes au **centre** de la liste s'animent
(IntersectionObserver sur une bande centrale) : le coup se joue, marque une
pause, puis le cube revient à l'état actuel et le coup recommence, jamais
rejoué à l'envers. Un coup bloqué dans l'état (la tour 2x2x4...) reste figé, avec la
mention « Ce mouvement n'est pas possible dans cette configuration ». La
caméra d'une vignette est le cadrage de la scène, rapproché et retourné pour
que la couche qui tourne soit face à elle (dessous pour `D`, derrière pour
`B`), reculée sur une vignette étroite.

**Aperçu d'un coup** : survoler (ou focaliser au clavier) un bouton du pad met
en surbrillance les pièces que ce coup tournerait (corps bleu ciel, stickers
éclaircis) : `PadButton` (sur tous les pads) écrit le coup dans
`viewStore.preview`, `usePreviewed` (lu par `CubeView` et `PolyView`) en
déduit les pièces avec `turnedBy` et `halfTurnedBy` (les mêmes fonctions que
l'animation), sauf pendant une animation ou si le coup est bloqué. Dans le
tutoriel, l'aperçu l'emporte sur la pièce visée tant qu'un bouton est
survolé.

**Tutoriel** (moteur `lib/teach/`, tutoriels `lib/tutorials/`, état
`store/tutorialStore.ts` et `store/tutorialTrack.ts`, `hooks/useTutorial.ts`,
`components/tutorial/`). Sur un puzzle qui en a un pour la méthode choisie
(`tutorialFor(forme, méthode)` ; aujourd'hui le 3x3 et le 2x2, méthode par
couches : rien pour Roux, CFOP ou l'optimale), le bouton Tutoriel (grisé sur un puzzle résolu) remplace
le bloc de résolution par un panneau où l'on résout soi-même, un **pas** à
la fois.

- **Le parcours du 3x3** : recentrer si une tranche a bougé les centres,
  puis sept étapes. Croix jaune arête par arête (la formule la plus
  courte) ; coins jaunes, amenés au-dessus de leur place puis descendus
  par `R U R' U'` répété ; arêtes du milieu, insérées à droite
  (`U R U' R' U' F' U F`) ou à gauche (`U' L' U L U F U' F'`) ; croix
  blanche par `F R U R' U' F'` selon la figure du dessus (point, L, ligne) ;
  arêtes blanches au-dessus de leur centre (`R U R' U R U2 R'`) ; coins
  blancs à leur place (`U R U' L' U R' U' L`) ; coins blancs tournés (`R' D'
R D` répété, un seul pas, la première couche se défaisant en route).
- **Le parcours du 2x2**, trois étapes. Sans centres, le repère est un
  coin jaune dont le jaune est déjà en bas, là où il se trouve (celui qui
  a le plus de coins jaunes placés autour de lui) : rien ne tourne pour le
  choisir, les couleurs des faces se lisent sur lui (« Place le côté vert
  face à toi »). Si aucun jaune n'est en bas, on retourne d'abord le cube
  (« Avant de commencer », une rotation `x` ou `z`, sans pièce gênante ni
  hachures). Puis les autres coins jaunes autour du repère, par la recette
  des coins du 3x3 ; la face blanche par des Sunes (`R U R' U R U2 R'`), le haut tourné
  et la tenue choisis par la plus courte chaîne ; les coins blancs placés
  d'un tour du haut, ou d'une permutation : deux voisins échangés (T-perm)
  ou deux en diagonale (Y-perm, la parité du 2x2).
- **Le parcours du Pyraminx** (méthode Centres d'abord), cinq étapes,
  la pyramide tenue à plat (« Place la pyramide à plat, la face rouge face
  à toi », trois tenues autour du sommet) : les centres, chacun d'un tour
  de sa couche ; les pointes, chacune d'un tour seule ; les arêtes du bas,
  chacune par le crochet `[gd']` (un tour du haut avant au besoin), tenue
  l'emplacement devant ; les arêtes du haut placées par `d h d' h d h d'` ;
  les arêtes retournées deux à deux par `[gd'][h'd]`. Son vocabulaire :
  pointe, centre, arête, couche, sens horaire et anti-horaire.
- **Le parcours du Pyramorphinx** (méthode Comme un Pocket), trois
  étapes, posé à plat d'une seule façon (ses moitiés restent les couches
  du 2x2 qu'il cache, et les formules gardent la première moitié) : un
  pointe de la moitié du bas sert de repère (amenée d'un coup « avant de
  commencer » s'il n'y en a pas) ; la première moitié, ses deux pointes et
  deux milieux, une pièce à la fois ; les deux pointes de l'autre moitié
  tournés par des Sunes ; l'autre moitié placée d'un tour du haut, ou par
  T-perm ou Y-perm. La vrille d'un milieu ne se voit pas : rien ne la
  demande. Son vocabulaire (sur une pyramide, on parle de pointes, pas de coins) :
  pointe, milieu, moitié, sens horaire et
  anti-horaire.
- **Le parcours du 4x4** (méthode Réduction par couches), onze étapes :
  les centres regroupés un à un (jaune, blanc, puis la ceinture), les
  arêtes appariées une à une (une tranche, un échange, la tranche qui
  revient), puis les étapes du 3x3 jouées sur le cube réduit, avec ses deux
  parités là où on les voit : une arête seule à l'envers juste avant la
  croix blanche (parité OLL), deux arêtes échangées juste avant les arêtes
  blanches (parité PLL), chacune corrigée par sa formule de tranches. Son
  vocabulaire ajoute centre (quatre par face), aile, arête (deux ailes) et
  tranche intérieure. Au-delà de douze pièces, l'avancement n'a plus ses
  points, seulement ses mots.
- **Le vocabulaire** (« Étape 0 ») : avant les étapes, un pas par terme
  (centre, arête, coin ; sur un miroir, les six épaisseurs), ses pièces en
  bleu et la vue tournée vers elles ; « Suivant » passe au terme suivant,
  « Passer » va à l'étape 1. Un tutoriel déjà mené à son terme (gardé
  entre deux visites, `tutorialTrack.playedThrough`) offre en dessous un
  « Aide-mémoire » : ses étapes et leurs formules, à la place du pas,
  jusqu'à « Revenir au tutoriel ». Sur un miroir, tous les textes nomment les
  faces et les pièces par leur épaisseur, de très fine à très épaisse
  (« l'arête aux faces fine et moins épaisse »).
- **Le panneau** : l'étape (« Étape 4 sur 7 », son but, son avancement,
  sa consigne, la légende des hachures), puis quatre **consignes
  numérotées** : tenir le centre de face (un clic tourne la vue vers lui),
  repérer la pièce et celle qui occupe sa place (ou la figure), jouer la
  formule, vérifier le résultat (un nombre : « 5 faces blanches vers le
  haut »). La formule est découpée comme on l'apprend (`formulaSegments`) :
  coups simples, gestes des enchaînements appris (`algorithms`, d'où qu'on
  les joue), un geste répété dit une fois avec son nombre. Un morceau dont
  un coup n'a encore été montré nulle part (`tutorialTrack.learnt`) est en
  colonne, chaque coup avec sa phrase courte (`t.describeMoveShort`) ;
  les autres en rangée de boutons, leur phrase en infobulle ; les étapes
  qui le déclarent (`words`) gardent les coups simples en colonne.
- **La tenue** : chaque pas dit comment tenir le puzzle, une tenue du cadre
  du tutoriel (`HoldFrame` ; pour un cube, `lib/core/hold.ts` le déduit
  de ses faces). La vue tourne vers le centre à tenir quand la tenue
  change (plus haut pour une étape qui travaille le dessus, `side`) ; la
  formule qui achève une croix ou une face la montre (`shows`) jusqu'au
  clic sur « Suivant », qui revient à la tenue suivante ; les
  coups de la formule s'écrivent et se décrivent dans cette tenue, et le
  pavé de coups aussi pendant le tutoriel : `R` tourne la face qu'on voit
  à droite.
- **Sur le cube** : la pièce visée scintille en bleu et l'emplacement en
  ambre (`usePulse`), les pièces que la formule déplace sans les placer
  sont hachurées (`hatchTexture`, celle qui occupe l'emplacement aussi),
  et une flèche va de la face du sticker
  repère à celle où il arrive (`TutorialArrow` : un demi-cercle autour du
  milieu des deux faces, élargi jusqu'à passer au large du cube, en
  pointillés là où il est caché). Aux étapes par figures, les pièces
  travaillées (`subjects`) gardent leurs couleurs, une flèche chacune
  (celles qu'elle déplace sans flèche, un blanc qui quitte le dessus, sont
  hachurées) ;
  plusieurs flèches défilent une à une (`useArrowTurns`), la pièce de
  départ de celle qu'on voit en bleu, celle de son arrivée en ambre.
- **Jouer** : un clic sur une autre pièce la choisit, puis sur un
  emplacement. « Appliquer la formule » la joue puis marque un **arrêt**
  (les consignes faites cochées, la vérification en avant, les pièces
  déplacées en bleu) jusqu'à « Suivant ». Des coups joués **à la main** (le
  pavé ou les boutons de la formule) sont suivis : s'ils suivent la
  formule, elle reste affichée, ses coups joués estompés, le suivant
  entouré ; sinon elle est recalculée en remettant les pièces placées au
  début du pas (`formulaUnderWay`) ; le bouton devient « Valider le
  déplacement ». « Annuler le déplacement » ramène au début du pas.
- **Le parcours** : une étape que le cube remplit déjà quand le tutoriel
  y arrive n'est pas sautée : elle s'affiche avec « les cubes à déplacer
  à cette étape sont déjà dans la bonne position » et un bouton « Suivant »
  (`tutorialTrack.stageShown`). Une étape finie fait apparaître un 💪 devant
  le cube (`StageCheer`) ; la fin du tutoriel, une coupe, « Résolu, bravo ! »,
  « Les N formules à retenir » (`FormulaRecap` : chaque étape et ses
  formules, lues dans les `algorithms` qu'elle déclare, écrites dans la
  notation choisie, une formule enseignée deux fois comptée une fois), un
  bouton pour le fermer, et le feu d'artifice.
- **Autour** : la solution précalculée de la méthode n'est pas montrée
  (`useAutoPlan` s'en abstient) ; ce qui remplacerait le cube suivi est
  grisé (mélange, réinitialisation, saisie, restauration) ; choisir un
  autre puzzle quitte le tutoriel ; la vitesse du tutoriel est gardée à
  part de celle du jeu.

**Feu d'artifice** (`components/celebration/Fireworks.tsx`) : quand un coup
amène le puzzle résolu (`solvedByTurn` du store : le coup qui finit, depuis
un état non résolu ; pas une réinitialisation, un changement de puzzle ni
une restauration), quelques fusées montent et éclatent aux couleurs du cube
pendant trois secondes, sur un canvas qui laisse passer les clics et
n'existe que le temps du spectacle (rien au repos). Dans le tutoriel, seulement
à sa fin, avec la coupe : toutes ses étapes montrées, celles que le cube
remplissait déjà comprises (`tutorialStore.cheer`), jamais à un coup. Rien pour
qui demande moins d'animations (`prefers-reduced-motion`).

**Adresse** (`lib/app/route.ts`, `store/router.ts`, sans bibliothèque) : l'URL
dit la langue et le puzzle, `#/fr/floppy-ghost`, `#/en/3x3-mirror`, ou
l'**accueil** quand elle ne nomme pas de puzzle (`#/fr`, et la racine du
site, complétée en `#/<langue détectée>`). L'accueil (`useRoute.home`)
remplace la scène 3D par une galerie (`HomeGallery` : quelques modèles variés, un
clic ouvre le puzzle, puis la saisie, le guide et la résolution présentés en
trois cartes) ; le panneau de gauche n'y garde que le choix du cube, sur
« Choisissez un modèle », et celui de droite le bloc de résolution grisé
avec une invitation (`SolvePanel home`, sans calcul de solution). Le titre
« Rubik Solver » ramène à l'accueil. Le nom
d'un puzzle (`SHAPE_SLUG`, plus `-mirror`) est le même dans les deux langues,
pour qu'un lien marche chez tout le monde. Le sélecteur de cube et la bascule
de langue ne touchent pas les stores : ils vont à une adresse (`goTo`, une
entrée d'historique), et les stores la suivent (`followRoute`, lancé avant
le premier rendu puis à chaque `popstate` / `hashchange`), donc les boutons
précédent / suivant du navigateur changent de puzzle. Une langue absente ou
inconnue est complétée par celle de l'app, un puzzle inconnu mène à
l'accueil (`replaceState`, sans entrée d'historique) ; on ne change ni de
puzzle ni de page pendant une animation ou une saisie (l'adresse est
remise). La notation et la vitesse restent hors de
l'adresse : elles sont gardées d'une visite à l'autre dans le navigateur
(`lib/app/storage.ts`, comme les états mémorisés), la vitesse en deux
réglages, celui du mélange et de la résolution et celui du tutoriel (plus
lent par défaut), l'un ou l'autre selon que le tutoriel est ouvert
(`cubeStore.speedMode`). La langue donne aussi le `lang` du document et sa meta
description (`App.tsx`) ; celle d'`index.html` est bilingue, puisqu'un
robot qui n'exécute pas le JavaScript ne voit qu'une adresse (le `#` n'est
pas envoyé au serveur).

Le recentrage caméra transite par `viewStore` (`resetToken`) lu par
`CameraReset` dans le `<Canvas>`.
