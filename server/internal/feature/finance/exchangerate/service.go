package exchangerate

import (
	"context"
	"fmt"
	"math"
	"time"

	"github.com/google/uuid"
	currencydomain "github.com/kinqbert/finlo/server/internal/domain/currency"
	"github.com/kinqbert/finlo/server/internal/integration/monobankapi"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const (
	ProviderMonobank = "monobank"
	rateScale        = 1_000_000
)

var TargetCurrency = currencydomain.Base().Code

type Service struct {
	db     *gorm.DB
	client monobankapi.RatesClient
}

func NewService(db *gorm.DB, client monobankapi.RatesClient) *Service {
	return &Service{db: db, client: client}
}

func (s *Service) Refresh(ctx context.Context) error {
	rates, err := s.client.CurrencyRates(ctx)
	if err != nil {
		return fmt.Errorf("load Monobank currency rates: %w", err)
	}
	snapshots, err := snapshotsFromRates(rates, time.Now().UTC())
	if err != nil {
		return err
	}
	return s.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "provider"}, {Name: "source_currency"}, {Name: "target_currency"}, {Name: "rate_date"}},
		DoUpdates: clause.AssignmentColumns([]string{"buy_rate_micros", "sell_rate_micros", "provider_timestamp", "fetched_at"}),
	}).Create(&snapshots).Error
}

func snapshotsFromRates(rates []monobankapi.CurrencyRate, fetchedAt time.Time) ([]Snapshot, error) {
	definitions := currencydomain.All()
	base := currencydomain.Base()
	byCurrency := make(map[string]Snapshot, len(definitions)-1)
	for _, rate := range rates {
		definition, supported := currencydomain.ByNumericCode(rate.CurrencyCodeA)
		if !supported || definition.Base || rate.CurrencyCodeB != base.NumericCode {
			continue
		}
		buy, sell := rate.RateBuy, rate.RateSell
		if buy <= 0 {
			buy = rate.RateCross
		}
		if sell <= 0 {
			sell = rate.RateCross
		}
		if buy <= 0 || sell <= 0 {
			continue
		}
		providerTime := time.Unix(rate.Date, 0).UTC()
		byCurrency[definition.Code] = Snapshot{
			ID: uuid.NewString(), SourceCurrency: definition.Code, TargetCurrency: TargetCurrency,
			BuyRateMicros: int64(math.Round(buy * rateScale)), SellRateMicros: int64(math.Round(sell * rateScale)),
			Provider: ProviderMonobank, ProviderTimestamp: providerTime, FetchedAt: fetchedAt,
			RateDate: time.Date(fetchedAt.Year(), fetchedAt.Month(), fetchedAt.Day(), 0, 0, 0, 0, time.UTC),
		}
	}
	if len(byCurrency) != len(definitions)-1 {
		return nil, fmt.Errorf("Monobank response did not include every supported exchange rate to %s", base.Code)
	}
	snapshots := make([]Snapshot, 0, len(definitions))
	for _, definition := range definitions {
		if snapshot, ok := byCurrency[definition.Code]; ok {
			snapshots = append(snapshots, snapshot)
			continue
		}
		snapshots = append(snapshots, Snapshot{
			ID: uuid.NewString(), SourceCurrency: definition.Code, TargetCurrency: TargetCurrency,
			BuyRateMicros: rateScale, SellRateMicros: rateScale, Provider: ProviderMonobank,
			ProviderTimestamp: fetchedAt, FetchedAt: fetchedAt,
			RateDate: time.Date(fetchedAt.Year(), fetchedAt.Month(), fetchedAt.Day(), 0, 0, 0, 0, time.UTC),
		})
	}
	return snapshots, nil
}

func (s *Service) LatestToUAH(ctx context.Context) (map[string]Snapshot, error) {
	var snapshots []Snapshot
	if err := s.db.WithContext(ctx).Raw(`
		SELECT DISTINCT ON (source_currency) *
		FROM exchange_rate_snapshots
		WHERE provider = ? AND target_currency = ? AND source_currency IN ?
		ORDER BY source_currency, fetched_at DESC`, ProviderMonobank, TargetCurrency, currencydomain.Codes()).Scan(&snapshots).Error; err != nil {
		return nil, fmt.Errorf("load latest exchange rates: %w", err)
	}
	result := make(map[string]Snapshot, len(snapshots))
	for _, snapshot := range snapshots {
		result[snapshot.SourceCurrency] = snapshot
	}
	return result, nil
}
