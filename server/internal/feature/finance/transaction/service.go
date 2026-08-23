package transaction

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/kinqbert/finlo/server/internal/feature/finance/category"
	"github.com/kinqbert/finlo/server/internal/feature/finance/model"
	"github.com/kinqbert/finlo/server/internal/feature/finance/shared"
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

func (s *Service) List(ctx context.Context, userID string) ([]model.Transaction, error) {
	transactions := make([]model.Transaction, 0)
	if err := WithCategory(s.db.WithContext(ctx)).
		Where("transactions.user_id = ?", userID).
		Order("transactions.occurred_at DESC").
		Limit(100).
		Find(&transactions).Error; err != nil {
		return nil, apierror.Internal(fmt.Errorf("list transactions: %w", err))
	}
	return transactions, nil
}

func (s *Service) Create(ctx context.Context, userID string, input CreateInput) (model.Transaction, error) {
	created := model.Transaction{}
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var account model.Account
		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ? AND user_id = ?", input.AccountID, userID).First(&account).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apierror.NotFound("account_not_found", "account was not found")
		}
		if err != nil {
			return fmt.Errorf("find transaction account: %w", err)
		}
		resolvedCategory, err := category.FindOrCreate(tx, userID, input.Type, input.Category)
		if err != nil {
			return fmt.Errorf("resolve transaction category: %w", err)
		}

		created = model.Transaction{
			ID:          uuid.NewString(),
			UserID:      userID,
			AccountID:   account.ID,
			Type:        input.Type,
			AmountMinor: input.AmountMinor,
			Currency:    account.Currency,
			CategoryID:  resolvedCategory.ID,
			Category:    resolvedCategory.Name,
			Description: strings.TrimSpace(input.Description),
			OccurredAt:  input.OccurredAt.UTC(),
			Source:      "manual",
		}
		if err := tx.Create(&created).Error; err != nil {
			return fmt.Errorf("create transaction: %w", err)
		}

		delta := created.AmountMinor
		if created.Type == "expense" {
			delta = -delta
		}
		if err := tx.Model(&account).Update("balance_minor", gorm.Expr("balance_minor + ?", delta)).Error; err != nil {
			return fmt.Errorf("update account balance: %w", err)
		}
		return nil
	})
	if err != nil {
		var apiErr *apierror.Error
		if errors.As(err, &apiErr) {
			return model.Transaction{}, err
		}
		return model.Transaction{}, apierror.Internal(err)
	}
	return created, nil
}

func (s *Service) Delete(ctx context.Context, userID, id string) error {
	if err := shared.ValidateID(id); err != nil {
		return err
	}

	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var existing model.Transaction
		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ? AND user_id = ?", id, userID).First(&existing).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apierror.NotFound("transaction_not_found", "transaction was not found")
		}
		if err != nil {
			return fmt.Errorf("find transaction: %w", err)
		}

		delta := -existing.AmountMinor
		if existing.Type == "expense" {
			delta = existing.AmountMinor
		}
		result := tx.Model(&model.Account{}).Where("id = ? AND user_id = ?", existing.AccountID, userID).
			Update("balance_minor", gorm.Expr("balance_minor + ?", delta))
		if result.Error != nil {
			return fmt.Errorf("restore account balance: %w", result.Error)
		}
		if result.RowsAffected == 0 {
			return apierror.Conflict("transaction_account_missing", "transaction account no longer exists")
		}
		if err := tx.Delete(&existing).Error; err != nil {
			return fmt.Errorf("delete transaction: %w", err)
		}
		return nil
	})
	if err != nil {
		var apiErr *apierror.Error
		if errors.As(err, &apiErr) {
			return err
		}
		return apierror.Internal(err)
	}
	return nil
}

func WithCategory(db *gorm.DB) *gorm.DB {
	return db.Model(&model.Transaction{}).
		Select("transactions.*, categories.name AS category").
		Joins("JOIN categories ON categories.id = transactions.category_id")
}
