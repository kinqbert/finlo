package monobank

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/kinqbert/finlo/server/internal/feature/finance/mcc"
	"github.com/kinqbert/finlo/server/internal/feature/finance/model"
	"github.com/kinqbert/finlo/server/internal/http/apierror"
	"github.com/kinqbert/finlo/server/internal/integration/monobankapi"
	"gorm.io/gorm"
)

type Service struct {
	db             *gorm.DB
	client         monobankapi.Client
	cipher         *tokenCipher
	webhookBaseURL string
}

type clientSnapshot struct {
	Accounts []monobankapi.Account `json:"accounts"`
	Jars     []monobankapi.Jar     `json:"jars"`
}

func NewService(db *gorm.DB, client monobankapi.Client, encodedKey, webhookBaseURL string) (*Service, error) {
	tokenCipher, err := newTokenCipher(encodedKey)
	if err != nil {
		return nil, err
	}
	return &Service{db: db, client: client, cipher: tokenCipher, webhookBaseURL: strings.TrimRight(webhookBaseURL, "/")}, nil
}

func (s *Service) Preview(ctx context.Context, userID, rawToken string) (Preview, error) {
	if s.cipher == nil {
		return Preview{}, apierror.ServiceUnavailable("monobank_not_configured", "Monobank integration is not configured")
	}
	token := strings.TrimSpace(rawToken)
	info, err := s.client.ClientInfo(ctx, token)
	if err != nil {
		return Preview{}, mapClientError(err)
	}
	var duplicate int64
	if err := s.db.WithContext(ctx).Model(&Connection{}).Where("monobank_client_id = ? AND user_id <> ?", info.ClientID, userID).Count(&duplicate).Error; err != nil {
		return Preview{}, apierror.Internal(fmt.Errorf("check Monobank connection owner: %w", err))
	}
	if duplicate > 0 {
		return Preview{}, apierror.Conflict("monobank_already_connected", "this Monobank profile is already connected to another Finlo account")
	}

	accounts := make([]PreviewAccount, 0, len(info.Accounts))
	for _, account := range info.Accounts {
		currency, err := monobankapi.Currency(account.CurrencyCode)
		if err != nil {
			continue
		}
		accounts = append(accounts, PreviewAccount{
			ID: account.ID, Name: accountName(account), Type: account.Type, Currency: currency,
			BalanceMinor: account.Balance, CreditLimit: account.CreditLimit,
			MaskedPAN: account.MaskedPAN, IBAN: account.IBAN,
		})
	}
	jars := make([]PreviewJar, 0, len(info.Jars))
	for _, jar := range info.Jars {
		currency, err := monobankapi.Currency(jar.CurrencyCode)
		if err != nil {
			continue
		}
		var target *int64
		if jar.Goal > 0 {
			value := jar.Goal
			target = &value
		}
		jars = append(jars, PreviewJar{ID: jar.ID, Title: jar.Title, Description: jar.Description, Currency: currency, BalanceMinor: jar.Balance, TargetMinor: target})
	}

	snapshot, err := json.Marshal(clientSnapshot{Accounts: info.Accounts, Jars: info.Jars})
	if err != nil {
		return Preview{}, apierror.Internal(fmt.Errorf("encode Monobank client snapshot: %w", err))
	}
	encrypted, err := s.cipher.encrypt(token)
	if err != nil {
		return Preview{}, apierror.Internal(err)
	}
	secret, err := randomSecret()
	if err != nil {
		return Preview{}, apierror.Internal(err)
	}

	connection := Connection{}
	err = s.db.WithContext(ctx).Where("user_id = ?", userID).First(&connection).Error
	switch {
	case err == nil && connection.Status != "pending":
		return Preview{}, apierror.Conflict("monobank_already_connected", "a Monobank account is already connected")
	case err == nil:
		if err := s.db.WithContext(ctx).Model(&connection).Updates(map[string]any{
			"encrypted_token": encrypted, "monobank_client_id": info.ClientID, "client_name": info.Name,
			"client_snapshot": snapshot, "webhook_secret": secret, "last_error": "", "updated_at": time.Now(),
		}).Error; err != nil {
			return Preview{}, apierror.Internal(fmt.Errorf("update Monobank preview: %w", err))
		}
	case errors.Is(err, gorm.ErrRecordNotFound):
		connection = Connection{
			ID: uuid.NewString(), UserID: userID, EncryptedToken: encrypted, MonobankClientID: info.ClientID,
			ClientName: info.Name, Status: "pending", ClientSnapshot: snapshot, WebhookSecret: secret,
		}
		if err := s.db.WithContext(ctx).Create(&connection).Error; err != nil {
			return Preview{}, apierror.Internal(fmt.Errorf("create Monobank preview: %w", err))
		}
	default:
		return Preview{}, apierror.Internal(fmt.Errorf("find Monobank connection: %w", err))
	}
	return Preview{ConnectionID: connection.ID, ClientName: info.Name, Accounts: accounts, Jars: jars}, nil
}

func (s *Service) Complete(ctx context.Context, userID string, input CompleteInput) (ConnectionDTO, error) {
	if s.cipher == nil {
		return ConnectionDTO{}, apierror.ServiceUnavailable("monobank_not_configured", "Monobank integration is not configured")
	}
	if s.webhookBaseURL == "" {
		return ConnectionDTO{}, apierror.ServiceUnavailable("monobank_webhook_not_configured", "set MONOBANK_WEBHOOK_BASE_URL to a public HTTPS API URL")
	}
	var connection Connection
	err := s.db.WithContext(ctx).Where("id = ? AND user_id = ?", input.ConnectionID, userID).First(&connection).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return ConnectionDTO{}, apierror.NotFound("monobank_connection_not_found", "Monobank connection was not found")
	}
	if err != nil {
		return ConnectionDTO{}, apierror.Internal(fmt.Errorf("find Monobank connection: %w", err))
	}

	if connection.Status == "pending" {
		if len(input.AccountIDs)+len(input.JarIDs) == 0 {
			return ConnectionDTO{}, apierror.BadRequest("empty_monobank_selection", "select at least one account or jar")
		}
		var snapshot clientSnapshot
		if err := json.Unmarshal(connection.ClientSnapshot, &snapshot); err != nil {
			return ConnectionDTO{}, apierror.Internal(fmt.Errorf("decode Monobank snapshot: %w", err))
		}
		if err := s.createSelectedResources(ctx, &connection, snapshot, input); err != nil {
			return ConnectionDTO{}, err
		}
	}

	return s.registerWebhook(ctx, &connection)
}

func (s *Service) GetConnection(ctx context.Context, userID string) (*ConnectionDTO, error) {
	var connection Connection
	err := s.db.WithContext(ctx).Where("user_id = ?", userID).First(&connection).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, apierror.Internal(fmt.Errorf("get Monobank connection: %w", err))
	}
	result, err := s.connectionDTO(ctx, connection.ID, userID)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

func (s *Service) RegisterWebhook(ctx context.Context, userID string) (ConnectionDTO, error) {
	if s.cipher == nil {
		return ConnectionDTO{}, apierror.ServiceUnavailable("monobank_not_configured", "Monobank integration is not configured")
	}
	if s.webhookBaseURL == "" {
		return ConnectionDTO{}, apierror.ServiceUnavailable("monobank_webhook_not_configured", "set MONOBANK_WEBHOOK_BASE_URL to a public HTTPS API URL")
	}

	var connection Connection
	err := s.db.WithContext(ctx).Where("user_id = ?", userID).First(&connection).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return ConnectionDTO{}, apierror.NotFound("monobank_connection_not_found", "Monobank connection was not found")
	}
	if err != nil {
		return ConnectionDTO{}, apierror.Internal(fmt.Errorf("find Monobank connection: %w", err))
	}
	if connection.Status == "pending" {
		return ConnectionDTO{}, apierror.Conflict("monobank_connection_incomplete", "finish selecting Monobank accounts before registering the webhook")
	}

	return s.registerWebhook(ctx, &connection)
}

func (s *Service) DisconnectWebhook(ctx context.Context, userID string) (ConnectionDTO, error) {
	if s.cipher == nil {
		return ConnectionDTO{}, apierror.ServiceUnavailable("monobank_not_configured", "Monobank integration is not configured")
	}

	var connection Connection
	err := s.db.WithContext(ctx).Where("user_id = ?", userID).First(&connection).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return ConnectionDTO{}, apierror.NotFound("monobank_connection_not_found", "Monobank connection was not found")
	}
	if err != nil {
		return ConnectionDTO{}, apierror.Internal(fmt.Errorf("find Monobank connection: %w", err))
	}
	if connection.Status == "pending" {
		return ConnectionDTO{}, apierror.Conflict("monobank_connection_incomplete", "the Monobank connection has not been completed")
	}

	token, err := s.cipher.decrypt(connection.EncryptedToken)
	if err != nil {
		return ConnectionDTO{}, apierror.Internal(err)
	}
	if err := s.client.DeleteWebhook(ctx, token); err != nil {
		_ = s.db.WithContext(ctx).Model(&connection).Updates(map[string]any{
			"last_error": "Monobank could not remove the webhook", "updated_at": time.Now().UTC(),
		}).Error
		return ConnectionDTO{}, mapClientError(err)
	}

	now := time.Now().UTC()
	if err := s.db.WithContext(ctx).Model(&connection).Updates(map[string]any{
		"status": "disconnected", "webhook_configured": false, "last_error": "", "updated_at": now,
	}).Error; err != nil {
		return ConnectionDTO{}, apierror.Internal(fmt.Errorf("disconnect Monobank webhook: %w", err))
	}
	return s.connectionDTO(ctx, connection.ID, userID)
}

func (s *Service) registerWebhook(ctx context.Context, connection *Connection) (ConnectionDTO, error) {
	token, err := s.cipher.decrypt(connection.EncryptedToken)
	if err != nil {
		return ConnectionDTO{}, apierror.Internal(err)
	}
	webhookURL := s.webhookBaseURL + "/webhooks/monobank/" + connection.WebhookSecret
	if err := s.client.SetWebhook(ctx, token, webhookURL); err != nil {
		message := "Monobank could not validate the webhook URL"
		if updateErr := s.db.WithContext(ctx).Model(connection).Updates(map[string]any{
			"status": "webhook_error", "webhook_configured": false, "last_error": message, "updated_at": time.Now().UTC(),
		}).Error; updateErr != nil {
			return ConnectionDTO{}, apierror.Internal(fmt.Errorf("record Monobank webhook error: %w", updateErr))
		}
		return s.connectionDTO(ctx, connection.ID, connection.UserID)
	}

	now := time.Now().UTC()
	updates := map[string]any{
		"status": "active", "webhook_configured": true, "client_snapshot": nil,
		"last_error": "", "updated_at": now,
	}
	if connection.ConnectedAt == nil {
		updates["connected_at"] = now
	}
	if err := s.db.WithContext(ctx).Model(connection).Updates(updates).Error; err != nil {
		return ConnectionDTO{}, apierror.Internal(fmt.Errorf("activate Monobank connection: %w", err))
	}
	return s.connectionDTO(ctx, connection.ID, connection.UserID)
}

func (s *Service) ValidateWebhook(ctx context.Context, secret string) error {
	var count int64
	if err := s.db.WithContext(ctx).Model(&Connection{}).Where("webhook_secret = ?", secret).Count(&count).Error; err != nil {
		return apierror.Internal(fmt.Errorf("validate webhook secret: %w", err))
	}
	if count == 0 {
		return apierror.NotFound("monobank_webhook_not_found", "webhook was not found")
	}
	return nil
}

func (s *Service) createSelectedResources(ctx context.Context, connection *Connection, snapshot clientSnapshot, input CompleteInput) error {
	selectedAccounts := make(map[string]struct{}, len(input.AccountIDs))
	for _, id := range input.AccountIDs {
		selectedAccounts[id] = struct{}{}
	}
	selectedJars := make(map[string]struct{}, len(input.JarIDs))
	for _, id := range input.JarIDs {
		selectedJars[id] = struct{}{}
	}
	accountByID := make(map[string]monobankapi.Account, len(snapshot.Accounts))
	for _, item := range snapshot.Accounts {
		accountByID[item.ID] = item
	}
	jarByID := make(map[string]monobankapi.Jar, len(snapshot.Jars))
	for _, item := range snapshot.Jars {
		jarByID[item.ID] = item
	}
	for id := range selectedAccounts {
		if _, ok := accountByID[id]; !ok {
			return apierror.BadRequest("invalid_monobank_account", "selection contains an unknown Monobank account")
		}
	}
	for id := range selectedJars {
		if _, ok := jarByID[id]; !ok {
			return apierror.BadRequest("invalid_monobank_jar", "selection contains an unknown Monobank jar")
		}
	}

	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for _, item := range snapshot.Accounts {
			if _, ok := selectedAccounts[item.ID]; !ok {
				continue
			}
			currency, err := monobankapi.Currency(item.CurrencyCode)
			if err != nil {
				return err
			}
			account := model.Account{ID: uuid.NewString(), UserID: connection.UserID, Name: accountName(item), Type: localAccountType(item.Type), Currency: currency, BalanceMinor: item.Balance}
			if err := tx.Create(&account).Error; err != nil {
				return fmt.Errorf("create linked account: %w", err)
			}
			if err := tx.Create(&AccountLink{ID: uuid.NewString(), ConnectionID: connection.ID, AccountID: account.ID, ExternalAccountID: item.ID}).Error; err != nil {
				return fmt.Errorf("link Monobank account: %w", err)
			}
		}
		for _, item := range snapshot.Jars {
			if _, ok := selectedJars[item.ID]; !ok {
				continue
			}
			currency, err := monobankapi.Currency(item.CurrencyCode)
			if err != nil {
				return err
			}
			var target *int64
			if item.Goal > 0 {
				value := item.Goal
				target = &value
			}
			externalID := item.ID
			name := strings.TrimSpace(item.Title)
			if name == "" {
				name = "Monobank jar"
			}
			goal := model.Goal{ID: uuid.NewString(), UserID: connection.UserID, Name: name, CurrentMinor: item.Balance, TargetMinor: target, Currency: currency, Source: "monobank", ExternalID: &externalID}
			if err := tx.Create(&goal).Error; err != nil {
				return fmt.Errorf("create linked jar goal: %w", err)
			}
			if err := tx.Create(&JarLink{ID: uuid.NewString(), ConnectionID: connection.ID, GoalID: goal.ID, ExternalJarID: item.ID}).Error; err != nil {
				return fmt.Errorf("link Monobank jar: %w", err)
			}
		}
		return tx.Model(connection).Updates(map[string]any{"status": "webhook_error", "client_snapshot": nil, "last_error": "Waiting for webhook setup", "updated_at": time.Now()}).Error
	})
	if err != nil {
		var apiErr *apierror.Error
		if errors.As(err, &apiErr) {
			return err
		}
		return apierror.Internal(err)
	}
	connection.Status = "webhook_error"
	return nil
}

func (s *Service) ProcessWebhook(ctx context.Context, secret string, event monobankapi.WebhookEvent) error {
	if event.Type != "StatementItem" {
		return nil
	}
	var connection Connection
	if err := s.db.WithContext(ctx).Where("webhook_secret = ?", secret).First(&connection).Error; errors.Is(err, gorm.ErrRecordNotFound) {
		return apierror.NotFound("monobank_webhook_not_found", "webhook was not found")
	} else if err != nil {
		return apierror.Internal(fmt.Errorf("find webhook connection: %w", err))
	}

	var accountLink AccountLink
	err := s.db.WithContext(ctx).Where("connection_id = ? AND external_account_id = ?", connection.ID, event.Data.Account).First(&accountLink).Error
	if err == nil {
		return s.importTransaction(ctx, connection.UserID, accountLink.AccountID, event.Data.StatementItem)
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return apierror.Internal(fmt.Errorf("find linked account: %w", err))
	}

	var jarLink JarLink
	err = s.db.WithContext(ctx).Where("connection_id = ? AND external_jar_id = ?", connection.ID, event.Data.Account).First(&jarLink).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil
	}
	if err != nil {
		return apierror.Internal(fmt.Errorf("find linked jar: %w", err))
	}
	if err := s.db.WithContext(ctx).Model(&model.Goal{}).Where("id = ? AND user_id = ?", jarLink.GoalID, connection.UserID).
		Updates(map[string]any{"current_minor": event.Data.StatementItem.Balance, "updated_at": time.Now()}).Error; err != nil {
		return apierror.Internal(fmt.Errorf("update jar goal: %w", err))
	}
	return nil
}

func (s *Service) importTransaction(ctx context.Context, userID, accountID string, item monobankapi.StatementItem) error {
	if item.ID == "" || item.Amount == 0 {
		return nil
	}
	transactionType := "income"
	amount := item.Amount
	if amount < 0 {
		transactionType, amount = "expense", -amount
	}
	var linkedAccount model.Account
	if err := s.db.WithContext(ctx).Select("id", "currency").Where("id = ? AND user_id = ?", accountID, userID).First(&linkedAccount).Error; err != nil {
		return apierror.Internal(fmt.Errorf("find linked account currency: %w", err))
	}
	category, needsReview, err := mcc.ResolveCategory(s.db.WithContext(ctx), userID, transactionType, item.MCC)
	if err != nil {
		return apierror.Internal(fmt.Errorf("resolve transaction category: %w", err))
	}
	mccCode, originalMCC := item.MCC, item.OriginalMCC

	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var existing model.Transaction
		err := tx.Where("user_id = ? AND source = ? AND external_id = ?", userID, "monobank", item.ID).First(&existing).Error
		if err == nil {
			updates := map[string]any{"amount_minor": amount, "currency": linkedAccount.Currency, "description": item.Description, "occurred_at": time.Unix(item.Time, 0).UTC(), "pending": item.Hold, "updated_at": time.Now()}
			if existing.NeedsReview {
				updates["category_id"], updates["category_needs_review"] = category.ID, needsReview
			}
			if err := tx.Model(&existing).Updates(updates).Error; err != nil {
				return fmt.Errorf("update Monobank transaction: %w", err)
			}
		} else if errors.Is(err, gorm.ErrRecordNotFound) {
			externalID := item.ID
			created := model.Transaction{
				ID: uuid.NewString(), UserID: userID, AccountID: accountID, Type: transactionType,
				AmountMinor: amount, Currency: linkedAccount.Currency, CategoryID: category.ID, Description: item.Description,
				OccurredAt: time.Unix(item.Time, 0).UTC(), Source: "monobank", ExternalID: &externalID,
				MCCCode: &mccCode, OriginalMCC: &originalMCC, NeedsReview: needsReview, Pending: item.Hold,
			}
			if err := tx.Create(&created).Error; err != nil {
				return fmt.Errorf("create Monobank transaction: %w", err)
			}
		} else {
			return fmt.Errorf("find existing Monobank transaction: %w", err)
		}
		if err := tx.Model(&model.Account{}).Where("id = ? AND user_id = ?", accountID, userID).
			Updates(map[string]any{"balance_minor": item.Balance, "updated_at": time.Now()}).Error; err != nil {
			return fmt.Errorf("update linked account balance: %w", err)
		}
		return nil
	})
}

func (s *Service) connectionDTO(ctx context.Context, connectionID, userID string) (ConnectionDTO, error) {
	var connection Connection
	if err := s.db.WithContext(ctx).Where("id = ? AND user_id = ?", connectionID, userID).First(&connection).Error; err != nil {
		return ConnectionDTO{}, apierror.Internal(fmt.Errorf("load Monobank connection: %w", err))
	}
	var accounts, jars int64
	if err := s.db.WithContext(ctx).Model(&AccountLink{}).Where("connection_id = ?", connection.ID).Count(&accounts).Error; err != nil {
		return ConnectionDTO{}, apierror.Internal(err)
	}
	if err := s.db.WithContext(ctx).Model(&JarLink{}).Where("connection_id = ?", connection.ID).Count(&jars).Error; err != nil {
		return ConnectionDTO{}, apierror.Internal(err)
	}
	result := ConnectionDTO{ID: connection.ID, Status: connection.Status, ClientName: connection.ClientName, WebhookConfigured: connection.WebhookConfigured, AccountCount: accounts, JarCount: jars, LastError: connection.LastError}
	if connection.ConnectedAt != nil {
		value := connection.ConnectedAt.UTC().Format(time.RFC3339)
		result.ConnectedAt = &value
	}
	return result, nil
}

func mapClientError(err error) error {
	var clientErr *monobankapi.Error
	if errors.As(err, &clientErr) {
		switch clientErr.StatusCode {
		case http.StatusUnauthorized, http.StatusForbidden:
			return apierror.Unauthorized("invalid_monobank_token", "Monobank rejected this personal token")
		case http.StatusTooManyRequests:
			return apierror.New(http.StatusTooManyRequests, "monobank_rate_limited", "Monobank allows this check only once per minute; try again shortly")
		}
	}
	return apierror.ServiceUnavailable("monobank_unavailable", "Monobank is temporarily unavailable")
}

func randomSecret() (string, error) {
	value := make([]byte, 32)
	if _, err := rand.Read(value); err != nil {
		return "", fmt.Errorf("create webhook secret: %w", err)
	}
	return hex.EncodeToString(value), nil
}

func accountName(account monobankapi.Account) string {
	name := "Monobank " + strings.TrimSpace(account.Type)
	if len(account.MaskedPAN) > 0 {
		pan := account.MaskedPAN[0]
		if len(pan) >= 4 {
			name += " •" + pan[len(pan)-4:]
		}
	}
	return strings.TrimSpace(name)
}

func localAccountType(monobankType string) string {
	if strings.EqualFold(monobankType, "fop") {
		return "bank"
	}
	return "card"
}
