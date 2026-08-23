package currency

import "strings"

type Definition struct {
	Code        string
	Name        string
	Symbol      string
	NumericCode int
	Base        bool
}

var registry = [...]Definition{
	{Code: "UAH", Name: "Ukrainian hryvnia", Symbol: "₴", NumericCode: 980, Base: true},
	{Code: "USD", Name: "US dollar", Symbol: "$", NumericCode: 840},
	{Code: "EUR", Name: "Euro", Symbol: "€", NumericCode: 978},
}

func All() []Definition {
	result := make([]Definition, len(registry))
	copy(result, registry[:])
	return result
}

func Codes() []string {
	result := make([]string, 0, len(registry))
	for _, definition := range registry {
		result = append(result, definition.Code)
	}
	return result
}

func Normalize(code string) string {
	return strings.ToUpper(strings.TrimSpace(code))
}

func ByCode(code string) (Definition, bool) {
	normalized := Normalize(code)
	for _, definition := range registry {
		if definition.Code == normalized {
			return definition, true
		}
	}
	return Definition{}, false
}

func ByNumericCode(code int) (Definition, bool) {
	for _, definition := range registry {
		if definition.NumericCode == code {
			return definition, true
		}
	}
	return Definition{}, false
}

func Base() Definition {
	for _, definition := range registry {
		if definition.Base {
			return definition
		}
	}
	return Definition{}
}

func IsSupported(code string) bool {
	_, supported := ByCode(code)
	return supported
}
