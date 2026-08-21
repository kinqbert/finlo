package finance

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/kinqbert/finlo/server/internal/http/apierror"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type Service struct {
	db *gorm.DB
}

func NewService(db *gorm.DB) *Service {
	return &Service{db: db}
}

func (s *Service) ListAccounts(ctx context.Context, userID string) ([]Account, error) {
	accounts := make([]Account, 0)
	if err := s.db.WithContext(ctx).Where("user_id = ?", userID).Order("created_at ASC").Find(&accounts).Error; err != nil {
		return nil, apierror.Internal(fmt.Errorf("list accounts: %w", err))
	}
	return accounts, nil
}

func (s *Service) CreateAccount(ctx context.Context, userID string, input CreateAccountInput) (Account, error) {
	account := Account{
		ID:           uuid.NewString(),
		UserID:       userID,
		Name:         strings.TrimSpace(input.Name),
		Type:         input.Type,
		Currency:     normalizeCurrency(input.Currency),
		BalanceMinor: input.BalanceMinor,
	}
	if err := s.db.WithContext(ctx).Create(&account).Error; err != nil {
		return Account{}, apierror.Internal(fmt.Errorf("create account: %w", err))
	}
	return account, nil
}

func (s *Service) UpdateAccount(ctx context.Context, userID, id string, input UpdateAccountInput) (Account, error) {
	if err := validateID(id); err != nil {
		return Account{}, err
	}

	updates := map[string]any{}
	if input.Name != nil {
		name := strings.TrimSpace(*input.Name)
		if name == "" {
			return Account{}, apierror.BadRequest("invalid_name", "name is required")
		}
		updates["name"] = name
	}
	if input.Type != nil {
		updates["type"] = *input.Type
	}
	if input.BalanceMinor != nil {
		updates["balance_minor"] = *input.BalanceMinor
	}

	account, err := s.findAccount(ctx, userID, id)
	if err != nil {
		return Account{}, err
	}
	if len(updates) > 0 {
		updates["updated_at"] = time.Now()
		if err := s.db.WithContext(ctx).Model(&account).Updates(updates).Error; err != nil {
			return Account{}, apierror.Internal(fmt.Errorf("update account: %w", err))
		}
		if err := s.db.WithContext(ctx).First(&account, "id = ? AND user_id = ?", id, userID).Error; err != nil {
			return Account{}, apierror.Internal(fmt.Errorf("reload account: %w", err))
		}
	}
	return account, nil
}

func (s *Service) DeleteAccount(ctx context.Context, userID, id string) error {
	account, err := s.findAccount(ctx, userID, id)
	if err != nil {
		return err
	}

	var references int64
	if err := s.db.WithContext(ctx).Model(&Transaction{}).Where("account_id = ? AND user_id = ?", id, userID).Count(&references).Error; err != nil {
		return apierror.Internal(fmt.Errorf("check account transactions: %w", err))
	}
	if references > 0 {
		return apierror.Conflict("account_in_use", "account with transactions cannot be deleted")
	}
	if err := s.db.WithContext(ctx).Model(&Subscription{}).Where("account_id = ? AND user_id = ?", id, userID).Count(&references).Error; err != nil {
		return apierror.Internal(fmt.Errorf("check account subscriptions: %w", err))
	}
	if references > 0 {
		return apierror.Conflict("account_in_use", "account with subscriptions cannot be deleted")
	}

	if err := s.db.WithContext(ctx).Delete(&account).Error; err != nil {
		if errors.Is(err, gorm.ErrForeignKeyViolated) {
			return apierror.Conflict("account_in_use", "account with transactions cannot be deleted")
		}
		return apierror.Internal(fmt.Errorf("delete account: %w", err))
	}
	return nil
}

func (s *Service) ListTransactions(ctx context.Context, userID string) ([]Transaction, error) {
	transactions := make([]Transaction, 0)
	if err := s.db.WithContext(ctx).Where("user_id = ?", userID).Order("occurred_at DESC").Limit(100).Find(&transactions).Error; err != nil {
		return nil, apierror.Internal(fmt.Errorf("list transactions: %w", err))
	}
	return transactions, nil
}

func (s *Service) CreateTransaction(ctx context.Context, userID string, input CreateTransactionInput) (Transaction, error) {
	transaction := Transaction{}
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var account Account
		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ? AND user_id = ?", input.AccountID, userID).First(&account).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apierror.NotFound("account_not_found", "account was not found")
		}
		if err != nil {
			return fmt.Errorf("find transaction account: %w", err)
		}

		transaction = Transaction{
			ID:          uuid.NewString(),
			UserID:      userID,
			AccountID:   account.ID,
			Type:        input.Type,
			AmountMinor: input.AmountMinor,
			Currency:    account.Currency,
			Category:    strings.TrimSpace(input.Category),
			Description: strings.TrimSpace(input.Description),
			OccurredAt:  input.OccurredAt.UTC(),
			Source:      "manual",
		}
		if err := tx.Create(&transaction).Error; err != nil {
			return fmt.Errorf("create transaction: %w", err)
		}

		delta := transaction.AmountMinor
		if transaction.Type == "expense" {
			delta = -delta
		}
		if err := tx.Model(&account).Update("balance_minor", gorm.Expr("balance_minor + ?", delta)).Error; err != nil {
			return fmt.Errorf("update account balance: %w", err)
		}
		return nil
	})
	if err != nil {
		if _, ok := err.(*apierror.Error); ok {
			return Transaction{}, err
		}
		return Transaction{}, apierror.Internal(err)
	}
	return transaction, nil
}

func (s *Service) DeleteTransaction(ctx context.Context, userID, id string) error {
	if err := validateID(id); err != nil {
		return err
	}

	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var transaction Transaction
		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ? AND user_id = ?", id, userID).First(&transaction).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apierror.NotFound("transaction_not_found", "transaction was not found")
		}
		if err != nil {
			return fmt.Errorf("find transaction: %w", err)
		}

		delta := -transaction.AmountMinor
		if transaction.Type == "expense" {
			delta = transaction.AmountMinor
		}
		result := tx.Model(&Account{}).Where("id = ? AND user_id = ?", transaction.AccountID, userID).
			Update("balance_minor", gorm.Expr("balance_minor + ?", delta))
		if result.Error != nil {
			return fmt.Errorf("restore account balance: %w", result.Error)
		}
		if result.RowsAffected == 0 {
			return apierror.Conflict("transaction_account_missing", "transaction account no longer exists")
		}
		if err := tx.Delete(&transaction).Error; err != nil {
			return fmt.Errorf("delete transaction: %w", err)
		}
		return nil
	})
	if err != nil {
		if _, ok := err.(*apierror.Error); ok {
			return err
		}
		return apierror.Internal(err)
	}
	return nil
}

func (s *Service) ListBudgets(ctx context.Context, userID, month string) ([]BudgetDTO, error) {
	query := s.db.WithContext(ctx).Where("user_id = ?", userID)
	if month != "" {
		parsedMonth, err := parseMonth(month)
		if err != nil {
			return nil, err
		}
		query = query.Where("month = ?", parsedMonth)
	}

	var budgets []Budget
	if err := query.Order("month DESC, category ASC").Find(&budgets).Error; err != nil {
		return nil, apierror.Internal(fmt.Errorf("list budgets: %w", err))
	}
	result := make([]BudgetDTO, 0, len(budgets))
	for _, budget := range budgets {
		result = append(result, mapBudget(budget))
	}
	return result, nil
}

func (s *Service) SaveBudget(ctx context.Context, userID string, input CreateBudgetInput) (BudgetDTO, error) {
	month, err := parseMonth(input.Month)
	if err != nil {
		return BudgetDTO{}, err
	}
	currency := normalizeCurrency(input.Currency)
	category := strings.TrimSpace(input.Category)

	var budget Budget
	err = s.db.WithContext(ctx).Where(
		"user_id = ? AND category = ? AND currency = ? AND month = ?",
		userID, category, currency, month,
	).First(&budget).Error
	switch {
	case err == nil:
		budget.AmountMinor = input.AmountMinor
		if err := s.db.WithContext(ctx).Save(&budget).Error; err != nil {
			return BudgetDTO{}, apierror.Internal(fmt.Errorf("update budget: %w", err))
		}
	case errors.Is(err, gorm.ErrRecordNotFound):
		budget = Budget{
			ID:          uuid.NewString(),
			UserID:      userID,
			Category:    category,
			AmountMinor: input.AmountMinor,
			Currency:    currency,
			Month:       month,
		}
		if err := s.db.WithContext(ctx).Create(&budget).Error; err != nil {
			return BudgetDTO{}, apierror.Internal(fmt.Errorf("create budget: %w", err))
		}
	default:
		return BudgetDTO{}, apierror.Internal(fmt.Errorf("find budget: %w", err))
	}
	return mapBudget(budget), nil
}

func (s *Service) DeleteBudget(ctx context.Context, userID, id string) error {
	if err := validateID(id); err != nil {
		return err
	}
	result := s.db.WithContext(ctx).Where("id = ? AND user_id = ?", id, userID).Delete(&Budget{})
	if result.Error != nil {
		return apierror.Internal(fmt.Errorf("delete budget: %w", result.Error))
	}
	if result.RowsAffected == 0 {
		return apierror.NotFound("budget_not_found", "budget was not found")
	}
	return nil
}

func (s *Service) GetEmergencyFund(ctx context.Context, userID string) (*EmergencyFund, error) {
	var fund EmergencyFund
	err := s.db.WithContext(ctx).First(&fund, "user_id = ?", userID).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, apierror.Internal(fmt.Errorf("get emergency fund: %w", err))
	}
	return &fund, nil
}

func (s *Service) SaveEmergencyFund(ctx context.Context, userID string, input UpdateEmergencyFundInput) (EmergencyFund, error) {
	fund := EmergencyFund{
		UserID:       userID,
		TargetMinor:  input.TargetMinor,
		CurrentMinor: input.CurrentMinor,
		Currency:     normalizeCurrency(input.Currency),
	}
	err := s.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"target_minor", "current_minor", "currency", "updated_at"}),
	}).Create(&fund).Error
	if err != nil {
		return EmergencyFund{}, apierror.Internal(fmt.Errorf("save emergency fund: %w", err))
	}
	if err := s.db.WithContext(ctx).First(&fund, "user_id = ?", userID).Error; err != nil {
		return EmergencyFund{}, apierror.Internal(fmt.Errorf("reload emergency fund: %w", err))
	}
	return fund, nil
}

func (s *Service) ListSubscriptions(ctx context.Context, userID string) ([]Subscription, error) {
	subscriptions := make([]Subscription, 0)
	if err := s.db.WithContext(ctx).Where("user_id = ?", userID).Order("active DESC, billing_day ASC").Find(&subscriptions).Error; err != nil {
		return nil, apierror.Internal(fmt.Errorf("list subscriptions: %w", err))
	}
	return subscriptions, nil
}

func (s *Service) CreateSubscription(ctx context.Context, userID string, input CreateSubscriptionInput) (Subscription, error) {
	if err := s.ensureAccount(ctx, userID, input.AccountID); err != nil {
		return Subscription{}, err
	}
	nextPayment, err := parseOptionalDate(input.NextPaymentDate)
	if err != nil {
		return Subscription{}, err
	}
	active := true
	if input.Active != nil {
		active = *input.Active
	}
	subscription := Subscription{
		ID:              uuid.NewString(),
		UserID:          userID,
		AccountID:       input.AccountID,
		Name:            strings.TrimSpace(input.Name),
		AmountMinor:     input.AmountMinor,
		Currency:        normalizeCurrency(input.Currency),
		BillingDay:      input.BillingDay,
		Active:          active,
		NextPaymentDate: nextPayment,
	}
	if err := s.db.WithContext(ctx).Create(&subscription).Error; err != nil {
		return Subscription{}, apierror.Internal(fmt.Errorf("create subscription: %w", err))
	}
	return subscription, nil
}

func (s *Service) UpdateSubscription(ctx context.Context, userID, id string, input UpdateSubscriptionInput) (Subscription, error) {
	if err := validateID(id); err != nil {
		return Subscription{}, err
	}
	if err := s.ensureAccount(ctx, userID, input.AccountID); err != nil {
		return Subscription{}, err
	}

	var subscription Subscription
	err := s.db.WithContext(ctx).Where("id = ? AND user_id = ?", id, userID).First(&subscription).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return Subscription{}, apierror.NotFound("subscription_not_found", "subscription was not found")
	}
	if err != nil {
		return Subscription{}, apierror.Internal(fmt.Errorf("find subscription: %w", err))
	}

	updates := map[string]any{}
	if input.AccountID != nil {
		updates["account_id"] = *input.AccountID
	}
	if input.Name != nil {
		name := strings.TrimSpace(*input.Name)
		if name == "" {
			return Subscription{}, apierror.BadRequest("invalid_name", "name is required")
		}
		updates["name"] = name
	}
	if input.AmountMinor != nil {
		updates["amount_minor"] = *input.AmountMinor
	}
	if input.BillingDay != nil {
		updates["billing_day"] = *input.BillingDay
	}
	if input.Active != nil {
		updates["active"] = *input.Active
	}
	if input.NextPaymentDate != nil {
		nextPayment, err := parseOptionalDate(input.NextPaymentDate)
		if err != nil {
			return Subscription{}, err
		}
		updates["next_payment_date"] = nextPayment
	}
	if len(updates) > 0 {
		updates["updated_at"] = time.Now()
		if err := s.db.WithContext(ctx).Model(&subscription).Updates(updates).Error; err != nil {
			return Subscription{}, apierror.Internal(fmt.Errorf("update subscription: %w", err))
		}
		if err := s.db.WithContext(ctx).First(&subscription, "id = ? AND user_id = ?", id, userID).Error; err != nil {
			return Subscription{}, apierror.Internal(fmt.Errorf("reload subscription: %w", err))
		}
	}
	return subscription, nil
}

func (s *Service) DeleteSubscription(ctx context.Context, userID, id string) error {
	if err := validateID(id); err != nil {
		return err
	}
	result := s.db.WithContext(ctx).Where("id = ? AND user_id = ?", id, userID).Delete(&Subscription{})
	if result.Error != nil {
		return apierror.Internal(fmt.Errorf("delete subscription: %w", result.Error))
	}
	if result.RowsAffected == 0 {
		return apierror.NotFound("subscription_not_found", "subscription was not found")
	}
	return nil
}

func (s *Service) Dashboard(ctx context.Context, userID string) (Dashboard, error) {
	now := time.Now().UTC()
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	monthEnd := monthStart.AddDate(0, 1, 0)

	dashboard := Dashboard{
		Balances:           make([]BalanceSummary, 0),
		RecentTransactions: make([]Transaction, 0),
		Budgets:            make([]BudgetProgress, 0),
		Subscriptions:      make([]Subscription, 0),
		Insights:           make([]Insight, 0),
	}

	if err := s.db.WithContext(ctx).Model(&Account{}).
		Select("currency, COALESCE(SUM(balance_minor), 0) AS balance_minor").
		Where("user_id = ?", userID).Group("currency").Scan(&dashboard.Balances).Error; err != nil {
		return Dashboard{}, apierror.Internal(fmt.Errorf("summarize balances: %w", err))
	}
	if err := s.db.WithContext(ctx).Where("user_id = ?", userID).Order("occurred_at DESC").Limit(10).
		Find(&dashboard.RecentTransactions).Error; err != nil {
		return Dashboard{}, apierror.Internal(fmt.Errorf("load recent transactions: %w", err))
	}

	var budgets []Budget
	if err := s.db.WithContext(ctx).Where("user_id = ? AND month = ?", userID, monthStart).Order("category ASC").Find(&budgets).Error; err != nil {
		return Dashboard{}, apierror.Internal(fmt.Errorf("load dashboard budgets: %w", err))
	}
	type spendingRow struct {
		Category string
		Currency string
		Amount   int64
	}
	var spending []spendingRow
	if err := s.db.WithContext(ctx).Model(&Transaction{}).
		Select("category, currency, COALESCE(SUM(amount_minor), 0) AS amount").
		Where("user_id = ? AND type = ? AND occurred_at >= ? AND occurred_at < ?", userID, "expense", monthStart, monthEnd).
		Group("category, currency").Scan(&spending).Error; err != nil {
		return Dashboard{}, apierror.Internal(fmt.Errorf("summarize spending: %w", err))
	}
	spentByBudget := make(map[string]int64, len(spending))
	for _, row := range spending {
		spentByBudget[row.Category+"\x00"+row.Currency] = row.Amount
	}
	for _, budget := range budgets {
		spent := spentByBudget[budget.Category+"\x00"+budget.Currency]
		progress := BudgetProgress{
			BudgetDTO:      mapBudget(budget),
			SpentMinor:     spent,
			RemainingMinor: budget.AmountMinor - spent,
		}
		dashboard.Budgets = append(dashboard.Budgets, progress)
		if progress.RemainingMinor < 0 {
			dashboard.Insights = append(dashboard.Insights, Insight{
				Type:    "budget_risk",
				Title:   "Budget exceeded",
				Message: fmt.Sprintf("Spending in %s is above this month's budget.", budget.Category),
			})
		}
	}

	fund, err := s.GetEmergencyFund(ctx, userID)
	if err != nil {
		return Dashboard{}, err
	}
	dashboard.EmergencyFund = fund
	if fund != nil && fund.CurrentMinor < fund.TargetMinor {
		dashboard.Insights = append(dashboard.Insights, Insight{
			Type:    "savings_progress",
			Title:   "Keep building your emergency fund",
			Message: "Your emergency fund is still below its target.",
		})
	}

	if err := s.db.WithContext(ctx).Where("user_id = ? AND active = ?", userID, true).
		Order("billing_day ASC").Find(&dashboard.Subscriptions).Error; err != nil {
		return Dashboard{}, apierror.Internal(fmt.Errorf("load subscriptions: %w", err))
	}
	if len(dashboard.Subscriptions) > 0 {
		dashboard.Insights = append(dashboard.Insights, Insight{
			Type:    "subscriptions",
			Title:   "Recurring payments ahead",
			Message: fmt.Sprintf("You have %d active subscriptions in your monthly plan.", len(dashboard.Subscriptions)),
		})
	}
	return dashboard, nil
}

func (s *Service) findAccount(ctx context.Context, userID, id string) (Account, error) {
	if err := validateID(id); err != nil {
		return Account{}, err
	}
	var account Account
	err := s.db.WithContext(ctx).Where("id = ? AND user_id = ?", id, userID).First(&account).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return Account{}, apierror.NotFound("account_not_found", "account was not found")
	}
	if err != nil {
		return Account{}, apierror.Internal(fmt.Errorf("find account: %w", err))
	}
	return account, nil
}

func (s *Service) ensureAccount(ctx context.Context, userID string, accountID *string) error {
	if accountID == nil {
		return nil
	}
	_, err := s.findAccount(ctx, userID, *accountID)
	return err
}

func validateID(id string) error {
	if _, err := uuid.Parse(id); err != nil {
		return apierror.BadRequest("invalid_id", "resource ID must be a valid UUID")
	}
	return nil
}

func normalizeCurrency(currency string) string {
	return strings.ToUpper(strings.TrimSpace(currency))
}

func parseMonth(value string) (time.Time, error) {
	month, err := time.Parse("2006-01", strings.TrimSpace(value))
	if err != nil {
		return time.Time{}, apierror.BadRequest("invalid_month", "month must use YYYY-MM format")
	}
	return month.UTC(), nil
}

func parseOptionalDate(value *string) (*time.Time, error) {
	if value == nil || strings.TrimSpace(*value) == "" {
		return nil, nil
	}
	date, err := time.Parse("2006-01-02", strings.TrimSpace(*value))
	if err != nil {
		return nil, apierror.BadRequest("invalid_date", "next_payment_date must use YYYY-MM-DD format")
	}
	date = date.UTC()
	return &date, nil
}
