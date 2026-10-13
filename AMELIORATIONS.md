# Améliorations futures

Ce qui marche aujourd'hui mais mériterait mieux, avec les pistes déjà
envisagées.

## Gear Cube Extreme : accélérer la résolution

**Constat.** La méthode « Équateur puis coins » (`src/lib/methods/gearExtreme.ts`)
résout tous les mélanges testés, mais lentement : de quelques secondes à
environ 25 s. Presque tout le temps passe dans la dernière étape, les
engrenages. Le calcul se fait dans le worker, donc la page ne fige pas, et
Résoudre reste grisé (« Calcul de la solution… ») jusqu'à ce qu'il aboutisse.

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

## Gear Cube Extreme : saisir des engrenages de travers

La saisie suppose le cube en forme, tous les engrenages réalignés. Sur
l'Extreme, chaque engrenage peut rester de travers indépendamment des autres
(le haut et le bas les font changer de tranche), si bien qu'un cube réel
peut ne pas pouvoir être remis en forme. Piste : un outil de la palette qui
fait pivoter l'engrenage cliqué d'un tiers de tour, dessiné de travers comme
en jeu.

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
