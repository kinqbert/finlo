package transaction

import "time"

type CreateInput struct {
	AccountID   string    `json:"account_id" validate:"required,uuid"`
	Type        string    `json:"type" validate:"required,oneof=income expense"`
	AmountMinor int64     `json:"amount_minor" validate:"required,gt=0"`
	Category    string    `json:"category" validate:"required,notblank,max=100"`
	Description string    `json:"description" validate:"max=500"`
	OccurredAt  time.Time `json:"occurred_at" validate:"required"`
}
