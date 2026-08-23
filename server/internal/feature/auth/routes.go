package auth

import (
	"net/http"

	"github.com/kinqbert/finlo/server/internal/platform/config"
	"github.com/labstack/echo/v5"
	"gorm.io/gorm"
)

func RegisterRoutes(e *echo.Echo, db *gorm.DB, jwtConfig *config.JWTConfig, googleConfig *config.GoogleConfig, cookieConfig *config.AuthCookieConfig) *Middleware {
	tokenService := NewTokenService(jwtConfig.AccessSecret, jwtConfig.RefreshSecret, jwtConfig.Issuer, jwtConfig.Audience)

	authMiddleware := NewMiddleware(tokenService)

	repository := NewRepository(db)
	service := NewService(repository, tokenService, NewGoogleVerifier(googleConfig.ClientIDs))
	sameSite := http.SameSiteLaxMode
	switch cookieConfig.SameSite {
	case "strict":
		sameSite = http.SameSiteStrictMode
	case "none":
		sameSite = http.SameSiteNoneMode
	}
	handler := NewHandler(service, CookieOptions{Domain: cookieConfig.Domain, Secure: cookieConfig.Secure, SameSite: sameSite})

	handler.RegisterRoutes(e, authMiddleware)

	return authMiddleware
}
