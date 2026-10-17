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
  d'animation, **recentrage caméra animé** et **bascule de notation FR/US**.
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
structurée que `t.describeMove` met en phrase), donc un nouveau puzzle a son
guide sans travail. Rendu : **un seul contexte WebGL** (`GuideCanvas`, posé
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

**Tutoriel** (`lib/tutorial/`, `store/tutorialStore.ts`,
`hooks/useTutorial.ts`, `components/tutorial/`) : sur un puzzle qui en a un
(`tutorialFor`, le 3x3 pour l'instant), le bouton Tutoriel (grisé sur un
puzzle résolu) remplace le bloc de résolution par un panneau où l'on résout
soi-même, un **pas** à la fois : un pas est une formule qui amène une pièce
à sa place sans déranger celles déjà placées (sur le 3x3 : recentrer ;
la croix jaune arête par arête, la formule la plus courte en coups
externes ; les coins jaunes un par un, amenés au-dessus de leur place puis
descendus par le déclencheur de la place, `R U R' U'` pour l'avant droite,
répété ; les arêtes du milieu une par une, amenées au-dessus du centre de
leur couleur puis insérées à droite (`U R U' R' U' F' U F`) ou à gauche
(`U' L' U L U F U' F'`) ; la croix blanche par `F R U R' U' F'`, selon la
figure que dessine le blanc en haut (un point, un L tenu derrière à gauche,
une ligne tenue de gauche à droite), ses arêtes mises en valeur, sans
pièce à choisir ; une étape qui travaille le dessus (`face`) monte la vue
pour le voir (`liftFor`), et les pièces qu'elle travaille (`subjects`) ne
sont pas hachurées quand la formule les déplace : une flèche chacune vers
sa place, de face du dessus à face du dessus, ou suivant leur blanc quand
il y monte (la croix blanche) ; puis les arêtes blanches au-dessus de leur centre
(`R U R' U R U2 R'`), les coins blancs à leur place
(`U R U' L' U R' U' L`) et enfin tournés blanc en haut (`R' D' R D` répété,
un seul pas, la première couche se défaisant en route), jusqu'au cube
résolu : « Résolu, bravo ! » et le feu d'artifice). Chaque pas dit comment **tenir le
cube** (`TutorialStep.hold`, parmi les tenues du tutoriel, son
`HoldFrame` : pour un cube, `lib/core/hold.ts` les déduit de ses faces,
chacune des faces autour du haut tenue devant, le haut en haut) : pour un coin, sa place devant à droite, donc toujours
`R U R' U'`. La vue tourne d'elle-même vers le centre à tenir quand la
tenue change, les coups de la formule s'écrivent et se décrivent dans
cette tenue, et le pavé de coups aussi pendant le tutoriel
(`tutorialStore.hold`) : `R` tourne la face qu'on voit à droite. Le panneau dit l'**étape** (son rang,
son but, son avancement en pastilles et en mots, sa consigne, la légende
des hachures), puis quatre **consignes numérotées** : tenir le centre de
face (un clic tourne la vue vers lui, `viewStore.viewToward`), repérer la
pièce et celle qui occupe sa place, jouer la formule (chaque coup en
bouton du pad, à côté de sa phrase courte `t.describeMoveShort` ; un bloc
découpée comme on l'apprend, `formulaSegments` : les enchaînements appris
(`TutorialStep.algorithms`), d'où qu'on les joue, sur une rangée de
boutons, un enchaînement répété dit une fois avec son nombre, chacun coupé
en les gestes que déclare sa définition (l'insertion : dégager, puis
ramener) ; un morceau dont un coup n'a encore été montré ni dans un pas
validé, `tutorialStore.learnt`, ni plus tôt dans la formule, s'affiche en colonne, chaque
coup avec sa phrase à droite, les autres en rangée, leurs phrases en
infobulle ; les coups simples restent en colonne dans les étapes qui le
déclarent, `words` : les deux premières), vérifier
les nouvelles positions. Sur le cube, la pièce visée et l'emplacement
**scintillent** (`usePulse`), les pièces que la formule déplace sans les
placer sont **hachurées** (`hatchTexture`), et une **flèche** va de la face
du sticker repère à celle où il arrive (`TutorialArrow` : un demi-cercle
centré entre les deux faces, du côté opposé au centre du cube, ou dans le
plan de l'écran pour deux faces opposées, élargi jusqu'à passer au large du cube, chaque
bout sortant de sa face tout droit, en pointillés là où le cube le cache).
Un clic sur une autre pièce la choisit, puis un clic sur un emplacement ;
la formule se recalcule. « Appliquer la formule » la joue puis marque un
**arrêt** (les consignes faites cochées, la vérification en avant) jusqu'à
« Suivant » ; une **étape** finie (son dernier pas validé, le puzzle pas
encore résolu) fait apparaître un 💪 devant le cube, qui grandit, bat deux
fois et s'efface (`StageCheer`, `tutorialStore.stagesDone`), distinct du
feu d'artifice de la résolution complète. Des coups joués **à la main** pendant un pas (le pad ou les
boutons de la formule) sont suivis : le bouton devient « Valider le
déplacement » (le reste de la formule). S'ils suivent la formule du début
du pas, elle reste affichée, ses coups joués estompés, le suivant entouré et
la répétition en cours dite ; sinon elle est recalculée pour la même pièce,
en remettant les pièces placées au début du pas (`formulaUnderWay`). Et
« Annuler le déplacement » ramène au début du pas, formule et coups à la
main compris. La solution précalculée de la méthode n'est pas montrée
pendant le tutoriel (`useAutoPlan` s'en abstient). Tout ce qui remplacerait le cube suivi est
grisé tant qu'il est ouvert (mélange, réinitialisation, saisie,
restauration), avec une infobulle qui invite à le quitter ; choisir un
autre puzzle le quitte.

**Feu d'artifice** (`components/celebration/Fireworks.tsx`) : quand un coup
amène le puzzle résolu (`solvedByTurn` du store : le coup qui finit, depuis
un état non résolu ; pas une réinitialisation, un changement de puzzle ni
une restauration), quelques fusées montent et éclatent aux couleurs du cube
pendant trois secondes, sur un canvas qui laisse passer les clics et
n'existe que le temps du spectacle (rien au repos). Dans le tutoriel, seulement
une fois le pas validé : le coup d'une formule qui le résout, ou « Valider le
déplacement » sur un puzzle que des coups à la main ont résolu ; un coup à
la main seul ne le déclenche pas. Rien pour
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
