package sim

type Options struct {
	Strategies map[PlayerID]StrategyFunc
	MaxTurns   uint
}

type OptionFunc func(opts *Options)

func NewOptions(funcs ...OptionFunc) *Options {
	opts := &Options{
		Strategies: map[PlayerID]StrategyFunc{
			PlayerOne: DefaultStrategy,
			PlayerTwo: DefaultStrategy,
		},
		MaxTurns: 100,
	}
	for _, fn := range funcs {
		fn(opts)
	}
	return opts
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
