package dashboard

import (
	"time"

	"github.com/kinqbert/finlo/server/internal/feature/finance/budget"
	"github.com/kinqbert/finlo/server/internal/feature/finance/model"
)

type BalanceSummary struct {
	Currency     string `json:"currency"`
	BalanceMinor int64  `json:"balance_minor"`
}

type BudgetProgress struct {
	budget.DTO
	SpentMinor     int64 `json:"spent_minor"`
	RemainingMinor int64 `json:"remaining_minor"`
}

type Insight struct {
	Type    string `json:"type"`
	Title   string `json:"title"`
	Message string `json:"message"`
}

type DTO struct {
	Balances           []BalanceSummary     `json:"balances"`
	TotalBalance       BalanceSummary       `json:"total_balance"`
	TotalBalances      []BalanceSummary     `json:"total_balances"`
	BalanceComplete    bool                 `json:"balance_complete"`
	Unconverted        []string             `json:"unconverted_currencies"`
	ExchangeRatesAsOf  *time.Time           `json:"exchange_rates_as_of,omitempty"`
	RecentTransactions []model.Transaction  `json:"recent_transactions"`
	Budgets            []BudgetProgress     `json:"budgets"`
	EmergencyFund      *model.EmergencyFund `json:"emergency_fund"`
	Subscriptions      []model.Subscription `json:"subscriptions"`
	Insights           []Insight            `json:"insights"`
}
