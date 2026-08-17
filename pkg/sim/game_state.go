package sim

import (
	"fmt"
	"io"
	"maps"
	"os"
)

type PlayerID int

const (
	PlayerOne PlayerID = iota
	PlayerTwo
)

type UnitID int

type Position struct {
	X, Y int
}

func (p Position) String() string {
	return fmt.Sprintf("%d,%d", p.X, p.Y)
}

type UnitStats struct {
	Health int
	Range  int
	Power  int
	Move   int
}

type PlayerUnit struct {
	Unit

	ID      UnitID
	OwnerID PlayerID
}

const (
	CounterRoundAttacks   string = "round-attacks"
	CounterHealth         string = "health"
	CounterRoundAbilities string = "round-abilities"
	// CounterRoundActions compte les actions effectuées par l'unité pendant
	// le tour courant — c'est ce qui permet à la Suppression de limiter
	// l'unité à une seule action, conformément au texte de la carte.
	CounterRoundActions    string = "round-actions"
	CounterDefensiveStance string = "defensive-stance"
	CounterSuppressed      string = "suppressed"
	CounterUntargetable    string = "untargetable"
	// La Surcharge se joue en deux temps : « pending » est posé au moment du
	// cast (aucun effet ce tour-ci), puis converti en « lock » au début du
	// prochain tour du propriétaire, où il interdit l'attaque normale.
	// L'ancien compteur unique, décrémenté à chaque tour global, expirait
	// AVANT le tour du propriétaire : le malus promis par la carte
	// n'existait tout simplement pas.
	CounterOverchargePending string = "overcharge-pending"
	CounterOverchargeLock    string = "overcharge-lock"
	CounterGuardianOf        string = "guardian-of"
)

const BoardSize = 8

// ObjectiveZone est la zone de capture centrale 2×2. La contrôler de façon
// exclusive à la fin de son tour rapporte 1 point ; le premier joueur à
// ControlPointsToWin l'emporte.
var ObjectiveZone = []Position{{X: 3, Y: 3}, {X: 4, Y: 3}, {X: 3, Y: 4}, {X: 4, Y: 4}}

const ControlPointsToWin = 3

// CaptureRules paramètre la condition de victoire par capture. Les variantes
// vivent dans le GameState : endTurn et terminalState étant partagés entre la
// boucle de jeu et la recherche alpha-beta, l'IA joue automatiquement la
// règle en vigueur — indispensable pour comparer des variantes sans biais.
type CaptureRules struct {
	// PointsToWin : marqueurs de contrôle nécessaires pour l'emporter.
	// 0 vaut ControlPointsToWin (protège les états construits à la main).
	PointsToWin int
	// HoldOffRounds : nombre de tours qu'un joueur doit avoir joués avant que
	// son contrôle de la zone ne commence à marquer. 0 = dès le premier tour.
	HoldOffRounds int
	// ContestSteals : marquer un point en fait aussi perdre un à l'adversaire
	// (plancher à zéro) — la capture devient disputable au lieu de cumulative.
	ContestSteals bool
}

var DefaultCaptureRules = CaptureRules{PointsToWin: ControlPointsToWin}

// pointsToWin renvoie le seuil de victoire effectif, en traitant la valeur
// zéro comme « règle par défaut » plutôt que « victoire immédiate ».
func (s GameState) pointsToWin() int {
	if s.Rules.PointsToWin <= 0 {
		return ControlPointsToWin
	}
	return s.Rules.PointsToWin
}

// InObjectiveZone indique si une position est dans la zone de capture.
func InObjectiveZone(pos Position) bool {
	return pos.X >= 3 && pos.X <= 4 && pos.Y >= 3 && pos.Y <= 4
}

// IsValidObstaclePosition valide l'emplacement d'un obstacle : hors de la
// zone centrale et hors des zones de déploiement (deux premières rangées de
// chaque côté).
func IsValidObstaclePosition(pos Position) bool {
	if pos.X < 0 || pos.X >= BoardSize || pos.Y < 0 || pos.Y >= BoardSize {
		return false
	}
	if InObjectiveZone(pos) {
		return false
	}
	if pos.Y <= 1 || pos.Y >= BoardSize-2 {
		return false
	}
	return true
}

type GameState struct {
	counters  map[UnitID]map[string]int
	Positions map[UnitID]Position
	Board     map[string]UnitID
	Units     map[UnitID]*PlayerUnit
	// Obstacles : cases infranchissables qui bloquent aussi la ligne de vue.
	// Un par joueur, posé pendant la mise en place.
	Obstacles map[string]bool
	// ControlPoints : tours de contrôle exclusif de la zone centrale
	// accumulés par joueur.
	ControlPoints map[PlayerID]int
	// TurnsPlayed : tours achevés par joueur — support de HoldOffRounds.
	TurnsPlayed     map[PlayerID]int
	Rules           CaptureRules
	CurrentPlayerID PlayerID
	ActionsLeft     int
}

func (s GameState) Get(unitID UnitID, name string, defaultValue int) int {
	unitCounters, exists := s.counters[unitID]
	if !exists {
		return defaultValue
	}

	counter, exists := unitCounters[name]
	if !exists {
		return defaultValue
	}

	return counter
}

func (s GameState) Inc(unitID UnitID, name string, value int) int {
	unitCounters, exists := s.counters[unitID]
	if !exists {
		unitCounters = map[string]int{}
	}

	counter, exists := unitCounters[name]
	if !exists {
		counter = 0
	}

	unitCounters[name] = counter + value
	s.counters[unitID] = unitCounters

	return unitCounters[name]
}

func (s GameState) Set(unitID UnitID, name string, value int) int {
	unitCounters, exists := s.counters[unitID]
	if !exists {
		unitCounters = map[string]int{}
	}

	unitCounters[name] = value
	s.counters[unitID] = unitCounters

	return value
}

func (s GameState) Del(unitID UnitID, name string) {
	unitCounters, exists := s.counters[unitID]
	if !exists {
		unitCounters = map[string]int{}
	}

	delete(unitCounters, name)
	s.counters[unitID] = unitCounters
}

func (s GameState) DelAll(name string) {
	for unitID := range s.counters {
		s.Del(unitID, name)
	}
}

func (s GameState) Copy() GameState {
	copy := GameState{
		counters:        map[UnitID]map[string]int{},
		Positions:       map[UnitID]Position{},
		Board:           map[string]UnitID{},
		Units:           map[UnitID]*PlayerUnit{},
		Obstacles:       map[string]bool{},
		ControlPoints:   map[PlayerID]int{},
		TurnsPlayed:     map[PlayerID]int{},
		Rules:           s.Rules,
		CurrentPlayerID: s.CurrentPlayerID,
		ActionsLeft:     s.ActionsLeft,
	}

	maps.Copy(copy.Units, s.Units)
	maps.Copy(copy.Board, s.Board)
	maps.Copy(copy.Positions, s.Positions)
	maps.Copy(copy.Obstacles, s.Obstacles)
	maps.Copy(copy.ControlPoints, s.ControlPoints)
	maps.Copy(copy.TurnsPlayed, s.TurnsPlayed)

	// Deep copy the counters map
	for unitID, unitCounters := range s.counters {
		copy.counters[unitID] = make(map[string]int)
		maps.Copy(copy.counters[unitID], unitCounters)
	}

	return copy
}

// Kill retire une unité du plateau. Mute l'état reçu : la convention du
// paquet est que les Apply et leurs auxiliaires mutent, et que l'appelant
// copie s'il veut préserver l'original.
func (s GameState) Kill(unitID UnitID) GameState {
	s.Del(unitID, CounterHealth)
	delete(s.Board, s.Positions[unitID].String())
	delete(s.Positions, unitID)
	delete(s.Units, unitID)
	return s
}

func (s GameState) PrintConsole() {
	s.Print(os.Stdout)
}

func (s GameState) Print(w io.Writer) {
	fmt.Fprintln(w, "┌────┬────┬────┬────┬────┬────┬────┬────┐")

	for row := 0; row < 8; row++ {
		fmt.Fprint(w, "|")

		for col := 0; col < 8; col++ {
			pos := Position{X: col, Y: row}
			if unitID, exists := s.Board[pos.String()]; exists {
				fmt.Fprintf(w, "%3d │", unitID)
			} else {
				fmt.Fprint(w, "    │")
			}
		}

		if row == 7 {
			fmt.Fprintln(w, "\n└────┴────┴────┴────┴────┴────┴────┴────┘")
		} else {
			fmt.Fprintln(w, "\n├────┼────┼────┼────┼────┼────┼────┼────┤")
		}
	}
}

// canMoveTo checks if a unit can move from one position to another considering obstacles
func canMoveTo(state GameState, from Position, to Position) bool {
	// Check if destination is within bounds
	if to.X < 0 || to.X >= 8 || to.Y < 0 || to.Y >= 8 {
		return false
	}

	// Check if destination is occupied
	if _, exists := state.Board[to.String()]; exists {
		return false
	}

	// Obstacles are impassable
	if state.Obstacles[to.String()] {
		return false
	}

	// Check if there's a clear path (no obstacles blocking the way)
	return hasLineOfSight(state, from, to)
}

// getReachablePositions uses BFS to find all positions reachable within the movement range
func getReachablePositions(state GameState, startPos Position, moveRange int) []Position {
	if moveRange <= 0 {
		return []Position{}
	}

	reachable := make([]Position, 0)
	visited := make(map[string]bool)
	queue := []struct {
		pos   Position
		steps int
	}{{startPos, 0}}

	visited[startPos.String()] = true

	// All possible movement directions (including diagonals)
	directions := []struct{ dx, dy int }{
		{-1, -1}, {-1, 0}, {-1, 1},
		{0, -1}, {0, 1},
		{1, -1}, {1, 0}, {1, 1},
	}

	for len(queue) > 0 {
		current := queue[0]
		queue = queue[1:]

		// If we've used all movement points, skip
		if current.steps >= moveRange {
			continue
		}

		// Try all 8 directions
		for _, dir := range directions {
			nextPos := Position{
				X: current.pos.X + dir.dx,
				Y: current.pos.Y + dir.dy,
			}

			// Skip if already visited
			if visited[nextPos.String()] {
				continue
			}

			// Check if we can move to this position
			if !canMoveTo(state, current.pos, nextPos) {
				continue
			}

			// Calculate movement cost (diagonal moves cost more)
			moveCost := 1
			if dir.dx != 0 && dir.dy != 0 {
				// Diagonal movement costs 1.4 (approximation of sqrt(2))
				// We'll use integer math: diagonal = 1.4 ≈ 7/5, so we multiply by 5 and compare with 7*moveRange
				totalCost := current.steps*5 + 7
				if totalCost > moveRange*5 {
					continue
				}
				moveCost = 1 // For simplicity, we'll treat diagonal as 1 step but check the approximation above
			}

			newSteps := current.steps + moveCost
			if newSteps > moveRange {
				continue
			}

			visited[nextPos.String()] = true
			queue = append(queue, struct {
				pos   Position
				steps int
			}{nextPos, newSteps})

			// Add to reachable positions (excluding start position)
			if nextPos != startPos {
				reachable = append(reachable, nextPos)
			}
		}
	}

	return reachable
}

func getPossibleMoves(state GameState, unit *PlayerUnit) []Action {
	moves := make([]Action, 0)

	startPos := state.Positions[unit.ID]
	reachablePositions := getReachablePositions(state, startPos, unit.Stats.Move)

	for _, targetPos := range reachablePositions {
		moveAction := NewMoveAction(unit.ID, targetPos)
		moves = append(moves, moveAction)
	}

	return moves
}

func getPossiblePowers(state GameState, unit *PlayerUnit) []Action {
	reachable := getReachableOpponentUnits(state, unit.OwnerID, state.Positions[unit.ID], unit.Stats.Range)

	attacks := make([]Action, 0, len(reachable))
	for _, r := range reachable {
		attacks = append(attacks, NewAttackAction(unit.ID, r))
	}

	return attacks
}

// hasLineOfSight checks if there's a clear line of sight between two positions
// Returns true if no units block the path between from and to positions
func hasLineOfSight(state GameState, from Position, to Position) bool {
	// Use Bresenham's line algorithm to get all positions along the line
	positions := getLinePositions(from, to)

	// Check each position along the line (excluding start and end positions)
	for i := 1; i < len(positions)-1; i++ {
		pos := positions[i]
		// If there's a unit at this position, line of sight is blocked
		if _, exists := state.Board[pos.String()]; exists {
			return false
		}
		// Obstacles grant full cover
		if state.Obstacles[pos.String()] {
			return false
		}
	}

	return true
}

// getLinePositions returns all positions along a line from start to end using Bresenham's algorithm
func getLinePositions(from Position, to Position) []Position {
	positions := make([]Position, 0)

	x0, y0 := from.X, from.Y
	x1, y1 := to.X, to.Y

	dx := abs(x1 - x0)
	dy := abs(y1 - y0)

	var sx, sy int
	if x0 < x1 {
		sx = 1
	} else {
		sx = -1
	}
	if y0 < y1 {
		sy = 1
	} else {
		sy = -1
	}

	err := dx - dy
	x, y := x0, y0

	for {
		positions = append(positions, Position{X: x, Y: y})

		if x == x1 && y == y1 {
			break
		}

		e2 := 2 * err
		if e2 > -dy {
			err -= dy
			x += sx
		}
		if e2 < dx {
			err += dx
			y += sy
		}
	}

	return positions
}

func getReachableOpponentUnits(state GameState, playerID PlayerID, from Position, reach int) []UnitID {
	reachable := make([]UnitID, 0)

	for dx := -reach; dx <= reach; dx++ {
		for dy := -reach; dy <= reach; dy++ {
			if dx == 0 && dy == 0 {
				continue
			}

			targetPos := Position{
				X: from.X + dx,
				Y: from.Y + dy,
			}

			if targetPos.X < 0 || targetPos.X >= 8 || targetPos.Y < 0 || targetPos.Y >= 8 {
				continue
			}

			targetUnitID, exists := state.Board[targetPos.String()]
			if !exists || state.Units[targetUnitID].OwnerID == playerID {
				continue
			}

			if state.Get(targetUnitID, CounterUntargetable, 0) > 0 {
				continue
			}

			dist := distance(from, targetPos)
			if int(dist) > reach {
				continue
			}

			// Check line of sight - only add target if there's a clear path
			if !hasLineOfSight(state, from, targetPos) {
				continue
			}

			reachable = append(reachable, targetUnitID)
		}
	}

	return reachable
}

// getOpponentsInRange returns all opponent units within reach ignoring line of sight.
func getOpponentsInRange(state GameState, playerID PlayerID, from Position, reach int) []UnitID {
	reachable := make([]UnitID, 0)

	for uid, unit := range state.Units {
		if unit.OwnerID == playerID {
			continue
		}
		targetPos := state.Positions[uid]
		dist := distance(from, targetPos)
		if int(dist) <= reach {
			reachable = append(reachable, uid)
		}
	}

	return reachable
}

func getValidActions(state GameState, unit *PlayerUnit) []Action {
	// Suppression : « ne peut effectuer qu'une seule action à son prochain
	// tour » (texte de la carte). L'unité garde donc UNE action, pas zéro.
	if state.Get(unit.ID, CounterSuppressed, 0) > 0 &&
		state.Get(unit.ID, CounterRoundActions, 0) >= 1 {
		return nil
	}

	actions := make([]Action, 0)

	moves := getPossibleMoves(state, unit)
	actions = append(actions, moves...)

	roundPowers := state.Get(unit.ID, CounterRoundAttacks, 0)
	if roundPowers == 0 && state.Get(unit.ID, CounterOverchargeLock, 0) == 0 {
		attacks := getPossiblePowers(state, unit)
		actions = append(actions, attacks...)
	}

	roundAbilities := state.Get(unit.ID, CounterRoundAbilities, 0)
	if roundAbilities == 0 {
		abilities := getPossibleAbilities(state, unit)
		actions = append(actions, abilities...)
	}

	return actions
}

// Helper function to calculate absolute value
func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

// distance mesure en distance de Chebyshev : sur un plateau où la diagonale
// compte pour un pas (mouvement 8 directions, portée en carré), c'est la
// seule métrique cohérente. L'ancienne distance euclidienne faisait par
// exemple échouer une Feinte sur un allié en diagonale (2,2).
func distance(pos1, pos2 Position) float64 {
	return float64(max(abs(pos1.X-pos2.X), abs(pos1.Y-pos2.Y)))
}

// applyDamage applies damage to a unit, respecting defensive stance and guardian redirection.
// applyDamage inflige des dégâts en respectant Gardien (redirection) et
// Posture Défensive (« le prochain point de dégât est annulé », consommée).
// Mute l'état reçu — cf. la convention décrite sur Kill.
func applyDamage(state GameState, targetID UnitID, damage int) (GameState, int) {
	// Redirection par un Gardien allié
	if targetUnit, exists := state.Units[targetID]; exists {
		for uid := range state.Units {
			if state.Units[uid].OwnerID == targetUnit.OwnerID && uid != targetID {
				if UnitID(state.Get(uid, CounterGuardianOf, -1)) == targetID {
					state.Del(uid, CounterGuardianOf)
					return applyDamage(state, uid, damage)
				}
			}
		}
	}

	if state.Get(targetID, CounterDefensiveStance, 0) > 0 && damage > 0 {
		damage--
		state.Del(targetID, CounterDefensiveStance)
	}

	remainingHealth := state.Inc(targetID, CounterHealth, -damage)

	if remainingHealth <= 0 {
		state = state.Kill(targetID)
	}

	return state, remainingHealth
}

// GetHealthWinner determines winner based on total remaining health
func GetHealthWinner(s GameState) PlayerID {
	healthTotals := map[PlayerID]int{}

	for _, unit := range s.Units {
		health := s.Get(unit.ID, CounterHealth, unit.Stats.Health)
		healthTotals[unit.OwnerID] += health
	}

	var winner PlayerID
	maxHealth := -1
	for playerID, health := range healthTotals {
		if health > maxHealth {
			maxHealth = health
			winner = playerID
		}
	}

	return winner
}
