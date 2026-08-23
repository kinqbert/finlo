package dashboard

import (
	"net/http"

	"github.com/kinqbert/finlo/server/internal/feature/auth"
	"github.com/labstack/echo/v5"
	"gorm.io/gorm"
)

type Handler struct {
	service *Service
}

func RegisterRoutes(api *echo.Group, db *gorm.DB) {
	handler := &Handler{service: NewService(db)}
	api.GET("/dashboard", handler.Get)
}

func (h *Handler) Get(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	result, err := h.service.Get(c.Request().Context(), userID)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, result)
}
