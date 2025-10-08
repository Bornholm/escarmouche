//go:build js && wasm
// +build js,wasm

package main

import (
	"slices"
	"syscall/js"

	"github.com/bornholm/escarmouche/pkg/core"
	"github.com/bornholm/escarmouche/pkg/gen"
	"github.com/pkg/errors"
)

func main() {
	rankPointCosts := map[string]any{}
	for r, c := range gen.DefaultRankPointCosts {
		rankPointCosts[r.String()] = c
	}

	js.Global().Set("Barracks", map[string]any{
		"evaluateUnit":       js.FuncOf(evaluateUnit),
		"generateSquad":      js.FuncOf(generateSquad),
		"generateUnit":       js.FuncOf(generateUnit),
		"RankPointCosts":     js.ValueOf(rankPointCosts),
		"MaxSquadSize":       js.ValueOf(gen.DefaultMaxSquadSize),
		"MaxSquadRankPoints": js.ValueOf(gen.DefaultMaxRankPoints),
	})

	select {}
}

func evaluateUnit(this js.Value, args []js.Value) any {
	return withPromise(func() (map[string]any, error) {
		stats := core.Stats{
			Health: args[0].Get("health").Int(),
			Reach:  args[0].Get("reach").Int(),
			Move:   args[0].Get("move").Int(),
			Attack: args[0].Get("attack").Int(),
		}

		abilities := []core.Ability{}

		if jsAbilities := args[0].Get("abilities"); jsAbilities.Truthy() {
			len := jsAbilities.Length()
			ids := make([]string, 0, len)

			for i := 0; i < len; i++ {
				ids = append(ids, jsAbilities.Index(i).Get("id").String())
			}

			abilities = core.Abilities(ids...)
		}

		evaluation, err := core.Evaluate(stats, abilities, core.DefaultCosts)
		if err != nil {
			return nil, errors.Wrap(err, "could not evaluate unit")
		}

		return map[string]any{
			"rank": evaluation.Rank.String(),
			"cost": evaluation.Cost,
		}, nil
	})
}

func generateSquad(this js.Value, args []js.Value) any {
	return withPromise(func() ([]map[string]any, error) {
		squad, err := gen.RandomSquad(gen.DefaultMaxRankPoints, gen.DefaultMaxSquadSize, gen.DefaultRankPointCosts, core.DefaultCosts, gen.DefaultArchetypes...)
		if err != nil {
			return nil, errors.WithStack(err)
		}

		jsSquad := slices.Collect(func(yield func(map[string]any) bool) {
			for _, u := range squad {
				unit := map[string]any{
					"health":    u.Stats.Health,
					"move":      u.Stats.Move,
					"reach":     u.Stats.Reach,
					"attack":    u.Stats.Attack,
					"cost":      u.TotalCost,
					"rank":      u.Rank.String(),
					"archetype": u.Archetype.Name,
				}
				if !yield(unit) {
					return
				}
			}
		})

		return jsSquad, nil
	})
}

func generateUnit(this js.Value, args []js.Value) any {
	return withPromise(func() (map[string]any, error) {
		rank, err := core.ParseRank(args[0].String())
		if err != nil {
			return nil, errors.WithStack(err)
		}

		archetype, err := gen.ParseArchetype(args[1].String())
		if err != nil {
			return nil, errors.WithStack(err)
		}

		unit, err := gen.RandomUnit(rank, archetype, core.DefaultCosts)
		if err != nil {
			return nil, errors.WithStack(err)
		}

		abilities := make([]any, 0, len(unit.Abilities))
		for _, a := range unit.Abilities {
			abilities = append(abilities, map[string]any{
				"id":          a.ID,
				"description": a.Description.String(),
				"label":       a.Label.String(),
			})
		}

		return map[string]any{
			"health":    unit.Stats.Health,
			"move":      unit.Stats.Move,
			"reach":     unit.Stats.Reach,
			"attack":    unit.Stats.Attack,
			"cost":      unit.TotalCost,
			"rank":      unit.Rank.String(),
			"archetype": unit.Archetype.Name,
			"abilities": abilities,
		}, nil
	})
}

func withPromise[T any](fn func() (T, error)) js.Value {
	handler := js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		resolve := args[0]
		reject := args[1]

		go func() {
			result, err := fn()
			if err != nil {
				errorConstructor := js.Global().Get("Error")
				errorObject := errorConstructor.New(err.Error())
				reject.Invoke(errorObject)
			} else {
				resolve.Invoke(js.ValueOf(result))
			}
		}()

		return nil
	})

	promiseConstructor := js.Global().Get("Promise")

	return promiseConstructor.New(handler)
}
