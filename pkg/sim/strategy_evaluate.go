package sim

import (
	"github.com/bornholm/escarmouche/pkg/core"
	"github.com/bornholm/go-fuzzy"
	"github.com/bornholm/go-fuzzy/dsl"
	"github.com/pkg/errors"

	_ "embed"
)

//go:embed strategy_rules.fuzzy
var strategyRules string

var strategyEngine *fuzzy.Engine

func init() {
	result, err := dsl.ParseRulesAndVariables(strategyRules)
	if err != nil {
		panic(errors.Wrap(err, "could not parse strategy rules"))
	}

	strategyEngine = fuzzy.NewEngine(fuzzy.Centroid(100))
	strategyEngine.Rules(result.Rules...)
	strategyEngine.Variables(result.Variables...)
}

// StrategicContext represents the tactical situation for decision making
type StrategicContext struct {
	HealthRatio     float64 // 0.0 to 1.0 (current health / max health)
	DistanceToEnemy float64 // Distance to nearest enemy
	EnemyThreat     float64 // 0.0 to 1.0 (threat level assessment)
	UnitValue       float64 // 0.0 to 1.0 (unit importance/cost)
}

// StrategicDecision represents the AI's tactical preferences
type StrategicDecision struct {
	Aggression            float64 // 0.0 (defensive) to 1.0 (reckless)
	PositioningPreference float64 // 0.0 (retreat) to 1.0 (charge)
	RiskTolerance         float64 // 0.0 (risk averse) to 1.0 (reckless)
}

// EvaluateStrategy uses fuzzy logic to determine tactical preferences
func EvaluateStrategy(context StrategicContext) (*StrategicDecision, error) {
	values := fuzzy.Values{
		"health_ratio":      context.HealthRatio,
		"distance_to_enemy": context.DistanceToEnemy,
		"enemy_threat":      context.EnemyThreat,
		"unit_value":        context.UnitValue,
	}

	results, err := strategyEngine.Infer(values)
	if err != nil {
		return nil, errors.Wrap(err, "could not evaluate strategic context")
	}

	// Extract defuzzified values for each output variable
	aggression := extractDefuzzifiedValue(results["aggression"])
	positioning := extractDefuzzifiedValue(results["positioning_preference"])
	risk := extractDefuzzifiedValue(results["risk_tolerance"])

	return &StrategicDecision{
		Aggression:            aggression,
		PositioningPreference: positioning,
		RiskTolerance:         risk,
	}, nil
}

// extractDefuzzifiedValue gets the centroid (defuzzified) value from fuzzy results
func extractDefuzzifiedValue(results map[string]fuzzy.Result) float64 {
	if len(results) == 0 {
		return 0.5 // Default middle value
	}

	// Calculate weighted average based on truth degrees
	var totalWeight float64 = 0.0
	var weightedSum float64 = 0.0

	// Map linguistic terms to numeric values
	termValues := map[string]float64{
		// Aggression terms
		"defensive":  0.1,
		"cautious":   0.3,
		"balanced":   0.5,
		"aggressive": 0.7,
		"reckless":   0.9,

		// Positioning terms
		"retreat": 0.1,
		"hold":    0.3,
		"advance": 0.6,
		"charge":  0.9,

		// Risk tolerance terms
		"risk_averse":  0.1,
		"conservative": 0.3,
		"moderate":     0.5,
		"bold":         0.7,
	}

	for term, result := range results {
		truth := result.TruthDegree()
		if truth > 0 {
			if value, exists := termValues[term]; exists {
				weightedSum += value * truth
				totalWeight += truth
			}
		}
	}

	if totalWeight > 0 {
		return weightedSum / totalWeight
	}

	return 0.5 // Default middle value
}

// CalculateUnitValue estimates the strategic value of a unit based on its stats and abilities
func CalculateUnitValue(stats core.Stats, abilities []core.Ability, costs core.Costs) float64 {
	// Use the existing cost calculation as a base for unit value
	totalCost := core.CalculateTotalCost(stats, abilities, costs)

	// Normalize to 0-1 range (assuming max cost around 30)
	normalizedValue := totalCost / costs.MaxTotal
	if normalizedValue > 1.0 {
		normalizedValue = 1.0
	}

	return normalizedValue
}

// CalculateEnemyThreat assesses the threat level from nearby enemies
func CalculateEnemyThreat(myHealth, enemyAttackPower int, distance float64) float64 {
	if distance > 10 {
		return 0.0 // Too far to be a threat
	}

	// Threat decreases with distance and increases with enemy attack power
	distanceFactor := 1.0 - (distance / 10.0)
	attackFactor := float64(enemyAttackPower) / 5.0  // Assuming max attack around 5
	healthFactor := 1.0 - (float64(myHealth) / 10.0) // Assuming max health around 10

	threat := (distanceFactor * attackFactor * (1.0 + healthFactor)) / 2.0

	if threat > 1.0 {
		threat = 1.0
	}

	return threat
}
