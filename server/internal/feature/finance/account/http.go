package account

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
	api.GET("/accounts", handler.List)
	api.POST("/accounts", handler.Create)
	api.PATCH("/accounts/:id", handler.Update)
	api.DELETE("/accounts/:id", handler.Delete)
}

func (h *Handler) List(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	accounts, err := h.service.List(c.Request().Context(), userID)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, accounts)
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
	account, err := h.service.Create(c.Request().Context(), userID, input)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusCreated, account)
}

func (h *Handler) Update(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	var input UpdateInput
	if err := request.BindAndValidateBody(c, &input); err != nil {
		return err
	}
	account, err := h.service.Update(c.Request().Context(), userID, c.Param("id"), input)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, account)
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
