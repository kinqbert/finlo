package monobankapi

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"testing"
)

type roundTripFunc func(*http.Request) (*http.Response, error)

func (fn roundTripFunc) RoundTrip(request *http.Request) (*http.Response, error) {
	return fn(request)
}

func TestDeleteWebhookSendsEmptyURL(t *testing.T) {
	transport := roundTripFunc(func(r *http.Request) (*http.Response, error) {
		if r.Method != http.MethodPost {
			t.Errorf("method = %s, want POST", r.Method)
		}
		if r.URL.Path != "/personal/webhook" {
			t.Errorf("path = %s, want /personal/webhook", r.URL.Path)
		}
		if token := r.Header.Get("X-Token"); token != "personal-token" {
			t.Errorf("X-Token = %q, want personal-token", token)
		}

		var input struct {
			WebhookURL string `json:"webHookUrl"`
		}
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			t.Fatalf("decode request: %v", err)
		}
		if input.WebhookURL != "" {
			t.Errorf("webHookUrl = %q, want empty", input.WebhookURL)
		}
		return &http.Response{
			StatusCode: http.StatusOK,
			Body:       io.NopCloser(strings.NewReader("")),
			Header:     make(http.Header),
		}, nil
	})

	client := &HTTPClient{
		baseURL: "https://api.monobank.test",
		http:    &http.Client{Transport: transport},
	}
	if err := client.DeleteWebhook(context.Background(), "personal-token"); err != nil {
		t.Fatalf("delete webhook: %v", err)
	}
}
