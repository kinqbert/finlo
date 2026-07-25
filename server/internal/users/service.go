package users

import (
	"context"

	"github.com/google/uuid"
)

type Service struct {
	repository *Repository
}

func NewService(repository *Repository) *Service {
	return &Service{repository: repository}
}

func (s *Service) GetByID(ctx context.Context, id string) (User, error) {
	if _, err := uuid.Parse(id); err != nil {
		return User{}, ErrInvalidInput
	}

	return s.repository.FindByID(ctx, id)
}

func (s *Service) CreateUser(ctx context.Context, input CreateUserInput) (User, error) {
	user, err := s.repository.CreateUser(ctx, &User{
		ID:      uuid.NewString(),
		Name:    input.Name,
		Surname: input.Surname,
	})

	if err != nil {
		return User{}, err
	}

	return user, err
}
