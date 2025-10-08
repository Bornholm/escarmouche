package gen

import (
	"math/rand"
	"slices"

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
	Abilities []core.Ability
	TotalCost float64
	Rank      core.Rank
	Archetype Archetype
}

func RandomUnit(targetRank core.Rank, archetype Archetype, costs core.Costs) (*GeneratedUnit, error) {
	availableAbilities := append([]core.Ability{}, archetype.Abilities...)

	abilities := []core.Ability{}

	var stats core.Stats

	hasMinimalHealth := false
	hasMinimalMove := false
	hasMinimalAttack := false
	hasMinimalReach := false

	var (
		evaluation *core.Evaluation
		err        error
	)

	maxRounds := int(costs.MaxTotal)
	round := 0
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

		abilityAdded := false

		if hasMinimal && len(availableAbilities) > 0 && len(abilities) < 2 {
			newAbility := rand.Intn(100) < archetype.WeightAbility
			if newAbility {
				index := rand.Intn(len(availableAbilities))
				abilities = append(abilities, availableAbilities[index])
				availableAbilities = slices.Delete(availableAbilities, index, index+1)
				abilityAdded = true
			}
		}

		if hasMinimal {
			evaluation, err = core.Evaluate(stats, abilities, costs)
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

				if abilityAdded {
					availableAbilities = append(availableAbilities, abilities[len(abilities)-1])
					abilities = abilities[:len(abilities)-1]
				}
			}

			if evaluation.Rank == targetRank {
				break
			}
		}

		round++
		if round > maxRounds {
			break
		}
	}

	return &GeneratedUnit{
		Stats:     stats,
		Abilities: abilities,
		TotalCost: evaluation.Cost,
		Rank:      evaluation.Rank,
		Archetype: archetype,
	}, nil
}

func chooseWeightedStat(archetype Archetype) int {
	totalWeight := archetype.WeightHealth + archetype.WeightReach + archetype.WeightMove + archetype.WeightAttack

	r := rand.Intn(totalWeight)

	if r < archetype.WeightHealth {
		return 0 // Health
	}
	r -= archetype.WeightHealth
	if r < archetype.WeightReach {
		return 1 // Reach
	}
	r -= archetype.WeightReach

	if r < archetype.WeightMove {
		return 2 // Movement
	}

	return 3 // Attack
}
