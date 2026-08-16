package sim

type Options struct {
	Strategies map[PlayerID]StrategyFunc
	MaxTurns   uint
	// Obstacles : emplacements choisis pendant la mise en place (un par
	// joueur). Vide = tirage aléatoire parmi les emplacements valides.
	Obstacles []Position
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
