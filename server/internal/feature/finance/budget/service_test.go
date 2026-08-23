package budget

import (
	"testing"

	"github.com/kinqbert/finlo/server/internal/feature/finance/model"
)

func TestMapKeepsCategoryName(t *testing.T) {
	item := model.Budget{CategoryID: "category-id", Category: "Groceries"}

	result := Map(item)
	if result.Category != "Groceries" {
		t.Fatalf("Map().Category = %q, want Groceries", result.Category)
	}
}
