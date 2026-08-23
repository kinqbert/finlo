package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Database   DatabaseConfig
	Port       string
	JWT        JWTConfig
	Google     GoogleConfig
	CORS       CORSConfig
	AuthCookie AuthCookieConfig
	Monobank   MonobankConfig
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
	SSLMode  string
}

type JWTConfig struct {
	AccessSecret  string
	RefreshSecret string
	Issuer        string
	Audience      string
}

type GoogleConfig struct {
	ClientIDs []string
}

type CORSConfig struct {
	AllowedOrigins []string
}

type AuthCookieConfig struct {
	Secure   bool
	SameSite string
	Domain   string
}

type MonobankConfig struct {
	APIURL         string
	WebhookBaseURL string
	CredentialsKey string
}

func (d DatabaseConfig) GetDSN() string {
	return fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s", d.Host, d.User, d.Password, d.Name, d.Port, d.SSLMode)
}

func Load() (Config, error) {
	godotenv.Load()

	accessSecret, refreshSecret := os.Getenv("JWT_ACCESS_SECRET"), os.Getenv("JWT_REFRESH_SECRET")
	if len(accessSecret) < 32 || len(refreshSecret) < 32 {
		return Config{}, fmt.Errorf("Secrets have to be at least 32 symbols in length")
	}

	if accessSecret == refreshSecret {
		return Config{}, fmt.Errorf("Secrets cannot be the same")
	}

	cookieSecure, err := strconv.ParseBool(envOrDefault("AUTH_COOKIE_SECURE", "false"))
	if err != nil {
		return Config{}, fmt.Errorf("AUTH_COOKIE_SECURE must be true or false")
	}
	cookieSameSite := strings.ToLower(envOrDefault("AUTH_COOKIE_SAME_SITE", "lax"))
	if cookieSameSite != "lax" && cookieSameSite != "strict" && cookieSameSite != "none" {
		return Config{}, fmt.Errorf("AUTH_COOKIE_SAME_SITE must be lax, strict, or none")
	}
	if cookieSameSite == "none" && !cookieSecure {
		return Config{}, fmt.Errorf("AUTH_COOKIE_SECURE must be true when AUTH_COOKIE_SAME_SITE is none")
	}

	cfg := Config{
		Port: envOrDefault("PORT", "8080"),
		Database: DatabaseConfig{
			Host:     envOrDefault("DB_HOST", "localhost"),
			Port:     envOrDefault("DB_PORT", "5433"),
			User:     envOrDefault("DB_USER", "postgres"),
			Password: envOrDefault("DB_PASSWORD", "postgres"),
			Name:     envOrDefault("DB_NAME", "finlo"),
			SSLMode:  envOrDefault("DB_SSL_MODE", "disable"),
		},
		JWT: JWTConfig{
			AccessSecret:  accessSecret,
			RefreshSecret: refreshSecret,
			Issuer:        envOrDefault("JWT_ISSUER", "finlo-api"),
			Audience:      envOrDefault("JWT_AUDIENCE", "finlo-app"),
		},
		Google: GoogleConfig{
			ClientIDs: splitCSV(envOrDefault("GOOGLE_CLIENT_IDS", os.Getenv("GOOGLE_CLIENT_ID"))),
		},
		CORS: CORSConfig{
			AllowedOrigins: splitCSV(envOrDefault("CORS_ALLOWED_ORIGINS", "http://localhost:5173")),
		},
		AuthCookie: AuthCookieConfig{
			Secure:   cookieSecure,
			SameSite: cookieSameSite,
			Domain:   strings.TrimSpace(os.Getenv("AUTH_COOKIE_DOMAIN")),
		},
		Monobank: MonobankConfig{
			APIURL:         strings.TrimRight(envOrDefault("MONOBANK_API_URL", "https://api.monobank.ua"), "/"),
			WebhookBaseURL: strings.TrimRight(strings.TrimSpace(os.Getenv("MONOBANK_WEBHOOK_BASE_URL")), "/"),
			CredentialsKey: strings.TrimSpace(os.Getenv("MONOBANK_CREDENTIALS_KEY")),
		},
	}

	return cfg, nil
}

func splitCSV(value string) []string {
	values := make([]string, 0)
	for _, item := range strings.Split(value, ",") {
		if item = strings.TrimSpace(item); item != "" {
			values = append(values, item)
		}
	}
	return values
}

func envOrDefault(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}

	return fallback
}
