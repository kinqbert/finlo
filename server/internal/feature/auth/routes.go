package auth

import (
	"github.com/kinqbert/finlo/server/internal/platform/config"
	"github.com/labstack/echo/v5"
	"gorm.io/gorm"
)

func RegisterRoutes(e *echo.Echo, db *gorm.DB, jwtConfig *config.JWTConfig) *Middleware {
	tokenService := NewTokenService(jwtConfig.AccessSecret, jwtConfig.RefreshSecret, jwtConfig.Issuer, jwtConfig.Audience)

	authMiddleware := NewMiddleware(tokenService)

	repository := NewRepository(db)
	service := NewService(repository, tokenService)
	handler := NewHandler(service)

	handler.RegisterRoutes(e, authMiddleware)

	return authMiddleware
}
