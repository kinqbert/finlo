package health

import (
	"fmt"

	"github.com/labstack/echo/v5"
	"gorm.io/gorm"
)

func RegisterRoutes(e *echo.Echo, gormDB *gorm.DB) error {
	sqlDB, err := gormDB.DB()
	if err != nil {
		return fmt.Errorf(
			"get database connection pool: %w",
			err,
		)
	}

	handler := NewHandler(sqlDB)

	e.GET("/health", handler.Check)

	return nil
}
