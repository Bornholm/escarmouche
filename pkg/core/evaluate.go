package core

type Evaluation struct {
	Cost float64
	Rank Rank
}

// Evaluate calcule le coût total d'une unité et en déduit son rang.
//
// Le rang est purement narratif : c'est un titre affiché sur la carte, dérivé
// de bandes de coût fixes. Il n'entre plus dans aucune comptabilité — les
// escouades se composent directement en points de coût (cf. gen.RandomSquad).
//
// L'ancien système passait par un moteur flou avec une variable « expertise »
// (nombre de capacités) qui faisait sauter un rang entier dès la première
// capacité, alors que le coût des capacités était déjà compté : une double
// taxation qui rendait toute capacité irrationnelle à l'achat.
func Evaluate(stats Stats, abilities []Ability, costs Costs) (*Evaluation, error) {
	cost := CalculateTotalCost(stats, abilities, costs)

	return &Evaluation{
		Cost: cost,
		Rank: RankFromCost(cost, costs.MaxTotal),
	}, nil
}

// RankFromCost découpe l'échelle de coût [0, maxCost] en cinq bandes égales
// en s'appuyant sur les proportions de l'ancienne échelle (maxCost = 30 :
// ≤10 Soldat, ≤16 Vétéran, ≤22 Élite, ≤27 Champion, au-delà Parangon).
func RankFromCost(cost float64, maxCost float64) Rank {
	if maxCost <= 0 {
		maxCost = 30
	}
	ratio := cost / maxCost

	switch {
	case ratio <= 1.0/3.0:
		return RankTrooper
	case ratio <= 16.0/30.0:
		return RankVeteran
	case ratio <= 22.0/30.0:
		return RankElite
	case ratio <= 27.0/30.0:
		return RankChampion
	default:
		return RankParagon
	}
}
