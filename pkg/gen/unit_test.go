package gen

import (
	"fmt"
	"testing"

	"github.com/bornholm/escarmouche/pkg/core"
	"github.com/davecgh/go-spew/spew"
	"github.com/pkg/errors"
)

func TestRandomUnit(t *testing.T) {
	for _, r := range core.Ranks {
		for _, a := range DefaultArchetypes {
			t.Run(fmt.Sprintf("%s_%s", r.String(), a.Name), func(t *testing.T) {
				unit, err := RandomUnit(r, a, core.DefaultCosts)
				if err != nil {
					t.Fatalf("%+v", errors.WithStack(err))
				}

				t.Logf("Generated unit:\n%s", spew.Sdump(unit))

				if e, g := r, unit.Rank; e != g {
					t.Errorf("unit.Rank: expected '%v', got '%v'", e, g)
				}

				if e, g := a.Name, unit.Archetype.Name; e != g {
					t.Errorf("unit.Archetype: expected '%v', got '%v'", e, g)
				}
			})
		}
	}
}
