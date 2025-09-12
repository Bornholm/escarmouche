package core

import (
	"github.com/pkg/errors"
)

type Rank int

const (
	RankTrooper Rank = iota
	RankVeteran
	RankElite
	RankChampion
	RankParagon
)

var Ranks = []Rank{RankTrooper, RankVeteran, RankElite, RankChampion, RankParagon}

func (r Rank) String() string {
	switch r {
	case RankTrooper:
		return "trooper"
	case RankVeteran:
		return "veteran"
	case RankElite:
		return "elite"
	case RankChampion:
		return "champion"
	case RankParagon:
		return "paragon"
	default:
		panic(errors.Errorf("unknown rank '%d'", r))
	}
}
