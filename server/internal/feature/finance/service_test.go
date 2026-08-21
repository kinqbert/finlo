package finance

import (
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
