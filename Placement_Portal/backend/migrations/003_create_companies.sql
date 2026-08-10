-- Migration 003: Create companies table
-- Stores company information managed by TPO officers.
-- Website is optional (nullable) — some companies may not have a web presence.

CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    website VARCHAR(500),
    description TEXT,
    created_at TIMESTAMP
    WITH
        TIME ZONE NOT NULL DEFAULT NOW (),
        updated_at TIMESTAMP
    WITH
        TIME ZONE NOT NULL DEFAULT NOW ()
);

-- Prevent duplicate company names (case-insensitive)
CREATE UNIQUE
INDEX IF NOT EXISTS idx_companies_name_lower ON companies (LOWER(name));

COMMENT ON
TABLE companies IS 'Companies that participate in placement drives';

COMMENT ON COLUMN companies.website IS 'Optional company website URL';