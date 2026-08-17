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

// DefaultCosts : facteurs re-mesurés le 2026-08-17 sous la condition de
// victoire actuelle — 5 marqueurs et tir à la corde — qui a rallongé les
// parties et changé ce qui a de la valeur (cf. 20260817_dominant-strategy.md).
//
// L'algorithme évolutionnaire indiquait santé, portée et mobilité sous-cotées,
// puissance surcotée. Les amplitudes ci-dessous sont la version tempérée de
// ces directions, pour la même raison qu'en août : le candidat brut poussait
// les exposants à leurs bornes (Move 2,99 / Range 2,00) et rendait
// inachetable jusqu'à une unité aussi banale que 3/3/2/2 — 42 points sur un
// plafond de 30. Il « équilibrait » en supprimant l'espace de conception.
//
// Le barème retenu garde portée 4 et mouvement 4 accessibles, et resserre
// l'écart entre doctrines extrêmes de 75 à 58 points de taux de victoire.
var DefaultCosts = Costs{
	HealthFactor: 2.0,

	RangeFactor:   1.6,
	RangeExponent: 1.40,

	MoveFactor:   0.8,
	MoveExponent: 1.75,

	PowerFactor:   1.6,
	PowerExponent: 1.30,

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
