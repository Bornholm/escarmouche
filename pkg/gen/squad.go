package gen

import (
	"math/rand"

	"github.com/bornholm/escarmouche/pkg/core"
	"github.com/pkg/errors"
)

const (
	DefaultMaxSquadSize  = 6
	DefaultMaxRankPoints = 30
)

func RandomSquad(maxRankPoints int, maxSquadSize int, archetypes []Archetype, rankPointCosts map[core.Rank]int, rankCostRanges map[core.Rank][2]float64, costs core.Costs) ([]*GeneratedUnit, error) {
	var squad []*GeneratedUnit
	remainingPoints := maxRankPoints

	for len(squad) < maxSquadSize {
		affordableRanks := getAffordableRanks(remainingPoints, rankPointCosts)
		if len(affordableRanks) == 0 {
			break
		}

		chosenRank := affordableRanks[rand.Intn(len(affordableRanks))]

		chosenArchetype := archetypes[rand.Intn(len(archetypes))]

		newUnit, err := RandomUnit(chosenRank, chosenArchetype, rankCostRanges, costs)
		if err != nil {
			return nil, errors.WithStack(err)
		}

		squad = append(squad, newUnit)
		remainingPoints -= rankPointCosts[newUnit.Rank]
	}

	return squad, nil
}

func getAffordableRanks(remainingPoints int, costs map[core.Rank]int) []core.Rank {
	var affordable []core.Rank
	for rank, cost := range costs {
		if cost <= remainingPoints {
			affordable = append(affordable, rank)
		}
	}
	return affordable
}
