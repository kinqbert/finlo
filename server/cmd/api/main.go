package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/kinqbert/finlo/server/internal/feature/auth"
	"github.com/kinqbert/finlo/server/internal/feature/finance"
	"github.com/kinqbert/finlo/server/internal/feature/health"
	"github.com/kinqbert/finlo/server/internal/http/apierror"
	httpvalidator "github.com/kinqbert/finlo/server/internal/http/validator"
	"github.com/kinqbert/finlo/server/internal/platform/config"
	"github.com/kinqbert/finlo/server/internal/platform/database"
	"github.com/labstack/echo/v5"
	"github.com/labstack/echo/v5/middleware"
	"gorm.io/gorm"
)

func setupHandlers(e *echo.Echo, db *gorm.DB, cfg *config.Config) error {
	authMiddleware := auth.RegisterRoutes(e, db, &cfg.JWT, &cfg.Google)
	finance.RegisterRoutes(e, db, authMiddleware)

	if err := health.RegisterRoutes(e, db); err != nil {
		return fmt.Errorf("set up health handler: %w", err)
	}

	return nil
}

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("load configuration: %v", err)
	}

	db, err := database.OpenConnection(&cfg.Database)
	if err != nil {
		log.Fatalf("open database: %v", err)
	}

	e := echo.New()

	e.Validator = httpvalidator.New()
	e.HTTPErrorHandler = apierror.Handler

	e.Use(middleware.RequestLogger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: cfg.CORS.AllowedOrigins,
		AllowHeaders: []string{"Accept", "Authorization", "Content-Type"},
		MaxAge:       3600,
	}))

	if err := setupHandlers(e, db, &cfg); err != nil {
		log.Fatalf("set up handlers: %v", err)
	}

	e.GET("/", func(c *echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"name": "Finlo API", "status": "ok"})
	})

	if err := e.Start(":" + cfg.Port); err != nil {
		e.Logger.Error("failed to start server", "error", err)
	}
}
