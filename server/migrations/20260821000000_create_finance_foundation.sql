-- +goose Up
ALTER TABLE users
    ALTER COLUMN password_hash DROP NOT NULL,
    ADD COLUMN google_subject TEXT,
    ADD COLUMN avatar_url TEXT NOT NULL DEFAULT '';

CREATE UNIQUE INDEX idx_users_google_subject
    ON users (google_subject)
    WHERE google_subject IS NOT NULL;

CREATE TABLE accounts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL,
    currency CHAR(3) NOT NULL,
    balance_minor BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT accounts_type_check CHECK (type IN ('cash', 'bank', 'card', 'savings', 'other'))
);
CREATE INDEX idx_accounts_user_id ON accounts (user_id);
CREATE INDEX idx_accounts_deleted_at ON accounts (deleted_at);

CREATE TABLE transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    type VARCHAR(10) NOT NULL,
    amount_minor BIGINT NOT NULL,
    currency CHAR(3) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description VARCHAR(500) NOT NULL DEFAULT '',
    occurred_at TIMESTAMPTZ NOT NULL,
    source VARCHAR(20) NOT NULL DEFAULT 'manual',
    external_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT transactions_type_check CHECK (type IN ('income', 'expense')),
    CONSTRAINT transactions_amount_check CHECK (amount_minor > 0),
    CONSTRAINT transactions_source_check CHECK (source IN ('manual', 'monobank'))
);
CREATE INDEX idx_transactions_user_occurred_at ON transactions (user_id, occurred_at DESC);
CREATE INDEX idx_transactions_account_id ON transactions (account_id);
CREATE INDEX idx_transactions_deleted_at ON transactions (deleted_at);
CREATE UNIQUE INDEX idx_transactions_external_source
    ON transactions (user_id, source, external_id)
    WHERE external_id IS NOT NULL;

CREATE TABLE budgets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    amount_minor BIGINT NOT NULL,
    currency CHAR(3) NOT NULL,
    month DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT budgets_amount_check CHECK (amount_minor > 0),
    UNIQUE (user_id, category, currency, month)
);
CREATE INDEX idx_budgets_user_month ON budgets (user_id, month);

CREATE TABLE emergency_funds (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    target_minor BIGINT NOT NULL,
    current_minor BIGINT NOT NULL DEFAULT 0,
    currency CHAR(3) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT emergency_target_check CHECK (target_minor > 0),
    CONSTRAINT emergency_current_check CHECK (current_minor >= 0)
);

CREATE TABLE subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    amount_minor BIGINT NOT NULL,
    currency CHAR(3) NOT NULL,
    billing_day SMALLINT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    next_payment_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT subscriptions_amount_check CHECK (amount_minor > 0),
    CONSTRAINT subscriptions_billing_day_check CHECK (billing_day BETWEEN 1 AND 31)
);
CREATE INDEX idx_subscriptions_user_id ON subscriptions (user_id);
CREATE INDEX idx_subscriptions_deleted_at ON subscriptions (deleted_at);

-- +goose Down
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS emergency_funds;
DROP TABLE IF EXISTS budgets;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS accounts;
DROP INDEX IF EXISTS idx_users_google_subject;
UPDATE users SET password_hash = '' WHERE password_hash IS NULL;
ALTER TABLE users
    DROP COLUMN IF EXISTS avatar_url,
    DROP COLUMN IF EXISTS google_subject,
    ALTER COLUMN password_hash SET NOT NULL;
