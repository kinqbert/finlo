package budget

import "time"

type CreateInput struct {
	Category    string `json:"category" validate:"required,notblank,max=100"`
	AmountMinor int64  `json:"amount_minor" validate:"required,gt=0"`
	Currency    string `json:"currency" validate:"required,supportedcurrency"`
	Month       string `json:"month" validate:"required"`
}

type DTO struct {
	ID          string    `json:"id"`
	Category    string    `json:"category"`
	AmountMinor int64     `json:"amount_minor"`
	Currency    string    `json:"currency"`
	Month       string    `json:"month"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
