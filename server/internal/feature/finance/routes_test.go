package finance

import (
	"net/http"
	"strings"
	"testing"

	"github.com/kinqbert/finlo/server/internal/feature/auth"
	"github.com/labstack/echo/v5"
)

func TestRegisterRoutesPreservesFinanceAPI(t *testing.T) {
	e := echo.New()
	RegisterRoutes(e, nil, auth.NewMiddleware(nil))

	expected := map[string]struct{}{
		http.MethodGet + " /api/dashboard":            {},
		http.MethodGet + " /api/categories":           {},
		http.MethodPost + " /api/categories":          {},
		http.MethodPatch + " /api/categories/:id":     {},
		http.MethodDelete + " /api/categories/:id":    {},
		http.MethodPut + " /api/categories/order":     {},
		http.MethodGet + " /api/accounts":             {},
		http.MethodPost + " /api/accounts":            {},
		http.MethodPatch + " /api/accounts/:id":       {},
		http.MethodDelete + " /api/accounts/:id":      {},
		http.MethodGet + " /api/transactions":         {},
		http.MethodPost + " /api/transactions":        {},
		http.MethodDelete + " /api/transactions/:id":  {},
		http.MethodGet + " /api/budgets":              {},
		http.MethodPost + " /api/budgets":             {},
		http.MethodDelete + " /api/budgets/:id":       {},
		http.MethodGet + " /api/emergency-fund":       {},
		http.MethodPut + " /api/emergency-fund":       {},
		http.MethodGet + " /api/subscriptions":        {},
		http.MethodPost + " /api/subscriptions":       {},
		http.MethodPatch + " /api/subscriptions/:id":  {},
		http.MethodDelete + " /api/subscriptions/:id": {},
	}

	registered := make(map[string]struct{}, len(expected))
	for _, route := range e.Router().Routes() {
		if !strings.HasPrefix(route.Path, "/api/") || route.Method == "echo_route_not_found" {
			continue
		}
		key := route.Method + " " + route.Path
		registered[key] = struct{}{}
		if _, ok := expected[key]; !ok {
			t.Errorf("unexpected route %s", key)
		}
	}
	if len(registered) != len(expected) {
		t.Fatalf("registered %d finance routes, want %d", len(registered), len(expected))
	}
}
