package database

import (
	"context"
	"fmt"
	"time"

	"github.com/kinqbert/finlo/server/internal/config"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func OpenConnection(config *config.DatabaseConfig) (*gorm.DB, error) {
	dsn := config.GetDSN()

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		TranslateError: true,
	})

	if err != nil {
		return nil, fmt.Errorf("open PostgreSQL connection: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("get database pool: %w", err)
	}

	ctx, cancel := context.WithTimeout(
		context.Background(),
		5*time.Second,
	)
	defer cancel()

	if err := sqlDB.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("ping PostgreSQL: %w", err)
	}

	return db, nil
}
