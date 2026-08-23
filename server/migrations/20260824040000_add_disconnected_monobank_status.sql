-- +goose Up
ALTER TABLE monobank_connections
    DROP CONSTRAINT monobank_connections_status_check,
    ADD CONSTRAINT monobank_connections_status_check
        CHECK (status IN ('pending', 'active', 'webhook_error', 'disconnected'));

-- +goose Down
UPDATE monobank_connections
SET status = 'webhook_error'
WHERE status = 'disconnected';

ALTER TABLE monobank_connections
    DROP CONSTRAINT monobank_connections_status_check,
    ADD CONSTRAINT monobank_connections_status_check
        CHECK (status IN ('pending', 'active', 'webhook_error'));
