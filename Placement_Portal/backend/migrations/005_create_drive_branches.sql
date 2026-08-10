-- Migration 005: Create drive_branches table
-- Stores which branches are eligible for each drive.
-- Composite PK (drive_id, branch) ensures a branch can only appear once per drive.
-- This is a classic many-to-many junction pattern: one drive can have many eligible branches.

CREATE TABLE IF NOT EXISTS drive_branches (
  drive_id  INTEGER     NOT NULL,
  branch    VARCHAR(100) NOT NULL,

-- Composite primary key: same branch cannot be added twice to same drive
PRIMARY KEY (drive_id, branch),

  CONSTRAINT fk_drive_branches_drive
    FOREIGN KEY (drive_id) REFERENCES placement_drives (id)
    ON DELETE CASCADE
);

-- Index to quickly find all drives open to a given branch
CREATE
INDEX IF NOT EXISTS idx_drive_branches_branch ON drive_branches (branch);

COMMENT ON
TABLE drive_branches IS 'Eligible branches for each placement drive (1NF decomposition)';