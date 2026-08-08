package request

import (
	"github.com/kinqbert/finlo/server/internal/http/apierror"
	"github.com/labstack/echo/v5"
)

func BindAndValidateBody[T any](c *echo.Context, input *T) error {
	if err := c.Bind(input); err != nil {
		return apierror.BadRequest(
			"invalid_request_body",
			"request body is invalid",
		)
	}

	if err := c.Validate(input); err != nil {
		return err
	}

	return nil
}
