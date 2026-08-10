-- Migration 008: Create audit_logs table
-- Immutable record of important actions in the system.
-- user_id uses SET NULL on delete: if a user is removed, the log survives.
-- metadata stores additional context as JSONB (flexible, indexable).
-- No UPDATE on audit_logs — logs are append-only.

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users (id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id INTEGER,
    metadata JSONB,
    created_at TIMESTAMP
    WITH
        TIME ZONE NOT NULL DEFAULT NOW ()
);

-- Index: find all actions by a specific user
CREATE
INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);

-- Index: find all changes to a specific record
CREATE
INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_type, entity_id);

-- Index: time-range queries on logs
CREATE
INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at);

-- GIN index on metadata for flexible JSONB queries
CREATE
INDEX IF NOT EXISTS idx_audit_logs_metadata ON audit_logs USING GIN (metadata);

COMMENT ON
TABLE audit_logs IS 'Append-only log of significant system actions';

COMMENT ON COLUMN audit_logs.action IS 'e.g. USER_REGISTERED, APPLICATION_SUBMITTED, STATUS_CHANGED';

COMMENT ON COLUMN audit_logs.entity_type IS 'e.g. user, application, drive';

COMMENT ON COLUMN audit_logs.metadata IS 'Arbitrary JSONB context: before/after values, reasons, etc.';