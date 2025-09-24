package core

type Language string

const (
	LanguageFR Language = "fr-FR"
	LanguageEN Language = "en-EN"
	LanguageES Language = "es-ES"
)

type Text map[Language]string

var (
	defaultLanguage = LanguageFR
	language        = LanguageFR
)

func SetLanguage(lang Language) {
	language = lang
}

func (t Text) String() string {
	str, ok := t[language]
	if ok {
		return str
	}

	str = t[defaultLanguage]

	return str
}
