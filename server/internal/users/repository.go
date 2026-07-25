package users

import (
	"context"
	"errors"
	"fmt"

	"github.com/kinqbert/finlo/server/internal/apierror"
	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) FindByID(ctx context.Context, id string) (User, error) {
	user, err := gorm.G[User](r.db).Where("id = ?", id).First(ctx)

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return User{}, apierror.NotFound("user_not_found", "user was not found")
	}

	if err != nil {
		return User{}, apierror.Internal(
			fmt.Errorf("find user by ID: %w", err),
		)
	}

	return user, nil
}

func (r *Repository) CreateUser(ctx context.Context, user *User) error {
	err := gorm.G[User](r.db).Create(ctx, user)

	if err != nil {
		return apierror.Internal(err)
	}

	return nil
}

func (r *Repository) DeleteByID(ctx context.Context, id string) (int, error) {
	rowsAffected, err := gorm.G[User](r.db).Where("id = ?", id).Delete(ctx)

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return 0, apierror.NotFound("user_not_found", "user was not found")
	}

	if err != nil {
		return 0, apierror.Internal(
			fmt.Errorf("find user by ID: %w", err),
		)
	}

	return rowsAffected, nil
}
