package auth

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/kinqbert/finlo/server/internal/apierror"
	"github.com/kinqbert/finlo/server/internal/utils"
)

type Service struct {
	repository   *Repository
	tokenService *TokenService
}

func NewService(repository *Repository, tokenService *TokenService) *Service {
	return &Service{repository: repository, tokenService: tokenService}
}

func (s *Service) GetByID(ctx context.Context, id string) (User, error) {
	if _, err := uuid.Parse(id); err != nil {
		return User{}, apierror.BadRequest("invalid_user_id", "user ID must be valid UUID")
	}

	user, err := s.repository.FindByID(ctx, id)

	switch {
	case errors.Is(err, ErrUserNotFound):
		return User{}, apierror.NotFound(
			"user_not_found",
			"user was not found",
		)
	case err != nil:
		return User{}, apierror.Internal(err)
	}

	return user, nil
}

func (s *Service) RegisterUser(ctx context.Context, input RegisterBodyDTO) (Tokens, error) {
	email := strings.TrimSpace(strings.ToLower(input.Email))

	hashedPassword, err := hashPassword(input.Password)
	if err != nil {
		return Tokens{}, err
	}

	user := &User{
		ID:           uuid.NewString(),
		Name:         strings.TrimSpace(input.Name),
		Surname:      strings.TrimSpace(input.Surname),
		Email:        email,
		PasswordHash: hashedPassword,
	}

	err = s.repository.CreateUser(ctx, user)

	switch {
	case errors.Is(err, ErrEmailAlreadyExists):
		return Tokens{}, apierror.Conflict("email_already_registered", "email is already registered")
	case err != nil:
		return Tokens{}, apierror.Internal(err)
	}

	return s.tokenService.Generate(user.ID)
}

func (s *Service) LoginUser(ctx context.Context, input LoginBodyDTO) (Tokens, error) {
	email := utils.NormalizeEmail(input.Email)

	user, err := s.repository.FindByEmail(ctx, email)
	switch {
	case errors.Is(err, ErrUserNotFound):
		return Tokens{}, invalidCredentialsError()
	case err != nil:
		return Tokens{}, apierror.Internal(err)
	}

	if !ComparePassword(user.PasswordHash, input.Password) {
		return Tokens{}, invalidCredentialsError()
	}

	return s.tokenService.Generate(user.ID)
}

func (s *Service) Refresh(ctx context.Context, refreshToken string) (Tokens, error) {
	userID, err := s.tokenService.ParseRefresh(refreshToken)
	if err != nil {
		return Tokens{}, invalidRefreshTokenError()
	}

	_, err = s.repository.FindByID(ctx, userID)

	switch {
	case errors.Is(err, ErrUserNotFound):
		return Tokens{}, invalidRefreshTokenError()
	case err != nil:
		return Tokens{}, apierror.Internal(err)
	}

	return s.tokenService.Generate(userID)
}
