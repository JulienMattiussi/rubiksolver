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

- traiter les arêtes une à une (`oneAtATime`) : pas plus rapide ;
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
