package sim

type Options struct {
	Strategies map[PlayerID]StrategyFunc
}

type OptionFunc func(opts *Options)

func NewOptions(funcs ...OptionFunc) *Options {
	opts := &Options{
		Strategies: map[PlayerID]StrategyFunc{
			PlayerOne: DefaultStrategy,
			PlayerTwo: DefaultStrategy,
		},
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
