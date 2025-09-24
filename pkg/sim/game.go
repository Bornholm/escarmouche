package sim

import (
	"fmt"
	"io"
	"maps"
	"os"
)

type PlayerID int

const (
	PlayerOne PlayerID = iota
	PlayerTwo
)

type UnitID int

type Position struct {
	X, Y int
}

func (p Position) String() string {
	return fmt.Sprintf("%d,%d", p.X, p.Y)
}

type UnitStats struct {
	Health int
	Reach  int
	Attack int
	Move   int
}

type PlayerUnit struct {
	Unit

	ID      UnitID
	OwnerID PlayerID
}

type GameState struct {
	Attacks         map[UnitID]int
	Healths         map[UnitID]int
	Positions       map[UnitID]Position
	Board           map[string]UnitID
	Units           map[UnitID]*PlayerUnit
	CurrentPlayerID PlayerID
	ActionsLeft     int
}

func (s GameState) Copy() GameState {
	copy := GameState{
		Attacks:         map[UnitID]int{},
		Healths:         map[UnitID]int{},
		Positions:       map[UnitID]Position{},
		Board:           map[string]UnitID{},
		Units:           map[UnitID]*PlayerUnit{},
		CurrentPlayerID: s.CurrentPlayerID,
		ActionsLeft:     s.ActionsLeft,
	}

	maps.Copy(copy.Units, s.Units)
	maps.Copy(copy.Board, s.Board)
	maps.Copy(copy.Positions, s.Positions)
	maps.Copy(copy.Healths, s.Healths)
	maps.Copy(copy.Attacks, s.Attacks)

	return copy
}

func (s GameState) PrintConsole() {
	s.Print(os.Stdout)
}

func (s GameState) Print(w io.Writer) {
	fmt.Fprintln(w, "┌────┬────┬────┬────┬────┬────┬────┬────┐")

	for row := 0; row < 8; row++ {
		fmt.Fprint(w, "|")

		for col := 0; col < 8; col++ {
			pos := Position{X: col, Y: row}
			if unitID, exists := s.Board[pos.String()]; exists {
				fmt.Fprintf(w, "%3d │", unitID)
			} else {
				fmt.Fprint(w, "    │")
			}
		}

		if row == 7 {
			fmt.Fprintln(w, "\n└────┴────┴────┴────┴────┴────┴────┴────┘")
		} else {
			fmt.Fprintln(w, "\n├────┼────┼────┼────┼────┼────┼────┼────┤")
		}
	}
}
