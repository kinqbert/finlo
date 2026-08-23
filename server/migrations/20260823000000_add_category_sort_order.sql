-- +goose Up
ALTER TABLE categories ADD COLUMN sort_order INTEGER;

WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, type ORDER BY name, id) - 1 AS position
    FROM categories
)
UPDATE categories
SET sort_order = ranked.position
FROM ranked
WHERE categories.id = ranked.id;

ALTER TABLE categories
    ALTER COLUMN sort_order SET NOT NULL,
    ALTER COLUMN sort_order SET DEFAULT 0,
    ADD CONSTRAINT categories_sort_order_check CHECK (sort_order >= 0);

CREATE INDEX idx_categories_user_type_order ON categories (user_id, type, sort_order, name);

-- +goose Down
DROP INDEX IF EXISTS idx_categories_user_type_order;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_sort_order_check;
ALTER TABLE categories DROP COLUMN sort_order;
