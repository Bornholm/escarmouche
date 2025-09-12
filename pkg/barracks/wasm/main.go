//go:build js && wasm
// +build js,wasm

package main

import (
	"syscall/js"

	"github.com/bornholm/escarmouche/pkg/barracks"
	"github.com/pkg/errors"
)

func main() {
	js.Global().Set("Barracks", map[string]any{
		"evaluate": js.FuncOf(evaluate),
	})

	select {}
}

func evaluate(this js.Value, args []js.Value) any {
	return withPromise(func() (map[string]any, error) {
		unit := &barracks.Unit{
			Health: args[0].Get("health").Int(),
			Reach:  args[0].Get("reach").Int(),
			Move:   args[0].Get("move").Int(),
			Attack: args[0].Get("attack").Int(),
		}

		evaluation, err := barracks.Evaluate(unit)
		if err != nil {
			return nil, errors.Wrap(err, "could not evaluate unit")
		}

		return map[string]any{
			"rank": evaluation.Rank.String(),
			"cost": evaluation.Cost,
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
