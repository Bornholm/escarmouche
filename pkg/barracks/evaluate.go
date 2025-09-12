package barracks

import (
	"math"

	"github.com/bornholm/go-fuzzy"
	"github.com/bornholm/go-fuzzy/dsl"
	"github.com/davecgh/go-spew/spew"
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

type Rank int

const (
	RankTrooper Rank = iota
	RankVeteran
	RankElite
	RankChampion
	RankParagon
)

var Ranks = []Rank{RankTrooper, RankVeteran, RankElite, RankChampion, RankParagon}

func (r Rank) String() string {
	switch r {
	case RankTrooper:
		return "trooper"
	case RankVeteran:
		return "veteran"
	case RankElite:
		return "elite"
	case RankChampion:
		return "champion"
	case RankParagon:
		return "paragon"
	default:
		panic(errors.Errorf("unknown rank '%d'", r))
	}
}

type Evaluation struct {
	Cost int
	Rank Rank
}

func Evaluate(unit *Unit) (*Evaluation, error) {
	cost := math.Ceil(unit.Cost())

	spew.Dump(unit, cost)

	values := fuzzy.Values{
		"cost":      cost,
		"expertise": float64(len(unit.Capacities)),
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

		spew.Dump(r.String(), truthDegree)

		if truthDegree > 0 && truthDegree >= bestResult {
			bestRank = r
			bestResult = truthDegree
		}
	}

	if bestRank == -1 {
		return nil, errors.New("could not find rank for unit")
	}

	spew.Dump("---")

	return &Evaluation{
		Cost: int(cost),
		Rank: bestRank,
	}, nil

}
