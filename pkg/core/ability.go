package core

import (
	"embed"
	"io/fs"
	"path/filepath"
	"strings"
	"sync"

	"github.com/pkg/errors"
	"go.yaml.in/yaml/v3"
)

type Ability struct {
	ID          string
	Label       Text    `yaml:"label"`
	Description Text    `yaml:"description"`
	Cost        float64 `yaml:"cost"`
}

//go:embed abilities/*.yml
var abilitiesFS embed.FS

var (
	abilities map[string]Ability
	loadOnce  sync.Once
)

func loadAbilities() {
	loadOnce.Do(func() {
		abilities = map[string]Ability{}

		files, err := fs.Glob(abilitiesFS, "abilities/*.yml")
		if err != nil {
			panic(errors.Wrap(err, "could not find abilities"))
		}

		for _, f := range files {
			ability, err := parseAbilityFile(f)
			if err != nil {
				panic(errors.Wrapf(err, "could not parse ability file '%s'", f))
			}

			abilities[ability.ID] = ability
		}
	})
}

func parseAbilityFile(path string) (Ability, error) {
	f, err := abilitiesFS.Open(path)
	if err != nil {
		return Ability{}, errors.WithStack(err)
	}

	defer f.Close()

	ability := Ability{}

	decoder := yaml.NewDecoder(f)

	if err := decoder.Decode(&ability); err != nil {
		return Ability{}, errors.WithStack(err)
	}

	ability.ID = strings.TrimSuffix(filepath.Base(path), filepath.Ext(path))

	return ability, nil
}

func Abilities(ids ...string) []Ability {
	loadAbilities()

	selected := make([]Ability, 0, len(ids))
	for _, id := range ids {
		ability, exists := abilities[id]
		if !exists {
			panic(errors.Errorf("could not find ability '%s'", id))
		}

		selected = append(selected, ability)
	}

	return selected
}
