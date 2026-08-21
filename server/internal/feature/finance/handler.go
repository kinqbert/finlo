package finance

import (
	"net/http"

	"github.com/kinqbert/finlo/server/internal/feature/auth"
	"github.com/kinqbert/finlo/server/internal/http/request"
	"github.com/labstack/echo/v5"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) ListAccounts(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	accounts, err := h.service.ListAccounts(c.Request().Context(), userID)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, accounts)
}

func (h *Handler) CreateAccount(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	var input CreateAccountInput
	if err := request.BindAndValidateBody(c, &input); err != nil {
		return err
	}
	account, err := h.service.CreateAccount(c.Request().Context(), userID, input)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusCreated, account)
}

func (h *Handler) UpdateAccount(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	var input UpdateAccountInput
	if err := request.BindAndValidateBody(c, &input); err != nil {
		return err
	}
	account, err := h.service.UpdateAccount(c.Request().Context(), userID, c.Param("id"), input)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, account)
}

func (h *Handler) DeleteAccount(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	if err := h.service.DeleteAccount(c.Request().Context(), userID, c.Param("id")); err != nil {
		return err
	}
	return c.NoContent(http.StatusNoContent)
}

func (h *Handler) ListTransactions(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	transactions, err := h.service.ListTransactions(c.Request().Context(), userID)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, transactions)
}

func (h *Handler) CreateTransaction(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	var input CreateTransactionInput
	if err := request.BindAndValidateBody(c, &input); err != nil {
		return err
	}
	transaction, err := h.service.CreateTransaction(c.Request().Context(), userID, input)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusCreated, transaction)
}

func (h *Handler) DeleteTransaction(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	if err := h.service.DeleteTransaction(c.Request().Context(), userID, c.Param("id")); err != nil {
		return err
	}
	return c.NoContent(http.StatusNoContent)
}

func (h *Handler) ListBudgets(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	budgets, err := h.service.ListBudgets(c.Request().Context(), userID, c.QueryParam("month"))
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, budgets)
}

func (h *Handler) SaveBudget(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	var input CreateBudgetInput
	if err := request.BindAndValidateBody(c, &input); err != nil {
		return err
	}
	budget, err := h.service.SaveBudget(c.Request().Context(), userID, input)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, budget)
}

func (h *Handler) DeleteBudget(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	if err := h.service.DeleteBudget(c.Request().Context(), userID, c.Param("id")); err != nil {
		return err
	}
	return c.NoContent(http.StatusNoContent)
}

func (h *Handler) GetEmergencyFund(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	fund, err := h.service.GetEmergencyFund(c.Request().Context(), userID)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, fund)
}

func (h *Handler) SaveEmergencyFund(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	var input UpdateEmergencyFundInput
	if err := request.BindAndValidateBody(c, &input); err != nil {
		return err
	}
	fund, err := h.service.SaveEmergencyFund(c.Request().Context(), userID, input)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, fund)
}

func (h *Handler) ListSubscriptions(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	subscriptions, err := h.service.ListSubscriptions(c.Request().Context(), userID)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, subscriptions)
}

func (h *Handler) CreateSubscription(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	var input CreateSubscriptionInput
	if err := request.BindAndValidateBody(c, &input); err != nil {
		return err
	}
	subscription, err := h.service.CreateSubscription(c.Request().Context(), userID, input)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusCreated, subscription)
}

func (h *Handler) UpdateSubscription(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	var input UpdateSubscriptionInput
	if err := request.BindAndValidateBody(c, &input); err != nil {
		return err
	}
	subscription, err := h.service.UpdateSubscription(c.Request().Context(), userID, c.Param("id"), input)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, subscription)
}

func (h *Handler) DeleteSubscription(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	if err := h.service.DeleteSubscription(c.Request().Context(), userID, c.Param("id")); err != nil {
		return err
	}
	return c.NoContent(http.StatusNoContent)
}

func (h *Handler) Dashboard(c *echo.Context) error {
	userID, err := auth.UserIDFromContext(c)
	if err != nil {
		return err
	}
	dashboard, err := h.service.Dashboard(c.Request().Context(), userID)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, dashboard)
}
