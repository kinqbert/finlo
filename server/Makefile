# Load local environment variables when .env exists.
-include .env

# Construct the Goose connection URL from the DB_* variables loaded above.
# It can still be overridden with: make migration-up DATABASE_URL=...
DATABASE_URL ?= postgres://$(DB_USER):$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)?sslmode=$(DB_SSL_MODE)

GOOSE := goose
MIGRATIONS_DIR := migrations
BINARY := bin/api

.PHONY: help dev build test vet fmt tidy \
	migration-create migration-up migration-down \
	migration-redo migration-status migration-version

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
