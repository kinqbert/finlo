package monobankapi

import (
	"fmt"

	"github.com/kinqbert/finlo/server/internal/domain/currency"
)

func Currency(code int) (string, error) {
	definition, supported := currency.ByNumericCode(code)
	if !supported {
		return "", fmt.Errorf("unsupported Monobank currency code %d", code)
	}
	return definition.Code, nil
}
