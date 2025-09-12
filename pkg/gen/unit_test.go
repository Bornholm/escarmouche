package gen

import (
	"testing"

	"github.com/bornholm/escarmouche/pkg/core"
	"github.com/davecgh/go-spew/spew"
	"github.com/pkg/errors"
)

func TestRandomUnit(t *testing.T) {
	unit, err := RandomUnit(core.RankChampion, ArchetypeSniper, DefaultRankCostRanges, core.DefaultCosts)
	if err != nil {
		t.Fatalf("%+v", errors.WithStack(err))
	}

	t.Logf("Generated unit:\n%s", spew.Sdump(unit))
}
