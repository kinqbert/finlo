package validation

import (
	"reflect"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/kinqbert/finlo/server/internal/apierror"
	"github.com/labstack/echo/v5"
)

type Validator struct {
	validate *validator.Validate
}

func New() *Validator {
	v := validator.New(
		validator.WithRequiredStructEnabled(),
	)

	// Report JSON field names instead of Go field names.
	v.RegisterTagNameFunc(func(field reflect.StructField) string {
		name := strings.SplitN(
			field.Tag.Get("json"),
			",",
			2,
		)[0]

		if name == "-" {
			return ""
		}

		if name == "" {
			return field.Name
		}

		return name
	})

	_ = v.RegisterValidation(
		"notblank",
		func(field validator.FieldLevel) bool {
			return strings.TrimSpace(
				field.Field().String(),
			) != ""
		},
	)

	return &Validator{
		validate: v,
	}
}

func (v *Validator) Validate(value any) error {
	if err := v.validate.Struct(value); err != nil {
		return apierror.BadRequest(
			"validation_failed",
			validationMessage(err),
		)
	}

	return nil
}

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

func validationMessage(err error) string {
	validationErrors, ok := err.(validator.ValidationErrors)
	if !ok || len(validationErrors) == 0 {
		return "request validation failed"
	}

	fieldError := validationErrors[0]
	field := fieldError.Field()

	switch fieldError.Tag() {
	case "required", "notblank":
		return field + " is required"

	case "email":
		return field + " must be a valid email address"

	case "min":
		return field + " is too short"

	case "max":
		return field + " is too long"

	case "oneof":
		return field + " contains an unsupported value"

	case "uuid":
		return field + " must be a valid UUID"

	default:
		return field + " is invalid"
	}
}
