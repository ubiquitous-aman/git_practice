-- Migration 006: Create applications table
-- Records a student's application to a specific drive.
-- UNIQUE (student_id, drive_id) is the DB-level duplicate prevention.
-- status is an enum-like VARCHAR with a CHECK constraint.
-- Valid statuses: APPLIED, APTITUDE, TECHNICAL, HR, SELECTED, REJECTED


CREATE TABLE IF NOT EXISTS applications (
  id         SERIAL PRIMARY KEY,
  student_id INTEGER  NOT NULL,
  drive_id   INTEGER  NOT NULL,
  status     VARCHAR(20) NOT NULL DEFAULT 'APPLIED'
               CHECK (status IN (
                 'APPLIED', 'APTITUDE', 'TECHNICAL', 'HR', 'SELECTED', 'REJECTED'
               )),
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_applications_student
    FOREIGN KEY (student_id) REFERENCES users (id)
    ON DELETE CASCADE,

  CONSTRAINT fk_applications_drive
    FOREIGN KEY (drive_id) REFERENCES placement_drives (id)
    ON DELETE CASCADE,

-- THE critical constraint: one application per student per drive
CONSTRAINT uq_applications_student_drive
    UNIQUE (student_id, drive_id)
);

-- Index for "get all applications by this student"
CREATE
INDEX IF NOT EXISTS idx_applications_student_id ON applications (student_id);

-- Index for "get all applicants for this drive"
CREATE
INDEX IF NOT EXISTS idx_applications_drive_id ON applications (drive_id);

-- Index for filtering by status (e.g., all SELECTED applications)
CREATE
INDEX IF NOT EXISTS idx_applications_status ON applications (status);

COMMENT ON
TABLE applications IS 'Student applications to placement drives';

COMMENT ON COLUMN applications.status IS 'Current stage: APPLIED | APTITUDE | TECHNICAL | HR | SELECTED | REJECTED';