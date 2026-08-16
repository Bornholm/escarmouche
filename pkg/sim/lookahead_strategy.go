package sim

import (
	"math"
	"sort"
)

/* =============================================================================
   IA par recherche alpha-beta sur la VRAIE structure de tour.

   L'ancienne implémentation alternait les joueurs à chaque pli (A→B→A→B),
   alors que le jeu réel donne 2 actions consécutives au même joueur
   (A,A,B,B). Elle était donc incapable de voir le geste central du jeu — le
   combo move+attack d'une même unité — et jouait en conséquence.

   Ici la recherche simule fidèlement le moteur : elle partage beginTurn /
   endTurn avec la boucle de jeu, ce qui inclut le décompte des points de
   contrôle de la zone centrale. L'IA « voit » donc qu'achever son tour seule
   dans la zone marque un point, et que trois points gagnent la partie.

   La profondeur se mesure en actions : depth 4 = mon tour complet + la
   réponse adverse complète. Un budget de nœuds borne le temps de réponse
   (important en WASM) : l'approfondissement itératif rend le meilleur coup
   de la dernière profondeur entièrement explorée.
   ========================================================================== */

const (
	winScore = 100000.0
	// movesPerUnit limite le branchement : seules les meilleures destinations
	// (selon une heuristique rapide) sont explorées. Attaques et capacités ne
	// sont jamais élaguées.
	movesPerUnit = 5
)

// LookaheadStrategy conserve l'API historique : profondeur fixe, budget large.
func LookaheadStrategy(depth int) StrategyFunc {
	return SearchStrategy(depth, 200000)
}

// SearchStrategy renvoie une stratégie par approfondissement itératif
// (2, 4, … maxDepth actions) bornée par un budget de nœuds.
func SearchStrategy(maxDepth int, nodeBudget int) StrategyFunc {
	return func(state GameState, playerID PlayerID) Action {
		// Le moteur décrémente ActionsLeft AVANT d'appeler la stratégie :
		// l'action que nous choisissons n'est pas comptée. La recherche
		// raisonne en « actions restantes, celle-ci comprise ».
		remaining := state.ActionsLeft + 1

		search := &searcher{budget: nodeBudget}

		var best Action
		for depth := 2; depth <= maxDepth; depth += 2 {
			action, _, complete := search.alphabeta(
				state, playerID, remaining, depth,
				-math.MaxFloat64, math.MaxFloat64,
			)
			if !complete {
				break
			}
			if action != nil {
				best = action
			}
		}

		return best
	}
}

type searcher struct {
	budget int
	nodes  int
}

// alphabeta explore l'arbre d'actions. `remaining` est le nombre d'actions
// restantes au joueur courant dans son tour (celle à jouer comprise) ;
// lorsque son tour s'achève, endTurn/beginTurn sont appliquées comme dans le
// moteur. Retourne (meilleure action, score, exploration complète ?).
func (s *searcher) alphabeta(state GameState, maximizer PlayerID, remaining int, depth int, alpha, beta float64) (Action, float64, bool) {
	s.nodes++
	maybeYield(s.nodes)
	if s.nodes > s.budget {
		return nil, evaluateState(state, maximizer), false
	}

	// États terminaux — modulés par la profondeur restante pour préférer les
	// victoires rapides et retarder les défaites.
	if over, winner := terminalState(state); over {
		if winner == maximizer {
			return nil, winScore + float64(depth), true
		}
		return nil, -winScore - float64(depth), true
	}

	if depth == 0 {
		return nil, evaluateState(state, maximizer), true
	}

	currentPlayer := state.CurrentPlayerID
	isMaximizing := currentPlayer == maximizer

	actions := s.prunedActions(state, currentPlayer)
	if len(actions) == 0 {
		// Aucune action possible : le tour se termine de fait.
		next := advanceTurn(state.Copy(), currentPlayer)
		_, score, complete := s.alphabeta(next, maximizer, 2, depth-1, alpha, beta)
		return nil, score, complete
	}

	var bestAction Action
	complete := true

	step := func(action Action) (float64, bool) {
		next := action.Apply(state.Copy())
		nextRemaining := remaining - 1
		if nextRemaining <= 0 {
			// Fin du tour du joueur courant : scoring de la zone puis main à
			// l'adversaire — exactement ce que fait la boucle de jeu.
			next = advanceTurn(next, currentPlayer)
			nextRemaining = 2
		} else {
			next.ActionsLeft = nextRemaining - 1
		}
		_, score, ok := s.alphabeta(next, maximizer, nextRemaining, depth-1, alpha, beta)
		return score, ok
	}

	if isMaximizing {
		bestScore := -math.MaxFloat64
		for _, action := range actions {
			score, ok := step(action)
			if !ok {
				complete = false
			}
			if score > bestScore {
				bestScore = score
				bestAction = action
			}
			if score > alpha {
				alpha = score
			}
			if beta <= alpha {
				break
			}
		}
		return bestAction, bestScore, complete
	}

	bestScore := math.MaxFloat64
	for _, action := range actions {
		score, ok := step(action)
		if !ok {
			complete = false
		}
		if score < bestScore {
			bestScore = score
			bestAction = action
		}
		if score < beta {
			beta = score
		}
		if beta <= alpha {
			break
		}
	}
	return bestAction, bestScore, complete
}

// advanceTurn ferme le tour de playerID et ouvre celui de son adversaire, en
// réutilisant les transitions du moteur (statuts, points de contrôle).
func advanceTurn(state GameState, playerID PlayerID) GameState {
	state = endTurn(state, playerID)
	return beginTurn(state, getOpponentPlayerID(playerID))
}

// terminalState : élimination totale ou victoire par capture.
func terminalState(state GameState) (bool, PlayerID) {
	if over, winner := isGameOver(state); over {
		return true, winner
	}
	for _, playerID := range []PlayerID{PlayerOne, PlayerTwo} {
		if state.ControlPoints[playerID] >= ControlPointsToWin {
			return true, playerID
		}
	}
	return false, -1
}

// prunedActions rassemble les actions du joueur en limitant les déplacements
// de chaque unité à ses movesPerUnit meilleures destinations, et ordonne
// attaques et capacités en tête pour maximiser les coupes alpha-beta.
func (s *searcher) prunedActions(state GameState, playerID PlayerID) []Action {
	direct := make([]Action, 0)
	moves := make([]Action, 0)

	for _, unit := range getControllableUnits(state, playerID) {
		unitMoves := make([]Action, 0)
		for _, action := range getValidActions(state, unit) {
			if action.Type() == ActionMove {
				unitMoves = append(unitMoves, action)
			} else {
				direct = append(direct, action)
			}
		}

		if len(unitMoves) > movesPerUnit {
			sort.Slice(unitMoves, func(i, j int) bool {
				a := unitMoves[i].(*MoveAction)
				b := unitMoves[j].(*MoveAction)
				return destinationScore(state, unit, a.TargetPos()) >
					destinationScore(state, unit, b.TargetPos())
			})
			unitMoves = unitMoves[:movesPerUnit]
		}
		moves = append(moves, unitMoves...)
	}

	return append(direct, moves...)
}

// destinationScore évalue rapidement l'intérêt d'une case de destination :
// prise de la zone centrale, et distance de combat adaptée au profil de
// l'unité (les tireurs cherchent la limite de leur portée, les combattants
// de mêlée cherchent le contact).
func destinationScore(state GameState, unit *PlayerUnit, pos Position) float64 {
	score := 0.0

	if InObjectiveZone(pos) {
		score += 3.0
	} else {
		score -= objectiveDistance(pos) * 0.4
	}

	nearest := nearestEnemyDistanceFrom(state, unit, pos)
	if nearest < math.MaxFloat64 {
		if unit.Stats.Range > 1 {
			// Kiting : à portée de tir, hors de portée de riposte si possible.
			score -= math.Abs(nearest-float64(unit.Stats.Range)) * 0.6
		} else {
			score -= nearest * 0.6
		}
	}

	return score
}

func objectiveDistance(pos Position) float64 {
	best := math.MaxFloat64
	for _, zone := range ObjectiveZone {
		if d := distance(pos, zone); d < best {
			best = d
		}
	}
	return best
}

func nearestEnemyDistanceFrom(state GameState, unit *PlayerUnit, from Position) float64 {
	best := math.MaxFloat64
	for _, other := range state.Units {
		if other.OwnerID == unit.OwnerID {
			continue
		}
		if d := distance(from, state.Positions[other.ID]); d < best {
			best = d
		}
	}
	return best
}
