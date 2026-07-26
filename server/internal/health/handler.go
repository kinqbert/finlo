package health

import (
	"context"
	"database/sql"
	"net/http"
	"time"

	"github.com/labstack/echo/v5"
)

func NewHandler(db *sql.DB) *Handler {
	return &Handler{db: db}
}

type Handler struct {
	db *sql.DB
}

func (h *Handler) Check(c *echo.Context) error {
	ctx, cancel := context.WithTimeout(
		c.Request().Context(),
		2*time.Second,
	)
	defer cancel()

	if err := h.db.PingContext(ctx); err != nil {
		c.Logger().Error(
			"database health check failed",
			"error",
			err,
		)

		return c.JSON(
			http.StatusServiceUnavailable,
			map[string]string{
				"status": "unhealthy",
			},
		)
	}

	return c.JSON(
		http.StatusOK,
		map[string]string{
			"status": "ok",
		},
	)
}
