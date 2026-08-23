package goal

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
)

type Service struct{ db *gorm.DB }

func NewService(db *gorm.DB) *Service { return &Service{db: db} }

func (s *Service) List(ctx context.Context, userID string) ([]model.Goal, error) {
	goals := make([]model.Goal, 0)
	if err := s.db.WithContext(ctx).Where("user_id = ?", userID).Order("created_at ASC").Find(&goals).Error; err != nil {
		return nil, apierror.Internal(fmt.Errorf("list goals: %w", err))
	}
	return goals, nil
}

func (s *Service) Create(ctx context.Context, userID string, input CreateInput) (model.Goal, error) {
	result := model.Goal{
		ID: uuid.NewString(), UserID: userID, Name: strings.TrimSpace(input.Name),
		CurrentMinor: input.CurrentMinor, TargetMinor: input.TargetMinor,
		Currency: shared.NormalizeCurrency(input.Currency), Source: "manual",
	}
	if err := s.db.WithContext(ctx).Create(&result).Error; err != nil {
		return model.Goal{}, apierror.Internal(fmt.Errorf("create goal: %w", err))
	}
	return result, nil
}

func (s *Service) Update(ctx context.Context, userID, id string, input UpdateInput) (model.Goal, error) {
	result, err := s.find(ctx, userID, id)
	if err != nil {
		return model.Goal{}, err
	}
	updates := map[string]any{}
	if input.Name != nil {
		updates["name"] = strings.TrimSpace(*input.Name)
	}
	if input.CurrentMinor != nil {
		updates["current_minor"] = *input.CurrentMinor
	}
	if input.TargetMinor != nil {
		updates["target_minor"] = *input.TargetMinor
	} else if input.ClearTarget {
		updates["target_minor"] = nil
	}
	if len(updates) == 0 {
		return result, nil
	}
	updates["updated_at"] = time.Now()
	if err := s.db.WithContext(ctx).Model(&result).Updates(updates).Error; err != nil {
		return model.Goal{}, apierror.Internal(fmt.Errorf("update goal: %w", err))
	}
	if err := s.db.WithContext(ctx).First(&result, "id = ? AND user_id = ?", id, userID).Error; err != nil {
		return model.Goal{}, apierror.Internal(fmt.Errorf("reload goal: %w", err))
	}
	return result, nil
}

func (s *Service) Delete(ctx context.Context, userID, id string) error {
	result, err := s.find(ctx, userID, id)
	if err != nil {
		return err
	}
	if result.Source == "monobank" {
		return apierror.Conflict("connected_goal", "disconnect the Monobank jar before deleting this goal")
	}
	if err := s.db.WithContext(ctx).Delete(&result).Error; err != nil {
		return apierror.Internal(fmt.Errorf("delete goal: %w", err))
	}
	return nil
}

func (s *Service) find(ctx context.Context, userID, id string) (model.Goal, error) {
	if err := shared.ValidateID(id); err != nil {
		return model.Goal{}, err
	}
	var result model.Goal
	err := s.db.WithContext(ctx).Where("id = ? AND user_id = ?", id, userID).First(&result).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.Goal{}, apierror.NotFound("goal_not_found", "goal was not found")
	}
	if err != nil {
		return model.Goal{}, apierror.Internal(fmt.Errorf("find goal: %w", err))
	}
	return result, nil
}
