package dashboard

import (
	"context"
	"fmt"
	"time"

	"github.com/kinqbert/finlo/server/internal/feature/finance/budget"
	"github.com/kinqbert/finlo/server/internal/feature/finance/emergencyfund"
	"github.com/kinqbert/finlo/server/internal/feature/finance/model"
	"github.com/kinqbert/finlo/server/internal/feature/finance/subscription"
	financetransaction "github.com/kinqbert/finlo/server/internal/feature/finance/transaction"
	"github.com/kinqbert/finlo/server/internal/http/apierror"
	"gorm.io/gorm"
)

type Service struct {
	db            *gorm.DB
	emergencyFund *emergencyfund.Service
}

func NewService(db *gorm.DB) *Service {
	return &Service{
		db:            db,
		emergencyFund: emergencyfund.NewService(db),
	}
}

func (s *Service) Get(ctx context.Context, userID string) (DTO, error) {
	now := time.Now().UTC()
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	monthEnd := monthStart.AddDate(0, 1, 0)

	result := DTO{
		Balances:           make([]BalanceSummary, 0),
		RecentTransactions: make([]model.Transaction, 0),
		Budgets:            make([]BudgetProgress, 0),
		Subscriptions:      make([]model.Subscription, 0),
		Insights:           make([]Insight, 0),
	}

	if err := s.db.WithContext(ctx).Model(&model.Account{}).
		Select("currency, COALESCE(SUM(balance_minor), 0) AS balance_minor").
		Where("user_id = ?", userID).Group("currency").Scan(&result.Balances).Error; err != nil {
		return DTO{}, apierror.Internal(fmt.Errorf("summarize balances: %w", err))
	}
	if err := financetransaction.WithCategory(s.db.WithContext(ctx)).
		Where("transactions.user_id = ?", userID).
		Order("transactions.occurred_at DESC").Limit(10).
		Find(&result.RecentTransactions).Error; err != nil {
		return DTO{}, apierror.Internal(fmt.Errorf("load recent transactions: %w", err))
	}

	var budgets []model.Budget
	if err := budget.WithCategory(s.db.WithContext(ctx)).
		Where("budgets.user_id = ? AND budgets.month = ?", userID, monthStart).
		Order("categories.name ASC").Find(&budgets).Error; err != nil {
		return DTO{}, apierror.Internal(fmt.Errorf("load dashboard budgets: %w", err))
	}
	type spendingRow struct {
		CategoryID string
		Currency   string
		Amount     int64
	}
	var spending []spendingRow
	if err := s.db.WithContext(ctx).Model(&model.Transaction{}).
		Select("category_id, currency, COALESCE(SUM(amount_minor), 0) AS amount").
		Where("user_id = ? AND type = ? AND occurred_at >= ? AND occurred_at < ?", userID, "expense", monthStart, monthEnd).
		Group("category_id, currency").Scan(&spending).Error; err != nil {
		return DTO{}, apierror.Internal(fmt.Errorf("summarize spending: %w", err))
	}
	spentByBudget := make(map[string]int64, len(spending))
	for _, row := range spending {
		spentByBudget[row.CategoryID+"\x00"+row.Currency] = row.Amount
	}
	for _, item := range budgets {
		spent := spentByBudget[item.CategoryID+"\x00"+item.Currency]
		progress := BudgetProgress{
			DTO:            budget.Map(item),
			SpentMinor:     spent,
			RemainingMinor: item.AmountMinor - spent,
		}
		result.Budgets = append(result.Budgets, progress)
		if progress.RemainingMinor < 0 {
			result.Insights = append(result.Insights, Insight{
				Type:    "budget_risk",
				Title:   "Budget exceeded",
				Message: fmt.Sprintf("Spending in %s is above this month's budget.", item.Category),
			})
		}
	}

	fund, err := s.emergencyFund.Get(ctx, userID)
	if err != nil {
		return DTO{}, err
	}
	result.EmergencyFund = fund
	if fund != nil && fund.CurrentMinor < fund.TargetMinor {
		result.Insights = append(result.Insights, Insight{
			Type:    "savings_progress",
			Title:   "Keep building your emergency fund",
			Message: "Your emergency fund is still below its target.",
		})
	}

	if err := s.db.WithContext(ctx).Where("user_id = ? AND active = ?", userID, true).
		Order("billing_day ASC").Find(&result.Subscriptions).Error; err != nil {
		return DTO{}, apierror.Internal(fmt.Errorf("load subscriptions: %w", err))
	}
	subscription.ResolveNextPaymentDates(result.Subscriptions, now)
	if len(result.Subscriptions) > 0 {
		result.Insights = append(result.Insights, Insight{
			Type:    "subscriptions",
			Title:   "Recurring payments ahead",
			Message: fmt.Sprintf("You have %d active subscriptions in your monthly plan.", len(result.Subscriptions)),
		})
	}
	return result, nil
}
