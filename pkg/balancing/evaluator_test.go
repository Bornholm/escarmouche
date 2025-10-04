package balancing

import (
	"testing"

	"github.com/bornholm/escarmouche/pkg/core"
)

func TestEvaluator_Creation(t *testing.T) {
	evaluator := NewEvaluator(
		WithPopulationSize(10),
		WithMutationRate(0.2),
		WithSquadsPerEval(3),
		WithMaxGenerations(50),
	)

	if evaluator.populationSize != 10 {
		t.Errorf("Expected population size 10, got %d", evaluator.populationSize)
	}

	if evaluator.mutationRate != 0.2 {
		t.Errorf("Expected mutation rate 0.2, got %f", evaluator.mutationRate)
	}

	if evaluator.squadsPerEval != 3 {
		t.Errorf("Expected squads per eval 3, got %d", evaluator.squadsPerEval)
	}

	if evaluator.maxGenerations != 50 {
		t.Errorf("Expected max generations 50, got %d", evaluator.maxGenerations)
	}
}

func TestEvaluator_RandomCosts(t *testing.T) {
	evaluator := NewEvaluator()

	// Generate several random costs and check they're within bounds
	for i := 0; i < 10; i++ {
		costs := evaluator.randomCosts()

		if costs.HealthFactor < 0.5 || costs.HealthFactor > 2.5 {
			t.Errorf("HealthFactor out of expected range [0.5, 2.5]: %f", costs.HealthFactor)
		}
		if costs.ReachFactor < 1.0 || costs.ReachFactor > 4.0 {
			t.Errorf("ReachFactor out of expected range [1.0, 4.0]: %f", costs.ReachFactor)
		}
		if costs.ReachExponent < 1.0 || costs.ReachExponent > 1.5 {
			t.Errorf("ReachExponent out of expected range [1.0, 1.5]: %f", costs.ReachExponent)
		}
		if costs.MoveFactor < 0.5 || costs.MoveFactor > 2.5 {
			t.Errorf("MoveFactor out of expected range [0.5, 2.5]: %f", costs.MoveFactor)
		}
		if costs.MoveExponent < 1.0 || costs.MoveExponent > 1.5 {
			t.Errorf("MoveExponent out of expected range [1.0, 1.5]: %f", costs.MoveExponent)
		}
		if costs.AttackFactor < 1.0 || costs.AttackFactor > 5.0 {
			t.Errorf("AttackFactor out of expected range [1.0, 5.0]: %f", costs.AttackFactor)
		}
		if costs.AttackExponent < 1.0 || costs.AttackExponent > 1.5 {
			t.Errorf("AttackExponent out of expected range [1.0, 1.5]: %f", costs.AttackExponent)
		}
		if costs.MaxTotal < 20.0 || costs.MaxTotal > 40.0 {
			t.Errorf("MaxTotal out of expected range [20.0, 40.0]: %f", costs.MaxTotal)
		}
	}
}

func TestEvaluator_PopulationInitialization(t *testing.T) {
	evaluator := NewEvaluator(WithPopulationSize(5))
	evaluator.initializePopulation()

	if len(evaluator.population) != 5 {
		t.Errorf("Expected population size 5, got %d", len(evaluator.population))
	}

	// Check that all individuals have valid costs
	for i, individual := range evaluator.population {
		if individual.Costs.HealthFactor <= 0 {
			t.Errorf("Individual %d has invalid HealthFactor: %f", i, individual.Costs.HealthFactor)
		}
		if individual.Costs.MaxTotal <= 0 {
			t.Errorf("Individual %d has invalid MaxTotal: %f", i, individual.Costs.MaxTotal)
		}
	}
}

func TestEvaluator_GeneticOperations(t *testing.T) {
	evaluator := NewEvaluator(WithPopulationSize(4))
	evaluator.initializePopulation()

	// Test tournament selection
	selected := evaluator.tournamentSelection()
	if selected.Costs.HealthFactor == 0 {
		t.Error("Tournament selection returned invalid individual")
	}

	// Test crossover
	parent1 := evaluator.population[0]
	parent2 := evaluator.population[1]
	child1, child2 := evaluator.crossover(parent1, parent2)

	// Children should be valid
	if child1.Costs.HealthFactor <= 0 || child2.Costs.HealthFactor <= 0 {
		t.Error("Crossover produced invalid children")
	}

	// Test mutation
	original := evaluator.population[0]
	mutated := evaluator.mutate(original)

	// Mutated individual should still be valid
	if mutated.Costs.HealthFactor <= 0 {
		t.Error("Mutation produced invalid individual")
	}
}

func TestStats_String(t *testing.T) {
	stats := &Stats{
		Generation:     5,
		BestFitness:    0.85,
		AverageFitness: 0.65,
		WorstFitness:   0.45,
		BestCosts:      core.DefaultCosts,
		Converged:      false,
	}

	str := stats.String()
	expected := "Gen 5: Best=0.8500, Avg=0.6500, Worst=0.4500, Converged=false"
	if str != expected {
		t.Errorf("Expected string %q, got %q", expected, str)
	}
}

func TestEvaluator_CalculateStats(t *testing.T) {
	evaluator := NewEvaluator(WithPopulationSize(3))

	// Manually set population with known fitness values
	evaluator.population = []Individual{
		{Costs: core.DefaultCosts, Fitness: 0.9},
		{Costs: core.DefaultCosts, Fitness: 0.7},
		{Costs: core.DefaultCosts, Fitness: 0.5},
	}

	stats := evaluator.calculateStats()

	if stats.Generation != 0 {
		t.Errorf("Expected generation 0, got %d", stats.Generation)
	}

	if stats.BestFitness != 0.9 {
		t.Errorf("Expected best fitness 0.9, got %f", stats.BestFitness)
	}

	if stats.WorstFitness != 0.5 {
		t.Errorf("Expected worst fitness 0.5, got %f", stats.WorstFitness)
	}

	expectedAvg := (0.9 + 0.7 + 0.5) / 3.0
	if abs(stats.AverageFitness-expectedAvg) > 0.001 {
		t.Errorf("Expected average fitness %f, got %f", expectedAvg, stats.AverageFitness)
	}
}

// Helper function for floating point comparison
func abs(x float64) float64 {
	if x < 0 {
		return -x
	}
	return x
}

// Test basic functionality without running simulations
func TestEvaluator_BasicFunctionality(t *testing.T) {
	evaluator := NewEvaluator(WithPopulationSize(3))

	// Test initialization
	evaluator.initializePopulation()
	if len(evaluator.population) != 3 {
		t.Errorf("Expected population size 3, got %d", len(evaluator.population))
	}

	// Manually set fitness values to test stats calculation
	evaluator.population[0].Fitness = 0.8
	evaluator.population[1].Fitness = 0.6
	evaluator.population[2].Fitness = 0.4

	stats := evaluator.calculateStats()
	if stats.BestFitness != 0.8 {
		t.Errorf("Expected best fitness 0.8, got %f", stats.BestFitness)
	}
	if stats.WorstFitness != 0.4 {
		t.Errorf("Expected worst fitness 0.4, got %f", stats.WorstFitness)
	}

	t.Logf("Basic functionality test stats: %s", stats.String())
}
