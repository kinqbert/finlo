package finance

import (
	"github.com/kinqbert/finlo/server/internal/feature/auth"
	"github.com/kinqbert/finlo/server/internal/feature/finance/account"
	"github.com/kinqbert/finlo/server/internal/feature/finance/budget"
	"github.com/kinqbert/finlo/server/internal/feature/finance/category"
	"github.com/kinqbert/finlo/server/internal/feature/finance/dashboard"
	"github.com/kinqbert/finlo/server/internal/feature/finance/emergencyfund"
	"github.com/kinqbert/finlo/server/internal/feature/finance/subscription"
	financetransaction "github.com/kinqbert/finlo/server/internal/feature/finance/transaction"
	"github.com/labstack/echo/v5"
	"gorm.io/gorm"
)

func RegisterRoutes(e *echo.Echo, db *gorm.DB, authMiddleware *auth.Middleware) {
	api := e.Group("/api", authMiddleware.RequireAccessToken)
	dashboard.RegisterRoutes(api, db)
	category.RegisterRoutes(api, db)
	account.RegisterRoutes(api, db)
	financetransaction.RegisterRoutes(api, db)
	budget.RegisterRoutes(api, db)
	emergencyfund.RegisterRoutes(api, db)
	subscription.RegisterRoutes(api, db)
}
