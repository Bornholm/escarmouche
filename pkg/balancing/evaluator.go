package balancing

import (
	"context"
	"fmt"
	"log"
	"math"
	"math/rand/v2"
	"runtime"
	"slices"
	"sync"

	"github.com/bornholm/escarmouche/pkg/core"
	"github.com/bornholm/escarmouche/pkg/gen"
	"github.com/bornholm/escarmouche/pkg/sim"
	"github.com/pkg/errors"
)

// Stats holds statistics about the current generation
type Stats struct {
	Generation     int
	BestFitness    float64
	AverageFitness float64
	WorstFitness   float64
	BestCosts      core.Costs
	Converged      bool
}

// Individual represents a candidate solution with its fitness
type Individual struct {
	Costs   core.Costs
	Fitness float64
}

// Evaluator implements an evolutionary algorithm to optimize core.Costs
type Evaluator struct {
	generation           int
	population           []Individual
	populationSize       int
	mutationRate         float64
	crossoverRate        float64
	eliteSize            int
	tournamentSize       int
	squadsPerEval        int
	maxGenerations       int
	convergenceThreshold float64
}

// EvaluatorOption allows customization of the evaluator
type EvaluatorOption func(*Evaluator)

// WithPopulationSize sets the population size
func WithPopulationSize(size int) EvaluatorOption {
	return func(e *Evaluator) {
		e.populationSize = size
	}
}

// WithMutationRate sets the mutation rate
func WithMutationRate(rate float64) EvaluatorOption {
	return func(e *Evaluator) {
		e.mutationRate = rate
	}
}

// WithSquadsPerEval sets how many squads to simulate per fitness evaluation
func WithSquadsPerEval(games int) EvaluatorOption {
	return func(e *Evaluator) {
		e.squadsPerEval = games
	}
}

// WithMaxGenerations sets the maximum number of generations
func WithMaxGenerations(max int) EvaluatorOption {
	return func(e *Evaluator) {
		e.maxGenerations = max
	}
}

func (e *Evaluator) Next(ctx context.Context) (*Stats, error) {
	// Initialize population if this is the first generation
	if e.generation == 0 {
		e.initializePopulation()
	}

	// Evaluate fitness for all individuals
	if err := e.evaluatePopulation(ctx); err != nil {
		return nil, errors.Wrap(err, "failed to evaluate population")
	}

	// Calculate statistics
	stats := e.calculateStats()

	// Check for convergence
	if e.generation >= e.maxGenerations || stats.Converged {
		stats.Converged = true
		return stats, nil
	}

	// Create next generation
	e.population = e.createNewGeneration()
	e.generation++

	return stats, nil
}

// initializePopulation creates the initial random population
func (e *Evaluator) initializePopulation() {
	e.population = make([]Individual, e.populationSize)

	for i := range e.population {
		e.population[i] = Individual{
			Costs:   e.randomCosts(),
			Fitness: 0.0,
		}
	}
}

// randomCosts generates random cost parameters within reasonable bounds
func (e *Evaluator) randomCosts() core.Costs {
	min := 0.5
	max := 4 - min
	return core.Costs{
		HealthFactor:  min + rand.Float64()*max,
		RangeFactor:   min + rand.Float64()*max,
		RangeExponent: min + rand.Float64()*max,
		MoveFactor:    min + rand.Float64()*max,
		MoveExponent:  min + rand.Float64()*max,
		PowerFactor:   min + rand.Float64()*max,
		PowerExponent: min + rand.Float64()*max,
		MaxTotal:      30,
	}
}

// evaluatePopulation calculates fitness for all individuals
func (e *Evaluator) evaluatePopulation(ctx context.Context) error {
	for i := range e.population {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
			fitness, err := e.evaluateFitness(ctx, e.population[i].Costs)
			if err != nil {
				return errors.Wrapf(err, "failed to evaluate individual %d", i)
			}
			e.population[i].Fitness = fitness
		}
	}
	return nil
}

// TournamentResult holds the results of a tournament simulation
type TournamentResult struct {
	WinShares    []float64
	TotalGames   int64
	HHI          float64
	Fitness      float64
	SquadResults []SquadResult
}

// SquadResult contains statistics for a single squad in the tournament
type SquadResult struct {
	Index   int
	Wins    int
	Games   int
	WinRate float64
}

// FitnessConfig holds configuration parameters for fitness evaluation
type FitnessConfig struct {
	MaxRankPoints   int
	MaxSquadSize    int
	ScalingExponent float64
	MaxSimSteps     int // Prevent infinite simulations
}

// DefaultFitnessConfig returns sensible default configuration
func DefaultFitnessConfig() FitnessConfig {
	return FitnessConfig{
		MaxRankPoints:   30,
		MaxSquadSize:    gen.DefaultMaxSquadSize,
		ScalingExponent: 2.0,
		MaxSimSteps:     250, // Prevent runaway simulations
	}
}

// evaluateFitness runs tournament simulations to determine balance quality using Herfindahl-Hirschman Index.
// It generates squads using the provided costs, runs a round-robin tournament, and calculates
// fitness based on how balanced the win rates are across all squads.
func (e *Evaluator) evaluateFitness(ctx context.Context, costs core.Costs) (float64, error) {
	if e.squadsPerEval <= 0 {
		return 0, errors.New("squadsPerEval must be positive")
	}
	if e.squadsPerEval == 1 {
		return 0, errors.New("need at least 2 squads for tournament evaluation")
	}

	config := DefaultFitnessConfig()

	// Generate tournament squads
	squads, err := e.generateTournamentSquads(ctx, costs, config)
	if err != nil {
		return 0, errors.Wrap(err, "failed to generate tournament squads")
	}

	// Run tournament simulations
	result, err := e.runTournament(ctx, squads, config)
	if err != nil {
		return 0, errors.Wrap(err, "failed to run tournament")
	}

	// Calculate and return fitness score
	fitness := 1 - result.HHI

	if log.Default() != nil {
		log.Printf("Tournament completed: %d games, HHI=%.6f, fitness=%.6f",
			result.TotalGames, result.HHI, fitness)
	}

	return fitness, nil
}

// generateTournamentSquads creates squads for the tournament using the given costs
func (e *Evaluator) generateTournamentSquads(ctx context.Context, costs core.Costs, config FitnessConfig) ([][]sim.Unit, error) {
	squads := make([][]sim.Unit, 0, e.squadsPerEval)

	for i := 0; i < e.squadsPerEval; i++ {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		default:
		}

		squad, err := gen.RandomSquad(config.MaxRankPoints, config.MaxSquadSize, gen.DefaultRankPointCosts, costs)
		if err != nil {
			return nil, errors.Wrapf(err, "failed to generate squad %d", i)
		}

		if len(squad) == 0 {
			return nil, errors.Errorf("generated empty squad %d", i)
		}

		// Convert to sim.Unit format efficiently
		units := make([]sim.Unit, len(squad))
		for j, u := range squad {
			units[j] = sim.Unit{
				Stats:     u.Stats,
				Abilities: u.Abilities,
			}
		}
		squads = append(squads, units)
	}

	return squads, nil
}

// gameJob represents a single game to be played in the tournament
type gameJob struct {
	squad1Index, squad2Index int
}

// gameResult represents the outcome of a single game
type gameResult struct {
	winnerIndex int
	completed   bool
}

// runTournament executes a round-robin tournament between all squads
func (e *Evaluator) runTournament(ctx context.Context, squads [][]sim.Unit, config FitnessConfig) (*TournamentResult, error) {
	numSquads := len(squads)
	if numSquads < 2 {
		return nil, errors.New("need at least 2 squads for tournament")
	}

	// Calculate optimal worker count
	numWorkers := e.calculateOptimalWorkers(numSquads)

	jobs := make(chan gameJob, numWorkers*2)
	results := make(chan gameResult, numWorkers*2)

	// Start workers
	var wg sync.WaitGroup
	for i := 0; i < numWorkers; i++ {
		wg.Add(1)
		go e.tournamentWorker(ctx, &wg, squads, jobs, results, config)
	}

	// Send jobs - full round-robin tournament (each squad plays every other squad)
	go func() {
		defer close(jobs)
		for i := 0; i < numSquads; i++ {
			for j := 0; j < numSquads; j++ {
				if i != j { // Don't play against self
					select {
					case <-ctx.Done():
						return
					case jobs <- gameJob{i, j}:
					}
				}
			}
		}
	}()

	// Collect results
	wins := make([]int, numSquads)
	totalGames := 0

	go func() {
		wg.Wait()
		close(results)
	}()

	for result := range results {
		if result.completed {
			wins[result.winnerIndex]++
			totalGames++
		}
	}

	if totalGames == 0 {
		return nil, errors.New("no games completed in tournament")
	}

	// Le nombre total de victoires est égal au nombre total de parties jouées
	totalWins := float64(totalGames)

	winShares := make([]float64, numSquads)
	squadResults := make([]SquadResult, numSquads)
	gamesPerSquad := (numSquads - 1) * 2

	for i := 0; i < numSquads; i++ {
		if totalWins > 0 {
			winShares[i] = float64(wins[i]) / totalWins
		} else {
			winShares[i] = 0.0
		}

		squadResults = append(squadResults, SquadResult{
			Index:   i,
			Wins:    wins[i],
			Games:   gamesPerSquad,
			WinRate: float64(wins[i]) / float64(gamesPerSquad),
		})
	}

	hhi := e.calculateHHI(winShares)

	return &TournamentResult{
		WinShares:    winShares,
		TotalGames:   int64(totalGames),
		HHI:          hhi,
		SquadResults: squadResults,
	}, nil
}

// tournamentWorker processes tournament games concurrently
func (e *Evaluator) tournamentWorker(ctx context.Context, wg *sync.WaitGroup, squads [][]sim.Unit,
	jobs <-chan gameJob, results chan<- gameResult, config FitnessConfig) {

	defer wg.Done()

	for job := range jobs {
		select {
		case <-ctx.Done():
			results <- gameResult{completed: false}
			continue
		default:
		}

		winner, err := e.runSingleGame(ctx, squads[job.squad1Index], squads[job.squad2Index], config)
		if err != nil {
			// Log error but continue with tournament
			if log.Default() != nil {
				log.Printf("Game error between squads %d and %d: %v", job.squad1Index, job.squad2Index, err)
			}
			results <- gameResult{completed: false}
			continue
		}

		winnerIndex := job.squad1Index
		if winner == sim.PlayerTwo {
			winnerIndex = job.squad2Index
		}

		results <- gameResult{
			winnerIndex: winnerIndex,
			completed:   true,
		}
	}
}

// runSingleGame executes a single simulation between two squads
func (e *Evaluator) runSingleGame(ctx context.Context, squad1, squad2 []sim.Unit, config FitnessConfig) (sim.PlayerID, error) {
	game := sim.NewGame(squad1, squad2)

	for step := range game.Run() {
		select {
		case <-ctx.Done():
			return -1, ctx.Err()
		default:
			if step.Turn >= uint(config.MaxSimSteps) {
				return sim.GetHealthWinner(game.State()), nil
			}

			if step.IsOver {
				return step.Winner, nil
			}
		}

	}

	// If we range max steps, declare it a draw (return player one arbitrarily)
	return sim.PlayerOne, errors.New("simulation exceeded maximum steps")
}

// calculateOptimalWorkers determines the optimal number of workers for the tournament
func (e *Evaluator) calculateOptimalWorkers(numSquads int) int {
	maxWorkers := runtime.NumCPU()
	// Full round-robin: each squad plays against every other squad
	totalGames := numSquads * (numSquads - 1)

	// Use fewer workers for small tournaments to avoid overhead
	if totalGames < maxWorkers {
		return totalGames
	}

	// Reserve one CPU for the main thread
	if maxWorkers > 1 {
		return maxWorkers - 1
	}

	return 1
}

// calculateHHI computes the Herfindahl-Hirschman Index from win shares
func (e *Evaluator) calculateHHI(shares []float64) float64 {
	hhi := 0.0
	for _, share := range shares {
		hhi += share * share
	}

	best := 1.0 / float64(len(shares))
	normalized := (hhi - best) / (1 - best)

	return normalized
}

// calculateFitnessFromHHI converts HHI to a fitness score in [0,1] range
func (e *Evaluator) calculateFitnessFromHHI(hhi float64, numSquads int) float64 {
	if numSquads <= 0 {
		return 0.0
	}

	// Perfect balance: each squad has equal win rate (1/n)
	perfectHHI := 1.0 / float64(numSquads)

	// Worst case: one squad wins everything
	worstHHI := 1.0

	// Clamp HHI to valid range
	if hhi > worstHHI {
		hhi = worstHHI
	}
	if hhi < perfectHHI {
		hhi = perfectHHI
	}

	// Convert to fitness: lower HHI = better balance = higher fitness
	fitness := (worstHHI - hhi) / (worstHHI - perfectHHI)

	// Apply scaling to make convergence more challenging
	fitness = math.Pow(fitness, 2.0)

	// Ensure fitness is in [0, 1] range
	return math.Max(0.0, math.Min(1.0, fitness))
}

// calculateStats computes statistics for the current generation
func (e *Evaluator) calculateStats() *Stats {
	if len(e.population) == 0 {
		return &Stats{Generation: e.generation}
	}

	// Sort population by fitness (descending)
	slices.SortFunc(e.population, func(a, b Individual) int {
		if a.Fitness > b.Fitness {
			return -1
		} else if a.Fitness < b.Fitness {
			return 1
		}
		return 0
	})

	best := e.population[0]
	worst := e.population[len(e.population)-1]

	var totalFitness float64
	for _, ind := range e.population {
		totalFitness += ind.Fitness
	}
	avgFitness := totalFitness / float64(len(e.population))

	// Check convergence: if best fitness is very close to 1.0 (perfect balance)
	converged := best.Fitness >= (1.0 - e.convergenceThreshold)

	return &Stats{
		Generation:     e.generation,
		BestFitness:    best.Fitness,
		AverageFitness: avgFitness,
		WorstFitness:   worst.Fitness,
		BestCosts:      best.Costs,
		Converged:      converged,
	}
}

func (e *Evaluator) createNewGeneration() []Individual {
	newPopulation := make([]Individual, 0, e.populationSize)

	// Sort population by fitness (descending)
	slices.SortFunc(e.population, func(a, b Individual) int {
		if a.Fitness > b.Fitness {
			return -1
		} else if a.Fitness < b.Fitness {
			return 1
		}
		return 0
	})

	// Elitism: keep the best individuals
	for i := 0; i < e.eliteSize && i < len(e.population); i++ {
		newPopulation = append(newPopulation, e.population[i])
	}

	// Fill the rest with offspring
	for len(newPopulation) < e.populationSize {
		parent1 := e.tournamentSelection()
		parent2 := e.tournamentSelection()

		child1, child2 := e.crossover(parent1, parent2)

		child1 = e.mutate(child1)
		child2 = e.mutate(child2)

		newPopulation = append(newPopulation, child1)
		if len(newPopulation) < e.populationSize {
			newPopulation = append(newPopulation, child2)
		}
	}

	return newPopulation
}

// tournamentSelection selects an individual using tournament selection
func (e *Evaluator) tournamentSelection() Individual {
	best := e.population[rand.IntN(len(e.population))]

	for i := 1; i < e.tournamentSize; i++ {
		candidate := e.population[rand.IntN(len(e.population))]
		if candidate.Fitness > best.Fitness {
			best = candidate
		}
	}

	return best
}

// crossover creates two offspring from two parents using uniform crossover
func (e *Evaluator) crossover(parent1, parent2 Individual) (Individual, Individual) {
	if rand.Float64() > e.crossoverRate {
		return parent1, parent2
	}

	child1 := Individual{Costs: parent1.Costs, Fitness: 0}
	child2 := Individual{Costs: parent2.Costs, Fitness: 0}

	// Uniform crossover for each parameter
	if rand.Float64() < 0.5 {
		child1.Costs.HealthFactor, child2.Costs.HealthFactor = child2.Costs.HealthFactor, child1.Costs.HealthFactor
	}
	if rand.Float64() < 0.5 {
		child1.Costs.RangeFactor, child2.Costs.RangeFactor = child2.Costs.RangeFactor, child1.Costs.RangeFactor
	}
	if rand.Float64() < 0.5 {
		child1.Costs.RangeExponent, child2.Costs.RangeExponent = child2.Costs.RangeExponent, child1.Costs.RangeExponent
	}
	if rand.Float64() < 0.5 {
		child1.Costs.MoveFactor, child2.Costs.MoveFactor = child2.Costs.MoveFactor, child1.Costs.MoveFactor
	}
	if rand.Float64() < 0.5 {
		child1.Costs.MoveExponent, child2.Costs.MoveExponent = child2.Costs.MoveExponent, child1.Costs.MoveExponent
	}
	if rand.Float64() < 0.5 {
		child1.Costs.PowerFactor, child2.Costs.PowerFactor = child2.Costs.PowerFactor, child1.Costs.PowerFactor
	}
	if rand.Float64() < 0.5 {
		child1.Costs.PowerExponent, child2.Costs.PowerExponent = child2.Costs.PowerExponent, child1.Costs.PowerExponent
	}
	if rand.Float64() < 0.5 {
		child1.Costs.MaxTotal, child2.Costs.MaxTotal = child2.Costs.MaxTotal, child1.Costs.MaxTotal
	}

	return child1, child2
}

// mutate applies random mutations to an individual
func (e *Evaluator) mutate(individual Individual) Individual {
	mutated := Individual{Costs: individual.Costs, Fitness: 0}

	// Mutate each parameter with probability mutationRate
	if rand.Float64() < e.mutationRate {
		mutated.Costs.HealthFactor += (rand.Float64() - 0.5) * 0.2
		mutated.Costs.HealthFactor = math.Max(0.1, math.Min(5.0, mutated.Costs.HealthFactor))
	}
	if rand.Float64() < e.mutationRate {
		mutated.Costs.RangeFactor += (rand.Float64() - 0.5) * 0.4
		mutated.Costs.RangeFactor = math.Max(0.1, math.Min(8.0, mutated.Costs.RangeFactor))
	}
	if rand.Float64() < e.mutationRate {
		mutated.Costs.RangeExponent += (rand.Float64() - 0.5) * 0.1
		mutated.Costs.RangeExponent = math.Max(1.0, math.Min(2.0, mutated.Costs.RangeExponent))
	}
	if rand.Float64() < e.mutationRate {
		mutated.Costs.MoveFactor += (rand.Float64() - 0.5) * 0.2
		mutated.Costs.MoveFactor = math.Max(0.1, math.Min(5.0, mutated.Costs.MoveFactor))
	}
	if rand.Float64() < e.mutationRate {
		mutated.Costs.MoveExponent += (rand.Float64() - 0.5) * 0.1
		mutated.Costs.MoveExponent = math.Max(1.0, math.Min(2.0, mutated.Costs.MoveExponent))
	}
	if rand.Float64() < e.mutationRate {
		mutated.Costs.PowerFactor += (rand.Float64() - 0.5) * 0.4
		mutated.Costs.PowerFactor = math.Max(0.1, math.Min(10.0, mutated.Costs.PowerFactor))
	}
	if rand.Float64() < e.mutationRate {
		mutated.Costs.PowerExponent += (rand.Float64() - 0.5) * 0.1
		mutated.Costs.PowerExponent = math.Max(1.0, math.Min(2.0, mutated.Costs.PowerExponent))
	}
	if rand.Float64() < e.mutationRate {
		mutated.Costs.MaxTotal += (rand.Float64() - 0.5) * 4.0
		mutated.Costs.MaxTotal = math.Max(10.0, math.Min(60.0, mutated.Costs.MaxTotal))
	}

	return mutated
}

// String returns a string representation of the stats
func (s *Stats) String() string {
	return fmt.Sprintf("Gen %d: Best=%.4f, Avg=%.4f, Worst=%.4f, Converged=%t",
		s.Generation, s.BestFitness, s.AverageFitness, s.WorstFitness, s.Converged)
}

func NewEvaluator(options ...EvaluatorOption) *Evaluator {
	e := &Evaluator{
		generation:           0,
		populationSize:       50,
		mutationRate:         0.1,
		crossoverRate:        0.8,
		eliteSize:            5,
		tournamentSize:       3,
		squadsPerEval:        10,
		maxGenerations:       100,
		convergenceThreshold: 0.001, // More strict convergence threshold
	}

	for _, option := range options {
		option(e)
	}

	return e
}
