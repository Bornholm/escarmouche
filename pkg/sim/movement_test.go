package sim

import (
	"testing"

	"github.com/bornholm/escarmouche/pkg/core"
)

func TestMovementWithObstacles(t *testing.T) {
	// Create a test unit with move range 2
	unit := &PlayerUnit{
		ID:      1,
		OwnerID: PlayerOne,
		Unit: Unit{
			Stats: core.Stats{
				Health: 3,
				Reach:  1,
				Move:   2,
				Attack: 1,
			},
		},
	}

	// Create an obstacle unit
	obstacle := &PlayerUnit{
		ID:      2,
		OwnerID: PlayerTwo,
		Unit: Unit{
			Stats: core.Stats{
				Health: 1,
				Reach:  1,
				Move:   1,
				Attack: 1,
			},
		},
	}

	// Test case 1: Movement without obstacles
	t.Run("Movement without obstacles", func(t *testing.T) {
		state := GameState{
			counters:        map[UnitID]map[string]int{},
			Positions:       map[UnitID]Position{1: {X: 4, Y: 4}},
			Board:           map[string]UnitID{"4,4": 1},
			Units:           map[UnitID]*PlayerUnit{1: unit},
			CurrentPlayerID: PlayerOne,
			ActionsLeft:     2,
		}

		moves := getPossibleMoves(state, unit)

		// Should be able to move to many positions within range 2
		if len(moves) == 0 {
			t.Error("Expected some possible moves without obstacles, but got none")
		}

		// Check that we can move diagonally
		foundDiagonal := false
		for _, move := range moves {
			moveAction := move.(*MoveAction)
			if moveAction.targetPos.X == 5 && moveAction.targetPos.Y == 5 {
				foundDiagonal = true
				break
			}
		}
		if !foundDiagonal {
			t.Error("Expected to find diagonal movement to (5,5), but didn't")
		}
	})

	// Test case 2: Movement blocked by obstacle
	t.Run("Movement blocked by obstacle", func(t *testing.T) {
		state := GameState{
			counters:        map[UnitID]map[string]int{},
			Positions:       map[UnitID]Position{1: {X: 2, Y: 2}, 2: {X: 3, Y: 2}},
			Board:           map[string]UnitID{"2,2": 1, "3,2": 2},
			Units:           map[UnitID]*PlayerUnit{1: unit, 2: obstacle},
			CurrentPlayerID: PlayerOne,
			ActionsLeft:     2,
		}

		moves := getPossibleMoves(state, unit)

		// Should not be able to move to position (4,2) because it's blocked by obstacle at (3,2)
		foundBlocked := false
		for _, move := range moves {
			moveAction := move.(*MoveAction)
			if moveAction.targetPos.X == 4 && moveAction.targetPos.Y == 2 {
				foundBlocked = true
				break
			}
		}
		if foundBlocked {
			t.Error("Expected position (4,2) to be blocked by obstacle, but found it in possible moves")
		}

		// Should still be able to move to positions not blocked by the obstacle
		foundUnblocked := false
		for _, move := range moves {
			moveAction := move.(*MoveAction)
			if moveAction.targetPos.X == 2 && moveAction.targetPos.Y == 1 {
				foundUnblocked = true
				break
			}
		}
		if !foundUnblocked {
			t.Error("Expected to find unblocked movement to (2,1), but didn't")
		}
	})

	// Test case 3: Diagonal movement around obstacle
	t.Run("Diagonal movement around obstacle", func(t *testing.T) {
		state := GameState{
			counters:        map[UnitID]map[string]int{},
			Positions:       map[UnitID]Position{1: {X: 1, Y: 1}, 2: {X: 2, Y: 1}},
			Board:           map[string]UnitID{"1,1": 1, "2,1": 2},
			Units:           map[UnitID]*PlayerUnit{1: unit, 2: obstacle},
			CurrentPlayerID: PlayerOne,
			ActionsLeft:     2,
		}

		moves := getPossibleMoves(state, unit)

		// Should be able to move diagonally to (2,2) even though (2,1) is blocked
		foundDiagonal := false
		for _, move := range moves {
			moveAction := move.(*MoveAction)
			if moveAction.targetPos.X == 2 && moveAction.targetPos.Y == 2 {
				foundDiagonal = true
				break
			}
		}
		if !foundDiagonal {
			t.Error("Expected to find diagonal movement to (2,2) around obstacle, but didn't")
		}
	})
}

func TestGetReachablePositions(t *testing.T) {
	// Test the pathfinding function directly
	state := GameState{
		Board: map[string]UnitID{
			"2,1": 1, // obstacle
		},
	}

	startPos := Position{X: 1, Y: 1}
	reachable := getReachablePositions(state, startPos, 2)

	// Should find multiple reachable positions
	if len(reachable) == 0 {
		t.Error("Expected some reachable positions, but got none")
	}

	// Should not include the obstacle position
	for _, pos := range reachable {
		if pos.X == 2 && pos.Y == 1 {
			t.Error("Expected obstacle position (2,1) to not be reachable, but found it")
		}
	}

	// Should include diagonal positions
	foundDiagonal := false
	for _, pos := range reachable {
		if pos.X == 2 && pos.Y == 2 {
			foundDiagonal = true
			break
		}
	}
	if !foundDiagonal {
		t.Error("Expected diagonal position (2,2) to be reachable, but didn't find it")
	}
}

func TestCanMoveTo(t *testing.T) {
	state := GameState{
		Board: map[string]UnitID{
			"2,2": 1, // obstacle
		},
	}

	// Test clear path
	if !canMoveTo(state, Position{X: 1, Y: 1}, Position{X: 3, Y: 1}) {
		t.Error("Expected clear path from (1,1) to (3,1), but got blocked")
	}

	// Test blocked path
	if canMoveTo(state, Position{X: 1, Y: 1}, Position{X: 3, Y: 3}) {
		t.Error("Expected blocked path from (1,1) to (3,3) due to obstacle at (2,2), but got clear")
	}

	// Test out of bounds
	if canMoveTo(state, Position{X: 1, Y: 1}, Position{X: -1, Y: 1}) {
		t.Error("Expected out of bounds position (-1,1) to be unreachable, but got reachable")
	}

	// Test occupied destination
	if canMoveTo(state, Position{X: 1, Y: 1}, Position{X: 2, Y: 2}) {
		t.Error("Expected occupied position (2,2) to be unreachable, but got reachable")
	}
}
