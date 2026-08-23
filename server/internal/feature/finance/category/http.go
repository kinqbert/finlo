package category

import (
	"net/http"

	"github.com/kinqbert/finlo/server/internal/feature/auth"
	"github.com/kinqbert/finlo/server/internal/http/request"
	"github.com/labstack/echo/v5"
	"gorm.io/gorm"
)

type Handler struct{ service *Service }

func RegisterRoutes(api *echo.Group, db *gorm.DB) {
	h := &Handler{service: NewService(db)}
	api.GET("/categories", h.list)
	api.POST("/categories", h.create)
	api.PATCH("/categories/:id", h.update)
	api.DELETE("/categories/:id", h.delete)
	api.PUT("/categories/order", h.reorder)
}

func (h *Handler) list(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	result, err := h.service.List(c.Request().Context(), userID)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, result)
}

func (h *Handler) create(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	var input CreateInput
	if err := request.BindAndValidateBody(c, &input); err != nil {
		return err
	}
	result, err := h.service.Create(c.Request().Context(), userID, input)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusCreated, result)
}

func (h *Handler) update(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	var input UpdateInput
	if err := request.BindAndValidateBody(c, &input); err != nil {
		return err
	}
	result, err := h.service.Update(c.Request().Context(), userID, c.Param("id"), input)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, result)
}

func (h *Handler) delete(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	if err := h.service.Delete(c.Request().Context(), userID, c.Param("id")); err != nil {
		return err
	}
	return c.NoContent(http.StatusNoContent)
}

func (h *Handler) reorder(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	var input ReorderInput
	if err := request.BindAndValidateBody(c, &input); err != nil {
		return err
	}
	result, err := h.service.Reorder(c.Request().Context(), userID, input)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, result)
}
