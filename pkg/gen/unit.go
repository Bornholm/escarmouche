package gen

import (
	"math/rand"
	"slices"

	"github.com/bornholm/escarmouche/pkg/core"
	"github.com/pkg/errors"
)

type GeneratedUnit struct {
	Stats     core.Stats
	Abilities []core.Ability
	TotalCost float64
	Rank      core.Rank
	Archetype Archetype
}

// RandomUnit génère une unité de l'archétype demandé dont le coût total
// approche targetCost sans jamais le dépasser. Le rang qui en résulte est
// purement narratif (cf. core.RankFromCost).
//
// La construction est incrémentale : on garantit d'abord 1 point dans chaque
// caractéristique, puis on ajoute des crans (pondérés par l'archétype) et
// éventuellement des capacités tant que le budget le permet.
func RandomUnit(targetCost float64, archetype Archetype, costs core.Costs) (*GeneratedUnit, error) {
	if targetCost > costs.MaxTotal {
		targetCost = costs.MaxTotal
	}

	availableAbilities := append([]core.Ability{}, archetype.Abilities...)
	abilities := []core.Ability{}

	// Socle minimal : une unité a toujours au moins 1 partout.
	stats := core.Stats{Health: 1, Range: 1, Move: 1, Power: 1}

	evaluation, err := core.Evaluate(stats, abilities, costs)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	if evaluation.Cost > targetCost {
		// Le budget ne couvre même pas le socle : on rend l'unité minimale.
		return &GeneratedUnit{
			Stats:     stats,
			Abilities: abilities,
			TotalCost: evaluation.Cost,
			Rank:      evaluation.Rank,
			Archetype: archetype,
		}, nil
	}

	maxRounds := int(costs.MaxTotal) * 4
	stuck := 0

	for round := 0; round < maxRounds && stuck < 6; round++ {
		prevStats := stats
		prevAbilities := abilities
		abilityAdded := false

		// Tenter une capacité de l'archétype de temps en temps
		if len(availableAbilities) > 0 && len(abilities) < 2 && rand.Intn(100) < archetype.WeightAbility {
			index := rand.Intn(len(availableAbilities))
			abilities = append(abilities, availableAbilities[index])
			availableAbilities = slices.Delete(availableAbilities, index, index+1)
			abilityAdded = true
		} else {
			switch chooseWeightedStat(archetype) {
			case 0:
				stats.Health++
			case 1:
				stats.Range++
			case 2:
				stats.Move++
			case 3:
				stats.Power++
			}
		}

		candidate, err := core.Evaluate(stats, abilities, costs)
		if err != nil {
			return nil, errors.WithStack(err)
		}

		if candidate.Cost > targetCost {
			// Trop cher : on annule ce cran et on réessaie autre chose.
			stats = prevStats
			if abilityAdded {
				availableAbilities = append(availableAbilities, abilities[len(abilities)-1])
				abilities = prevAbilities
			}
			stuck++
			continue
		}

		evaluation = candidate
		stuck = 0
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
	totalWeight := archetype.WeightHealth + archetype.WeightRange + archetype.WeightMove + archetype.WeightPower

	r := rand.Intn(totalWeight)

	if r < archetype.WeightHealth {
		return 0 // Health
	}
	r -= archetype.WeightHealth
	if r < archetype.WeightRange {
		return 1 // Range
	}
	r -= archetype.WeightRange

	if r < archetype.WeightMove {
		return 2 // Movement
	}

	return 3 // Power
}
