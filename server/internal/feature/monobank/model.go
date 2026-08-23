package monobank

import "time"

type Connection struct {
	ID                string `gorm:"primaryKey"`
	UserID            string `gorm:"uniqueIndex;not null"`
	EncryptedToken    []byte `gorm:"not null"`
	MonobankClientID  string `gorm:"column:monobank_client_id;not null;uniqueIndex"`
	ClientName        string `gorm:"not null"`
	Status            string `gorm:"not null"`
	ClientSnapshot    []byte `gorm:"type:jsonb"`
	WebhookSecret     string `gorm:"not null;uniqueIndex"`
	WebhookConfigured bool   `gorm:"not null"`
	ConnectedAt       *time.Time
	LastError         string `gorm:"not null"`
	CreatedAt         time.Time
	UpdatedAt         time.Time
}

func (Connection) TableName() string { return "monobank_connections" }

type AccountLink struct {
	ID                string `gorm:"primaryKey"`
	ConnectionID      string `gorm:"not null"`
	AccountID         string `gorm:"not null"`
	ExternalAccountID string `gorm:"not null"`
	CreatedAt         time.Time
}

func (AccountLink) TableName() string { return "monobank_account_links" }

type JarLink struct {
	ID            string `gorm:"primaryKey"`
	ConnectionID  string `gorm:"not null"`
	GoalID        string `gorm:"not null"`
	ExternalJarID string `gorm:"not null"`
	CreatedAt     time.Time
}

func (JarLink) TableName() string { return "monobank_jar_links" }
