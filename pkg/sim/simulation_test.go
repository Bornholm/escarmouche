package sim

import (
	"slices"
	"testing"
	"time"

	"github.com/bornholm/escarmouche/pkg/core"
	"github.com/bornholm/escarmouche/pkg/gen"
	"github.com/davecgh/go-spew/spew"
	"github.com/pkg/errors"
)

func TestSimulation(t *testing.T) {
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

	playerOneUnits := slices.Collect(func(yield func(core.Stats) bool) {
		for _, u := range playerOne {
			if !yield(u.Stats) {
				return
			}
		}
	})

	playerTwoUnits := slices.Collect(func(yield func(core.Stats) bool) {
		for _, u := range playerTwo {
			if !yield(u.Stats) {
				return
			}
		}
	})

	sim := NewSimulation(playerOneUnits, playerTwoUnits)

	sim.State().PrintConsole()

	time.Sleep(time.Second)

	for {
		actions, isGameOver, winner := sim.Next()

		sim.State().PrintConsole()

		t.Logf("Turn: %d", sim.Turn())

		for _, a := range actions {
			switch a.Type {
			case ActionMove:
				t.Logf("Unit %d moved to %s", a.UnitID, a.TargetPos.String())
			case ActionAttack:
				t.Logf("Unit %d attacked unit %d", a.UnitID, a.TargetID)
			}
		}

		if isGameOver {
			t.Logf("Game Over: winner %d", winner)
			return
		}

		time.Sleep(time.Second)
	}

}
