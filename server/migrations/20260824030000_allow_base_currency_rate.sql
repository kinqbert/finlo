-- +goose Up
ALTER TABLE exchange_rate_snapshots
    DROP CONSTRAINT IF EXISTS exchange_rate_currency_pair_check;

-- +goose Down
DELETE FROM exchange_rate_snapshots WHERE source_currency = target_currency;
ALTER TABLE exchange_rate_snapshots
    ADD CONSTRAINT exchange_rate_currency_pair_check CHECK (source_currency <> target_currency);
