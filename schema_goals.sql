-- Financial Mentor: user goals
-- Run this in the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS goals (
    goal_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    kind VARCHAR(10) NOT NULL DEFAULT 'custom',
    preset_id VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_label VARCHAR(100),
    category_id VARCHAR(50),
    target_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    saved_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    unit VARCHAR(10) NOT NULL DEFAULT 'usd',
    deadline TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_goals_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
