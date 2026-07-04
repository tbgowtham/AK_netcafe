-- Drop old tables
DROP TABLE IF EXISTS requests;
DROP TABLE IF EXISTS chats;
DROP TABLE IF EXISTS customers;

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    registered_at TEXT NOT NULL
);

-- Create requests table with generic document_number
CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_type TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    document_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL
);

-- Create chats table
CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_name TEXT NOT NULL,
    message TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0,
    timestamp TEXT NOT NULL
);

-- Seed welcome message from Admin
INSERT INTO chats (sender_name, message, is_admin, timestamp) VALUES
('Admin', 'Welcome to AK E-Services! How can we help you today?', 1, datetime('now'));
