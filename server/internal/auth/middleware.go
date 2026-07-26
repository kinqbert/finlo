package auth

import (
	"strings"

	"github.com/kinqbert/finlo/server/internal/apierror"
	"github.com/labstack/echo/v5"
)

const userIDContextKey = "authenticated_user_id"

type Middleware struct {
	tokens *TokenService
}

func NewMiddleware(tokens *TokenService) *Middleware {
	return &Middleware{tokens: tokens}
}

func (m *Middleware) RequireAccessToken(
	next echo.HandlerFunc,
) echo.HandlerFunc {
	return func(c *echo.Context) error {
		header := c.Request().Header.Get("Authorization")
		parts := strings.Fields(header)

		if len(parts) != 2 ||
			!strings.EqualFold(parts[0], "Bearer") {
			return apierror.Unauthorized(
				"missing_access_token",
				"a valid access token is required",
			)
		}

		userID, err := m.tokens.ParseAccess(parts[1])
		if err != nil {
			return apierror.Unauthorized(
				"invalid_access_token",
				"access token is invalid or expired",
			)
		}

		c.Set(userIDContextKey, userID)

		return next(c)
	}
}

func UserIDFromContext(c *echo.Context) (string, error) {
	userID, ok := c.Get(userIDContextKey).(string)
	if !ok || userID == "" {
		return "", apierror.Unauthorized(
			"unauthenticated",
			"authentication is required",
		)
	}

	return userID, nil
}
