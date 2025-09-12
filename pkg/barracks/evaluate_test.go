package barracks

import (
	"testing"

	"github.com/pkg/errors"
)

func TestEvaluate(t *testing.T) {

	u := &Unit{
		Health:     3,
		Reach:      1,
		Move:       2,
		Attack:     1,
		Capacities: []Capacity{},
	}

	t.Logf("Cost: %v", u.Cost())

	evaluation, err := Evaluate(u)
	if err != nil {
		t.Fatalf("%+v", errors.WithStack(err))
	}

	t.Logf("Rank: %s", evaluation.Rank)
}
