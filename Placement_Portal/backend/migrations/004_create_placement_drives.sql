-- Migration 004: Create placement_drives table
-- Each drive belongs to one company (company_id FK).
-- RESTRICT on company delete: you cannot delete a company that has drives.
-- package_lpa stored as NUMERIC(6,2) e.g. "12.50" = 12.5 LPA.
-- minimum_cgpa and maximum_backlogs define the core eligibility floor.
-- graduation_year and application_deadline are also eligibility factors.

CREATE TABLE IF NOT EXISTS placement_drives (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    job_role VARCHAR(200) NOT NULL,
    job_description TEXT,
    package_lpa NUMERIC(6, 2) CHECK (package_lpa > 0),
    location VARCHAR(200),
    minimum_cgpa NUMERIC(4, 2) NOT NULL DEFAULT 0.00 CHECK (
        minimum_cgpa >= 0.00
        AND minimum_cgpa <= 10.00
    ),
    maximum_backlogs INTEGER NOT NULL DEFAULT 0 CHECK (maximum_backlogs >= 0),
    graduation_year INTEGER NOT NULL CHECK (
        graduation_year >= 2000
        AND graduation_year <= 2100
    ),
    application_deadline TIMESTAMP
    WITH
        TIME ZONE NOT NULL,
        created_at TIMESTAMP
    WITH
        TIME ZONE NOT NULL DEFAULT NOW (),
        updated_at TIMESTAMP
    WITH
        TIME ZONE NOT NULL DEFAULT NOW (),
        CONSTRAINT fk_placement_drives_company FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE RESTRICT
);

-- Index for filtering drives by company
CREATE
INDEX IF NOT EXISTS idx_placement_drives_company_id ON placement_drives (company_id);

-- Index for filtering drives by deadline (upcoming drives query)
CREATE
INDEX IF NOT EXISTS idx_placement_drives_deadline ON placement_drives (application_deadline);

-- Index for eligibility filtering by graduation year
CREATE
INDEX IF NOT EXISTS idx_placement_drives_grad_year ON placement_drives (graduation_year);

COMMENT ON
TABLE placement_drives IS 'Individual placement drives run by companies';

COMMENT ON COLUMN placement_drives.package_lpa IS 'Offered salary in Lakhs Per Annum';

COMMENT ON COLUMN placement_drives.minimum_cgpa IS 'Students below this CGPA are ineligible';

COMMENT ON COLUMN placement_drives.maximum_backlogs IS 'Students with more backlogs than this are ineligible';

COMMENT ON COLUMN placement_drives.application_deadline IS 'Applications are not accepted after this time';