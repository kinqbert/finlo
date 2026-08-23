package currency

import "testing"

func TestRegistryLookups(t *testing.T) {
	t.Parallel()

	if codes := Codes(); len(codes) != 3 || codes[0] != "UAH" || codes[1] != "USD" || codes[2] != "EUR" {
		t.Fatalf("Codes() = %v", codes)
	}
	if definition, ok := ByNumericCode(840); !ok || definition.Code != "USD" || definition.Symbol != "$" {
		t.Fatalf("ByNumericCode(840) = %+v, %v", definition, ok)
	}
	if !IsSupported(" eur ") {
		t.Fatal("IsSupported() rejected normalized EUR")
	}
	if IsSupported("GBP") {
		t.Fatal("IsSupported() accepted GBP")
	}
	if base := Base(); base.Code != "UAH" || !base.Base || base.NumericCode != 980 {
		t.Fatalf("Base() = %+v", base)
	}
}
