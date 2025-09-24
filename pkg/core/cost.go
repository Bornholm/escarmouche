package core

import "math"

type Costs struct {
	HealthFactor   float64
	ReachFactor    float64
	ReachExponent  float64
	MoveFactor     float64
	MoveExponent   float64
	AttackFactor   float64
	AttackExponent float64
	MaxTotal       float64
}

var DefaultCosts = Costs{
	HealthFactor: 1,

	ReachFactor:   2,
	ReachExponent: 1.1,

	MoveFactor:   1,
	MoveExponent: 1.1,

	AttackFactor:   3,
	AttackExponent: 1.2,

	MaxTotal: 30,
}

func CalculateTotalCost(stats Stats, capacities []Ability, costs Costs) float64 {
	healthCost := CalculateSimpleCost(stats.Health, costs.HealthFactor)
	reachCost := CalculeExponentialCost(stats.Reach, costs.ReachFactor, costs.ReachExponent)
	moveCost := CalculeExponentialCost(stats.Move, costs.MoveFactor, costs.MoveExponent)
	attackCost := CalculeExponentialCost(stats.Attack, costs.AttackFactor, costs.AttackExponent)

	// Synergie "bonus"
	synergyBonus := (float64(stats.Reach) * costs.ReachFactor) * (float64(stats.Attack) * costs.AttackFactor) * 0.1

	capacitiesCost := 0.0
	for _, c := range capacities {
		capacitiesCost += c.Cost
	}

	return math.Ceil(healthCost + reachCost + moveCost + attackCost + synergyBonus + capacitiesCost)
}

func CalculateSimpleCost(value int, costFactor float64) float64 {
	return float64(value) * costFactor
}

func CalculeExponentialCost(value int, costFactor float64, exponent float64) float64 {
	return float64(value) * costFactor * math.Pow(exponent, float64(value-1))
}
