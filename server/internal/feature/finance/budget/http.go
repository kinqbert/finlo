package budget

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
	api.GET("/budgets", handler.List)
	api.POST("/budgets", handler.Save)
	api.DELETE("/budgets/:id", handler.Delete)
}

func (h *Handler) List(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	budgets, err := h.service.List(c.Request().Context(), userID, c.QueryParam("month"))
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, budgets)
}

func (h *Handler) Save(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	var input CreateInput
	if err := request.BindAndValidateBody(c, &input); err != nil {
		return err
	}
	saved, err := h.service.Save(c.Request().Context(), userID, input)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, saved)
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
