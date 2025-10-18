package core

import "math"

type Costs struct {
	HealthFactor  float64
	RangeFactor   float64
	RangeExponent float64
	MoveFactor    float64
	MoveExponent  float64
	PowerFactor   float64
	PowerExponent float64
	MaxTotal      float64
}

var DefaultCosts = Costs{
	HealthFactor: 1,

	RangeFactor:   2,
	RangeExponent: 1.1,

	MoveFactor:   1,
	MoveExponent: 1.1,

	PowerFactor:   3,
	PowerExponent: 1.2,

	MaxTotal: 30,
}

func CalculateTotalCost(stats Stats, abilities []Ability, costs Costs) float64 {
	healthCost := CalculateSimpleCost(stats.Health, costs.HealthFactor)
	rangeCost := CalculeExponentialCost(stats.Range, costs.RangeFactor, costs.RangeExponent)
	moveCost := CalculeExponentialCost(stats.Move, costs.MoveFactor, costs.MoveExponent)
	attackCost := CalculeExponentialCost(stats.Power, costs.PowerFactor, costs.PowerExponent)

	// Synergie "bonus"
	synergyBonus := (float64(stats.Range) * costs.RangeFactor) * (float64(stats.Power) * costs.PowerFactor) * 0.1

	abilitiesCost := 0.0
	for _, c := range abilities {
		abilitiesCost += c.Cost
	}

	return math.Ceil(healthCost + rangeCost + moveCost + attackCost + synergyBonus + abilitiesCost)
}

func CalculateSimpleCost(value int, costFactor float64) float64 {
	return float64(value) * costFactor
}

func CalculeExponentialCost(value int, costFactor float64, exponent float64) float64 {
	return float64(value) * costFactor * math.Pow(exponent, float64(value-1))
}
