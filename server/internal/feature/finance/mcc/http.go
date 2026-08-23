package mcc

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
	api.GET("/mcc-rules", h.list)
	api.POST("/mcc-rules", h.save)
	api.DELETE("/mcc-rules/:id", h.delete)
	api.PATCH("/transactions/:id/category", h.assignTransaction)
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

func (h *Handler) save(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	var input SaveRuleInput
	if err := request.BindAndValidateBody(c, &input); err != nil {
		return err
	}
	result, err := h.service.Save(c.Request().Context(), userID, input)
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

func (h *Handler) assignTransaction(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	var input AssignCategoryInput
	if err := request.BindAndValidateBody(c, &input); err != nil {
		return err
	}
	result, err := h.service.AssignTransaction(c.Request().Context(), userID, c.Param("id"), input)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, result)
}
