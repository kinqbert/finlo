package apierror

import (
	"errors"
	"net/http"

	"github.com/labstack/echo/v5"
)

type response struct {
	Error details `json:"error"`
}

type details struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func Handler(c *echo.Context, err error) {
	response, _ := echo.UnwrapResponse(c.Response())
	if response != nil && response.Committed {
		return
	}

	if apiErr, ok := errors.AsType[*Error](err); ok {
		if apiErr.Status >= http.StatusInternalServerError {
			c.Logger().Error(
				"request failed",
				"error",
				apiErr.cause,
			)
		}

		writeResponse(
			c,
			apiErr.Status,
			apiErr.Code,
			apiErr.Message,
		)
		return
	}

	if echoErr, ok := errors.AsType[*echo.HTTPError](err); ok {
		writeResponse(
			c,
			echoErr.Code,
			"http_error",
			echoErr.Message,
		)
		return
	}

	var statusError echo.HTTPStatusCoder

	if errors.As(err, &statusError) {
		status := statusError.StatusCode()

		code := "http_error"

		switch status {
		case http.StatusNotFound:
			code = "route_not_found"

		case http.StatusMethodNotAllowed:
			code = "method_not_allowed"
		}

		writeResponse(
			c,
			status,
			code,
			http.StatusText(status),
		)
		return
	}

	c.Logger().Error(
		"unexpected request error",
		"error",
		err,
	)

	writeResponse(
		c,
		http.StatusInternalServerError,
		"internal_error",
		"internal server error",
	)
}

func writeResponse(
	c *echo.Context,
	status int,
	code string,
	message string,
) {
	if err := c.JSON(status, response{
		Error: details{
			Code:    code,
			Message: message,
		},
	}); err != nil {
		c.Logger().Error(
			"failed to write error response",
			"error",
			err,
		)
	}
}
