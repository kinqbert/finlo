package finance

import "time"

type CreateAccountInput struct {
	Name         string `json:"name" validate:"required,notblank,max=100"`
	Type         string `json:"type" validate:"required,oneof=cash bank card savings other"`
	Currency     string `json:"currency" validate:"required,alpha,len=3"`
	BalanceMinor int64  `json:"balance_minor"`
}

type UpdateAccountInput struct {
	Name         *string `json:"name" validate:"omitempty,notblank,max=100"`
	Type         *string `json:"type" validate:"omitempty,oneof=cash bank card savings other"`
	BalanceMinor *int64  `json:"balance_minor"`
}

type CreateTransactionInput struct {
	AccountID   string    `json:"account_id" validate:"required,uuid"`
	Type        string    `json:"type" validate:"required,oneof=income expense"`
	AmountMinor int64     `json:"amount_minor" validate:"required,gt=0"`
	Category    string    `json:"category" validate:"required,notblank,max=100"`
	Description string    `json:"description" validate:"max=500"`
	OccurredAt  time.Time `json:"occurred_at" validate:"required"`
}

type CreateBudgetInput struct {
	Category    string `json:"category" validate:"required,notblank,max=100"`
	AmountMinor int64  `json:"amount_minor" validate:"required,gt=0"`
	Currency    string `json:"currency" validate:"required,alpha,len=3"`
	Month       string `json:"month" validate:"required"`
}

type BudgetDTO struct {
	ID          string    `json:"id"`
	Category    string    `json:"category"`
	AmountMinor int64     `json:"amount_minor"`
	Currency    string    `json:"currency"`
	Month       string    `json:"month"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type UpdateEmergencyFundInput struct {
	TargetMinor  int64  `json:"target_minor" validate:"required,gt=0"`
	CurrentMinor int64  `json:"current_minor" validate:"gte=0"`
	Currency     string `json:"currency" validate:"required,alpha,len=3"`
}

type CreateSubscriptionInput struct {
	AccountID       *string `json:"account_id" validate:"omitempty,uuid"`
	Name            string  `json:"name" validate:"required,notblank,max=100"`
	AmountMinor     int64   `json:"amount_minor" validate:"required,gt=0"`
	Currency        string  `json:"currency" validate:"required,alpha,len=3"`
	BillingDay      int     `json:"billing_day" validate:"required,min=1,max=31"`
	Active          *bool   `json:"active"`
	NextPaymentDate *string `json:"next_payment_date"`
}

type UpdateSubscriptionInput struct {
	AccountID       *string `json:"account_id" validate:"omitempty,uuid"`
	Name            *string `json:"name" validate:"omitempty,notblank,max=100"`
	AmountMinor     *int64  `json:"amount_minor" validate:"omitempty,gt=0"`
	BillingDay      *int    `json:"billing_day" validate:"omitempty,min=1,max=31"`
	Active          *bool   `json:"active"`
	NextPaymentDate *string `json:"next_payment_date"`
}

type BalanceSummary struct {
	Currency     string `json:"currency"`
	BalanceMinor int64  `json:"balance_minor"`
}

type BudgetProgress struct {
	BudgetDTO
	SpentMinor     int64 `json:"spent_minor"`
	RemainingMinor int64 `json:"remaining_minor"`
}

type Insight struct {
	Type    string `json:"type"`
	Title   string `json:"title"`
	Message string `json:"message"`
}

type Dashboard struct {
	Balances           []BalanceSummary `json:"balances"`
	RecentTransactions []Transaction    `json:"recent_transactions"`
	Budgets            []BudgetProgress `json:"budgets"`
	EmergencyFund      *EmergencyFund   `json:"emergency_fund"`
	Subscriptions      []Subscription   `json:"subscriptions"`
	Insights           []Insight        `json:"insights"`
}

func mapBudget(budget Budget) BudgetDTO {
	return BudgetDTO{
		ID:          budget.ID,
		Category:    budget.Category,
		AmountMinor: budget.AmountMinor,
		Currency:    budget.Currency,
		Month:       budget.Month.Format("2006-01"),
		CreatedAt:   budget.CreatedAt,
		UpdatedAt:   budget.UpdatedAt,
	}
}
