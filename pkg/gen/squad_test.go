package gen

import (
	"testing"

	"github.com/bornholm/escarmouche/pkg/core"
	"github.com/davecgh/go-spew/spew"
	"github.com/pkg/errors"
)

func TestRandomSquad(t *testing.T) {
	squad, err := RandomSquad(30, DefaultMaxSquadSize, DefaultArchetypes, DefaultRankPointCosts, DefaultRankCostRanges, core.DefaultCosts)
	if err != nil {
		t.Fatalf("%+v", errors.WithStack(err))
	}

	rankPoints := 0
	totalCost := 0.0
	for _, u := range squad {
		totalCost += u.TotalCost
		rankPoints += DefaultRankPointCosts[u.Rank]
	}

	t.Logf("Generated squad:\n- Squad RP: %v\n- Total unit cost: %v\n- Units:\n%s", rankPoints, totalCost, spew.Sdump(squad))
}
