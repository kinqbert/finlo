package finance

import (
	"github.com/kinqbert/finlo/server/internal/feature/auth"
	"github.com/labstack/echo/v5"
	"gorm.io/gorm"
)

func RegisterRoutes(e *echo.Echo, db *gorm.DB, authMiddleware *auth.Middleware) {
	handler := NewHandler(NewService(db))
	api := e.Group("/api", authMiddleware.RequireAccessToken)

	api.GET("/dashboard", handler.Dashboard)

	api.GET("/accounts", handler.ListAccounts)
	api.POST("/accounts", handler.CreateAccount)
	api.PATCH("/accounts/:id", handler.UpdateAccount)
	api.DELETE("/accounts/:id", handler.DeleteAccount)

	api.GET("/transactions", handler.ListTransactions)
	api.POST("/transactions", handler.CreateTransaction)
	api.DELETE("/transactions/:id", handler.DeleteTransaction)

	api.GET("/budgets", handler.ListBudgets)
	api.POST("/budgets", handler.SaveBudget)
	api.DELETE("/budgets/:id", handler.DeleteBudget)

	api.GET("/emergency-fund", handler.GetEmergencyFund)
	api.PUT("/emergency-fund", handler.SaveEmergencyFund)

	api.GET("/subscriptions", handler.ListSubscriptions)
	api.POST("/subscriptions", handler.CreateSubscription)
	api.PATCH("/subscriptions/:id", handler.UpdateSubscription)
	api.DELETE("/subscriptions/:id", handler.DeleteSubscription)
}
