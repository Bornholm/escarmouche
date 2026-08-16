# Évaluation d'équilibrage — 2026-08-16

Première évaluation menée après la refonte du système : monnaie unique en
points de coût (budget d'escouade 100 pts), zone de capture centrale 2×2,
obstacles, statuts corrigés, et IA de recherche sur la vraie structure de
tour.

## Protocole

- **Algorithme** : évolutionnaire, population 16, 10 générations, mutation
  15 %, élitisme avec **réévaluation des élites à chaque génération** (les
  individus « chanceux » ne survivent pas à une re-mesure).
- **Fitness** : `0,5·(1−HHI) + 0,4·(1−biais d'archétype) − 0,3·taux de
  non-terminaison`, moyenné sur 3 tournois indépendants par évaluation.
- **Tournoi** : 8 escouades (une mono-archétype par archétype + 2 mixtes),
  round-robin aller-retour, budget 100 pts.
- **IA des simulations** : `SearchStrategy(depth 2, 4000 nœuds)` — recherche
  alpha-beta sur la structure de tour réelle, consciente de l'objectif.
- ~56 parties par tournoi, ~9 000 parties pour le run complet.

## Résultats du run

| Génération | Best | Moyenne |
|---|---|---|
| 0 | 0,595 | 0,463 |
| 3 | 0,632 | 0,520 |
| 6 | **0,638** | 0,541 |
| 9 (finale) | 0,618 | 0,541 |

Meilleur candidat (génération 6) :

```
HealthFactor: 1.553   RangeFactor: 1.205 (exp 1.525)
MoveFactor:   0.612 (exp 2.946)   PowerFactor: 2.301 (exp 1.200)
```

## Lecture du signal

Trois enseignements convergents, tous cohérents avec le nouveau gameplay :

1. **La santé était sous-cotée** (+55 %) : dans un jeu où tenir la zone
   centrale gagne la partie, survivre sur l'objectif vaut plus que ne le
   disait le tarif linéaire à 1,0.
2. **La puissance était sous-cotée** (+53 %) : l'attaque touche toujours ;
   chaque point de puissance est une promesse certaine.
3. **La mobilité est la statistique dominante** : le GA baisse son prix de
   base mais pousse son exposant à 2,95 — au point de rendre Move ≥ 4
   inachetable (Move 4 ≈ 62 pts à lui seul). C'est la découverte du run :
   avec un objectif central à capturer, arriver plus vite ET pouvoir fuir la
   zone de riposte domine tout le reste si ce n'est pas tarifé.

## Décision : adoption tempérée

Le candidat brut ampute l'espace de conception (Move 4-6 inachetables, le
Cuirassier des escouades par défaut dépasse le plafond de 30). Un candidat
« tempéré » suivant les mêmes directions avec des amplitudes jouables a été
mesuré contre lui :

| Candidat | Fitness (3 runs × 3 tournois, ~500 parties) |
|---|---|
| Anciens défauts | 0,501 |
| GA brut (gen 6) | 0,543 |
| **Tempéré (adopté)** | **0,531** |

L'écart brut/tempéré (0,012) est dans la marge de bruit (±0,04 entre runs) ;
l'écart aux anciens défauts (+6 %) est constant. Adopté dans
`core.DefaultCosts` :

```
HealthFactor: 1.5
RangeFactor:  1.4  (exp 1.35)
MoveFactor:   0.7  (exp 1.6)
PowerFactor:  2.2  (exp 1.2)
```

Sous ces coûts, Move 4 ≈ 11,5 pts et Move 5 ≈ 23 pts : chers, accessibles.

## Validation

- 56 tests Go verts, WASM recompilé.
- Les quatre escouades par défaut tiennent dans le budget : Compagnie de
  l'Aube 84, Vanguard 76, Ligne de 1812 86, Convoi des Rouilleux 79 / 100 pts
  — avec moins de marge qu'avant, ce qui est voulu : le budget doit se sentir.
- Aucune unité par défaut ne dépasse le plafond unitaire de 30.

## Limites et suites

- Le taux de non-terminaison est devenu marginal grâce à la zone de capture —
  la pénalité du fitness n'a presque plus de prise ; c'est le signe que
  l'objectif remplit son rôle.
- L'IA des simulations reste à depth 2 par souci de débit : une passe de
  confirmation à depth 4 sur les 2-3 meilleurs candidats serait une suite
  utile.
- L'étape suivante naturelle est la **co-évolution adversariale** : une
  population d'escouades qui cherche activement à exploiter les coûts, plutôt
  que des tirages aléatoires stratifiés.
