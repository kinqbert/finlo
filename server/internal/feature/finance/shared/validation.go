package shared

import (
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/kinqbert/finlo/server/internal/http/apierror"
)

func ValidateID(id string) error {
	if _, err := uuid.Parse(id); err != nil {
		return apierror.BadRequest("invalid_id", "resource ID must be a valid UUID")
	}
	return nil
}

func NormalizeCurrency(currency string) string {
	return strings.ToUpper(strings.TrimSpace(currency))
}

func ParseMonth(value string) (time.Time, error) {
	month, err := time.Parse("2006-01", strings.TrimSpace(value))
	if err != nil {
		return time.Time{}, apierror.BadRequest("invalid_month", "month must use YYYY-MM format")
	}
	return month.UTC(), nil
}

func ParseOptionalDate(value *string) (*time.Time, error) {
	if value == nil || strings.TrimSpace(*value) == "" {
		return nil, nil
	}
	date, err := time.Parse("2006-01-02", strings.TrimSpace(*value))
	if err != nil {
		return nil, apierror.BadRequest("invalid_date", "next_payment_date must use YYYY-MM-DD format")
	}
	date = date.UTC()
	return &date, nil
}
