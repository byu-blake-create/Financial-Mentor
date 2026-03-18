-- Financial Mentor Application Seed Data
-- Sample data for development and testing
-- Matches `schema.sql` (Supabase/Postgres)

-- Clear existing data (in reverse order of dependencies) and reset identities
TRUNCATE TABLE user_progress RESTART IDENTITY CASCADE;
TRUNCATE TABLE transactions RESTART IDENTITY CASCADE;
TRUNCATE TABLE budget_categories RESTART IDENTITY CASCADE;
TRUNCATE TABLE budget RESTART IDENTITY CASCADE;
TRUNCATE TABLE modules RESTART IDENTITY CASCADE;
TRUNCATE TABLE users RESTART IDENTITY CASCADE;

-- Insert Users
-- All users have password: "password123"
-- Verified bcrypt hash for "password123"
INSERT INTO users (email, password, first_name, last_name) VALUES
('user@example.com', '$2b$10$iovsj1/EiMTn9dYpR28zN.oP1oj4w7Xw4oe9yshM45kW.7Df0j1O2', 'John', 'Doe'),
('jane.smith@example.com', '$2b$10$iovsj1/EiMTn9dYpR28zN.oP1oj4w7Xw4oe9yshM45kW.7Df0j1O2', 'Jane', 'Smith'),
('alice.johnson@example.com', '$2b$10$iovsj1/EiMTn9dYpR28zN.oP1oj4w7Xw4oe9yshM45kW.7Df0j1O2', 'Alice', 'Johnson'),
('bob.williams@example.com', '$2b$10$iovsj1/EiMTn9dYpR28zN.oP1oj4w7Xw4oe9yshM45kW.7Df0j1O2', 'Bob', 'Williams');

-- Insert Budgets
-- Note: user_id references users.user_id (SERIAL), so we use fixed ids 1..4 after RESTART IDENTITY
INSERT INTO budget (user_id, monthly_limit, weekly_limit, date) VALUES
(1, '2000.00', NULL, '2025-01-01T00:00:00Z'),
(1, '2200.00', NULL, '2025-02-01T00:00:00Z'),
(2, '3000.00', NULL, '2025-01-01T00:00:00Z'),
(3, '1500.00', NULL, '2025-01-01T00:00:00Z'),
(4, '2500.00', NULL, '2025-01-01T00:00:00Z');

-- Insert Categories
-- Budget 1 categories (January 2025)
INSERT INTO budget_categories (budget_id, label) VALUES
(1, 'Rent'),
(1, 'Groceries'),
(1, 'Transportation'),
(1, 'Entertainment'),
(1, 'Utilities'),
-- Budget 2 categories (February 2025)
(2, 'Rent'),
(2, 'Groceries'),
(2, 'Transportation'),
(2, 'Entertainment'),
(2, 'Utilities'),
(2, 'Savings'),
-- Budget 3 categories (user-2, January 2025)
(3, 'Rent'),
(3, 'Groceries'),
(3, 'Transportation'),
(3, 'Entertainment'),
(3, 'Utilities'),
(3, 'Savings'),
-- Budget 4 categories (user-3, January 2025)
(4, 'Rent'),
(4, 'Groceries'),
(4, 'Transportation'),
(4, 'Entertainment'),
(4, 'Utilities'),
-- Budget 5 categories (user-4, January 2025)
(5, 'Rent'),
(5, 'Groceries'),
(5, 'Transportation'),
(5, 'Entertainment'),
(5, 'Utilities'),
(5, 'Savings');

-- Insert Transactions
INSERT INTO transactions (user_id, category_id, amount, date, description) VALUES
-- User 1 transactions (John Doe)
-- category_id values correspond to inserted budget_categories rows (starting at 1)
(1, 1, '900.00', '2025-01-05T12:00:00Z', 'Monthly rent payment'),
(1, 2, '125.50', '2025-01-08T12:00:00Z', 'Grocery shopping at Whole Foods'),
(1, 2, '85.25', '2025-01-15T12:00:00Z', 'Weekly grocery run'),
(1, 3, '45.00', '2025-01-10T12:00:00Z', 'Gas station fill-up'),
(1, 3, '12.50', '2025-01-12T12:00:00Z', 'Uber ride to downtown'),
(1, 4, '35.00', '2025-01-18T12:00:00Z', 'Movie tickets'),
(1, 5, '120.00', '2025-01-20T12:00:00Z', 'Electric and water bill'),
(1, 2, '95.75', '2025-01-22T12:00:00Z', 'Grocery shopping'),
(1, 4, '28.50', '2025-01-25T12:00:00Z', 'Restaurant dinner'),
(1, 3, '50.00', '2025-01-28T12:00:00Z', 'Gas station'),
-- User 2 transactions (Jane Smith)
-- Budget 3 categories start at id 12+? (see insert order); we use ids created by order:
-- Budget 1: 1-5, Budget 2: 6-11, Budget 3: 12-17, Budget 4: 18-22, Budget 5: 23-28
(2, 12, '1200.00', '2025-01-01T12:00:00Z', 'Monthly rent'),
(2, 13, '200.00', '2025-01-05T12:00:00Z', 'Grocery shopping'),
(2, 14, '60.00', '2025-01-07T12:00:00Z', 'Monthly transit pass'),
(2, 15, '150.00', '2025-01-10T12:00:00Z', 'Concert tickets'),
(2, 16, '180.00', '2025-01-15T12:00:00Z', 'Utilities payment'),
(2, 17, '500.00', '2025-01-20T12:00:00Z', 'Savings transfer'),
-- User 3 transactions (Alice Johnson)
-- Budget 4 categories are 18-22
(3, 18, '750.00', '2025-01-01T12:00:00Z', 'Rent payment'),
(3, 19, '150.00', '2025-01-06T12:00:00Z', 'Grocery shopping'),
(3, 20, '40.00', '2025-01-08T12:00:00Z', 'Gas fill-up'),
(3, 21, '65.00', '2025-01-12T12:00:00Z', 'Dinner at Italian restaurant'),
(3, 22, '120.00', '2025-01-18T12:00:00Z', 'Clothing purchase'),
-- User 4 transactions (Bob Williams)
-- Budget 5 categories are 23-28
(4, 23, '1000.00', '2025-01-01T12:00:00Z', 'Rent payment'),
(4, 24, '180.00', '2025-01-04T12:00:00Z', 'Grocery shopping'),
(4, 25, '75.00', '2025-01-08T12:00:00Z', 'Public transportation'),
(4, 26, '45.00', '2025-01-12T12:00:00Z', 'Restaurant meals'),
(4, 27, '200.00', '2025-01-15T12:00:00Z', 'Utilities payment'),
(4, 28, '200.00', '2025-01-20T12:00:00Z', 'Savings deposit');

-- Insert Modules
INSERT INTO modules (title, description, video_url) VALUES
('Introduction to Budgeting', 'Learn the basics of creating and maintaining a personal budget.', 'https://www.youtube.com/watch?v=3HTa9FKSurs'),
('Understanding Credit Scores', 'Discover how credit scores work and how to improve yours.', 'https://www.youtube.com/watch?v=TOdnj2p91_c'),
('Saving for Retirement', 'Plan for your future with effective retirement savings strategies.', 'https://www.youtube.com/watch?v=T_6PFoY-ou0'),
('Managing Debt', 'Learn strategies to pay off debt and stay debt-free.', 'https://www.youtube.com/watch?v=F-mQRThLwUI'),
('Investment Basics', 'Introduction to stocks, bonds, and other investment vehicles.', 'https://www.youtube.com/watch?v=1Ob-hAYCnJE'),
('Emergency Funds', 'Why you need an emergency fund and how to build one.', 'https://www.youtube.com/watch?v=7pNEEoOSFTA'),
('Tax Planning', 'Understand tax deductions and credits to maximize your savings.', 'https://www.youtube.com/watch?v=62-SUCnRq1E'),
('Home Buying Guide', 'Everything you need to know about buying your first home.', 'https://www.youtube.com/watch?v=wXzTE8zLIbo'),
('Insurance Essentials', 'Learn about different types of insurance and what you need.', 'https://www.youtube.com/watch?v=9iR80DApetQ'),
('Financial Goal Setting', 'Set and achieve your financial goals with proven strategies.', 'https://www.youtube.com/watch?v=EOLkI-QghQw');

-- Display summary
SELECT 'Seed data inserted successfully!' AS status;
SELECT COUNT(*) AS total_users FROM users;
SELECT COUNT(*) AS total_budgets FROM budget;
SELECT COUNT(*) AS total_categories FROM budget_categories;
SELECT COUNT(*) AS total_transactions FROM transactions;
SELECT COUNT(*) AS total_modules FROM modules;
