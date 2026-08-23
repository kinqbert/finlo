package budget

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/kinqbert/finlo/server/internal/feature/finance/category"
	"github.com/kinqbert/finlo/server/internal/feature/finance/model"
	"github.com/kinqbert/finlo/server/internal/feature/finance/shared"
	"github.com/kinqbert/finlo/server/internal/http/apierror"
	"gorm.io/gorm"
)

type Service struct {
	db *gorm.DB
}

func NewService(db *gorm.DB) *Service {
	return &Service{db: db}
}

func (s *Service) List(ctx context.Context, userID, month string) ([]DTO, error) {
	query := WithCategory(s.db.WithContext(ctx)).Where("budgets.user_id = ?", userID)
	if month != "" {
		parsedMonth, err := shared.ParseMonth(month)
		if err != nil {
			return nil, err
		}
		query = query.Where("budgets.month = ?", parsedMonth)
	}

	var budgets []model.Budget
	if err := query.Order("budgets.month DESC, categories.name ASC").Find(&budgets).Error; err != nil {
		return nil, apierror.Internal(fmt.Errorf("list budgets: %w", err))
	}
	result := make([]DTO, 0, len(budgets))
	for _, item := range budgets {
		result = append(result, Map(item))
	}
	return result, nil
}

func (s *Service) Save(ctx context.Context, userID string, input CreateInput) (DTO, error) {
	month, err := shared.ParseMonth(input.Month)
	if err != nil {
		return DTO{}, err
	}
	currency := shared.NormalizeCurrency(input.Currency)

	var saved model.Budget
	err = s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		resolvedCategory, err := category.FindOrCreate(tx, userID, "expense", input.Category)
		if err != nil {
			return fmt.Errorf("resolve budget category: %w", err)
		}

		err = tx.Where(
			"user_id = ? AND category_id = ? AND currency = ? AND month = ?",
			userID, resolvedCategory.ID, currency, month,
		).First(&saved).Error
		switch {
		case err == nil:
			saved.AmountMinor = input.AmountMinor
			saved.Category = resolvedCategory.Name
			if err := tx.Save(&saved).Error; err != nil {
				return fmt.Errorf("update budget: %w", err)
			}
		case errors.Is(err, gorm.ErrRecordNotFound):
			saved = model.Budget{
				ID:          uuid.NewString(),
				UserID:      userID,
				CategoryID:  resolvedCategory.ID,
				Category:    resolvedCategory.Name,
				AmountMinor: input.AmountMinor,
				Currency:    currency,
				Month:       month,
			}
			if err := tx.Create(&saved).Error; err != nil {
				return fmt.Errorf("create budget: %w", err)
			}
		default:
			return fmt.Errorf("find budget: %w", err)
		}
		return nil
	})
	if err != nil {
		return DTO{}, apierror.Internal(err)
	}
	return Map(saved), nil
}

func (s *Service) Delete(ctx context.Context, userID, id string) error {
	if err := shared.ValidateID(id); err != nil {
		return err
	}
	result := s.db.WithContext(ctx).Where("id = ? AND user_id = ?", id, userID).Delete(&model.Budget{})
	if result.Error != nil {
		return apierror.Internal(fmt.Errorf("delete budget: %w", result.Error))
	}
	if result.RowsAffected == 0 {
		return apierror.NotFound("budget_not_found", "budget was not found")
	}
	return nil
}

func Map(item model.Budget) DTO {
	return DTO{
		ID:          item.ID,
		Category:    item.Category,
		AmountMinor: item.AmountMinor,
		Currency:    item.Currency,
		Month:       item.Month.Format("2006-01"),
		CreatedAt:   item.CreatedAt,
		UpdatedAt:   item.UpdatedAt,
	}
}

func WithCategory(db *gorm.DB) *gorm.DB {
	return db.Model(&model.Budget{}).
		Select("budgets.*, categories.name AS category").
		Joins("JOIN categories ON categories.id = budgets.category_id")
}
