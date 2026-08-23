-- +goose Up
CREATE TABLE exchange_rate_snapshots (
    id TEXT PRIMARY KEY,
    source_currency CHAR(3) NOT NULL,
    target_currency CHAR(3) NOT NULL,
    buy_rate_micros BIGINT NOT NULL,
    sell_rate_micros BIGINT NOT NULL,
    provider VARCHAR(30) NOT NULL,
    provider_timestamp TIMESTAMPTZ NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    rate_date DATE NOT NULL,
    CONSTRAINT exchange_rate_buy_positive CHECK (buy_rate_micros > 0),
    CONSTRAINT exchange_rate_sell_positive CHECK (sell_rate_micros > 0),
    CONSTRAINT exchange_rate_currency_pair_check CHECK (source_currency <> target_currency),
    CONSTRAINT exchange_rate_daily_key UNIQUE (provider, source_currency, target_currency, rate_date)
);

CREATE INDEX idx_exchange_rate_snapshots_latest
    ON exchange_rate_snapshots (source_currency, target_currency, fetched_at DESC);

-- +goose Down
DROP TABLE IF EXISTS exchange_rate_snapshots;
