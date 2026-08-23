package monobankapi

import (
	"testing"

	"github.com/kinqbert/finlo/server/internal/domain/currency"
)

func TestCurrency(t *testing.T) {
	t.Parallel()
	for _, definition := range currency.All() {
		got, err := Currency(definition.NumericCode)
		if err != nil || got != definition.Code {
			t.Fatalf("Currency(%d) = %q, %v; want %q", definition.NumericCode, got, err, definition.Code)
		}
	}
	if _, err := Currency(985); err == nil {
		t.Fatal("Currency() accepted an unsupported currency")
	}
}
