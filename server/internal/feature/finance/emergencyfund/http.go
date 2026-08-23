package emergencyfund

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
	api.GET("/emergency-fund", handler.Get)
	api.PUT("/emergency-fund", handler.Save)
}

func (h *Handler) Get(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	fund, err := h.service.Get(c.Request().Context(), userID)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, fund)
}

func (h *Handler) Save(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	var input UpdateInput
	if err := request.BindAndValidateBody(c, &input); err != nil {
		return err
	}
	fund, err := h.service.Save(c.Request().Context(), userID, input)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, fund)
}
