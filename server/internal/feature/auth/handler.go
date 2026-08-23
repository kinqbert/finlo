package auth

import (
	"net/http"
	"strings"

	"github.com/kinqbert/finlo/server/internal/http/apierror"
	"github.com/kinqbert/finlo/server/internal/http/request"
	"github.com/labstack/echo/v5"
)

func NewHandler(service *Service, cookies CookieOptions) *Handler {
	return &Handler{service: service, cookies: cookies}
}

type Handler struct {
	service *Service
	cookies CookieOptions
}

func (h *Handler) RegisterRoutes(e *echo.Echo, authMiddleware *Middleware) {
	auth := e.Group("/auth")

	auth.POST("/register", h.Register)
	auth.POST("/login", h.Login)
	auth.POST("/refresh", h.Refresh)
	auth.POST("/logout", h.Logout)
	auth.POST("/google", h.Google)

	auth.GET("/me", h.Me, authMiddleware.RequireAccessToken)
}

func (h *Handler) Google(c *echo.Context) error {
	var input GoogleLoginBodyDTO
	if err := request.BindAndValidateBody(c, &input); err != nil {
		return err
	}

	tokens, err := h.service.LoginWithGoogle(c.Request().Context(), input.IDToken)
	if err != nil {
		return err
	}

	return h.respondWithTokens(c, http.StatusOK, tokens, h.usesCookieTransport(c))
}

func (h *Handler) Register(c *echo.Context) error {
	var input RegisterBodyDTO
	err := request.BindAndValidateBody(c, &input)

	if err != nil {
		return err
	}

	tokens, err := h.service.RegisterUser(c.Request().Context(), input)

	if err != nil {
		return err
	}

	return h.respondWithTokens(c, http.StatusCreated, tokens, h.usesCookieTransport(c))
}

func (h *Handler) Login(c *echo.Context) error {
	var input LoginBodyDTO
	err := request.BindAndValidateBody(c, &input)

	if err != nil {
		return err
	}

	tokens, err := h.service.LoginUser(c.Request().Context(), input)

	if err != nil {
		return err
	}

	return h.respondWithTokens(c, http.StatusOK, tokens, h.usesCookieTransport(c))
}

func (h *Handler) Refresh(c *echo.Context) error {
	refreshToken := ""
	usesCookie := false
	if cookie, err := c.Cookie(refreshCookieName); err == nil {
		refreshToken = strings.TrimSpace(cookie.Value)
		usesCookie = refreshToken != ""
	}
	if refreshToken == "" {
		var input RefreshBodyDTO
		if err := request.BindAndValidateBody(c, &input); err != nil {
			return err
		}
		refreshToken = strings.TrimSpace(input.RefreshToken)
	}

	if refreshToken == "" {
		return apierror.BadRequest(
			"refresh_token_required",
			"refresh token is required",
		)
	}

	tokens, err := h.service.Refresh(c.Request().Context(), refreshToken)

	if err != nil {
		return err
	}

	return h.respondWithTokens(c, http.StatusOK, tokens, usesCookie)
}

func (h *Handler) Logout(c *echo.Context) error {
	c.SetCookie(expiredRefreshCookie(h.cookies))
	return c.NoContent(http.StatusNoContent)
}

func (h *Handler) Me(c *echo.Context) error {
	userID, err := UserIDFromContext(c)
	if err != nil {
		return apierror.Unauthorized("unauthorized", "unauthorized")
	}

	user, err := h.service.GetByID(c.Request().Context(), userID)
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, MapUserToDto(user))
}

func (h *Handler) usesCookieTransport(c *echo.Context) bool {
	return strings.EqualFold(strings.TrimSpace(c.Request().Header.Get(tokenTransportHeader)), cookieTokenTransport)
}

func (h *Handler) respondWithTokens(c *echo.Context, status int, tokens Tokens, usesCookie bool) error {
	if usesCookie {
		c.SetCookie(refreshCookie(tokens.Refresh, h.cookies))
		tokens.Refresh = ""
	}
	return c.JSON(status, tokens)
}
