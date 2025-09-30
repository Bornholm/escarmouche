package sim

import (
	"context"
	"slices"
	"testing"
	"time"

	"github.com/bornholm/escarmouche/pkg/core"
	"github.com/bornholm/escarmouche/pkg/gen"
	"github.com/davecgh/go-spew/spew"
	"github.com/pkg/errors"
)

func TestSimulation(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	playerOne, err := gen.RandomSquad(30, gen.DefaultMaxSquadSize, gen.DefaultArchetypes, gen.DefaultRankPointCosts, core.DefaultCosts)
	if err != nil {
		t.Logf("%+v", errors.WithStack(err))
	}

	t.Logf("Player One Squad: %s", spew.Sdump(playerOne))

	playerTwo, err := gen.RandomSquad(30, gen.DefaultMaxSquadSize, gen.DefaultArchetypes, gen.DefaultRankPointCosts, core.DefaultCosts)
	if err != nil {
		t.Logf("%+v", errors.WithStack(err))
	}

	t.Logf("Player Two Squad: %s", spew.Sdump(playerTwo))

	playerOneUnits := slices.Collect(func(yield func(Unit) bool) {
		for _, u := range playerOne {
			if !yield(Unit{
				Stats:     u.Stats,
				Abilities: u.Abilities,
			}) {
				return
			}
		}
	})

	playerTwoUnits := slices.Collect(func(yield func(Unit) bool) {
		for _, u := range playerTwo {
			if !yield(Unit{
				Stats:     u.Stats,
				Abilities: u.Abilities,
			}) {
				return
			}
		}
	})

	sim := NewSimulation(playerOneUnits, playerTwoUnits)

	for {
		select {
		case <-ctx.Done():
			t.Fatalf("%+v", errors.WithStack(ctx.Err()))
		default:
			actions, isGameOver, winner := sim.Next()
			currentPlayer := sim.State().CurrentPlayerID

			sim.State().PrintConsole()

			t.Logf("[TURN] %d", sim.Turn())

			for _, a := range actions {
				t.Logf("[ACTION] P%d: %s", currentPlayer, a)
			}

			if isGameOver {
				t.Logf("[GAME OVER] Winner %d", winner)
				return
			}

			time.Sleep(time.Millisecond)
		}
	}

}
