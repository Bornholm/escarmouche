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

type GeneratedUnit struct {
	Stats     core.Stats
	TotalCost float64
	Rank      core.Rank
	Archetype Archetype
}

func RandomUnit(targetRank core.Rank, archetype Archetype, costs core.Costs) (*GeneratedUnit, error) {
	capacities := []core.Capacity{}

	var stats core.Stats

	hasMinimalHealth := false
	hasMinimalMove := false
	hasMinimalAttack := false
	hasMinimalReach := false

	var (
		evaluation *core.Evaluation
		err        error
	)

	for {
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

		hasMinimal := hasMinimalHealth && hasMinimalReach && hasMinimalMove && hasMinimalAttack

		if hasMinimal {
			evaluation, err = core.Evaluate(stats, capacities, costs)
			if err != nil {
				return nil, errors.WithStack(err)
			}

			if evaluation.Cost > costs.MaxTotal || evaluation.Rank > targetRank {
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

			if evaluation.Rank == targetRank {
				break
			}
		}
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
