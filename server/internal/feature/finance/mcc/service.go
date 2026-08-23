package mcc

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	financecategory "github.com/kinqbert/finlo/server/internal/feature/finance/category"
	"github.com/kinqbert/finlo/server/internal/feature/finance/model"
	"github.com/kinqbert/finlo/server/internal/feature/finance/shared"
	"github.com/kinqbert/finlo/server/internal/http/apierror"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type Service struct{ db *gorm.DB }

func NewService(db *gorm.DB) *Service { return &Service{db: db} }

func WithCategory(db *gorm.DB) *gorm.DB {
	return db.Model(&model.MCCCategoryRule{}).
		Select("mcc_category_rules.*, categories.name AS category").
		Joins("JOIN categories ON categories.id = mcc_category_rules.category_id")
}

func (s *Service) List(ctx context.Context, userID string) ([]model.MCCCategoryRule, error) {
	rules := make([]model.MCCCategoryRule, 0)
	if err := WithCategory(s.db.WithContext(ctx)).Where("mcc_category_rules.user_id = ?", userID).
		Order("mcc_category_rules.transaction_type, mcc_category_rules.mcc").Find(&rules).Error; err != nil {
		return nil, apierror.Internal(fmt.Errorf("list MCC rules: %w", err))
	}
	return rules, nil
}

func (s *Service) Save(ctx context.Context, userID string, input SaveRuleInput) (model.MCCCategoryRule, error) {
	var result model.MCCCategoryRule
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		category, err := findCategory(tx, userID, input.CategoryID, input.TransactionType)
		if err != nil {
			return err
		}
		return saveRule(tx, userID, input.MCC, input.TransactionType, category.ID)
	})
	if err != nil {
		var apiErr *apierror.Error
		if errors.As(err, &apiErr) {
			return model.MCCCategoryRule{}, err
		}
		return model.MCCCategoryRule{}, apierror.Internal(fmt.Errorf("save MCC rule: %w", err))
	}
	if err := WithCategory(s.db.WithContext(ctx)).Where("mcc_category_rules.user_id = ? AND mcc_category_rules.mcc = ? AND mcc_category_rules.transaction_type = ?", userID, input.MCC, input.TransactionType).First(&result).Error; err != nil {
		return model.MCCCategoryRule{}, apierror.Internal(fmt.Errorf("reload MCC rule: %w", err))
	}
	return result, nil
}

func (s *Service) Delete(ctx context.Context, userID, id string) error {
	if err := shared.ValidateID(id); err != nil {
		return err
	}
	result := s.db.WithContext(ctx).Where("id = ? AND user_id = ?", id, userID).Delete(&model.MCCCategoryRule{})
	if result.Error != nil {
		return apierror.Internal(fmt.Errorf("delete MCC rule: %w", result.Error))
	}
	if result.RowsAffected == 0 {
		return apierror.NotFound("mcc_rule_not_found", "MCC rule was not found")
	}
	return nil
}

func (s *Service) AssignTransaction(ctx context.Context, userID, transactionID string, input AssignCategoryInput) (model.Transaction, error) {
	if err := shared.ValidateID(transactionID); err != nil {
		return model.Transaction{}, err
	}
	var result model.Transaction
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("id = ? AND user_id = ?", transactionID, userID).First(&result).Error; errors.Is(err, gorm.ErrRecordNotFound) {
			return apierror.NotFound("transaction_not_found", "transaction was not found")
		} else if err != nil {
			return fmt.Errorf("find transaction: %w", err)
		}
		category, err := findCategory(tx, userID, input.CategoryID, result.Type)
		if err != nil {
			return err
		}
		if err := tx.Model(&result).Updates(map[string]any{
			"category_id": category.ID, "category_needs_review": false, "updated_at": time.Now(),
		}).Error; err != nil {
			return fmt.Errorf("assign transaction category: %w", err)
		}
		result.CategoryID, result.Category, result.NeedsReview = category.ID, category.Name, false
		if input.Remember {
			if result.MCCCode == nil {
				return apierror.BadRequest("transaction_has_no_mcc", "this transaction has no MCC code to remember")
			}
			if err := saveRule(tx, userID, *result.MCCCode, result.Type, category.ID); err != nil {
				return err
			}
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
	return result, nil
}

func saveRule(db *gorm.DB, userID string, code int, transactionType, categoryID string) error {
	rule := model.MCCCategoryRule{
		ID: uuid.NewString(), UserID: userID, MCC: code,
		TransactionType: transactionType, CategoryID: categoryID,
	}
	return db.Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "user_id"}, {Name: "mcc"}, {Name: "transaction_type"}},
		DoUpdates: clause.Assignments(map[string]any{
			"category_id": categoryID, "is_default": false, "updated_at": time.Now(),
		}),
	}).Create(&rule).Error
}

func ResolveCategory(db *gorm.DB, userID, transactionType string, code int) (model.Category, bool, error) {
	var category model.Category
	err := db.Model(&model.Category{}).
		Joins("JOIN mcc_category_rules ON mcc_category_rules.category_id = categories.id").
		Where("mcc_category_rules.user_id = ? AND mcc_category_rules.transaction_type = ? AND mcc_category_rules.mcc = ?", userID, transactionType, code).
		First(&category).Error
	if err == nil {
		return category, false, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return model.Category{}, false, err
	}
	fallback := "Other Income"
	if transactionType == "expense" {
		fallback = "Other Expenses"
	}
	category, err = financecategory.FindOrCreate(db, userID, transactionType, fallback)
	if err != nil {
		return model.Category{}, false, fmt.Errorf("find fallback category: %w", err)
	}
	return category, true, nil
}

func findCategory(db *gorm.DB, userID, categoryID, transactionType string) (model.Category, error) {
	var category model.Category
	err := db.Where("id = ? AND user_id = ?", categoryID, userID).First(&category).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.Category{}, apierror.NotFound("category_not_found", "category was not found")
	}
	if err != nil {
		return model.Category{}, fmt.Errorf("find category: %w", err)
	}
	if category.Type != transactionType {
		return model.Category{}, apierror.BadRequest("category_type_mismatch", "category type must match transaction type")
	}
	return category, nil
}
