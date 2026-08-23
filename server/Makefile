# Load local environment variables when .env exists.
-include .env

# Construct the Goose connection URL from the DB_* variables loaded above.
# It can still be overridden with: make migration-up DATABASE_URL=...
DATABASE_URL ?= postgres://$(DB_USER):$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)?sslmode=$(DB_SSL_MODE)

GOOSE := goose
MIGRATIONS_DIR := migrations
BINARY := bin/api
COMPOSE_FILE := ../compose.yaml
COMPOSE_ENV_FILE := $(wildcard .env)
COMPOSE := docker compose $(if $(COMPOSE_ENV_FILE),--env-file $(COMPOSE_ENV_FILE)) -f $(COMPOSE_FILE)
DB_VOLUME := finlo_postgres-data

.PHONY: help dev build test vet fmt tidy \
	migration-create migration-up migration-down \
	migration-redo migration-status migration-version \
	db-up db-down db-status db-migrate db-setup db-reset

help:
	@echo "Available commands:"
	@echo "  make dev"
	@echo "  make build"
	@echo "  make test"
	@echo "  make vet"
	@echo "  make fmt"
	@echo "  make tidy"
	@echo "  make migration-create name=create_accounts"
	@echo "  make migration-up"
	@echo "  make migration-down"
	@echo "  make migration-redo"
	@echo "  make migration-status"
	@echo "  make db-up              Start the local PostgreSQL container"
	@echo "  make db-down            Stop local Docker services"
	@echo "  make db-status          Show local Docker service status"
	@echo "  make db-migrate         Apply migrations in Docker"
	@echo "  make db-setup           Start PostgreSQL and apply migrations"
	@echo "  make db-reset CONFIRM=1 Permanently reset the local database"

dev:
	go run ./cmd/api

build:
	go build -o $(BINARY) ./cmd/api

test:
	go test ./...

vet:
	go vet ./...

fmt:
	gofmt -w .
	go fmt ./...

tidy:
	go mod tidy

migration-create:
	@test -n "$(name)" || \
		(echo "Usage: make migration-create name=create_accounts" && exit 1)
	$(GOOSE) -dir $(MIGRATIONS_DIR) create "$(name)" sql

migration-up:
	$(GOOSE) -dir $(MIGRATIONS_DIR) postgres "$(DATABASE_URL)" up

migration-down:
	$(GOOSE) -dir $(MIGRATIONS_DIR) postgres "$(DATABASE_URL)" down

migration-redo:
	$(GOOSE) -dir $(MIGRATIONS_DIR) postgres "$(DATABASE_URL)" redo

migration-status:
	$(GOOSE) -dir $(MIGRATIONS_DIR) postgres "$(DATABASE_URL)" status

migration-version:
	$(GOOSE) -dir $(MIGRATIONS_DIR) postgres "$(DATABASE_URL)" version

db-up:
	$(COMPOSE) up -d --wait db

db-down:
	$(COMPOSE) down

db-status:
	$(COMPOSE) ps

db-migrate:
	$(COMPOSE) run --rm migrate

db-setup: db-up db-migrate

db-reset:
	@test "$(CONFIRM)" = "1" || (echo "Refusing to delete local database data. Re-run with: make db-reset CONFIRM=1" && exit 1)
	$(COMPOSE) down
	@if docker volume inspect $(DB_VOLUME) >/dev/null 2>&1; then docker volume rm $(DB_VOLUME); fi
	$(MAKE) db-setup
