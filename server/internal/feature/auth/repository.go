package auth

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

func (r *Repository) FindByID(ctx context.Context, id string) (User, error) {
	user, err := gorm.G[User](r.db).Where("id = ?", id).First(ctx)

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return User{}, ErrUserNotFound
	}

	if err != nil {
		return User{}, fmt.Errorf("find user by ID: %w", err)
	}

	return user, nil
}

func (r *Repository) FindByEmail(ctx context.Context, email string) (User, error) {
	user, err := gorm.G[User](r.db).Where("email = ?", email).First(ctx)

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return User{}, ErrUserNotFound
	}

	if err != nil {
		return User{}, fmt.Errorf("find user by email: %w", err)
	}

	return user, nil
}

func (r *Repository) CreateUser(ctx context.Context, user *User) error {
	err := gorm.G[User](r.db).Create(ctx, user)

	if errors.Is(err, gorm.ErrDuplicatedKey) {
		return ErrEmailAlreadyExists
	}

	if err != nil {
		return fmt.Errorf("create user: %w", err)
	}

	return nil
}

func (r *Repository) FindOrCreateGoogleUser(ctx context.Context, identity GoogleIdentity) (User, error) {
	var result User

	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("google_subject = ?", identity.Subject).First(&result).Error; err == nil {
			return nil
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("find user by Google subject: %w", err)
		}

		err := tx.Where("email = ?", identity.Email).First(&result).Error
		switch {
		case err == nil:
			if result.GoogleSubject != nil && *result.GoogleSubject != identity.Subject {
				return ErrGoogleAlreadyLinked
			}

			result.GoogleSubject = &identity.Subject
			if identity.AvatarURL != "" {
				result.AvatarURL = identity.AvatarURL
			}
			if err := tx.Save(&result).Error; err != nil {
				return fmt.Errorf("link Google identity: %w", err)
			}
			return nil

		case !errors.Is(err, gorm.ErrRecordNotFound):
			return fmt.Errorf("find user by email: %w", err)
		}

		result = User{
			ID:            identity.UserID,
			Name:          identity.GivenName,
			Surname:       identity.FamilyName,
			Email:         identity.Email,
			GoogleSubject: &identity.Subject,
			AvatarURL:     identity.AvatarURL,
		}

		if err := tx.Create(&result).Error; err != nil {
			if errors.Is(err, gorm.ErrDuplicatedKey) {
				return ErrEmailAlreadyExists
			}
			return fmt.Errorf("create Google user: %w", err)
		}

		return nil
	})
	if err != nil {
		return User{}, err
	}

	return result, nil
}
