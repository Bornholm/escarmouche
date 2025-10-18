package main

import (
	"context"
	"flag"
	"fmt"
	"log"

	"github.com/bornholm/escarmouche/pkg/balancing"
	"github.com/bornholm/escarmouche/pkg/core"
	"github.com/pkg/errors"
)

var (
	populationSize = 100
	squadsPerEval  = 100
	mutationRate   = 0.1
	maxGenerations = 1000
)

func init() {
	flag.IntVar(&populationSize, "population-size", populationSize, "population size")
	flag.IntVar(&squadsPerEval, "squads-per-eval", squadsPerEval, "number of squads to create for each tournament evaluation")
	flag.Float64Var(&mutationRate, "mutation-rate", mutationRate, "mutation rate")
	flag.IntVar(&maxGenerations, "max-generations", maxGenerations, "maximum number of generations")
}

func main() {
	flag.Parse()

	fmt.Println("Escarmouche Balancing System")
	fmt.Println("============================")

	// Create context with timeout
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Create evaluator with custom settings
	evaluator := balancing.NewEvaluator(
		balancing.WithPopulationSize(populationSize),
		balancing.WithSquadsPerEval(squadsPerEval),
		balancing.WithMutationRate(mutationRate),
		balancing.WithMaxGenerations(maxGenerations),
	)

	fmt.Printf("Starting with:\n")
	fmt.Printf("- Population size: %d\n", populationSize)
	fmt.Printf("- Squads per evaluation: %d\n", squadsPerEval)
	fmt.Printf("- Mutation rate: %v%%\n", mutationRate*100)
	fmt.Printf("- Max generations: %d\n", maxGenerations)
	fmt.Println()
	fmt.Printf("Default costs for comparison:\n")
	printCosts(core.DefaultCosts)
	fmt.Println()

	var (
		bestCosts   core.Costs
		bestFitness float64
	)

	// Run the evolutionary algorithm
	for generation := 0; generation < maxGenerations; generation++ {
		select {
		case <-ctx.Done():
			log.Printf("Context cancelled: %+v", errors.WithStack(ctx.Err()))
			return
		default:
			fmt.Printf("Running generation %d...\n", generation)
			stats, err := evaluator.Next(ctx)
			if err != nil {
				log.Fatalf("Generation %d failed: %+v", generation, errors.WithStack(err))
			}

			fmt.Printf("%s\n", stats.String())

			if generation == 0 || generation%2 == 0 {
				fmt.Printf("Best costs for this generation: %v\n", stats.BestFitness)
				printCosts(stats.BestCosts)
				fmt.Printf("\nComparison with defaults:\n")
				compareCosts(core.DefaultCosts, stats.BestCosts)
				fmt.Printf("\n")
			}

			if stats.Converged {
				fmt.Printf("\n🎉 Algorithm converged at generation %d!\n", generation)
				fmt.Printf("Final optimized costs:\n")
				printCosts(stats.BestCosts)

				fmt.Printf("\nComparison with defaults:\n")
				compareCosts(core.DefaultCosts, stats.BestCosts)
				return
			}

			if stats.BestFitness > bestFitness {
				bestCosts = stats.BestCosts
				bestFitness = stats.BestFitness
			}
		}
	}

	fmt.Println("\nAlgorithm completed maximum generations.")

	fmt.Printf("Best found costs:\n")
	printCosts(bestCosts)

	fmt.Printf("\nComparison with defaults:\n")
	compareCosts(core.DefaultCosts, bestCosts)
}

func printCosts(costs core.Costs) {
	fmt.Printf("  HealthFactor:   %.3f\n", costs.HealthFactor)
	fmt.Printf("  RangeFactor:    %.3f (exponent: %.3f)\n", costs.RangeFactor, costs.RangeExponent)
	fmt.Printf("  MoveFactor:     %.3f (exponent: %.3f)\n", costs.MoveFactor, costs.MoveExponent)
	fmt.Printf("  PowerFactor:   %.3f (exponent: %.3f)\n", costs.PowerFactor, costs.PowerExponent)
	fmt.Printf("  MaxTotal:       %.1f\n", costs.MaxTotal)
}

func compareCosts(defaultCosts, optimizedCosts core.Costs) {
	fmt.Printf("Changes from default:\n")

	changes := []struct {
		name      string
		original  float64
		optimized float64
	}{
		{"HealthFactor", defaultCosts.HealthFactor, optimizedCosts.HealthFactor},
		{"RangeFactor", defaultCosts.RangeFactor, optimizedCosts.RangeFactor},
		{"RangeExponent", defaultCosts.RangeExponent, optimizedCosts.RangeExponent},
		{"MoveFactor", defaultCosts.MoveFactor, optimizedCosts.MoveFactor},
		{"MoveExponent", defaultCosts.MoveExponent, optimizedCosts.MoveExponent},
		{"PowerFactor", defaultCosts.PowerFactor, optimizedCosts.PowerFactor},
		{"PowerExponent", defaultCosts.PowerExponent, optimizedCosts.PowerExponent},
		{"MaxTotal", defaultCosts.MaxTotal, optimizedCosts.MaxTotal},
	}

	for _, change := range changes {
		diff := change.optimized - change.original
		percentage := (diff / change.original) * 100

		var arrow string
		if diff > 0.001 {
			arrow = "↑"
		} else if diff < -0.001 {
			arrow = "↓"
		} else {
			arrow = "="
		}

		fmt.Printf("  %s %s %.3f → %.3f (%.1f%%)\n",
			arrow, change.name, change.original, change.optimized, percentage)
	}
}
