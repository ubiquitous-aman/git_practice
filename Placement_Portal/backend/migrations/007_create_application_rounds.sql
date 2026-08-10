-- Migration 007: Create application_rounds table
-- Tracks each recruitment round for an application.
-- round_order ensures rounds are displayed in the correct sequence.
-- round_name examples: Aptitude Test, Technical Interview, HR Interview
-- status per round: PENDING, PASSED, FAILED


CREATE TABLE IF NOT EXISTS application_rounds (
  id             SERIAL PRIMARY KEY,
  application_id INTEGER      NOT NULL,
  round_name     VARCHAR(100) NOT NULL,
  status         VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                   CHECK (status IN ('PENDING', 'PASSED', 'FAILED')),
  round_order    INTEGER      NOT NULL CHECK (round_order > 0),
  notes          TEXT,
  updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_application_rounds_application
    FOREIGN KEY (application_id) REFERENCES applications (id)
    ON DELETE CASCADE,

-- Ensures round order is unique per application (no two rounds can be round 1)
CONSTRAINT uq_application_rounds_order
    UNIQUE (application_id, round_order)
);

-- Index for fetching all rounds for an application
CREATE
INDEX IF NOT EXISTS idx_application_rounds_application_id ON application_rounds (application_id);

COMMENT ON
TABLE application_rounds IS 'Individual recruitment rounds within an application process';

COMMENT ON COLUMN application_rounds.round_order IS 'Ordering of rounds (1 = first round)';

COMMENT ON COLUMN application_rounds.notes IS 'Optional TPO notes about the candidate in this round';