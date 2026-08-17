# La stratégie dominante — 2026-08-17

Enquête ouverte par une hypothèse de terrain : *« la stratégie dominante est
sûrement une équipe avec beaucoup de mobilité et de forts dégâts à distance. »*

Réponse courte : **l'hypothèse est à moitié juste, et sa moitié fausse est la
plus intéressante.** La mobilité décide effectivement des parties — mais pas
comme une doctrine de harcèlement à distance. Elle décide parce que **toutes
les parties se terminent par capture de la zone centrale, en 4 à 6 tours**, et
que la portée n'a pas le temps de servir.

## Protocole

Deux tournois indépendants, tous deux en round-robin aller-retour (chaque
doctrine joue les deux camps, ce qui neutralise l'avantage de position), IA
`SearchStrategy(profondeur 4, 5 000 nœuds)` des deux côtés, 50 tours maximum.

Sept doctrines, chacune poussant une idée jusqu'au bout :

| Doctrine | Idée |
|---|---|
| kite | mobilité 3-4 et portée 3 — *l'hypothèse à tester* |
| artillerie | portée 4, mouvement 1 |
| mêlée lourde | portée 1, gros dégâts, forte santé |
| nuée | 6 petites unités |
| concentrée | unités au plafond de coût |
| contrôle | tout en capacités |
| équilibrée | témoin |

Deux précautions ont changé les conclusions, et méritent d'être signalées :

1. **Budgets égalisés.** Au premier jet, les doctrines dépensaient de 70 à
   102 points : la comparaison ne mesurait rien. Elles sont désormais toutes à
   100 points, complétées si besoin par de la santé — la seule caractéristique
   linéaire, et celle qui ne change pas l'identité tactique d'une doctrine.
2. **Plafond par unité respecté.** La Caserne limite chaque unité à 30 points.
   Une première doctrine « deux héros à 50 points » écrasait tout le tableau
   avec 91,7 % de victoires… en étant tout simplement illégale. Elle a été
   remplacée par « concentrée », qui plafonne ses unités à 30 points.

   Conséquence structurelle à noter : **il faut au moins 4 unités pour dépenser
   100 points.** La doctrine « tout dans un héros » n'existe pas dans ce jeu.

## Résultat — 126 parties

| Rang | Doctrine | Taux de victoire |
|---|---|---|
| 1 | mêlée lourde | **91,7 %** |
| 2 | équilibrée | 63,9 % |
| 3 | contrôle | 55,6 % |
| 4 | concentrée | 52,8 % |
| 5 | **kite (mobilité + portée)** | **44,4 %** |
| 6 | **artillerie (portée max)** | **27,8 %** |
| 7 | nuée | 13,9 % |

L'hypothèse est réfutée : les deux doctrines qui misent sur la portée occupent
l'avant-dernière et la sixième place. Le kite ne bat que l'artillerie et la
nuée, et perd 5 parties sur 6 contre la mêlée lourde.

## Pourquoi — l'autopsie

Le classement ne dit pas *pourquoi*. En instrumentant la fin de partie sur les
escouades par défaut, le mécanisme apparaît :

| Affrontement | Fins par capture | Durée moyenne |
|---|---|---|
| Vanguard vs Aube | **16/16** | 4,6 tours |
| Vanguard vs Ligne 1812 | **16/16** | 6,3 tours |
| Aube vs Ligne 1812 | **16/16** | 6,5 tours |

**Aucune partie sur 48 ne se termine par élimination.** Et le classement suit
exactement le mouvement moyen des escouades : Vanguard 1,8 — Ligne 1812 1,5 —
Aube 1,3.

Le calcul est arithmétique. Depuis sa rangée de déploiement, une unité est à
2 cases de la zone centrale. À 3 de mouvement elle y est au tour 1 ; à 1 de
mouvement, au tour 3. Comme il suffit de **3 marqueurs de contrôle** et qu'on
marque dès qu'on occupe la zone seul, le premier arrivé a gagné avant que le
second n'ait pu le déloger.

D'où les trois enseignements, qui se tiennent tous :

- **Le mouvement est un seuil, pas une échelle.** Mouvement 1 est éliminatoire
  (l'artillerie ne participe pas à la course) ; au-delà, en rajouter ne paie
  plus. C'est ce qui distingue le seuil du surinvestissement, et pourquoi le
  kite — qui paie deux caractéristiques exponentielles à la fois — n'est pas
  rentable.
- **La portée est surévaluée.** Une partie se joue en 4 à 6 tours dans un carré
  de 4 cases : tirer à 4 cases n'y sert presque jamais, mais coûte 13,8 points
  contre 1,4 pour la portée 1.
- **L'effectif surnuméraire ne sert à rien.** Un joueur dispose de 2 actions par
  tour quel que soit le nombre d'unités : une escouade de 2 unités en active
  100 % chaque tour, une escouade de 6 en active 33 %. C'est ce qui enterre la
  nuée à 13,9 %.

## Le vrai défaut

Ce n'est pas un problème de composition, c'est un **réglage de la condition de
victoire** : la capture est trop courte pour être contestée. Le jeu récompense
la course et n'a pas le temps de récompenser autre chose — combat, portée,
capacités et manœuvre arrivent après la fin de la partie.

Trois leviers, par ordre d'efficacité présumée, à valider par la mesure :

1. **Porter les marqueurs de 3 à 5.** Le plus simple ; laisse le temps au camp
   lent d'arriver et de contester.
2. **N'ouvrir le décompte qu'au 3ᵉ tour.** Neutralise l'avantage de la course
   sans toucher au rythme de la fin de partie.
3. **Faire perdre un marqueur à qui perd la zone.** Rend la capture disputable
   plutôt que cumulative.

Aucun n'est appliqué à ce jour : ce sont des décisions de design.

## Effet de bord : une tentative de rééquilibrage qui échoue

L'enquête a révélé un déséquilibre marqué entre les escouades par défaut : le
Détachement Vanguard gagnait **91,7 %** de ses parties — en ne dépensant que
78 points sur 100.

Quatre passes d'ajustement ont suivi, chacune re-mesurée sur 72 parties. Elles
méritent d'être consignées parce qu'**elles n'ont pas résolu le problème** :

| Passe | Vanguard | Convoi | Ligne 1812 | Aube |
|---|---|---|---|---|
| départ | **91,7 %** | 44,4 % | 38,9 % | 25,0 % |
| mouvement rendu aux trois lentes | 55,6 % | **88,9 %** | 41,7 % | 13,9 % |
| Aube accélérée | 27,8 % | **77,8 %** | 69,4 % | 25,0 % |
| budget rendu au Vanguard | **88,9 %** | 47,2 % | 50,0 % | 13,9 % |
| Aube resserrée | **86,1 %** | 58,3 % | 47,2 % | 8,3 % |

À chaque passe, **la domination change de titulaire sans jamais s'atténuer** :
celle qui cumule mobilité et robustesse rafle 80-90 %, et l'écart entre la
première et la dernière ne descend jamais sous 45 points. La dernière passe a
même dégradé l'Aube, et a été annulée.

C'est la démonstration expérimentale du diagnostic : **le déséquilibre n'est pas
dans les compositions, il est dans la condition de victoire.** Tant que la
partie se décide par une course de 4 tours, aucun réglage de caractéristiques
ne produira quatre escouades comparables — on ne fait que désigner un nouveau
gagnant.

Les escouades livrées sont donc celles de la 4ᵉ ligne (Aube ramenée à sa
meilleure version mesurée), avec leurs budgets enfin utilisés : Aube 100 pts,
Vanguard 95, Ligne 1812 98, Convoi 91 — contre 90 / 78 / 95 / 85 au départ.
L'équilibre entre elles reste imparfait, et le restera jusqu'à l'arbitrage sur
la condition de victoire.

## Suite — les variantes de condition de victoire, mesurées

Les trois leviers proposés plus haut (plus deux combinaisons) ont été mis à
l'épreuve : la condition de capture est devenue paramétrable dans le moteur
(`sim.CaptureRules`, portée par le `GameState` pour que la recherche alpha-beta
joue la variante et non la règle de base), et les 7 doctrines ont rejoué leur
round-robin sous chaque variante — 42 parties par condition, 210 au total.

| Variante | Fins par élim. | Durée moy. | Écart 1ᵉʳ-dernier | Dominant |
|---|---|---|---|---|
| A. actuelle (3 marqueurs) | 17 % | 7,2 tours | 83 pts | mêlée **100 %** |
| B. 5 marqueurs | 40 % | 11,4 | 75 | concentrée 91,7 % |
| C. décompte au 3ᵉ tour | 26 % | 11,0 | 75 | concentrée 83,3 % |
| D. tir à la corde seul | 12 % | 6,6 | 83 | mêlée 91,7 % |
| E. 5 marqueurs + corde | **48 %** | 12,3 | **67** | concentrée 75 % |

Lecture :

- **D seul ne change rien** : voler un marqueur à l'adversaire ne sert que si
  l'adversaire en a — or dans une course, le perdant n'en gagne jamais. La
  partie reste une course, encore plus courte qu'avant.
- **B et C fonctionnent par le même mécanisme** : allonger la partie (7 → 11
  tours) laisse le combat exister. La part d'éliminations monte, l'artillerie
  redevient jouable.
- **E est la meilleure des cinq** : moitié captures, moitié éliminations —
  aucun style de victoire ne domine ; aucune doctrine au-dessus de 75 % ;
  cinq des sept doctrines entre 25 et 75 % de victoires ; et l'artillerie
  passe de 25 % (règle actuelle) à 66,7 %. Tenir la zone y exige d'avoir
  d'abord gagné le rapport de force — la capture couronne le combat au lieu
  de le remplacer.
- **La nuée reste morte partout** (8-17 %). Son problème n'est pas la
  condition de victoire mais l'économie d'actions : 2 actions par tour quel
  que soit l'effectif. C'est un levier distinct, à traiter séparément.

Réserve : 42 parties par variante, soit ±15 points de bruit sur les taux
individuels. Les classements fins entre doctrines voisines ne sont pas
significatifs ; la répartition des types de fin et les durées, elles, le sont.

**Arbitrage rendu : la variante E est la règle publiée** — 5 marqueurs, et
marquer en retire un à l'adversaire. Moteur, règles (fr/en/es) et onboarding
mis à jour en conséquence.

## Suite — l'économie d'actions par effectif, mesurée

Question posée après l'adoption de la règle E : faire croître le budget
d'actions avec l'effectif survivant sauve-t-il les escouades nombreuses ?
Le moteur a reçu `sim.ActionRules` (même mécanique que `CaptureRules` : la
règle vit dans le `GameState`, la recherche la joue). Trois économies
d'actions, sous la règle de capture désormais par défaut, 42 parties chacune :

| Effectif | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|
| A. 2 actions fixes (actuelle) | 2 | 2 | 2 | 2 | 2 |
| B. 1 + effectif/2 | 2 | 2 | 3 | 3 | 4 |
| C. 2 + effectif/3 | 2 | 3 | 3 | 3 | 4 |

| Variante | Nuée (6 unités) | Écart 1ᵉʳ-dernier | Fins par élim. | Dominant |
|---|---|---|---|---|
| A. fixe | 16,7 % | **58 pts** | 55 % | concentrée 75 % |
| B. 1 + n/2 | **50,0 %** | 75 | 57 % | artillerie 83,3 % |
| C. 2 + n/3 | 41,7 % | 92 | **81 %** | artillerie 91,7 % |

Verdict en deux temps :

- **Oui, ça sauve la nuée** : de 16,7 % à 50 % sous B — l'hypothèse est
  confirmée, le handicap des escouades nombreuses est bien l'économie
  d'actions.
- **Mais le remède déséquilibre plus qu'il ne répare.** Plus d'actions par
  tour, c'est plus d'attaques par tour pour tout le monde : l'artillerie
  s'envole (66,7 → 83,3 → 91,7 %), les unités fragiles et rapides
  s'effondrent (kite 16,7 → 8,3 → 0 %), et l'écart global se dégrade
  (58 → 75 → 92 points). Sous C, 81 % des parties finissent en élimination :
  on a re-déséquilibré dans l'autre sens.

**Décision : l'économie d'actions reste à 2 actions fixes.** Le support
`ActionRules` demeure dans le moteur pour de futures expériences — une piste
plus chirurgicale serait un modèle d'activation (chaque action doit activer
une unité différente de la précédente, ou k unités distinctes par tour), qui
avantagerait le nombre sans augmenter le volume de feu global.

## Les escouades par défaut sous la nouvelle règle

Re-mesure des 4 escouades livrées après adoption de la règle E (72 parties) :

| Escouade | Effectif | Ancienne règle | Règle E |
|---|---|---|---|
| Détachement Vanguard | 5 | 86,1 % | 77,8 % |
| Convoi des Rouilleux | 5 | 58,3 % | 77,8 % |
| Compagnie de l'Aube | 6 | 8,3 % | 33,3 % |
| Ligne de 1812 | 6 | 47,2 % | 11,1 % |

Le classement suit désormais **l'effectif** : les deux escouades de 5 unités
devant, les deux de 6 derrière — cohérent avec le diagnostic d'économie
d'actions, que des parties plus longues aggravent. Un retour d'équilibrage des
escouades (et de l'algorithme de coûts, qui a été calibré sous l'ancienne
règle) sous la règle E reste à faire.

## Note de méthode

Deux erreurs ont été commises et corrigées en cours de route ; elles disent
quelque chose sur la façon de mesurer ce jeu.

- **Comparer à budgets inégaux ne mesure rien.** Le premier tournoi opposait des
  escouades de 70 à 102 points.
- **Recopier les compositions à la main crée des divergences silencieuses.** Une
  substitution sur un nom ambigu (« Sergent ») a modifié la mauvaise unité dans
  un script de test. Les compositions de test sont désormais **générées depuis
  `barracks/util/defaults.ts`**, seule source de vérité.
