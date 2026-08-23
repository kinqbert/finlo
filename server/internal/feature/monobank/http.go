package monobank

import (
	"fmt"
	"net/http"

	"github.com/kinqbert/finlo/server/internal/feature/auth"
	"github.com/kinqbert/finlo/server/internal/http/request"
	"github.com/kinqbert/finlo/server/internal/integration/monobankapi"
	"github.com/kinqbert/finlo/server/internal/platform/config"
	"github.com/labstack/echo/v5"
	"gorm.io/gorm"
)

type Handler struct{ service *Service }

func RegisterRoutes(e *echo.Echo, db *gorm.DB, authMiddleware *auth.Middleware, cfg *config.MonobankConfig) error {
	service, err := NewService(db, monobankapi.NewClient(cfg.APIURL), cfg.CredentialsKey, cfg.WebhookBaseURL)
	if err != nil {
		return fmt.Errorf("configure Monobank integration: %w", err)
	}
	h := &Handler{service: service}
	api := e.Group("/api/integrations/monobank", authMiddleware.RequireAccessToken)
	api.GET("", h.getConnection)
	api.POST("/preview", h.preview)
	api.POST("/complete", h.complete)
	api.PUT("/webhook", h.registerWebhook)
	api.DELETE("/webhook", h.disconnectWebhook)
	e.GET("/webhooks/monobank/:secret", h.validateWebhook)
	e.POST("/webhooks/monobank/:secret", h.webhook)
	return nil
}

func (h *Handler) getConnection(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	result, err := h.service.GetConnection(c.Request().Context(), userID)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, result)
}

func (h *Handler) preview(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	var input PreviewInput
	if err := request.BindAndValidateBody(c, &input); err != nil {
		return err
	}
	result, err := h.service.Preview(c.Request().Context(), userID, input.Token)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, result)
}

func (h *Handler) complete(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	var input CompleteInput
	if err := request.BindAndValidateBody(c, &input); err != nil {
		return err
	}
	result, err := h.service.Complete(c.Request().Context(), userID, input)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, result)
}

func (h *Handler) registerWebhook(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	result, err := h.service.RegisterWebhook(c.Request().Context(), userID)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, result)
}

func (h *Handler) disconnectWebhook(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	result, err := h.service.DisconnectWebhook(c.Request().Context(), userID)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, result)
}

func (h *Handler) validateWebhook(c *echo.Context) error {
	if err := h.service.ValidateWebhook(c.Request().Context(), c.Param("secret")); err != nil {
		return err
	}
	return c.NoContent(http.StatusOK)
}

func (h *Handler) webhook(c *echo.Context) error {
	var event monobankapi.WebhookEvent
	if err := c.Bind(&event); err != nil {
		return c.NoContent(http.StatusBadRequest)
	}
	if err := h.service.ProcessWebhook(c.Request().Context(), c.Param("secret"), event); err != nil {
		return err
	}
	return c.NoContent(http.StatusOK)
}
