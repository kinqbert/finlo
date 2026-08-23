-- +goose Up
CREATE TABLE goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    current_minor BIGINT NOT NULL DEFAULT 0,
    target_minor BIGINT,
    currency CHAR(3) NOT NULL,
    source VARCHAR(20) NOT NULL DEFAULT 'manual',
    external_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT goals_current_check CHECK (current_minor >= 0),
    CONSTRAINT goals_target_check CHECK (target_minor IS NULL OR target_minor > 0),
    CONSTRAINT goals_source_check CHECK (source IN ('manual', 'monobank'))
);

CREATE INDEX idx_goals_user_id ON goals (user_id);
CREATE INDEX idx_goals_deleted_at ON goals (deleted_at);
CREATE UNIQUE INDEX idx_goals_external_source
    ON goals (user_id, source, external_id)
    WHERE external_id IS NOT NULL;

CREATE TABLE monobank_connections (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    encrypted_token BYTEA NOT NULL,
    monobank_client_id TEXT NOT NULL,
    client_name TEXT NOT NULL DEFAULT '',
    status VARCHAR(24) NOT NULL,
    client_snapshot JSONB,
    webhook_secret CHAR(64) NOT NULL UNIQUE,
    webhook_configured BOOLEAN NOT NULL DEFAULT FALSE,
    connected_at TIMESTAMPTZ,
    last_error TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT monobank_connections_status_check
        CHECK (status IN ('pending', 'active', 'webhook_error'))
);

CREATE INDEX idx_monobank_connections_status ON monobank_connections (status);

CREATE TABLE monobank_account_links (
    id TEXT PRIMARY KEY,
    connection_id TEXT NOT NULL REFERENCES monobank_connections(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
    external_account_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT monobank_account_links_external_key UNIQUE (connection_id, external_account_id)
);

CREATE TABLE monobank_jar_links (
    id TEXT PRIMARY KEY,
    connection_id TEXT NOT NULL REFERENCES monobank_connections(id) ON DELETE CASCADE,
    goal_id TEXT NOT NULL UNIQUE REFERENCES goals(id) ON DELETE CASCADE,
    external_jar_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT monobank_jar_links_external_key UNIQUE (connection_id, external_jar_id)
);

CREATE TABLE mcc_category_rules (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mcc INTEGER NOT NULL,
    transaction_type VARCHAR(10) NOT NULL,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT mcc_category_rules_mcc_check CHECK (mcc BETWEEN 0 AND 9999),
    CONSTRAINT mcc_category_rules_type_check CHECK (transaction_type IN ('income', 'expense')),
    CONSTRAINT mcc_category_rules_user_mcc_type_key UNIQUE (user_id, mcc, transaction_type)
);

CREATE INDEX idx_mcc_category_rules_category_id ON mcc_category_rules (category_id);

ALTER TABLE transactions
    ADD COLUMN mcc_code INTEGER,
    ADD COLUMN original_mcc_code INTEGER,
    ADD COLUMN category_needs_review BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN pending BOOLEAN NOT NULL DEFAULT FALSE,
    ADD CONSTRAINT transactions_mcc_code_check CHECK (mcc_code IS NULL OR mcc_code BETWEEN 0 AND 9999),
    ADD CONSTRAINT transactions_original_mcc_code_check CHECK (original_mcc_code IS NULL OR original_mcc_code BETWEEN 0 AND 9999);

INSERT INTO mcc_category_rules (id, user_id, mcc, transaction_type, category_id, is_default)
SELECT
    gen_random_uuid()::TEXT,
    category.user_id,
    defaults.mcc,
    'expense',
    category.id,
    TRUE
FROM (VALUES
    (4814, 'Housing & Utilities'),
    (4900, 'Housing & Utilities'),
    (6513, 'Housing & Utilities'),
    (5411, 'Food & Dining'),
    (5422, 'Food & Dining'),
    (5441, 'Food & Dining'),
    (5451, 'Food & Dining'),
    (5462, 'Food & Dining'),
    (5499, 'Food & Dining'),
    (5812, 'Food & Dining'),
    (5813, 'Food & Dining'),
    (5814, 'Food & Dining'),
    (4111, 'Transportation'),
    (4121, 'Transportation'),
    (4131, 'Transportation'),
    (4789, 'Transportation'),
    (5511, 'Transportation'),
    (5533, 'Transportation'),
    (5541, 'Transportation'),
    (5542, 'Transportation'),
    (7523, 'Transportation'),
    (5311, 'Shopping & Leisure'),
    (5331, 'Shopping & Leisure'),
    (5399, 'Shopping & Leisure'),
    (5651, 'Shopping & Leisure'),
    (5661, 'Shopping & Leisure'),
    (5732, 'Shopping & Leisure'),
    (5941, 'Shopping & Leisure'),
    (5942, 'Shopping & Leisure'),
    (5999, 'Shopping & Leisure'),
    (7832, 'Shopping & Leisure'),
    (7991, 'Shopping & Leisure'),
    (7996, 'Shopping & Leisure'),
    (7997, 'Shopping & Leisure'),
    (7999, 'Shopping & Leisure')
) AS defaults(mcc, category_name)
JOIN categories AS category
  ON category.name = defaults.category_name
 AND category.type = 'expense'
ON CONFLICT (user_id, mcc, transaction_type) DO NOTHING;

-- +goose Down
ALTER TABLE transactions
    DROP CONSTRAINT IF EXISTS transactions_original_mcc_code_check,
    DROP CONSTRAINT IF EXISTS transactions_mcc_code_check,
    DROP COLUMN IF EXISTS pending,
    DROP COLUMN IF EXISTS category_needs_review,
    DROP COLUMN IF EXISTS original_mcc_code,
    DROP COLUMN IF EXISTS mcc_code;

DROP TABLE IF EXISTS mcc_category_rules;
DROP TABLE IF EXISTS monobank_jar_links;
DROP TABLE IF EXISTS monobank_account_links;
DROP TABLE IF EXISTS monobank_connections;
DROP TABLE IF EXISTS goals;
