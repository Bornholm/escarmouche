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

// DefaultCosts : facteurs issus de l'évaluation d'équilibrage du 2026-08-16
// (cf. docs/20260816_balancing.md). L'algorithme évolutionnaire, mesuré sur
// des tournois stratifiés par archétype avec l'IA de recherche, indiquait :
// santé sous-cotée, puissance sous-cotée, mobilité dominante dans un jeu à
// objectif central. Les amplitudes ci-dessous sont la version « tempérée »
// des directions trouvées : le candidat brut rendait Move ≥ 4 inachetable
// (exposant 2,95), amputant l'espace de conception pour un gain de fitness
// dans la marge de bruit (0,543 contre 0,531 mesurés).
var DefaultCosts = Costs{
	HealthFactor: 1.5,

	RangeFactor:   1.4,
	RangeExponent: 1.35,

	MoveFactor:   0.7,
	MoveExponent: 1.6,

	PowerFactor:   2.2,
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
