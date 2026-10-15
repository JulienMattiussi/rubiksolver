# Améliorations futures

Ce qui marche aujourd'hui mais mériterait mieux, avec les pistes déjà
envisagées.

## Gear Cube Extreme : accélérer la résolution

**Constat.** La méthode « Équateur puis coins » (`src/lib/methods/gear/gearExtreme.ts`)
résout tous les mélanges testés, mais lentement : de quelques secondes à
environ 25 s. Presque tout le temps passe dans la dernière étape, les
engrenages. Le calcul se fait dans le worker, donc la page ne fige pas, et
Résoudre reste grisé (« Calcul de la solution… ») jusqu'à ce qu'il aboutisse,
et au-delà de 4 s un grand rouage tournant le dit par-dessus les étapes.

**Pourquoi.** Chaque formule de fan2cube (`(D²H)².D⁸.(H'D'²)²`) tourne un
engrenage du bas mais en dérange trois du haut. La recherche essaie toutes
les variantes de la formule (8 tenues × 16 préparations par des tours du
haut et du bas × 2 sens) et rejoue chacune coup par coup.

**Déjà essayé, sans succès :**

- traiter les arêtes une à une (`oneAtATime`) : gardé (les étapes restent
  lisibles), mais pas plus rapide ;
- combiner `(BA)+` et `(BA)-` en une paire qui ne tourne que deux engrenages :
  la résolution échouait sur plus de la moitié des mélanges.

**Piste.** Précalculer une fois l'effet de chaque variante de formule sur
les 8 arêtes à engrenage (une permutation + des pivots), puis faire la
recherche sur ces effets au lieu de rejouer les coups. Chaque essai devient
quelques opérations au lieu de dizaines de coups sur 27 pièces.

## Camouflage 4x4x2 : saisir un puzzle déformé

La saisie se fait dans la boîte seulement : l'utilisateur doit remettre son
Camouflage en forme de pavé avant de peindre ses couleurs. Déformé, il a
bien trop de formes pour les proposer en vignettes comme la tour : 52 000 à
5 coups de la boîte, 280 000 à 6, et un mélange est en général à 6 à 9
coups.

**Idée.** Faire compter à l'utilisateur, sur une face puis sur la face
opposée, les gros carrés, les rectangles et les petits carrés qu'il voit,
puis lui faire choisir la disposition de chaque face, et ne lui proposer
que les formes qui correspondent.

**Mesure.** Sur les formes à 5 coups ou moins, le haut et le bas comptés
donnent 338 combinaisons ; une même combinaison regroupe jusqu'à 1 500
formes (56 en médiane). Choisir ensuite la disposition des faces
réduirait beaucoup chaque groupe, mais le blocage reste l'énumération : la
forme réelle est presque toujours trop loin de la boîte pour être listée.

**Pistes.** Ne proposer cette saisie que pour un puzzle peu déformé (6 coups
au plus), ou reconstruire la forme case par case depuis ce que l'utilisateur
voit de chaque face (chaque pièce n'étant haute que sur un axe, la vue de
deux faces opposées dit peut-être assez), sans rien énumérer.

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
