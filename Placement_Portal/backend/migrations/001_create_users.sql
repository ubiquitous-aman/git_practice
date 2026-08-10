-- Migration 001: Create users table
-- This is the central identity table for all system users.
-- The role column uses a CHECK constraint to enforce only valid values.
-- is_active allows soft-disabling accounts without deleting data.

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (
        role IN ('student', 'tpo', 'admin')
    ),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP
    WITH
        TIME ZONE NOT NULL DEFAULT NOW (),
        updated_at TIMESTAMP
    WITH
        TIME ZONE NOT NULL DEFAULT NOW ()
);

-- Unique constraint: no two accounts share an email
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- Index for fast role-based queries (e.g., "get all students")
CREATE INDEX IF NOT EXISTS idx_users_role ON users ( role );

COMMENT ON
TABLE users IS 'All system users: students, TPO officers, and administrators';

COMMENT ON COLUMN users.role IS 'Values: student | tpo | admin';

COMMENT ON COLUMN users.is_active IS 'FALSE means the account is disabled by admin';

COMMENT ON COLUMN users.password_hash IS 'bcrypt hash — never store plaintext';