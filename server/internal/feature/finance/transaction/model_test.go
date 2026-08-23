package transaction

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/kinqbert/finlo/server/internal/feature/finance/model"
)

func TestCategoryJSONContract(t *testing.T) {
	transaction := model.Transaction{
		CategoryID: "category-id",
		Category:   "Salary",
	}

	payload, err := json.Marshal(transaction)
	if err != nil {
		t.Fatalf("json.Marshal() error = %v", err)
	}
	if !strings.Contains(string(payload), `"category":"Salary"`) {
		t.Fatalf("transaction JSON does not include category name: %s", payload)
	}
	if strings.Contains(string(payload), "category_id") {
		t.Fatalf("transaction JSON exposes internal category ID: %s", payload)
	}
}
