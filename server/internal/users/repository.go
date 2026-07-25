package users

import (
	"context"
	"errors"
	"fmt"

	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) CreateUser(ctx context.Context, user *User) (User, error) {
	err := gorm.G[User](r.db).Create(ctx, user)

	if err != nil {
		return User{}, fmt.Errorf("user creation failed: %w", err)
	}

	return *user, nil
}

func (r *Repository) FindByID(ctx context.Context, id string) (User, error) {
	user, err := gorm.G[User](r.db).Where("id = ?", id).First(ctx)

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return User{}, ErrNotFound
	}

	if err != nil {
		return User{}, fmt.Errorf("failed to find user: %w", err)
	}

	return user, nil
}

func (r *Repository) DeleteByID(ctx context.Context, id string) (int, error) {
	rowsAffected, err := gorm.G[User](r.db).Where("id = ?", id).Delete(ctx)

	if err != nil {
		return 0, err
	}

	return rowsAffected, nil
}
