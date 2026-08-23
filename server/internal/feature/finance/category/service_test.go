package category

import (
	"errors"
	"testing"

	"github.com/kinqbert/finlo/server/internal/feature/finance/model"
	"github.com/kinqbert/finlo/server/internal/http/apierror"
)

func TestValidateOrder(t *testing.T) {
	categories := []model.Category{{ID: "first"}, {ID: "second"}}
	if err := validateOrder(categories, []string{"second", "first"}); err != nil {
		t.Fatalf("validateOrder() error = %v", err)
	}
	for _, test := range []struct {
		name string
		ids  []string
	}{
		{name: "missing category", ids: []string{"first"}},
		{name: "duplicate category", ids: []string{"first", "first"}},
		{name: "unknown category", ids: []string{"first", "other"}},
	} {
		t.Run(test.name, func(t *testing.T) {
			err := validateOrder(categories, test.ids)
			var apiErr *apierror.Error
			if !errors.As(err, &apiErr) || apiErr.Code != "invalid_category_order" {
				t.Fatalf("validateOrder() error = %v, want invalid_category_order", err)
			}
		})
	}
}
