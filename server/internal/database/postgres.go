package database

import (
	"github.com/kinqbert/finlo/server/internal/config"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func OpenConnection(config *config.DatabaseConfig) (*gorm.DB, error) {
	dsn := config.GetDSN()

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		panic("Failed connect to the database!")
	}

	return db, nil
}
