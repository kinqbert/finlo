package auth

import (
	"net/http"
	"strings"

	"github.com/kinqbert/finlo/server/internal/http/apierror"
	"github.com/kinqbert/finlo/server/internal/http/request"
	"github.com/labstack/echo/v5"
)

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

type Handler struct {
	service *Service
}

func (h *Handler) RegisterRoutes(e *echo.Echo, authMiddleware *Middleware) {
	auth := e.Group("/auth")

	auth.POST("/register", h.Register)
	auth.POST("/login", h.Login)
	auth.POST("/refresh", h.Refresh)

	auth.GET("/me", h.Me, authMiddleware.RequireAccessToken)
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

	return c.JSON(http.StatusCreated, tokens)
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

	return c.JSON(http.StatusOK, tokens)
}

func (h *Handler) Refresh(c *echo.Context) error {
	var input RefreshBodyDTO
	err := request.BindAndValidateBody(c, &input)

	if err != nil {
		return err
	}

	if strings.TrimSpace(input.RefreshToken) == "" {
		return apierror.BadRequest(
			"refresh_token_required",
			"refresh token is required",
		)
	}

	tokens, err := h.service.Refresh(c.Request().Context(), input.RefreshToken)

	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, tokens)
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
