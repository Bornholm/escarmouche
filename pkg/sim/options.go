package sim

type Options struct {
	Strategies map[PlayerID]StrategyFunc
	MaxTurns   uint
	// Obstacles : emplacements choisis pendant la mise en place (un par
	// joueur). Vide = tirage aléatoire parmi les emplacements valides.
	Obstacles []Position
	// Deployment : position de chaque unité, indexée par joueur puis par rang
	// dans la liste d'unités fournie à NewGame. Vide = placement aléatoire sur
	// la première rangée (comportement historique, utile aux tests et au
	// balancer qui n'ont pas de phase de mise en place).
	Deployment map[PlayerID][]Position
}

type OptionFunc func(opts *Options)

func NewOptions(funcs ...OptionFunc) *Options {
	opts := &Options{
		Strategies: map[PlayerID]StrategyFunc{
			PlayerOne: DefaultStrategy,
			PlayerTwo: DefaultStrategy,
		},
		// L'objectif de capture termine les parties bien avant : 60 tours
		// est une borne de sécurité, plus un temps de jeu attendu.
		MaxTurns: 60,
	}
	for _, fn := range funcs {
		fn(opts)
	}
	return opts
}

// WithMaxTurns borne la durée d'une partie (départage par points de
// contrôle puis santé, cf. GetWinnerOnTimeout).
func WithMaxTurns(maxTurns uint) OptionFunc {
	return func(opts *Options) {
		opts.MaxTurns = maxTurns
	}
}

// WithDeployment fixe la position initiale de chaque unité, telle que décidée
// pendant la phase de déploiement alterné.
func WithDeployment(deployment map[PlayerID][]Position) OptionFunc {
	return func(opts *Options) {
		opts.Deployment = deployment
	}
}

// WithObstacles fixe les obstacles posés pendant la mise en place.
func WithObstacles(positions ...Position) OptionFunc {
	return func(opts *Options) {
		opts.Obstacles = positions
	}
}

func WithPlayerStrategy(playerID PlayerID, strategy StrategyFunc) OptionFunc {
	return func(opts *Options) {
		opts.Strategies[playerID] = strategy
	}
}

// WithLookaheadDepth configures both players to use alpha-beta minimax at the given depth.
// depth=1 is fast (one action ahead), depth=2 is the default (full response lookahead).
func WithLookaheadDepth(depth int) OptionFunc {
	strategy := LookaheadStrategy(depth)
	return func(opts *Options) {
		opts.Strategies[PlayerOne] = strategy
		opts.Strategies[PlayerTwo] = strategy
	}
}
