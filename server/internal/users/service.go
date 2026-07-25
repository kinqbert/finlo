package users

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/kinqbert/finlo/server/internal/apierror"
	"gorm.io/gorm"
)

type Service struct {
	repository *Repository
}

func NewService(repository *Repository) *Service {
	return &Service{repository: repository}
}

func (s *Service) GetByID(ctx context.Context, id string) (User, error) {
	if _, err := uuid.Parse(id); err != nil {
		return User{}, apierror.BadRequest("invalid_user_id", "user ID must be valid UUID")
	}

	return s.repository.FindByID(ctx, id)
}

func (s *Service) CreateUser(ctx context.Context, input CreateUserDTO) (User, error) {
	email := strings.TrimSpace(strings.ToLower(input.Email))

	hashedPassword, err := hashPassword(input.Password)
	if err != nil {
		return User{}, err
	}

	user := &User{
		ID:           uuid.NewString(),
		Name:         strings.TrimSpace(input.Name),
		Surname:      strings.TrimSpace(input.Surname),
		Email:        email,
		PasswordHash: hashedPassword,
	}

	err = s.repository.CreateUser(ctx, user)

	if errors.Is(err, gorm.ErrDuplicatedKey) {
		return User{}, apierror.Conflict("user_alread_exists", "such user already exists")
	}

	if err != nil {
		return User{}, err
	}

	return *user, err
}
