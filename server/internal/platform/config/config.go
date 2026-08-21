package config

import (
	"fmt"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Database DatabaseConfig
	Port     string
	JWT      JWTConfig
	Google   GoogleConfig
	CORS     CORSConfig
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

	cfg := Config{
		Port: envOrDefault("PORT", "8080"),
		Database: DatabaseConfig{
			Host:     envOrDefault("DB_HOST", "localhost"),
			Port:     envOrDefault("DB_PORT", "5432"),
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
