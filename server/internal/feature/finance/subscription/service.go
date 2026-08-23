package subscription

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/kinqbert/finlo/server/internal/feature/finance/account"
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

func (s *Service) List(ctx context.Context, userID string) ([]model.Subscription, error) {
	subscriptions := make([]model.Subscription, 0)
	if err := s.db.WithContext(ctx).Where("user_id = ?", userID).Order("active DESC, billing_day ASC").Find(&subscriptions).Error; err != nil {
		return nil, apierror.Internal(fmt.Errorf("list subscriptions: %w", err))
	}
	ResolveNextPaymentDates(subscriptions, time.Now().UTC())
	return subscriptions, nil
}

func (s *Service) Create(ctx context.Context, userID string, input CreateInput) (model.Subscription, error) {
	if err := account.Ensure(ctx, s.db, userID, input.AccountID); err != nil {
		return model.Subscription{}, err
	}
	nextPayment, err := shared.ParseOptionalDate(input.NextPaymentDate)
	if err != nil {
		return model.Subscription{}, err
	}
	if nextPayment == nil {
		calculated := NextBillingDate(input.BillingDay, time.Now().UTC())
		nextPayment = &calculated
	}
	active := true
	if input.Active != nil {
		active = *input.Active
	}
	created := model.Subscription{
		ID:              uuid.NewString(),
		UserID:          userID,
		AccountID:       input.AccountID,
		Name:            strings.TrimSpace(input.Name),
		AmountMinor:     input.AmountMinor,
		Currency:        shared.NormalizeCurrency(input.Currency),
		BillingDay:      input.BillingDay,
		Active:          active,
		NextPaymentDate: nextPayment,
	}
	if err := s.db.WithContext(ctx).Create(&created).Error; err != nil {
		return model.Subscription{}, apierror.Internal(fmt.Errorf("create subscription: %w", err))
	}
	return created, nil
}

func (s *Service) Update(ctx context.Context, userID, id string, input UpdateInput) (model.Subscription, error) {
	if err := shared.ValidateID(id); err != nil {
		return model.Subscription{}, err
	}
	if err := account.Ensure(ctx, s.db, userID, input.AccountID); err != nil {
		return model.Subscription{}, err
	}

	var existing model.Subscription
	err := s.db.WithContext(ctx).Where("id = ? AND user_id = ?", id, userID).First(&existing).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.Subscription{}, apierror.NotFound("subscription_not_found", "subscription was not found")
	}
	if err != nil {
		return model.Subscription{}, apierror.Internal(fmt.Errorf("find subscription: %w", err))
	}

	updates := map[string]any{}
	if input.AccountID != nil {
		updates["account_id"] = *input.AccountID
	}
	if input.Name != nil {
		name := strings.TrimSpace(*input.Name)
		if name == "" {
			return model.Subscription{}, apierror.BadRequest("invalid_name", "name is required")
		}
		updates["name"] = name
	}
	if input.AmountMinor != nil {
		updates["amount_minor"] = *input.AmountMinor
	}
	if input.BillingDay != nil {
		updates["billing_day"] = *input.BillingDay
		if input.NextPaymentDate == nil {
			updates["next_payment_date"] = NextBillingDate(*input.BillingDay, time.Now().UTC())
		}
	}
	if input.Active != nil {
		updates["active"] = *input.Active
	}
	if input.NextPaymentDate != nil {
		nextPayment, err := shared.ParseOptionalDate(input.NextPaymentDate)
		if err != nil {
			return model.Subscription{}, err
		}
		updates["next_payment_date"] = nextPayment
	}
	if len(updates) == 0 {
		return existing, nil
	}

	updates["updated_at"] = time.Now()
	if err := s.db.WithContext(ctx).Model(&existing).Updates(updates).Error; err != nil {
		return model.Subscription{}, apierror.Internal(fmt.Errorf("update subscription: %w", err))
	}
	if err := s.db.WithContext(ctx).First(&existing, "id = ? AND user_id = ?", id, userID).Error; err != nil {
		return model.Subscription{}, apierror.Internal(fmt.Errorf("reload subscription: %w", err))
	}
	return existing, nil
}

func (s *Service) Delete(ctx context.Context, userID, id string) error {
	if err := shared.ValidateID(id); err != nil {
		return err
	}
	result := s.db.WithContext(ctx).Where("id = ? AND user_id = ?", id, userID).Delete(&model.Subscription{})
	if result.Error != nil {
		return apierror.Internal(fmt.Errorf("delete subscription: %w", result.Error))
	}
	if result.RowsAffected == 0 {
		return apierror.NotFound("subscription_not_found", "subscription was not found")
	}
	return nil
}
