-- +goose Up
CREATE UNIQUE INDEX idx_monobank_connections_client_id
    ON monobank_connections (monobank_client_id);

-- +goose Down
DROP INDEX IF EXISTS idx_monobank_connections_client_id;
