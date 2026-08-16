package gen

import (
	"fmt"
	"testing"

	"github.com/bornholm/escarmouche/pkg/core"
	"github.com/davecgh/go-spew/spew"
	"github.com/pkg/errors"
)

func TestRandomUnit(t *testing.T) {
	for _, target := range []float64{8, 14, 20, 26, 30} {
		for _, a := range DefaultArchetypes {
			t.Run(fmt.Sprintf("cost%.0f_%s", target, a.Name), func(t *testing.T) {
				unit, err := RandomUnit(target, a, core.DefaultCosts)
				if err != nil {
					t.Fatalf("%+v", errors.WithStack(err))
				}

				t.Logf("Generated unit:\n%s", spew.Sdump(unit))

				if unit.TotalCost > target {
					t.Errorf("unit.TotalCost: expected <= %.1f, got %.1f", target, unit.TotalCost)
				}

				if e, g := a.Name, unit.Archetype.Name; e != g {
					t.Errorf("unit.Archetype: expected '%v', got '%v'", e, g)
				}
			})
		}
	}
}
