-- Financial Mentor Application Seed Data
-- Sample data for development and testing
-- Matches the actual Drizzle schema structure

-- Clear existing data (in reverse order of dependencies)
TRUNCATE TABLE transactions CASCADE;
TRUNCATE TABLE categories CASCADE;
TRUNCATE TABLE budgets CASCADE;
TRUNCATE TABLE modules CASCADE;
TRUNCATE TABLE users CASCADE;

-- Reset sequences
ALTER SEQUENCE budgets_id_seq RESTART WITH 1;
ALTER SEQUENCE categories_id_seq RESTART WITH 1;
ALTER SEQUENCE transactions_id_seq RESTART WITH 1;
ALTER SEQUENCE modules_id_seq RESTART WITH 1;

-- Insert Users
-- All users have password: "password123"
-- Using proper UUIDs to match the schema default
-- Verified bcrypt hash for "password123"
INSERT INTO users (id, email, password, first_name, last_name) VALUES
('4ab5ef74-da6b-45f4-81da-3024ea83c82c', 'user@example.com', '$2b$10$iovsj1/EiMTn9dYpR28zN.oP1oj4w7Xw4oe9yshM45kW.7Df0j1O2', 'John', 'Doe'),
('9ab97f89-3115-4f9c-808a-dc560f2f8bfa', 'jane.smith@example.com', '$2b$10$iovsj1/EiMTn9dYpR28zN.oP1oj4w7Xw4oe9yshM45kW.7Df0j1O2', 'Jane', 'Smith'),
('e398109e-b9f1-4552-9d7d-ef0dde0c900e', 'alice.johnson@example.com', '$2b$10$iovsj1/EiMTn9dYpR28zN.oP1oj4w7Xw4oe9yshM45kW.7Df0j1O2', 'Alice', 'Johnson'),
('fb779538-d591-4322-962c-45a033f9fd8e', 'bob.williams@example.com', '$2b$10$iovsj1/EiMTn9dYpR28zN.oP1oj4w7Xw4oe9yshM45kW.7Df0j1O2', 'Bob', 'Williams');

-- Insert Budgets
-- Note: user_id is text (varchar), referencing users.id (UUIDs)
INSERT INTO budgets (user_id, total_amount, period) VALUES
('4ab5ef74-da6b-45f4-81da-3024ea83c82c', '2000.00', 'January 2025'),
('4ab5ef74-da6b-45f4-81da-3024ea83c82c', '2200.00', 'February 2025'),
('9ab97f89-3115-4f9c-808a-dc560f2f8bfa', '3000.00', 'January 2025'),
('e398109e-b9f1-4552-9d7d-ef0dde0c900e', '1500.00', 'January 2025'),
('fb779538-d591-4322-962c-45a033f9fd8e', '2500.00', 'January 2025');

-- Insert Categories
-- Categories have: budget_id, name, allocated_amount, color
-- Budget 1 categories (January 2025)
INSERT INTO categories (budget_id, name, allocated_amount, color) VALUES
(1, 'Rent', '900.00', '#3b82f6'),
(1, 'Groceries', '300.00', '#eab308'),
(1, 'Transportation', '200.00', '#ef4444'),
(1, 'Entertainment', '300.00', '#22c55e'),
(1, 'Utilities', '300.00', '#8b5cf6'),
-- Budget 2 categories (February 2025)
(2, 'Rent', '900.00', '#3b82f6'),
(2, 'Groceries', '350.00', '#eab308'),
(2, 'Transportation', '250.00', '#ef4444'),
(2, 'Entertainment', '300.00', '#22c55e'),
(2, 'Utilities', '300.00', '#8b5cf6'),
(2, 'Savings', '100.00', '#10b981'),
-- Budget 3 categories (user-2, January 2025)
(3, 'Rent', '1200.00', '#3b82f6'),
(3, 'Groceries', '500.00', '#eab308'),
(3, 'Transportation', '300.00', '#ef4444'),
(3, 'Entertainment', '500.00', '#22c55e'),
(3, 'Utilities', '300.00', '#8b5cf6'),
(3, 'Savings', '200.00', '#10b981'),
-- Budget 4 categories (user-3, January 2025)
(4, 'Rent', '750.00', '#3b82f6'),
(4, 'Groceries', '300.00', '#eab308'),
(4, 'Transportation', '150.00', '#ef4444'),
(4, 'Entertainment', '150.00', '#22c55e'),
(4, 'Utilities', '150.00', '#8b5cf6'),
-- Budget 5 categories (user-4, January 2025)
(5, 'Rent', '1000.00', '#3b82f6'),
(5, 'Groceries', '400.00', '#eab308'),
(5, 'Transportation', '300.00', '#ef4444'),
(5, 'Entertainment', '400.00', '#22c55e'),
(5, 'Utilities', '200.00', '#8b5cf6'),
(5, 'Savings', '200.00', '#10b981');

-- Insert Transactions
-- Note: user_id is text (UUID), date is DATE type (not timestamp)
INSERT INTO transactions (user_id, category_id, amount, date, description) VALUES
-- User 1 transactions (John Doe)
('4ab5ef74-da6b-45f4-81da-3024ea83c82c', 1, '900.00', '2025-01-05', 'Monthly rent payment'),
('4ab5ef74-da6b-45f4-81da-3024ea83c82c', 2, '125.50', '2025-01-08', 'Grocery shopping at Whole Foods'),
('4ab5ef74-da6b-45f4-81da-3024ea83c82c', 2, '85.25', '2025-01-15', 'Weekly grocery run'),
('4ab5ef74-da6b-45f4-81da-3024ea83c82c', 3, '45.00', '2025-01-10', 'Gas station fill-up'),
('4ab5ef74-da6b-45f4-81da-3024ea83c82c', 3, '12.50', '2025-01-12', 'Uber ride to downtown'),
('4ab5ef74-da6b-45f4-81da-3024ea83c82c', 4, '35.00', '2025-01-18', 'Movie tickets'),
('4ab5ef74-da6b-45f4-81da-3024ea83c82c', 5, '120.00', '2025-01-20', 'Electric and water bill'),
('4ab5ef74-da6b-45f4-81da-3024ea83c82c', 2, '95.75', '2025-01-22', 'Grocery shopping'),
('4ab5ef74-da6b-45f4-81da-3024ea83c82c', 4, '28.50', '2025-01-25', 'Restaurant dinner'),
('4ab5ef74-da6b-45f4-81da-3024ea83c82c', 3, '50.00', '2025-01-28', 'Gas station'),
-- User 2 transactions (Jane Smith)
('9ab97f89-3115-4f9c-808a-dc560f2f8bfa', 7, '1200.00', '2025-01-01', 'Monthly rent'),
('9ab97f89-3115-4f9c-808a-dc560f2f8bfa', 8, '200.00', '2025-01-05', 'Grocery shopping'),
('9ab97f89-3115-4f9c-808a-dc560f2f8bfa', 9, '60.00', '2025-01-07', 'Monthly transit pass'),
('9ab97f89-3115-4f9c-808a-dc560f2f8bfa', 10, '150.00', '2025-01-10', 'Concert tickets'),
('9ab97f89-3115-4f9c-808a-dc560f2f8bfa', 11, '180.00', '2025-01-15', 'Utilities payment'),
('9ab97f89-3115-4f9c-808a-dc560f2f8bfa', 12, '500.00', '2025-01-20', 'Savings transfer'),
-- User 3 transactions (Alice Johnson)
('e398109e-b9f1-4552-9d7d-ef0dde0c900e', 13, '750.00', '2025-01-01', 'Rent payment'),
('e398109e-b9f1-4552-9d7d-ef0dde0c900e', 14, '150.00', '2025-01-06', 'Grocery shopping'),
('e398109e-b9f1-4552-9d7d-ef0dde0c900e', 15, '40.00', '2025-01-08', 'Gas fill-up'),
('e398109e-b9f1-4552-9d7d-ef0dde0c900e', 16, '65.00', '2025-01-12', 'Dinner at Italian restaurant'),
('e398109e-b9f1-4552-9d7d-ef0dde0c900e', 17, '120.00', '2025-01-18', 'Clothing purchase'),
-- User 4 transactions (Bob Williams)
('fb779538-d591-4322-962c-45a033f9fd8e', 18, '1000.00', '2025-01-01', 'Rent payment'),
('fb779538-d591-4322-962c-45a033f9fd8e', 19, '180.00', '2025-01-04', 'Grocery shopping'),
('fb779538-d591-4322-962c-45a033f9fd8e', 20, '75.00', '2025-01-08', 'Public transportation'),
('fb779538-d591-4322-962c-45a033f9fd8e', 21, '45.00', '2025-01-12', 'Restaurant meals'),
('fb779538-d591-4322-962c-45a033f9fd8e', 22, '200.00', '2025-01-15', 'Utilities payment'),
('fb779538-d591-4322-962c-45a033f9fd8e', 23, '200.00', '2025-01-20', 'Savings deposit');

-- Insert Modules
-- Modules have: title, description, video_url, category, image_url
INSERT INTO modules (title, description, video_url, category, image_url) VALUES
('Introduction to Budgeting', 'Learn the basics of creating and maintaining a personal budget.', 'https://www.youtube.com/watch?v=3HTa9FKSurs', 'Recent', '/images/module_thumb_1.jpg'),
('Understanding Credit Scores', 'Discover how credit scores work and how to improve yours.', 'https://www.youtube.com/watch?v=TOdnj2p91_c', 'Recommended', '/images/module_thumb_2.jpg'),
('Saving for Retirement', 'Plan for your future with effective retirement savings strategies.', 'https://www.youtube.com/watch?v=T_6PFoY-ou0', 'Recent', '/images/module_thumb_3.jpg'),
('Managing Debt', 'Learn strategies to pay off debt and stay debt-free.', 'https://www.youtube.com/watch?v=F-mQRThLwUI', 'Recommended', '/images/module_thumb_4.jpg'),
('Investment Basics', 'Introduction to stocks, bonds, and other investment vehicles.', 'https://www.youtube.com/watch?v=1Ob-hAYCnJE', 'Popular', '/images/module_thumb_5.jpg'),
('Emergency Funds', 'Why you need an emergency fund and how to build one.', 'https://www.youtube.com/watch?v=7pNEEoOSFTA', 'Recent', '/images/module_thumb_6.jpg'),
('Tax Planning', 'Understand tax deductions and credits to maximize your savings.', 'https://www.youtube.com/watch?v=62-SUCnRq1E', 'Recommended', '/images/module_thumb_7.jpg'),
('Home Buying Guide', 'Everything you need to know about buying your first home.', 'https://www.youtube.com/watch?v=wXzTE8zLIbo', 'Popular', '/images/module_thumb_8.jpg'),
('Insurance Essentials', 'Learn about different types of insurance and what you need.', 'https://www.youtube.com/watch?v=9iR80DApetQ', 'Recommended', '/images/module_thumb_9.jpg'),
('Financial Goal Setting', 'Set and achieve your financial goals with proven strategies.', 'https://www.youtube.com/watch?v=EOLkI-QghQw', 'Popular', '/images/module_thumb_10.jpg');

-- Display summary
SELECT 'Seed data inserted successfully!' AS status;
SELECT COUNT(*) AS total_users FROM users;
SELECT COUNT(*) AS total_budgets FROM budgets;
SELECT COUNT(*) AS total_categories FROM categories;
SELECT COUNT(*) AS total_transactions FROM transactions;
SELECT COUNT(*) AS total_modules FROM modules;
