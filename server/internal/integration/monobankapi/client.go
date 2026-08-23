package monobankapi

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type Error struct {
	StatusCode int
	Message    string
}

func (e *Error) Error() string { return e.Message }

type Client interface {
	ClientInfo(ctx context.Context, token string) (ClientInfo, error)
	SetWebhook(ctx context.Context, token, webhookURL string) error
	DeleteWebhook(ctx context.Context, token string) error
}

type RatesClient interface {
	CurrencyRates(ctx context.Context) ([]CurrencyRate, error)
}

type HTTPClient struct {
	baseURL string
	http    *http.Client
}

func NewClient(baseURL string) *HTTPClient {
	return &HTTPClient{baseURL: strings.TrimRight(baseURL, "/"), http: &http.Client{Timeout: 10 * time.Second}}
}

func (c *HTTPClient) ClientInfo(ctx context.Context, token string) (ClientInfo, error) {
	var result ClientInfo
	if err := c.request(ctx, http.MethodGet, "/personal/client-info", token, nil, &result); err != nil {
		return ClientInfo{}, err
	}
	return result, nil
}

func (c *HTTPClient) SetWebhook(ctx context.Context, token, webhookURL string) error {
	return c.request(ctx, http.MethodPost, "/personal/webhook", token, map[string]string{"webHookUrl": webhookURL}, nil)
}

func (c *HTTPClient) DeleteWebhook(ctx context.Context, token string) error {
	return c.SetWebhook(ctx, token, "")
}

func (c *HTTPClient) CurrencyRates(ctx context.Context) ([]CurrencyRate, error) {
	result := make([]CurrencyRate, 0)
	if err := c.request(ctx, http.MethodGet, "/bank/currency", "", nil, &result); err != nil {
		return nil, err
	}
	return result, nil
}

func (c *HTTPClient) request(ctx context.Context, method, path, token string, body, output any) error {
	var reader io.Reader
	if body != nil {
		payload, err := json.Marshal(body)
		if err != nil {
			return fmt.Errorf("encode Monobank request: %w", err)
		}
		reader = bytes.NewReader(payload)
	}
	req, err := http.NewRequestWithContext(ctx, method, c.baseURL+path, reader)
	if err != nil {
		return fmt.Errorf("create Monobank request: %w", err)
	}
	req.Header.Set("Accept", "application/json")
	if token != "" {
		req.Header.Set("X-Token", token)
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	response, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("call Monobank: %w", err)
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		payload, _ := io.ReadAll(io.LimitReader(response.Body, 4096))
		message := strings.TrimSpace(string(payload))
		if message == "" {
			message = response.Status
		}
		return &Error{StatusCode: response.StatusCode, Message: message}
	}
	if output == nil {
		return nil
	}
	if err := json.NewDecoder(io.LimitReader(response.Body, 2<<20)).Decode(output); err != nil {
		return fmt.Errorf("decode Monobank response: %w", err)
	}
	return nil
}
