package exchangerate

import (
	"testing"
	"time"

	"github.com/kinqbert/finlo/server/internal/integration/monobankapi"
)

func TestSnapshotsFromRates(t *testing.T) {
	t.Parallel()
	now := time.Date(2026, 8, 23, 18, 30, 0, 0, time.UTC)
	snapshots, err := snapshotsFromRates([]monobankapi.CurrencyRate{
		{CurrencyCodeA: 840, CurrencyCodeB: 980, Date: 100, RateBuy: 44.43, RateSell: 44.831},
		{CurrencyCodeA: 978, CurrencyCodeB: 980, Date: 200, RateCross: 51.9},
		{CurrencyCodeA: 978, CurrencyCodeB: 840, Date: 200, RateBuy: 1.16, RateSell: 1.17},
	}, now)
	if err != nil {
		t.Fatalf("snapshotsFromRates() error = %v", err)
	}
	if len(snapshots) != 3 {
		t.Fatalf("got %d snapshots, want 3", len(snapshots))
	}
	byCurrency := make(map[string]Snapshot, len(snapshots))
	for _, snapshot := range snapshots {
		byCurrency[snapshot.SourceCurrency] = snapshot
	}
	if snapshot := byCurrency["USD"]; snapshot.BuyRateMicros != 44_430_000 {
		t.Fatalf("unexpected USD snapshot: %+v", snapshot)
	}
	if snapshot := byCurrency["EUR"]; snapshot.BuyRateMicros != 51_900_000 || snapshot.SellRateMicros != 51_900_000 {
		t.Fatalf("unexpected EUR snapshot: %+v", snapshot)
	}
	if snapshot := byCurrency["USD"]; !snapshot.RateDate.Equal(time.Date(2026, 8, 23, 0, 0, 0, 0, time.UTC)) {
		t.Fatalf("rate date = %s", snapshot.RateDate)
	}
	if snapshot := byCurrency["UAH"]; snapshot.BuyRateMicros != 1_000_000 {
		t.Fatalf("unexpected UAH snapshot: %+v", snapshot)
	}
}

func TestSnapshotsFromRatesRequiresSupportedPairs(t *testing.T) {
	t.Parallel()
	_, err := snapshotsFromRates([]monobankapi.CurrencyRate{{CurrencyCodeA: 840, CurrencyCodeB: 980, RateBuy: 44, RateSell: 45}}, time.Now())
	if err == nil {
		t.Fatal("snapshotsFromRates() accepted a response without EUR/UAH")
	}
}
