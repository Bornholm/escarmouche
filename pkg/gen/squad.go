package gen

import (
	"math/rand"

	"github.com/bornholm/escarmouche/pkg/core"
	"github.com/pkg/errors"
)

const (
	DefaultMaxSquadSize = 6
	// DefaultSquadBudget est le budget d'escouade en points de coût directs.
	// C'est l'unique monnaie du jeu : le rang n'est plus qu'un titre narratif.
	DefaultSquadBudget = 100.0
	// MinUnitCost est le coût du socle 1/1/1/1 avec les coûts par défaut —
	// en dessous, inutile d'essayer de générer une unité.
	MinUnitCost = 6.0
)

// RandomSquad compose une escouade dont le coût cumulé tient dans budget,
// avec au plus maxSquadSize unités. Les cibles de coût individuelles sont
// tirées au hasard pour produire des compositions variées : quelques grosses
// unités, une nuée de petites, ou un mélange.
func RandomSquad(budget float64, maxSquadSize int, costs core.Costs, archetypes ...Archetype) ([]*GeneratedUnit, error) {
	if len(archetypes) == 0 {
		archetypes = DefaultArchetypes
	}

	var squad []*GeneratedUnit
	remaining := budget

	for len(squad) < maxSquadSize && remaining >= MinUnitCost {
		// Cible de coût aléatoire dans [MinUnitCost, min(remaining, MaxTotal)] :
		// c'est ce tirage qui fait la variété des compositions.
		ceiling := remaining
		if ceiling > costs.MaxTotal {
			ceiling = costs.MaxTotal
		}
		target := MinUnitCost + rand.Float64()*(ceiling-MinUnitCost)

		archetype := archetypes[rand.Intn(len(archetypes))]

		unit, err := RandomUnit(target, archetype, costs)
		if err != nil {
			return nil, errors.WithStack(err)
		}

		if unit.TotalCost > remaining {
			// La génération a un plancher (le socle 1/1/1/1) qui peut dépasser
			// le reliquat : l'escouade est complète.
			break
		}

		squad = append(squad, unit)
		remaining -= unit.TotalCost
	}

	if len(squad) == 0 {
		return nil, errors.Errorf("budget %.1f trop faible pour générer une escouade", budget)
	}

	return squad, nil
}
