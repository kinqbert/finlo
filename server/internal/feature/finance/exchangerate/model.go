package exchangerate

import "time"

type Snapshot struct {
	ID                string    `gorm:"primaryKey"`
	SourceCurrency    string    `gorm:"size:3;not null"`
	TargetCurrency    string    `gorm:"size:3;not null"`
	BuyRateMicros     int64     `gorm:"not null"`
	SellRateMicros    int64     `gorm:"not null"`
	Provider          string    `gorm:"not null"`
	ProviderTimestamp time.Time `gorm:"not null"`
	FetchedAt         time.Time `gorm:"not null"`
	RateDate          time.Time `gorm:"type:date;not null"`
}

func (Snapshot) TableName() string { return "exchange_rate_snapshots" }
