package users

import (
	"github.com/labstack/echo/v5"
	"gorm.io/gorm"
)

func Setup(e *echo.Echo, db *gorm.DB) *Handler {
	repository := NewRepository(db)
	service := NewService(repository)
	handler := NewHandler(service)

	handler.RegisterRoutes(e)

	return handler
}
