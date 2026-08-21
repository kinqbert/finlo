package finance

import (
	"time"

	"gorm.io/gorm"
)

type Account struct {
	ID           string         `json:"id" gorm:"primaryKey"`
	UserID       string         `json:"-" gorm:"index;not null"`
	Name         string         `json:"name" gorm:"not null"`
	Type         string         `json:"type" gorm:"not null"`
	Currency     string         `json:"currency" gorm:"size:3;not null"`
	BalanceMinor int64          `json:"balance_minor" gorm:"not null"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
}

type Transaction struct {
	ID          string         `json:"id" gorm:"primaryKey"`
	UserID      string         `json:"-" gorm:"index;not null"`
	AccountID   string         `json:"account_id" gorm:"index;not null"`
	Type        string         `json:"type" gorm:"not null"`
	AmountMinor int64          `json:"amount_minor" gorm:"not null"`
	Currency    string         `json:"currency" gorm:"size:3;not null"`
	Category    string         `json:"category" gorm:"not null"`
	Description string         `json:"description"`
	OccurredAt  time.Time      `json:"occurred_at" gorm:"index;not null"`
	Source      string         `json:"source" gorm:"not null"`
	ExternalID  *string        `json:"external_id,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
}

type Budget struct {
	ID          string    `json:"id" gorm:"primaryKey"`
	UserID      string    `json:"-" gorm:"index;not null"`
	Category    string    `json:"category" gorm:"not null"`
	AmountMinor int64     `json:"amount_minor" gorm:"not null"`
	Currency    string    `json:"currency" gorm:"size:3;not null"`
	Month       time.Time `json:"-" gorm:"type:date;not null"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type EmergencyFund struct {
	UserID       string    `json:"-" gorm:"primaryKey"`
	TargetMinor  int64     `json:"target_minor" gorm:"not null"`
	CurrentMinor int64     `json:"current_minor" gorm:"not null"`
	Currency     string    `json:"currency" gorm:"size:3;not null"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Subscription struct {
	ID              string         `json:"id" gorm:"primaryKey"`
	UserID          string         `json:"-" gorm:"index;not null"`
	AccountID       *string        `json:"account_id,omitempty"`
	Name            string         `json:"name" gorm:"not null"`
	AmountMinor     int64          `json:"amount_minor" gorm:"not null"`
	Currency        string         `json:"currency" gorm:"size:3;not null"`
	BillingDay      int            `json:"billing_day" gorm:"not null"`
	Active          bool           `json:"active" gorm:"not null"`
	NextPaymentDate *time.Time     `json:"next_payment_date,omitempty" gorm:"type:date"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `json:"-" gorm:"index"`
}
