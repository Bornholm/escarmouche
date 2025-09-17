package gen

import "github.com/pkg/errors"

var (
	ArchetypeBalanced    = Archetype{Name: "balanced", WeightHealth: 25, WeightReach: 25, WeightMovement: 25, WeightAttack: 25}
	ArchetypeTank        = Archetype{Name: "tank", WeightHealth: 60, WeightReach: 10, WeightMovement: 15, WeightAttack: 15}
	ArchetypeSniper      = Archetype{Name: "sniper", WeightHealth: 15, WeightReach: 40, WeightMovement: 15, WeightAttack: 30}
	ArchetypeSkirmisher  = Archetype{Name: "skirmisher", WeightHealth: 20, WeightReach: 20, WeightMovement: 40, WeightAttack: 20}
	ArchetypeBruiser     = Archetype{Name: "bruiser", WeightHealth: 35, WeightReach: 15, WeightMovement: 20, WeightAttack: 30}
	ArchetypeGlassCannon = Archetype{Name: "glasscannon", WeightHealth: 10, WeightReach: 30, WeightMovement: 15, WeightAttack: 45}
)

var DefaultArchetypes = []Archetype{
	ArchetypeBalanced,
	ArchetypeTank,
	ArchetypeSniper,
	ArchetypeSkirmisher,
	ArchetypeBruiser,
	ArchetypeGlassCannon,
}

type Archetype struct {
	Name           string
	WeightHealth   int
	WeightReach    int
	WeightMovement int
	WeightAttack   int
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
