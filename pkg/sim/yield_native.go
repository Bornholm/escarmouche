//go:build !js

package sim

// Hors WASM (tests, balancer), il n'y a pas de boucle d'événements à ménager.
func maybeYield(int) {}
