package gen

import (
	"testing"

	"github.com/bornholm/escarmouche/pkg/core"
	"github.com/davecgh/go-spew/spew"
	"github.com/pkg/errors"
)

func TestRandomSquad(t *testing.T) {
	squad, err := RandomSquad(DefaultSquadBudget, DefaultMaxSquadSize, core.DefaultCosts)
	if err != nil {
		t.Fatalf("%+v", errors.WithStack(err))
	}

	totalCost := 0.0
	for _, u := range squad {
		totalCost += u.TotalCost
	}

	if totalCost > DefaultSquadBudget {
		t.Errorf("squad cost: expected <= %.1f, got %.1f", float64(DefaultSquadBudget), totalCost)
	}

	if len(squad) > DefaultMaxSquadSize {
		t.Errorf("squad size: expected <= %d, got %d", DefaultMaxSquadSize, len(squad))
	}

	t.Logf("Generated squad:\n- Total cost: %v\n- Units:\n%s", totalCost, spew.Sdump(squad))
}
