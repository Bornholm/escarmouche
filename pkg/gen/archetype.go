package gen

import (
	"github.com/bornholm/escarmouche/pkg/core"
	"github.com/pkg/errors"
)

var (
	ArchetypeJackOfAllTrades = Archetype{Name: "jackofalltrades", WeightHealth: 25, WeightRange: 25, WeightMove: 25, WeightPower: 25, Abilities: core.AllAbilities()}
	ArchetypeTank            = Archetype{Name: "tank", WeightHealth: 60, WeightRange: 10, WeightMove: 15, WeightPower: 15, Abilities: core.Abilities("00002-defensive-stance"), WeightAbility: 20}
	ArchetypeSniper          = Archetype{Name: "sniper", WeightHealth: 15, WeightRange: 40, WeightMove: 15, WeightPower: 30}
	ArchetypeSkirmisher      = Archetype{Name: "skirmisher", WeightHealth: 20, WeightRange: 20, WeightMove: 40, WeightPower: 20, Abilities: core.Abilities("00000-charge"), WeightAbility: 20}
	ArchetypeBruiser         = Archetype{Name: "bruiser", WeightHealth: 35, WeightRange: 15, WeightMove: 20, WeightPower: 30}
	ArchetypeGlassCannon     = Archetype{Name: "glasscannon", WeightHealth: 10, WeightRange: 30, WeightMove: 15, WeightPower: 45, Abilities: core.Abilities("00001-energy-trait"), WeightAbility: 20}
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
	WeightRange  int
	WeightMove   int
	WeightPower  int

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
