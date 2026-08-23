package validator

import "testing"

func TestSupportedCurrencyValidation(t *testing.T) {
	t.Parallel()

	type input struct {
		Currency string `json:"currency" validate:"required,supportedcurrency"`
	}
	validate := New()
	if err := validate.Validate(input{Currency: "EUR"}); err != nil {
		t.Fatalf("Validate(EUR) error = %v", err)
	}
	if err := validate.Validate(input{Currency: "GBP"}); err == nil {
		t.Fatal("Validate(GBP) succeeded")
	}
}
