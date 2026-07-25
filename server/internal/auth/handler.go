package auth

import (
	"net/http"

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
	e.POST("/auth/register", h.Register)
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

	return c.JSON(http.StatusCreated, tokens)
}
