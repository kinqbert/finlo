package auth

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/kinqbert/finlo/server/internal/apierror"
	"github.com/kinqbert/finlo/server/internal/utils"
	"gorm.io/gorm"
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

	return s.repository.FindByID(ctx, id)
}

func (s *Service) RegisterUser(ctx context.Context, input RegisterDTO) (Tokens, error) {
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

	if errors.Is(err, gorm.ErrDuplicatedKey) {
		return Tokens{}, apierror.Conflict("user_alread_exists", "such user already exists")
	}

	if err != nil {
		return Tokens{}, err
	}

	return s.tokenService.Generate(user.ID)
}

func (s *Service) LoginUser(ctx context.Context, input LoginDTO) (Tokens, error) {
	email := utils.NormalizeEmail(input.Email)

	user, err := s.repository.FindByEmail(ctx, email)
	if err != nil {
		return Tokens{}, apierror.Forbidden("invalid_credentials", "Wrong email and password combination")
	}

	if !ComparePassword(user.PasswordHash, input.Password) {
		return Tokens{}, apierror.Forbidden("invalid_credentials", "Wrong email and password combination")
	}

	return s.tokenService.Generate(user.ID)
}

func (s *Service) Refresh(ctx context.Context, refreshToken string) (Tokens, error) {
	userID, err := s.tokenService.ParseRefresh(refreshToken)
	if err != nil {
		return Tokens{}, apierror.Unauthorized("invalid_refresh_token", "refresh token is invalid or expired")
	}

	if _, err := s.repository.FindByID(ctx, userID); err != nil {
		return Tokens{}, apierror.Forbidden("invalid_credentials", "Wrong email and password combination")
	}

	return s.tokenService.Generate(userID)
}
