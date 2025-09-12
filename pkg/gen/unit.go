package gen

import (
	"math/rand"

	"github.com/bornholm/escarmouche/pkg/core"
	"github.com/pkg/errors"
)

var DefaultRankPointCosts = map[core.Rank]int{
	core.RankTrooper:  1,
	core.RankVeteran:  3,
	core.RankElite:    6,
	core.RankChampion: 10,
	core.RankParagon:  15,
}

var DefaultRankCostRanges = map[core.Rank][2]float64{
	core.RankTrooper:  {8, 12},
	core.RankVeteran:  {10, 18},
	core.RankElite:    {16, 23},
	core.RankChampion: {22, 30},
	core.RankParagon:  {28, 40},
}

type GeneratedUnit struct {
	Stats     core.Stats
	TotalCost float64
	Rank      core.Rank
	Archetype Archetype
}

func RandomUnit(targetRank core.Rank, archetype Archetype, rankCostRanges map[core.Rank][2]float64, costs core.Costs) (*GeneratedUnit, error) {
	capacities := []core.Capacity{}

	costRange := rankCostRanges[targetRank]
	targetCost := costRange[0] + rand.Float64()*(costRange[1]-costRange[0])

	var stats core.Stats
	remainingCost := targetCost

	hasMinimalHealth := false
	hasMinimalMove := false
	hasMinimalAttack := false
	hasMinimalReach := false

	for remainingCost > 0 {
		var statToUpgrade int

		switch {
		case !hasMinimalHealth:
			statToUpgrade = 0
			hasMinimalHealth = true
		case !hasMinimalReach:
			statToUpgrade = 1
			hasMinimalReach = true
		case !hasMinimalMove:
			statToUpgrade = 2
			hasMinimalMove = true
		case !hasMinimalAttack:
			statToUpgrade = 3
			hasMinimalAttack = true
		default:
			statToUpgrade = chooseWeightedStat(archetype)
		}

		switch statToUpgrade {
		case 0:
			stats.Health++
		case 1:
			stats.Reach++
		case 2:
			stats.Move++
		case 3:
			stats.Attack++
		}

		remainingCost = targetCost - core.CalculateTotalCost(stats, capacities, costs)
		// Rollback last increase of value
		if remainingCost < 0 {
			switch statToUpgrade {
			case 0:
				stats.Health--
			case 1:
				stats.Reach--
			case 2:
				stats.Move--
			case 3:
				stats.Attack--
			}
		}
	}

	evaluation, err := core.Evaluate(stats, capacities, costs)
	if err != nil {
		return nil, errors.WithStack(err)
	}

	return &GeneratedUnit{
		Stats:     stats,
		TotalCost: evaluation.Cost,
		Rank:      evaluation.Rank,
		Archetype: archetype,
	}, nil
}

func chooseWeightedStat(archetype Archetype) int {
	totalWeight := archetype.WeightHealth + archetype.WeightReach + archetype.WeightMovement + archetype.WeightAttack
	r := rand.Intn(totalWeight)

	if r < archetype.WeightHealth {
		return 0 // Health
	}
	r -= archetype.WeightHealth
	if r < archetype.WeightReach {
		return 1 // Reach
	}
	r -= archetype.WeightReach
	if r < archetype.WeightMovement {
		return 2 // Movement
	}
	return 3 // Attack
}
