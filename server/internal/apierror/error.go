package apierror

import "net/http"

type Error struct {
	Status  int
	Code    string
	Message string
	Cause   error
}

func (e *Error) Error() string {
	return e.Message
}

func (e *Error) Unwrap() error {
	return e.Cause
}

func New(
	status int,
	code string,
	message string,
) error {
	return &Error{
		Status:  status,
		Code:    code,
		Message: message,
	}
}

func Wrap(
	status int,
	code string,
	message string,
	cause error,
) error {
	return &Error{
		Status:  status,
		Code:    code,
		Message: message,
		Cause:   cause,
	}
}

func BadRequest(code string, message string) error {
	return New(http.StatusBadRequest, code, message)
}

func Unauthorized(code string, message string) error {
	return New(http.StatusUnauthorized, code, message)
}

func Forbidden(code string, message string) error {
	return New(http.StatusForbidden, code, message)
}

func NotFound(code string, message string) error {
	return New(http.StatusNotFound, code, message)
}

func Conflict(code string, message string) error {
	return New(http.StatusConflict, code, message)
}

func Internal(cause error) error {
	return Wrap(
		http.StatusInternalServerError,
		"internal_error",
		"internal server error",
		cause,
	)
}
