-- +goose Up
CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT categories_type_check CHECK (type IN ('income', 'expense')),
    CONSTRAINT categories_user_type_name_key UNIQUE (user_id, type, name)
);

CREATE INDEX idx_categories_user_type ON categories (user_id, type, name);

INSERT INTO categories (id, user_id, name, type)
SELECT
    (md5(user_id || chr(31) || type || chr(31) || category)::UUID)::TEXT,
    user_id,
    category,
    type
FROM transactions
GROUP BY user_id, type, category
ON CONFLICT (user_id, type, name) DO NOTHING;

INSERT INTO categories (id, user_id, name, type)
SELECT
    (md5(user_id || chr(31) || 'expense' || chr(31) || category)::UUID)::TEXT,
    user_id,
    category,
    'expense'
FROM budgets
GROUP BY user_id, category
ON CONFLICT (user_id, type, name) DO NOTHING;

ALTER TABLE transactions ADD COLUMN category_id TEXT;

UPDATE transactions AS transaction
SET category_id = category.id
FROM categories AS category
WHERE category.user_id = transaction.user_id
  AND category.type = transaction.type
  AND category.name = transaction.category;

ALTER TABLE transactions
    ALTER COLUMN category_id SET NOT NULL,
    ADD CONSTRAINT transactions_category_id_fkey
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT;

CREATE INDEX idx_transactions_category_id ON transactions (category_id);

ALTER TABLE budgets ADD COLUMN category_id TEXT;

UPDATE budgets AS budget
SET category_id = category.id
FROM categories AS category
WHERE category.user_id = budget.user_id
  AND category.type = 'expense'
  AND category.name = budget.category;

ALTER TABLE budgets
    DROP CONSTRAINT IF EXISTS budgets_user_id_category_currency_month_key,
    ALTER COLUMN category_id SET NOT NULL,
    ADD CONSTRAINT budgets_category_id_fkey
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    ADD CONSTRAINT budgets_user_category_currency_month_key
        UNIQUE (user_id, category_id, currency, month);

CREATE INDEX idx_budgets_category_id ON budgets (category_id);

ALTER TABLE transactions DROP COLUMN category;
ALTER TABLE budgets DROP COLUMN category;

-- +goose Down
ALTER TABLE transactions ADD COLUMN category VARCHAR(100);

UPDATE transactions AS transaction
SET category = category.name
FROM categories AS category
WHERE category.id = transaction.category_id;

ALTER TABLE transactions ALTER COLUMN category SET NOT NULL;

ALTER TABLE budgets ADD COLUMN category VARCHAR(100);

UPDATE budgets AS budget
SET category = category.name
FROM categories AS category
WHERE category.id = budget.category_id;

ALTER TABLE budgets
    DROP CONSTRAINT IF EXISTS budgets_user_category_currency_month_key,
    ALTER COLUMN category SET NOT NULL,
    ADD CONSTRAINT budgets_user_category_currency_month_key
        UNIQUE (user_id, category, currency, month);

DROP INDEX IF EXISTS idx_budgets_category_id;
ALTER TABLE budgets
    DROP CONSTRAINT IF EXISTS budgets_category_id_fkey,
    DROP COLUMN category_id;

DROP INDEX IF EXISTS idx_transactions_category_id;
ALTER TABLE transactions
    DROP CONSTRAINT IF EXISTS transactions_category_id_fkey,
    DROP COLUMN category_id;

DROP TABLE IF EXISTS categories;
