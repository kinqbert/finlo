package finance

import (
	"encoding/json"
	"strings"
	"testing"
	"time"
)

func TestParseMonth(t *testing.T) {
	month, err := parseMonth("2026-08")
	if err != nil {
		t.Fatalf("parseMonth() error = %v", err)
	}
	want := time.Date(2026, time.August, 1, 0, 0, 0, 0, time.UTC)
	if !month.Equal(want) {
		t.Fatalf("parseMonth() = %v, want %v", month, want)
	}

	if _, err := parseMonth("08/2026"); err == nil {
		t.Fatal("parseMonth() accepted an invalid value")
	}
}

func TestNormalizeCurrency(t *testing.T) {
	if got := normalizeCurrency(" uah "); got != "UAH" {
		t.Fatalf("normalizeCurrency() = %q, want UAH", got)
	}
}

func TestParseOptionalDate(t *testing.T) {
	value := "2026-08-21"
	date, err := parseOptionalDate(&value)
	if err != nil {
		t.Fatalf("parseOptionalDate() error = %v", err)
	}
	if date.Format("2006-01-02") != value {
		t.Fatalf("parseOptionalDate() = %v", date)
	}
}

func TestTransactionCategoryJSONContract(t *testing.T) {
	transaction := Transaction{
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

func TestMapBudgetKeepsCategoryName(t *testing.T) {
	budget := Budget{CategoryID: "category-id", Category: "Groceries"}

	result := mapBudget(budget)
	if result.Category != "Groceries" {
		t.Fatalf("mapBudget().Category = %q, want Groceries", result.Category)
	}
}
