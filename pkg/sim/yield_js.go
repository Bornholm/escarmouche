//go:build js && wasm

package sim

import "time"

// En WebAssembly, le runtime Go partage le thread de l'interface : une
// recherche de plusieurs milliers de nœuds gèle le rendu, les animations et
// les entrées tactiles — sur mobile, l'application paraît morte pendant le
// tour de l'IA. Dormir une milliseconde à intervalle régulier rend la main à
// la boucle d'événements du navigateur : l'interface respire pendant que
// l'IA réfléchit.
const yieldInterval = 1200

func maybeYield(nodes int) {
	if nodes%yieldInterval == 0 {
		time.Sleep(time.Millisecond)
	}
}
