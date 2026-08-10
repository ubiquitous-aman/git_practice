-- Migration 002: Create student_profiles table
-- One student_profile per user (enforced by UNIQUE on user_id).
-- CGPA stored as NUMERIC(4,2) so "8.75" is stored precisely — no floating-point drift.
-- active_backlogs cannot be negative (CHECK constraint).


CREATE TABLE IF NOT EXISTS student_profiles (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER       NOT NULL,
  roll_number     VARCHAR(50)   NOT NULL,
  branch          VARCHAR(100)  NOT NULL,
  cgpa            NUMERIC(4, 2) NOT NULL
                    CHECK (cgpa >= 0.00 AND cgpa <= 10.00),
  active_backlogs INTEGER       NOT NULL DEFAULT 0
                    CHECK (active_backlogs >= 0),
  graduation_year INTEGER       NOT NULL
                    CHECK (graduation_year >= 2000 AND graduation_year <= 2100),
  resume_url      VARCHAR(500),
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_student_profiles_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE,

-- Ensures one profile per user
CONSTRAINT uq_student_profiles_user_id UNIQUE (user_id),

-- Ensures no two students share a roll number
CONSTRAINT uq_student_profiles_roll_number
    UNIQUE (roll_number)
);

-- Index for fast user-to-profile lookup
CREATE
INDEX IF NOT EXISTS idx_student_profiles_user_id ON student_profiles (user_id);

-- Index to filter by branch during eligibility checks
CREATE
INDEX IF NOT EXISTS idx_student_profiles_branch ON student_profiles (branch);

COMMENT ON
TABLE student_profiles IS 'Academic profile for users with role=student';

COMMENT ON COLUMN student_profiles.cgpa IS 'On a 10-point scale; stored as NUMERIC(4,2) for precision';

COMMENT ON COLUMN student_profiles.active_backlogs IS 'Current number of active backlogs; cannot be negative';