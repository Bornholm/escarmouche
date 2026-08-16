package sim

import "math"

/* =============================================================================
   Déploiement alterné.

   Les règles font placer les unités tour à tour : chaque joueur voit ce que
   l'adversaire a posé avant de décider. L'IA doit donc réagir, pas dérouler
   un plan calculé à l'avance.

   Zones : le joueur occupe les rangées 0-1, l'IA les rangées 6-7.
   ========================================================================== */

// DeploymentRows renvoie les deux rangées de déploiement d'un joueur.
func DeploymentRows(playerID PlayerID) [2]int {
	if playerID == PlayerOne {
		return [2]int{0, 1}
	}
	return [2]int{BoardSize - 1, BoardSize - 2}
}

// IsValidDeploymentPosition vérifie qu'une case appartient à la zone de
// déploiement du joueur, qu'elle est dans le plateau et libre de tout
// obstacle. L'occupation par une unité est vérifiée par l'appelant.
func IsValidDeploymentPosition(playerID PlayerID, pos Position, obstacles map[string]bool) bool {
	if pos.X < 0 || pos.X >= BoardSize || pos.Y < 0 || pos.Y >= BoardSize {
		return false
	}
	rows := DeploymentRows(playerID)
	if pos.Y != rows[0] && pos.Y != rows[1] {
		return false
	}
	if obstacles[pos.String()] {
		return false
	}
	return true
}

// SuggestDeployment choisit la case d'une unité de l'IA, en tenant compte de
// ce qui est déjà posé des deux côtés.
//
// Trois préférences, par ordre d'importance :
//   - les unités à longue portée se placent sur la rangée arrière, celles de
//     mêlée sur la rangée avancée ;
//   - toutes convergent vers les colonnes qui mènent à la zone centrale ;
//   - une unité fragile évite de se planter juste en face d'un tireur adverse
//     déjà déployé.
func SuggestDeployment(
	unit Unit,
	playerID PlayerID,
	occupied map[string]bool,
	obstacles map[string]bool,
	enemies []DeployedUnit,
) (Position, bool) {
	rows := DeploymentRows(playerID)
	// rows[0] est la rangée du fond, rows[1] la rangée avancée.
	backRow, frontRow := rows[0], rows[1]

	prefersBack := unit.Stats.Range >= 3 || unit.Stats.Health <= 1
	prefersFront := unit.Stats.Range <= 1 && unit.Stats.Health >= 3

	best := Position{}
	bestScore := math.Inf(-1)
	found := false

	for _, y := range []int{backRow, frontRow} {
		for x := 0; x < BoardSize; x++ {
			pos := Position{X: x, Y: y}
			if occupied[pos.String()] || obstacles[pos.String()] {
				continue
			}

			score := 0.0

			// Rangée adaptée au profil
			if prefersBack && y == backRow {
				score += 3
			}
			if prefersFront && y == frontRow {
				score += 3
			}
			// Aucun bonus par défaut pour la rangée avancée : la majorité des
			// unités n'ayant pas de profil marqué, ce bonus massait toute
			// l'escouade de l'IA au plus près du centre — un avantage de tempo
			// systématique vers l'objectif, que le joueur ne subissait pas
			// puisqu'il place où il veut.

			// Colonnes centrales : la zone d'objectif se joue au milieu
			score -= math.Abs(float64(x)-3.5) * 0.8

			// Une unité fragile évite la ligne de tir d'un tireur adverse
			if unit.Stats.Health <= 2 {
				for _, enemy := range enemies {
					if enemy.Unit.Stats.Range >= 3 && enemy.Position.X == x {
						score -= 2.5
					}
				}
			}

			if score > bestScore {
				bestScore = score
				best = pos
				found = true
			}
		}
	}

	return best, found
}

// DeployedUnit associe une unité à sa case, pour que l'IA puisse réagir aux
// placements déjà visibles.
type DeployedUnit struct {
	Unit     Unit
	Position Position
}
