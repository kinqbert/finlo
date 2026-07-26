package auth

import (
	"fmt"
	"strings"
	"unicode"
	"unicode/utf8"

	"github.com/kinqbert/finlo/server/internal/apierror"
	"golang.org/x/crypto/bcrypt"
)

func validatePassword(password string) error {
	var (
		hasUpper  bool
		hasLower  bool
		hasNumber bool
		hasSymbol bool
	)

	for _, character := range password {
		switch {
		case unicode.IsUpper(character):
			hasUpper = true
		case unicode.IsLower(character):
			hasLower = true
		case unicode.IsDigit(character):
			hasNumber = true
		case unicode.IsPunct(character), unicode.IsSymbol(character):
			hasSymbol = true
		}
	}

	var violations []string

	if utf8.RuneCountInString(password) < 8 {
		violations = append(violations, "at least 8 characters")
	}

	if !hasUpper {
		violations = append(violations, "an uppercase letter")
	}

	if !hasLower {
		violations = append(violations, "a lowercase letter")
	}

	if !hasNumber {
		violations = append(violations, "a number")
	}

	if !hasSymbol {
		violations = append(violations, "a symbol")
	}

	// bcrypt rejects passwords longer than 72 bytes.
	if len([]byte(password)) > 72 {
		violations = append(
			violations,
			"no more than 72 bytes",
		)
	}

	if len(violations) > 0 {
		return fmt.Errorf(
			"invalid password: password must contain %s",
			strings.Join(violations, ", "),
		)
	}

	return nil
}

func hashPassword(password string) (string, error) {
	if password == "" {
		return "", apierror.BadRequest("password_required", "Password is required")
	}

	if err := validatePassword(password); err != nil {
		return "", apierror.BadRequest("bad_password", err.Error())
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", apierror.Internal(err)
	}

	return string(hash), nil
}

func ComparePassword(passwordHash, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(password))

	if err != nil {
		return false
	}

	return true
}
