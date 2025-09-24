package core

import (
	"github.com/bornholm/go-fuzzy"
	"github.com/bornholm/go-fuzzy/dsl"
	"github.com/pkg/errors"

	_ "embed"
)

//go:embed rules.fuzzy
var rules string

var engine *fuzzy.Engine

func init() {
	result, err := dsl.ParseRulesAndVariables(rules)
	if err != nil {
		panic(errors.Wrap(err, "could not parse evaluation rules"))
	}

	engine = fuzzy.NewEngine(fuzzy.Centroid(100))
	engine.Rules(result.Rules...)
	engine.Variables(result.Variables...)
}

type Evaluation struct {
	Cost float64
	Rank Rank
}

func Evaluate(stats Stats, abilities []Ability, costs Costs) (*Evaluation, error) {
	cost := CalculateTotalCost(stats, abilities, costs)

	values := fuzzy.Values{
		"cost":      cost,
		"expertise": float64(len(abilities)),
	}

	results, err := engine.Infer(values)
	if err != nil {
		return nil, errors.Wrap(err, "could not evaluate unit")
	}

	rankResults := results["rank"]

	var bestRank Rank = -1
	var bestResult float64

	for _, r := range Ranks {
		res, exists := rankResults[r.String()]
		if !exists {
			continue
		}

		truthDegree := res.TruthDegree()

		if truthDegree > 0 && truthDegree >= bestResult {
			bestRank = r
			bestResult = truthDegree
		}
	}

	if bestRank == -1 {
		return nil, errors.New("could not find rank for unit")
	}

	return &Evaluation{
		Cost: cost,
		Rank: bestRank,
	}, nil

}
