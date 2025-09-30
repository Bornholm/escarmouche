package sim

import (
	"fmt"
	"io"
	"maps"
	"math"
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
	Reach  int
	Attack int
	Move   int
}

type PlayerUnit struct {
	Unit

	ID      UnitID
	OwnerID PlayerID
}

const (
	CounterRoundAttacks    string = "round-attacks"
	CounterHealth          string = "health"
	CounterRoundAbilities  string = "round-abilities"
	CounterDefensiveStance string = "defensive-stance"
)

type GameState struct {
	counters        map[UnitID]map[string]int
	Positions       map[UnitID]Position
	Board           map[string]UnitID
	Units           map[UnitID]*PlayerUnit
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
		CurrentPlayerID: s.CurrentPlayerID,
		ActionsLeft:     s.ActionsLeft,
	}

	maps.Copy(copy.Units, s.Units)
	maps.Copy(copy.Board, s.Board)
	maps.Copy(copy.Positions, s.Positions)

	// Deep copy the counters map
	for unitID, unitCounters := range s.counters {
		copy.counters[unitID] = make(map[string]int)
		maps.Copy(copy.counters[unitID], unitCounters)
	}

	return copy
}

func (s GameState) Kill(unitID UnitID) GameState {
	newState := s.Copy()
	newState.Del(unitID, CounterHealth)
	delete(newState.Board, newState.Positions[unitID].String())
	delete(newState.Positions, unitID)
	delete(newState.Units, unitID)
	return newState
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

func getPossibleAttacks(state GameState, unit *PlayerUnit) []Action {
	reachable := getReachableOpponentUnits(state, unit.OwnerID, state.Positions[unit.ID], unit.Stats.Reach)

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

func getValidActions(state GameState, unit *PlayerUnit) []Action {
	actions := make([]Action, 0)

	// Add possible moves
	moves := getPossibleMoves(state, unit)
	actions = append(actions, moves...)

	roundAttacks := state.Get(unit.ID, CounterRoundAttacks, 0)
	if roundAttacks == 0 {
		attacks := getPossibleAttacks(state, unit)
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

// Helper function to calculate Manhattan distance between two positions
func distance(pos1, pos2 Position) float64 {
	return math.Sqrt(
		math.Pow(float64(pos1.X-pos2.X), 2) +
			math.Pow(float64(pos1.Y-pos2.Y), 2),
	)
}

// applyDamage applies damage to a unit, respecting defensive stance
func applyDamage(state GameState, targetID UnitID, damage int) (GameState, int) {
	newState := state.Copy()

	// Check if target has defensive stance active
	defensiveStance := newState.Get(targetID, CounterDefensiveStance, 0)
	if defensiveStance > 0 && damage > 0 {
		// Defensive stance blocks 1 point of damage
		damage = damage - 1
		// Remove defensive stance after use
		newState.Del(targetID, CounterDefensiveStance)
	}

	// Apply remaining damage
	remainingHealth := newState.Inc(targetID, CounterHealth, -damage)

	// Kill unit if health drops to 0 or below
	if remainingHealth <= 0 {
		newState = newState.Kill(targetID)
	}

	return newState, remainingHealth
}
