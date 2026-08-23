package emergencyfund

import (
	"context"
	"errors"
	"fmt"

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

func (s *Service) Get(ctx context.Context, userID string) (*model.EmergencyFund, error) {
	var fund model.EmergencyFund
	err := s.db.WithContext(ctx).First(&fund, "user_id = ?", userID).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, apierror.Internal(fmt.Errorf("get emergency fund: %w", err))
	}
	return &fund, nil
}

func (s *Service) Save(ctx context.Context, userID string, input UpdateInput) (model.EmergencyFund, error) {
	fund := model.EmergencyFund{
		UserID:       userID,
		TargetMinor:  input.TargetMinor,
		CurrentMinor: input.CurrentMinor,
		Currency:     shared.NormalizeCurrency(input.Currency),
	}
	err := s.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"target_minor", "current_minor", "currency", "updated_at"}),
	}).Create(&fund).Error
	if err != nil {
		return model.EmergencyFund{}, apierror.Internal(fmt.Errorf("save emergency fund: %w", err))
	}
	if err := s.db.WithContext(ctx).First(&fund, "user_id = ?", userID).Error; err != nil {
		return model.EmergencyFund{}, apierror.Internal(fmt.Errorf("reload emergency fund: %w", err))
	}
	return fund, nil
}
