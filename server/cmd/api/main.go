package main

import (
	"log"
	"net/http"

	"github.com/kinqbert/finlo/server/internal/apierror"
	"github.com/kinqbert/finlo/server/internal/auth"
	"github.com/kinqbert/finlo/server/internal/config"
	"github.com/kinqbert/finlo/server/internal/database"
	"github.com/labstack/echo/v5"
	"github.com/labstack/echo/v5/middleware"
	"gorm.io/gorm"
)

func setupHandlers(e *echo.Echo, db *gorm.DB, cfg *config.Config) {
	auth.Setup(e, db, &cfg.JWT)
}

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Error loading environment variables")
	}

	db, err := database.OpenConnection(&cfg.Database)
	if err != nil {
		log.Fatal("Error opening connection to database: %w", err)
	}

	e := echo.New()

	e.HTTPErrorHandler = apierror.Handler
	e.Use(middleware.RequestLogger())
	e.Use(middleware.Recover())

	setupHandlers(e, db, &cfg)

	e.GET("/", func(c *echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"message": "Hello, World!"})
	})

	if err := e.Start(":8080"); err != nil {
		e.Logger.Error("failed to start server", "error", err)
	}
}
