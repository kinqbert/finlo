package auth

import (
	"github.com/kinqbert/finlo/server/internal/config"
	"github.com/labstack/echo/v5"
	"gorm.io/gorm"
)

func Setup(e *echo.Echo, db *gorm.DB, jwtConfig *config.JWTConfig) *Handler {
	tokenService := NewTokenService(jwtConfig.AccessSecret, jwtConfig.RefreshSecret, jwtConfig.Issuer, jwtConfig.Audience)

	repository := NewRepository(db)
	service := NewService(repository, tokenService)
	handler := NewHandler(service)

	handler.RegisterRoutes(e)

	return handler
}
