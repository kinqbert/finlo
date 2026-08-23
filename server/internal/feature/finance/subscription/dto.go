package subscription

type CreateInput struct {
	AccountID       *string `json:"account_id" validate:"omitempty,uuid"`
	Name            string  `json:"name" validate:"required,notblank,max=100"`
	AmountMinor     int64   `json:"amount_minor" validate:"required,gt=0"`
	Currency        string  `json:"currency" validate:"required,alpha,len=3"`
	BillingDay      int     `json:"billing_day" validate:"required,min=1,max=31"`
	Active          *bool   `json:"active"`
	NextPaymentDate *string `json:"next_payment_date"`
}

type UpdateInput struct {
	AccountID       *string `json:"account_id" validate:"omitempty,uuid"`
	Name            *string `json:"name" validate:"omitempty,notblank,max=100"`
	AmountMinor     *int64  `json:"amount_minor" validate:"omitempty,gt=0"`
	BillingDay      *int    `json:"billing_day" validate:"omitempty,min=1,max=31"`
	Active          *bool   `json:"active"`
	NextPaymentDate *string `json:"next_payment_date"`
}
