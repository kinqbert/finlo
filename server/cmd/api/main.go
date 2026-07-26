package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/kinqbert/finlo/server/internal/apierror"
	"github.com/kinqbert/finlo/server/internal/auth"
	"github.com/kinqbert/finlo/server/internal/config"
	"github.com/kinqbert/finlo/server/internal/database"
	"github.com/kinqbert/finlo/server/internal/health"
	"github.com/kinqbert/finlo/server/internal/validation"
	"github.com/labstack/echo/v5"
	"github.com/labstack/echo/v5/middleware"
	"gorm.io/gorm"
)

func setupHandlers(e *echo.Echo, db *gorm.DB, cfg *config.Config) error {
	auth.Setup(e, db, &cfg.JWT)

	if err := health.Setup(e, db); err != nil {
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

	e.Validator = validation.New()
	e.HTTPErrorHandler = apierror.Handler
	e.Use(middleware.RequestLogger())
	e.Use(middleware.Recover())

	setupHandlers(e, db, &cfg)

	e.GET("/", func(c *echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"message": "Hello, World!"})
	})

	if err := e.Start(":" + cfg.Port); err != nil {
		e.Logger.Error("failed to start server", "error", err)
	}
}
