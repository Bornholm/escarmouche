package barracks

const (
	HealthCostFactor float64 = 1
	ReachCostFactor  float64 = 2
	MoveCostFactor   float64 = 1
	AttackCostFactor float64 = 3
)

type Unit struct {
	Health     int        `json:"health" mapstructure:"health"`
	Reach      int        `json:"reach" mapstructure:"reach"`
	Move       int        `json:"move" mapstructure:"move"`
	Attack     int        `json:"attack" mapstructure:"attack"`
	Capacities []Capacity `json:"capacities" mapstructure:"capacities"`
}

func (u *Unit) Cost() float64 {
	var capacitiesCost float64
	for _, c := range u.Capacities {
		capacitiesCost += c.Cost
	}

	return float64(u.Health)*HealthCostFactor +
		float64(u.Reach)*ReachCostFactor +
		float64(u.Move)*MoveCostFactor +
		float64(u.Attack)*AttackCostFactor +
		capacitiesCost
}

type Capacity struct {
	Cost float64 `mapstructure:"cost"`
}
