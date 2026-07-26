package auth

import (
	"errors"

	"github.com/kinqbert/finlo/server/internal/apierror"
)

var (
	ErrUserNotFound       = errors.New("user not found")
	ErrEmailAlreadyExists = errors.New("email already exists")
)

func invalidCredentialsError() error {
	return apierror.Unauthorized("invalid_credentials", "invalid email or password")
}

func invalidRefreshTokenError() error {
	return apierror.Unauthorized("invalid_refresh_token", "refresh token is invalid or expired")
}
