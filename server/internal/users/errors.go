package users

import (
	"errors"
	"net/http"

	"github.com/labstack/echo/v5"
)

var (
	ErrNotFound     = errors.New("user not found")
	ErrInvalidInput = errors.New("invalid input")
)

func handleError(c *echo.Context, err error) error {
	switch {
	case errors.Is(err, ErrInvalidInput):
		return c.JSON(
			http.StatusBadRequest,
			map[string]string{
				"error": err.Error(),
			},
		)

	case errors.Is(err, ErrNotFound):
		return c.JSON(
			http.StatusNotFound,
			map[string]string{
				"error": err.Error(),
			},
		)

	default:
		c.Logger().Error(
			"request failed",
			"error",
			err,
		)

		return c.JSON(
			http.StatusInternalServerError,
			map[string]string{
				"error": "internal server error",
			},
		)
	}
}
