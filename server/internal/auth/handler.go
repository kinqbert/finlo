package auth

import (
	"net/http"
	"strings"

	"github.com/kinqbert/finlo/server/internal/apierror"
	"github.com/labstack/echo/v5"
)

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

type Handler struct {
	service *Service
}

func (h *Handler) RegisterRoutes(e *echo.Echo) {
	auth := e.Group("/auth")

	auth.POST("/register", h.Register)
	auth.POST("/login", h.Login)
	auth.POST("/refresh", h.Refresh)
}

func (h *Handler) Register(c *echo.Context) error {
	var input RegisterDTO

	if err := c.Bind(&input); err != nil {
		return apierror.BadRequest(
			"invalid_request_body",
			"request body is invalid",
		)
	}

	tokens, err := h.service.RegisterUser(c.Request().Context(), input)

	if err != nil {
		return err
	}

	return c.JSON(http.StatusCreated, tokens)
}

func (h *Handler) Login(c *echo.Context) error {
	var input LoginDTO

	if err := c.Bind(&input); err != nil {
		return apierror.BadRequest(
			"invalid_request_body",
			"request body is invalid",
		)
	}

	tokens, err := h.service.LoginUser(c.Request().Context(), input)

	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, tokens)
}

func (h *Handler) Refresh(c *echo.Context) error {
	var input RefreshDTO

	if err := c.Bind(&input); err != nil {
		return apierror.BadRequest(
			"invalid_request_body",
			"request body is invalid",
		)
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
