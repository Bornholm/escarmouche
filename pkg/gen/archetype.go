package gen

import (
	"github.com/bornholm/escarmouche/pkg/core"
	"github.com/pkg/errors"
)

var (
	ArchetypeJackOfAllTrades = Archetype{Name: "jackofalltrades", WeightHealth: 25, WeightReach: 25, WeightMove: 25, WeightAttack: 25, Abilities: core.AllAbilities()}
	ArchetypeTank            = Archetype{Name: "tank", WeightHealth: 60, WeightReach: 10, WeightMove: 15, WeightAttack: 15, Abilities: core.Abilities("00002-defensive-stance"), WeightAbility: 20}
	ArchetypeSniper          = Archetype{Name: "sniper", WeightHealth: 15, WeightReach: 40, WeightMove: 15, WeightAttack: 30}
	ArchetypeSkirmisher      = Archetype{Name: "skirmisher", WeightHealth: 20, WeightReach: 20, WeightMove: 40, WeightAttack: 20, Abilities: core.Abilities("00000-charge"), WeightAbility: 20}
	ArchetypeBruiser         = Archetype{Name: "bruiser", WeightHealth: 35, WeightReach: 15, WeightMove: 20, WeightAttack: 30}
	ArchetypeGlassCannon     = Archetype{Name: "glasscannon", WeightHealth: 10, WeightReach: 30, WeightMove: 15, WeightAttack: 45, Abilities: core.Abilities("00001-energy-trait"), WeightAbility: 20}
)

var DefaultArchetypes = []Archetype{
	ArchetypeJackOfAllTrades,
	ArchetypeTank,
	ArchetypeSniper,
	ArchetypeSkirmisher,
	ArchetypeBruiser,
	ArchetypeGlassCannon,
}

type Archetype struct {
	Name string

	WeightHealth int
	WeightReach  int
	WeightMove   int
	WeightAttack int

	WeightAbility int
	Abilities     []core.Ability
}

func ParseArchetype(str string, archetypes ...Archetype) (Archetype, error) {
	if len(archetypes) == 0 {
		archetypes = DefaultArchetypes
	}

	for _, a := range archetypes {
		if a.Name == str {
			return a, nil
		}
	}

	return Archetype{}, errors.Errorf("unknown archetype '%s'", str)
}
