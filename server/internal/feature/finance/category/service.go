package category

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/kinqbert/finlo/server/internal/feature/finance/model"
	"github.com/kinqbert/finlo/server/internal/feature/finance/shared"
	"github.com/kinqbert/finlo/server/internal/http/apierror"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type Service struct{ db *gorm.DB }

func NewService(db *gorm.DB) *Service { return &Service{db: db} }

func (s *Service) List(ctx context.Context, userID string) ([]model.Category, error) {
	categories := make([]model.Category, 0)
	if err := s.db.WithContext(ctx).Where("user_id = ?", userID).Order("type ASC, sort_order ASC, name ASC").Find(&categories).Error; err != nil {
		return nil, apierror.Internal(fmt.Errorf("list categories: %w", err))
	}
	return categories, nil
}

func (s *Service) Create(ctx context.Context, userID string, input CreateInput) (model.Category, error) {
	category := model.Category{ID: uuid.NewString(), UserID: userID, Name: strings.TrimSpace(input.Name), Type: input.Type}
	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var existing int64
		if err := tx.Model(&model.Category{}).Where("user_id = ? AND type = ? AND name = ?", userID, category.Type, category.Name).Count(&existing).Error; err != nil {
			return fmt.Errorf("check category name: %w", err)
		}
		if existing > 0 {
			return apierror.Conflict("category_exists", "a category with this name already exists")
		}
		order, err := nextOrder(tx, userID, category.Type)
		if err != nil {
			return fmt.Errorf("determine category order: %w", err)
		}
		category.SortOrder = order
		if err := tx.Create(&category).Error; err != nil {
			if errors.Is(err, gorm.ErrDuplicatedKey) {
				return apierror.Conflict("category_exists", "a category with this name already exists")
			}
			return fmt.Errorf("create category: %w", err)
		}
		return nil
	})
	if err != nil {
		var apiErr *apierror.Error
		if errors.As(err, &apiErr) {
			return model.Category{}, err
		}
		return model.Category{}, apierror.Internal(err)
	}
	return category, nil
}

func (s *Service) Update(ctx context.Context, userID, id string, input UpdateInput) (model.Category, error) {
	category, err := s.find(ctx, userID, id)
	if err != nil {
		return model.Category{}, err
	}
	name := strings.TrimSpace(input.Name)
	if name == category.Name {
		return category, nil
	}
	if err := s.db.WithContext(ctx).Model(&category).Updates(map[string]any{"name": name, "updated_at": time.Now()}).Error; err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return model.Category{}, apierror.Conflict("category_exists", "a category with this name already exists")
		}
		return model.Category{}, apierror.Internal(fmt.Errorf("update category: %w", err))
	}
	category.Name = name
	return category, nil
}

func (s *Service) Delete(ctx context.Context, userID, id string) error {
	category, err := s.find(ctx, userID, id)
	if err != nil {
		return err
	}
	var references int64
	if err := s.db.WithContext(ctx).Model(&model.Transaction{}).Where("user_id = ? AND category_id = ?", userID, id).Count(&references).Error; err != nil {
		return apierror.Internal(fmt.Errorf("check category transactions: %w", err))
	}
	if references > 0 {
		return apierror.Conflict("category_in_use", "category with transactions cannot be deleted")
	}
	if err := s.db.WithContext(ctx).Model(&model.Budget{}).Where("user_id = ? AND category_id = ?", userID, id).Count(&references).Error; err != nil {
		return apierror.Internal(fmt.Errorf("check category budgets: %w", err))
	}
	if references > 0 {
		return apierror.Conflict("category_in_use", "category with budgets cannot be deleted")
	}
	if err := s.db.WithContext(ctx).Model(&model.MCCCategoryRule{}).Where("user_id = ? AND category_id = ?", userID, id).Count(&references).Error; err != nil {
		return apierror.Internal(fmt.Errorf("check category MCC rules: %w", err))
	}
	if references > 0 {
		return apierror.Conflict("category_in_use", "category with MCC rules cannot be deleted")
	}
	if err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Delete(&category).Error; err != nil {
			return fmt.Errorf("delete category: %w", err)
		}
		return tx.Model(&model.Category{}).Where("user_id = ? AND type = ? AND sort_order > ?", userID, category.Type, category.SortOrder).Update("sort_order", gorm.Expr("sort_order - 1")).Error
	}); err != nil {
		if errors.Is(err, gorm.ErrForeignKeyViolated) {
			return apierror.Conflict("category_in_use", "category is in use and cannot be deleted")
		}
		return apierror.Internal(err)
	}
	return nil
}

func (s *Service) Reorder(ctx context.Context, userID string, input ReorderInput) ([]model.Category, error) {
	var categories []model.Category
	if err := s.db.WithContext(ctx).Where("user_id = ? AND type = ?", userID, input.Type).Find(&categories).Error; err != nil {
		return nil, apierror.Internal(fmt.Errorf("load categories for reorder: %w", err))
	}
	if err := validateOrder(categories, input.CategoryIDs); err != nil {
		return nil, err
	}
	if err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for position, id := range input.CategoryIDs {
			result := tx.Model(&model.Category{}).Where("id = ? AND user_id = ? AND type = ?", id, userID, input.Type).Updates(map[string]any{"sort_order": position, "updated_at": time.Now()})
			if result.Error != nil {
				return fmt.Errorf("update category order: %w", result.Error)
			}
			if result.RowsAffected != 1 {
				return apierror.BadRequest("invalid_category_order", "category order contains an unknown category")
			}
		}
		return nil
	}); err != nil {
		var apiErr *apierror.Error
		if errors.As(err, &apiErr) {
			return nil, err
		}
		return nil, apierror.Internal(err)
	}
	return s.listByType(ctx, userID, input.Type)
}

func (s *Service) listByType(ctx context.Context, userID, categoryType string) ([]model.Category, error) {
	categories := make([]model.Category, 0)
	if err := s.db.WithContext(ctx).Where("user_id = ? AND type = ?", userID, categoryType).Order("sort_order ASC, name ASC").Find(&categories).Error; err != nil {
		return nil, apierror.Internal(fmt.Errorf("list categories by type: %w", err))
	}
	return categories, nil
}

func (s *Service) find(ctx context.Context, userID, id string) (model.Category, error) {
	if err := shared.ValidateID(id); err != nil {
		return model.Category{}, err
	}
	var category model.Category
	err := s.db.WithContext(ctx).Where("id = ? AND user_id = ?", id, userID).First(&category).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.Category{}, apierror.NotFound("category_not_found", "category was not found")
	}
	if err != nil {
		return model.Category{}, apierror.Internal(fmt.Errorf("find category: %w", err))
	}
	return category, nil
}

func FindOrCreate(db *gorm.DB, userID, categoryType, name string) (model.Category, error) {
	categoryName := strings.TrimSpace(name)
	var persisted model.Category
	err := db.Where("user_id = ? AND type = ? AND name = ?", userID, categoryType, categoryName).First(&persisted).Error
	if err == nil {
		return persisted, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return model.Category{}, err
	}
	order, err := nextOrder(db, userID, categoryType)
	if err != nil {
		return model.Category{}, err
	}
	category := model.Category{ID: uuid.NewString(), UserID: userID, Name: categoryName, Type: categoryType, SortOrder: order}
	if err := db.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "user_id"}, {Name: "type"}, {Name: "name"}}, DoNothing: true}).Create(&category).Error; err != nil {
		return model.Category{}, err
	}
	if err := db.Where("user_id = ? AND type = ? AND name = ?", userID, categoryType, category.Name).First(&persisted).Error; err != nil {
		return model.Category{}, err
	}
	return persisted, nil
}

func nextOrder(db *gorm.DB, userID, categoryType string) (int, error) {
	var maxOrder int
	if err := db.Model(&model.Category{}).Select("COALESCE(MAX(sort_order), -1)").Where("user_id = ? AND type = ?", userID, categoryType).Scan(&maxOrder).Error; err != nil {
		return 0, err
	}
	return maxOrder + 1, nil
}

func validateOrder(categories []model.Category, ids []string) error {
	if len(categories) != len(ids) {
		return apierror.BadRequest("invalid_category_order", "category order must contain every category of this type")
	}
	expected := make(map[string]struct{}, len(categories))
	for _, category := range categories {
		expected[category.ID] = struct{}{}
	}
	seen := make(map[string]struct{}, len(ids))
	for _, id := range ids {
		if _, duplicate := seen[id]; duplicate {
			return apierror.BadRequest("invalid_category_order", "category order contains duplicate categories")
		}
		if _, exists := expected[id]; !exists {
			return apierror.BadRequest("invalid_category_order", "category order contains an unknown category")
		}
		seen[id] = struct{}{}
	}
	return nil
}
