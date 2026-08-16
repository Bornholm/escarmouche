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
	WinShares      []float64
	TotalGames     int64
	TimedOutGames  int64
	HHI            float64
	ArchetypeSkew  float64
	Fitness        float64
	SquadResults   []SquadResult
	SquadArchetype []string
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
	SquadBudget  float64
	MaxSquadSize int
	MaxSimSteps  int // Prevent infinite simulations
	// Repetitions : nombre de tournois indépendants moyennés par évaluation.
	// Une seule mesure sur des escouades aléatoires est dominée par le bruit
	// d'échantillonnage — l'ancien fitness promouvait des individus chanceux.
	Repetitions int
	// SearchDepth / SearchBudget : force de l'IA pendant les simulations.
	// L'équilibre mesuré est celui du niveau de jeu qui le mesure : une IA
	// myope sous-évalue mobilité et capacités de tempo.
	SearchDepth  int
	SearchBudget int
}

// DefaultFitnessConfig returns sensible default configuration
func DefaultFitnessConfig() FitnessConfig {
	return FitnessConfig{
		SquadBudget:  gen.DefaultSquadBudget,
		MaxSquadSize: gen.DefaultMaxSquadSize,
		MaxSimSteps:  60,
		Repetitions:  3,
		SearchDepth:  2,
		SearchBudget: 4000,
	}
}

// evaluateFitness mesure la qualité d'équilibrage d'un jeu de coûts.
//
// Trois composantes :
//   - 1-HHI : les victoires ne se concentrent pas sur quelques escouades ;
//   - biais d'archétype : chaque tournoi aligne une escouade mono-archétype
//     par archétype — leur écart de win-rate mesure directement si un profil
//     de jeu domine, ce que le HHI brut ne voit pas ;
//   - pénalité de non-terminaison : une partie qui atteint la limite de tours
//     signale un système qui encourage l'attentisme.
//
// Le score est moyenné sur plusieurs tournois indépendants pour amortir le
// bruit d'échantillonnage.
func (e *Evaluator) evaluateFitness(ctx context.Context, costs core.Costs) (float64, error) {
	config := DefaultFitnessConfig()

	total := 0.0
	for rep := 0; rep < config.Repetitions; rep++ {
		select {
		case <-ctx.Done():
			return 0, ctx.Err()
		default:
		}

		squads, labels, err := e.generateTournamentSquads(ctx, costs, config)
		if err != nil {
			return 0, errors.Wrap(err, "failed to generate tournament squads")
		}

		result, err := e.runTournament(ctx, squads, labels, config)
		if err != nil {
			return 0, errors.Wrap(err, "failed to run tournament")
		}

		timeoutRate := 0.0
		if result.TotalGames > 0 {
			timeoutRate = float64(result.TimedOutGames) / float64(result.TotalGames)
		}

		fitness := (1-result.HHI)*0.5 + (1-result.ArchetypeSkew)*0.4 - timeoutRate*0.3
		if fitness < 0 {
			fitness = 0
		}
		total += fitness
	}

	fitness := total / float64(config.Repetitions)

	if log.Default() != nil {
		log.Printf("Fitness evaluation completed: fitness=%.6f", fitness)
	}

	return fitness, nil
}

// generateTournamentSquads compose le plateau du tournoi : une escouade
// mono-archétype par archétype (pour mesurer le biais), plus deux escouades
// mixtes.
func (e *Evaluator) generateTournamentSquads(ctx context.Context, costs core.Costs, config FitnessConfig) ([][]sim.Unit, []string, error) {
	type squadSpec struct {
		label      string
		archetypes []gen.Archetype
	}

	specs := make([]squadSpec, 0, len(gen.DefaultArchetypes)+2)
	for _, archetype := range gen.DefaultArchetypes {
		specs = append(specs, squadSpec{label: archetype.Name, archetypes: []gen.Archetype{archetype}})
	}
	specs = append(specs,
		squadSpec{label: "mixed-1", archetypes: gen.DefaultArchetypes},
		squadSpec{label: "mixed-2", archetypes: gen.DefaultArchetypes},
	)

	squads := make([][]sim.Unit, 0, len(specs))
	labels := make([]string, 0, len(specs))

	for _, spec := range specs {
		select {
		case <-ctx.Done():
			return nil, nil, ctx.Err()
		default:
		}

		squad, err := gen.RandomSquad(config.SquadBudget, config.MaxSquadSize, costs, spec.archetypes...)
		if err != nil {
			return nil, nil, errors.Wrapf(err, "failed to generate squad '%s'", spec.label)
		}

		units := make([]sim.Unit, len(squad))
		for j, u := range squad {
			units[j] = sim.Unit{
				Stats:     u.Stats,
				Abilities: u.Abilities,
			}
		}
		squads = append(squads, units)
		labels = append(labels, spec.label)
	}

	return squads, labels, nil
}

// gameJob represents a single game to be played in the tournament
type gameJob struct {
	squad1Index, squad2Index int
}

// gameResult represents the outcome of a single game
type gameResult struct {
	winnerIndex int
	completed   bool
	timedOut    bool
}

// runTournament executes a round-robin tournament between all squads
func (e *Evaluator) runTournament(ctx context.Context, squads [][]sim.Unit, labels []string, config FitnessConfig) (*TournamentResult, error) {
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
	timedOut := 0

	go func() {
		wg.Wait()
		close(results)
	}()

	for result := range results {
		if result.completed {
			wins[result.winnerIndex]++
			totalGames++
			if result.timedOut {
				timedOut++
			}
		}
	}

	if totalGames == 0 {
		return nil, errors.New("no games completed in tournament")
	}

	// Le nombre total de victoires est égal au nombre total de parties jouées
	totalWins := float64(totalGames)

	winShares := make([]float64, numSquads)
	squadResults := make([]SquadResult, 0, numSquads)
	gamesPerSquad := (numSquads - 1) * 2

	for i := 0; i < numSquads; i++ {
		winShares[i] = float64(wins[i]) / totalWins

		squadResults = append(squadResults, SquadResult{
			Index:   i,
			Wins:    wins[i],
			Games:   gamesPerSquad,
			WinRate: float64(wins[i]) / float64(gamesPerSquad),
		})
	}

	hhi := e.calculateHHI(winShares)

	// Biais d'archétype : écart maximal du win-rate des escouades
	// mono-archétype à l'équilibre parfait (50 %), ramené dans [0, 1].
	skew := 0.0
	for i, label := range labels {
		if label == "mixed-1" || label == "mixed-2" {
			continue
		}
		deviation := math.Abs(squadResults[i].WinRate-0.5) * 2
		if deviation > skew {
			skew = deviation
		}
	}

	return &TournamentResult{
		WinShares:      winShares,
		TotalGames:     int64(totalGames),
		TimedOutGames:  int64(timedOut),
		HHI:            hhi,
		ArchetypeSkew:  skew,
		SquadResults:   squadResults,
		SquadArchetype: labels,
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

		winner, timedOut, err := e.runSingleGame(ctx, squads[job.squad1Index], squads[job.squad2Index], config)
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
			timedOut:    timedOut,
		}
	}
}

// runSingleGame executes a single simulation between two squads.
// Le booléen retourné signale une partie départagée par la limite de tours :
// c'est le symptôme d'attentisme que le fitness pénalise.
func (e *Evaluator) runSingleGame(ctx context.Context, squad1, squad2 []sim.Unit, config FitnessConfig) (sim.PlayerID, bool, error) {
	strategy := sim.SearchStrategy(config.SearchDepth, config.SearchBudget)
	game := sim.NewGame(squad1, squad2,
		sim.WithPlayerStrategy(sim.PlayerOne, strategy),
		sim.WithPlayerStrategy(sim.PlayerTwo, strategy),
		sim.WithMaxTurns(uint(config.MaxSimSteps)),
	)

	for step := range game.Run() {
		select {
		case <-ctx.Done():
			return -1, false, ctx.Err()
		default:
			if step.IsOver {
				timedOut := step.Turn >= uint(config.MaxSimSteps)
				return step.Winner, timedOut, nil
			}
		}
	}

	return sim.GetWinnerOnTimeout(game.State()), true, nil
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
	return child1, child2
}

// mutate applies random mutations to an individual with adaptive step sizes.
// Step sizes shrink as generations progress (starts at 100%, decays to 10%).
func (e *Evaluator) mutate(individual Individual) Individual {
	mutated := Individual{Costs: individual.Costs, Fitness: 0}

	progress := 0.0
	if e.maxGenerations > 0 {
		progress = float64(e.generation) / float64(e.maxGenerations)
	}
	adaptiveFactor := 1.0 - 0.9*progress

	if rand.Float64() < e.mutationRate {
		mutated.Costs.HealthFactor += (rand.Float64()-0.5) * 0.2 * adaptiveFactor
		mutated.Costs.HealthFactor = math.Max(0.1, math.Min(5.0, mutated.Costs.HealthFactor))
	}
	if rand.Float64() < e.mutationRate {
		mutated.Costs.RangeFactor += (rand.Float64()-0.5) * 0.4 * adaptiveFactor
		mutated.Costs.RangeFactor = math.Max(0.1, math.Min(8.0, mutated.Costs.RangeFactor))
	}
	if rand.Float64() < e.mutationRate {
		mutated.Costs.RangeExponent += (rand.Float64()-0.5) * 0.1 * adaptiveFactor
		mutated.Costs.RangeExponent = math.Max(1.0, math.Min(2.0, mutated.Costs.RangeExponent))
	}
	if rand.Float64() < e.mutationRate {
		mutated.Costs.MoveFactor += (rand.Float64()-0.5) * 0.2 * adaptiveFactor
		mutated.Costs.MoveFactor = math.Max(0.1, math.Min(5.0, mutated.Costs.MoveFactor))
	}
	if rand.Float64() < e.mutationRate {
		mutated.Costs.MoveExponent += (rand.Float64()-0.5) * 0.1 * adaptiveFactor
		mutated.Costs.MoveExponent = math.Max(1.0, math.Min(2.0, mutated.Costs.MoveExponent))
	}
	if rand.Float64() < e.mutationRate {
		mutated.Costs.PowerFactor += (rand.Float64()-0.5) * 0.4 * adaptiveFactor
		mutated.Costs.PowerFactor = math.Max(0.1, math.Min(10.0, mutated.Costs.PowerFactor))
	}
	if rand.Float64() < e.mutationRate {
		mutated.Costs.PowerExponent += (rand.Float64()-0.5) * 0.1 * adaptiveFactor
		mutated.Costs.PowerExponent = math.Max(1.0, math.Min(2.0, mutated.Costs.PowerExponent))
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
		maxGenerations:       100,
		convergenceThreshold: 0.001, // More strict convergence threshold
	}

	for _, option := range options {
		option(e)
	}

	return e
}
