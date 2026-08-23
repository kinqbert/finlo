package account

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

type Service struct {
	db *gorm.DB
}

func NewService(db *gorm.DB) *Service {
	return &Service{db: db}
}

func (s *Service) List(ctx context.Context, userID string) ([]model.Account, error) {
	accounts := make([]model.Account, 0)
	if err := s.db.WithContext(ctx).Where("user_id = ?", userID).Order("created_at ASC").Find(&accounts).Error; err != nil {
		return nil, apierror.Internal(fmt.Errorf("list accounts: %w", err))
	}
	return accounts, nil
}

func (s *Service) Create(ctx context.Context, userID string, input CreateInput) (model.Account, error) {
	account := model.Account{
		ID:           uuid.NewString(),
		UserID:       userID,
		Name:         strings.TrimSpace(input.Name),
		Type:         input.Type,
		Currency:     shared.NormalizeCurrency(input.Currency),
		BalanceMinor: input.BalanceMinor,
	}
	if err := s.db.WithContext(ctx).Create(&account).Error; err != nil {
		return model.Account{}, apierror.Internal(fmt.Errorf("create account: %w", err))
	}
	return account, nil
}

func (s *Service) Update(ctx context.Context, userID, id string, input UpdateInput) (model.Account, error) {
	if err := shared.ValidateID(id); err != nil {
		return model.Account{}, err
	}

	updates := map[string]any{}
	if input.Name != nil {
		name := strings.TrimSpace(*input.Name)
		if name == "" {
			return model.Account{}, apierror.BadRequest("invalid_name", "name is required")
		}
		updates["name"] = name
	}
	if input.Type != nil {
		updates["type"] = *input.Type
	}
	if input.BalanceMinor != nil {
		updates["balance_minor"] = *input.BalanceMinor
	}

	account, err := Find(ctx, s.db, userID, id)
	if err != nil {
		return model.Account{}, err
	}
	if len(updates) == 0 {
		return account, nil
	}

	updates["updated_at"] = time.Now()
	if err := s.db.WithContext(ctx).Model(&account).Updates(updates).Error; err != nil {
		return model.Account{}, apierror.Internal(fmt.Errorf("update account: %w", err))
	}
	if err := s.db.WithContext(ctx).First(&account, "id = ? AND user_id = ?", id, userID).Error; err != nil {
		return model.Account{}, apierror.Internal(fmt.Errorf("reload account: %w", err))
	}
	return account, nil
}

func (s *Service) Delete(ctx context.Context, userID, id string) error {
	account, err := Find(ctx, s.db, userID, id)
	if err != nil {
		return err
	}

	var references int64
	if err := s.db.WithContext(ctx).Model(&model.Transaction{}).Where("account_id = ? AND user_id = ?", id, userID).Count(&references).Error; err != nil {
		return apierror.Internal(fmt.Errorf("check account transactions: %w", err))
	}
	if references > 0 {
		return apierror.Conflict("account_in_use", "account with transactions cannot be deleted")
	}
	if err := s.db.WithContext(ctx).Model(&model.Subscription{}).Where("account_id = ? AND user_id = ?", id, userID).Count(&references).Error; err != nil {
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

func Find(ctx context.Context, db *gorm.DB, userID, id string) (model.Account, error) {
	if err := shared.ValidateID(id); err != nil {
		return model.Account{}, err
	}
	var account model.Account
	err := db.WithContext(ctx).Where("id = ? AND user_id = ?", id, userID).First(&account).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return model.Account{}, apierror.NotFound("account_not_found", "account was not found")
	}
	if err != nil {
		return model.Account{}, apierror.Internal(fmt.Errorf("find account: %w", err))
	}
	return account, nil
}

func Ensure(ctx context.Context, db *gorm.DB, userID string, accountID *string) error {
	if accountID == nil {
		return nil
	}
	_, err := Find(ctx, db, userID, *accountID)
	return err
}
