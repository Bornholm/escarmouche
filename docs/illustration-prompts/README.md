# Prompts d'illustration — les 23 unités

Un fichier par unité, prêt à coller dans un générateur d'images
(gpt-image-1, Stable Diffusion, Midjourney…). Chaque prompt est **autonome** :
il embarque déjà le bloc de style commun.

## Le style d'ensemble

Toutes les unités partagent la même esthétique : **figurine de wargame en
résine grise, rendu studio, socle rond, fond blanc uni** — avec un unique
**accent de couleur par escouade**. Pourquoi ce choix :

- cohérent avec l'objet du jeu (un compagnon de jeu de figurines) et avec les
  six images existantes du projet ;
- un accent unique par escouade = quatre univers immédiatement distinguables,
  sans casser l'unité de la collection ;
- la grisaille reste lisible une fois imprimée en noir et blanc sur la carte
  (63 × 88 mm) — c'est une exigence de la feuille d'impression.

| Escouade | Préfixe | Accent |
|---|---|---|
| Compagnie de l'Aube | `fantasy-` | or pâle (*pale gold*) |
| Détachement Vanguard | `scifi-` | cyan acier (*steel cyan*) |
| Ligne de 1812 | `hist-` | bleu impérial (*deep imperial blue*) |
| Convoi des Rouilleux | `apoc-` | orange rouille (*rust orange*) |

Pour basculer toute la collection dans un autre style (peinture complète,
illustration 2D…), remplacez le bloc STYLE au début de chaque prompt — le
reste (pose, équipement, caractère) est indépendant du rendu.

## Paramètres recommandés

- **Format : carré, 1024 × 1024 minimum** — l'application redimensionne en
  400 × 400 (`object-fit: contain`), un fond blanc uni ou transparent est
  indispensable.
- Générer les variantes d'une même escouade **dans la même session/seed**
  quand l'outil le permet : la cohérence intra-escouade y gagne.
- Après génération : déposer les fichiers dans `barracks/static/` sous le nom
  indiqué dans chaque fiche, puis renseigner `imageUrl` dans
  `barracks/util/defaults.ts` (`${BASE_URL}/<fichier>.png`).

## Les fiches

- [Templier](knight.md) — Compagnie de l'Aube
- [Archer elfe](archer.md) — Compagnie de l'Aube
- [Sorcier crépusculaire](mage.md) — Compagnie de l'Aube
- [Gardien du serment](fantasy-warden.md) — Compagnie de l'Aube
- [Écuyer](fantasy-squire.md) — Compagnie de l'Aube
- [Chasseresse sylvestre](fantasy-huntress.md) — Compagnie de l'Aube
- [Guerrier orc](bruiser.md) — Compagnie de l'Aube
- [Fusilier lourd](scifi-heavy.md) — Détachement Vanguard
- [Éclaireur orbital](scifi-scout.md) — Détachement Vanguard
- [Technicien de combat](scifi-tech.md) — Détachement Vanguard
- [Sergent d'abordage](scifi-sergeant.md) — Détachement Vanguard
- [Drone sentinelle](scifi-drone.md) — Détachement Vanguard
- [Grenadier de la Garde](hist-grenadier.md) — Ligne de 1812
- [Voltigeur](hist-voltigeur.md) — Ligne de 1812
- [Cuirassier](hist-cuirassier.md) — Ligne de 1812
- [Sergent de compagnie](hist-sergeant.md) — Ligne de 1812
- [Tambour](hist-drummer.md) — Ligne de 1812
- [Fusilier de ligne](hist-fusilier.md) — Ligne de 1812
- [Colosse de fonte](apoc-colossus.md) — Convoi des Rouilleux
- [Tireuse de tôle](apoc-sharpshooter.md) — Convoi des Rouilleux
- [Ferrailleur](apoc-scrapper.md) — Convoi des Rouilleux
- [Chien de casse](apoc-hound.md) — Convoi des Rouilleux
- [Mécano bricoleur](apoc-mechanic.md) — Convoi des Rouilleux
