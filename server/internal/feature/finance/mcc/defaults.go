package mcc

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/kinqbert/finlo/server/internal/feature/finance/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var defaultExpenseRules = map[string][]int{
	"Housing & Utilities": {4814, 4900, 6513},
	"Food & Dining":       {5411, 5422, 5441, 5451, 5462, 5499, 5812, 5813, 5814},
	"Transportation":      {4111, 4121, 4131, 4789, 5511, 5533, 5541, 5542, 7523},
	"Shopping & Leisure":  {5311, 5331, 5399, 5651, 5661, 5732, 5941, 5942, 5999, 7832, 7991, 7996, 7997, 7999},
}

func ProvisionDefaults(ctx context.Context, tx *gorm.DB, userID string) error {
	var categories []model.Category
	if err := tx.WithContext(ctx).Where("user_id = ? AND type = ?", userID, "expense").Find(&categories).Error; err != nil {
		return fmt.Errorf("load categories for MCC defaults: %w", err)
	}
	byName := make(map[string]string, len(categories))
	for _, category := range categories {
		byName[category.Name] = category.ID
	}
	rules := make([]model.MCCCategoryRule, 0)
	for name, codes := range defaultExpenseRules {
		categoryID, ok := byName[name]
		if !ok {
			continue
		}
		for _, code := range codes {
			rules = append(rules, model.MCCCategoryRule{
				ID: uuid.NewString(), UserID: userID, MCC: code, TransactionType: "expense",
				CategoryID: categoryID, IsDefault: true,
			})
		}
	}
	if len(rules) == 0 {
		return nil
	}
	if err := tx.WithContext(ctx).Clauses(clause.OnConflict{DoNothing: true}).Create(&rules).Error; err != nil {
		return fmt.Errorf("create MCC defaults: %w", err)
	}
	return nil
}
