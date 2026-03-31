-- Financial Mentor Application Database Schema
-- Based on ERD specification

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Budget Table
CREATE TABLE IF NOT EXISTS budget (
    budget_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    monthly_limit DECIMAL(10, 2),
    weekly_limit DECIMAL(10, 2),
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_budget_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Budget Categories Table
CREATE TABLE IF NOT EXISTS budget_categories (
    category_id SERIAL PRIMARY KEY,
    budget_id INTEGER NOT NULL,
    label VARCHAR(100) NOT NULL,
    allocated_amount DECIMAL(12, 2) DEFAULT 0 NOT NULL,
    color VARCHAR(32) DEFAULT '#64748b' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_category_budget FOREIGN KEY (budget_id) REFERENCES budget(budget_id) ON DELETE CASCADE
);

-- Existing databases: run once if columns are missing
-- ALTER TABLE budget_categories ADD COLUMN IF NOT EXISTS allocated_amount DECIMAL(12, 2) DEFAULT 0 NOT NULL;
-- ALTER TABLE budget_categories ADD COLUMN IF NOT EXISTS color VARCHAR(32) DEFAULT '#64748b' NOT NULL;

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    category_id INTEGER,
    amount DECIMAL(10, 2) NOT NULL,
    date TIMESTAMP NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transaction_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_transaction_category FOREIGN KEY (category_id) REFERENCES budget_categories(category_id) ON DELETE SET NULL
);

-- Modules Table
CREATE TABLE IF NOT EXISTS modules (
    module_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    video_url VARCHAR(500),
    image_url VARCHAR(500),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Progress Table
CREATE TABLE IF NOT EXISTS user_progress (
    progress_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    module_id INTEGER NOT NULL,
    status BOOLEAN DEFAULT FALSE,
    watch_later BOOLEAN DEFAULT FALSE NOT NULL,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_progress_module FOREIGN KEY (module_id) REFERENCES modules(module_id) ON DELETE CASCADE,
    CONSTRAINT unique_user_module UNIQUE (user_id, module_id)
);

-- If the table already existed without watch_later, run once in Supabase SQL editor:
-- ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS watch_later BOOLEAN DEFAULT FALSE NOT NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_budget_user_id ON budget(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_categories_budget_id ON budget_categories(budget_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_module_id ON user_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_budget_updated_at ON budget;
CREATE TRIGGER update_budget_updated_at BEFORE UPDATE ON budget
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_modules_updated_at ON modules;
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_progress_updated_at ON user_progress;
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
