package transaction

import (
	"net/http"

	"github.com/kinqbert/finlo/server/internal/feature/auth"
	"github.com/kinqbert/finlo/server/internal/http/request"
	"github.com/labstack/echo/v5"
	"gorm.io/gorm"
)

type Handler struct {
	service *Service
}

func RegisterRoutes(api *echo.Group, db *gorm.DB) {
	handler := &Handler{service: NewService(db)}
	api.GET("/transactions", handler.List)
	api.POST("/transactions", handler.Create)
	api.DELETE("/transactions/:id", handler.Delete)
}

func (h *Handler) List(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	transactions, err := h.service.List(c.Request().Context(), userID)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, transactions)
}

func (h *Handler) Create(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	var input CreateInput
	if err := request.BindAndValidateBody(c, &input); err != nil {
		return err
	}
	created, err := h.service.Create(c.Request().Context(), userID, input)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusCreated, created)
}

func (h *Handler) Delete(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	if err := h.service.Delete(c.Request().Context(), userID, c.Param("id")); err != nil {
		return err
	}
	return c.NoContent(http.StatusNoContent)
}
