package core

type Costs struct {
	HealthFactor float64
	ReachFactor  float64
	MoveFactor   float64
	AttackFactor float64
}

var DefaultCosts = Costs{
	HealthFactor: 1,
	ReachFactor:  2,
	MoveFactor:   1,
	AttackFactor: 3,
}

func CalculateTotalCost(stats Stats, capacities []Capacity, costs Costs) float64 {
	healthCost := CalculateSimpleCost(stats.Health, costs.HealthFactor)
	reachCost := CalculateSimpleCost(stats.Reach, costs.ReachFactor)
	moveCost := CalculateSimpleCost(stats.Move, costs.MoveFactor)
	attackCost := CalculateSimpleCost(stats.Attack, costs.AttackFactor)

	// Synergie "bonus"
	synergyBonus := (float64(stats.Reach) * costs.ReachFactor) * (float64(stats.Attack) * costs.AttackFactor) * 0.1

	capacitiesCost := 0.0
	for _, c := range capacities {
		capacitiesCost += c.Cost(stats, capacities)
	}

	return healthCost + reachCost + moveCost + attackCost + synergyBonus + capacitiesCost
}

func CalculateSimpleCost(value int, costFactor float64) float64 {
	return float64(value) * costFactor
}
