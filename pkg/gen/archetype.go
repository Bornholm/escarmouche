package gen

var (
	ArchetypeTank        = Archetype{Name: "Tank", WeightHealth: 60, WeightReach: 10, WeightMovement: 15, WeightAttack: 15}
	ArchetypeSniper      = Archetype{Name: "Sniper", WeightHealth: 15, WeightReach: 40, WeightMovement: 15, WeightAttack: 30}
	ArchetypeSkirmisher  = Archetype{Name: "Skirmisher", WeightHealth: 20, WeightReach: 20, WeightMovement: 40, WeightAttack: 20}
	ArchetypeBruiser     = Archetype{Name: "Bruiser", WeightHealth: 35, WeightReach: 15, WeightMovement: 20, WeightAttack: 30}
	ArchetypeGlassCannon = Archetype{Name: "GlassCannon", WeightHealth: 10, WeightReach: 30, WeightMovement: 15, WeightAttack: 45}
)

var DefaultArchetypes = []Archetype{
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
