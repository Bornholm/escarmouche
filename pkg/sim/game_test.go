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
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	isVerbose := testing.Verbose()

	playerOne, err := gen.RandomSquad(30, gen.DefaultMaxSquadSize, gen.DefaultRankPointCosts, core.DefaultCosts)
	if err != nil {
		t.Logf("%+v", errors.WithStack(err))
	}

	t.Logf("Player One Squad: %s", spew.Sdump(playerOne))

	playerTwo, err := gen.RandomSquad(30, gen.DefaultMaxSquadSize, gen.DefaultRankPointCosts, core.DefaultCosts)
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

	game := NewGame(playerOneUnits, playerTwoUnits)

	for step := range game.Run() {
		select {
		case <-ctx.Done():
			t.Fatalf("%+v", errors.WithStack(ctx.Err()))
		default:
			game.State().PrintConsole()

			t.Logf("[TURN] %d", game.Turn())

			t.Logf("[ACTION] P%d: %s", step.Player, step.Action)

			if step.IsOver {
				t.Logf("[GAME OVER] Winner %d", step.Winner)
				return
			}

			if isVerbose {
				time.Sleep(time.Second)
			}
		}
	}

}
