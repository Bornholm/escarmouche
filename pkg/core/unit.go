package core

type Stats struct {
	Health int
	Reach  int
	Move   int
	Attack int
}

type Capacity interface {
	Cost(stats Stats, capacities []Capacity) float64
}
