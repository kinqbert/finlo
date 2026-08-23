package category

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/kinqbert/finlo/server/internal/feature/finance/model"
	"gorm.io/gorm"
)

var defaultNames = map[string][]string{
	"expense": {
		"Housing & Utilities",
		"Food & Dining",
		"Transportation",
		"Shopping & Leisure",
		"Other Expenses",
	},
	"income": {
		"Salary",
		"Freelance & Business",
		"Investments",
		"Gifts",
		"Other Income",
	},
}

func ProvisionDefaults(ctx context.Context, tx *gorm.DB, userID string) error {
	categories := defaultCategories(userID)
	if err := tx.WithContext(ctx).Create(&categories).Error; err != nil {
		return fmt.Errorf("create default categories: %w", err)
	}

	return nil
}

func defaultCategories(userID string) []model.Category {
	categories := make([]model.Category, 0, len(defaultNames["expense"])+len(defaultNames["income"]))
	for _, categoryType := range []string{"expense", "income"} {
		for sortOrder, name := range defaultNames[categoryType] {
			categories = append(categories, model.Category{
				ID:        uuid.NewString(),
				UserID:    userID,
				Name:      name,
				Type:      categoryType,
				SortOrder: sortOrder,
			})
		}
	}

	return categories
}
