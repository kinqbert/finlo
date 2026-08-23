package shared

import (
	"testing"
	"time"
)

func TestParseMonth(t *testing.T) {
	month, err := ParseMonth("2026-08")
	if err != nil {
		t.Fatalf("ParseMonth() error = %v", err)
	}
	want := time.Date(2026, time.August, 1, 0, 0, 0, 0, time.UTC)
	if !month.Equal(want) {
		t.Fatalf("ParseMonth() = %v, want %v", month, want)
	}
	if _, err := ParseMonth("08/2026"); err == nil {
		t.Fatal("ParseMonth() accepted an invalid value")
	}
}

func TestNormalizeCurrency(t *testing.T) {
	if got := NormalizeCurrency(" uah "); got != "UAH" {
		t.Fatalf("NormalizeCurrency() = %q, want UAH", got)
	}
}

func TestParseOptionalDate(t *testing.T) {
	value := "2026-08-21"
	date, err := ParseOptionalDate(&value)
	if err != nil {
		t.Fatalf("ParseOptionalDate() error = %v", err)
	}
	if date.Format("2006-01-02") != value {
		t.Fatalf("ParseOptionalDate() = %v", date)
	}
}
