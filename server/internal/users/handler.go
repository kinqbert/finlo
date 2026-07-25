package users

import (
	"net/http"

	"github.com/labstack/echo/v5"
)

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

type Handler struct {
	service *Service
}

func (h *Handler) RegisterRoutes(e *echo.Echo) {
	e.POST("/users", h.CreateUser)
	e.GET("/users/:id", h.GetUserByID)
}

func (h *Handler) CreateUser(c *echo.Context) error {
	var input CreateUserInput

	err := c.Bind(&input)

	if err != nil {
		handleError(c, err)
		return nil
	}

	user, err := h.service.CreateUser(c.Request().Context(), input)

	if err != nil {
		handleError(c, err)
		return nil
	}

	return c.JSON(http.StatusCreated, MapUserToResponse(user))
}

func (h *Handler) GetUserByID(c *echo.Context) error {
	id := c.Param("id")

	user, err := h.service.GetByID(c.Request().Context(), id)

	if err != nil {
		handleError(c, err)
		return nil
	}

	return c.JSON(http.StatusOK, MapUserToResponse(user))
}
