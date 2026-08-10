# Database Design

## Entities and Relationships

### Entity Overview

| Table | Purpose |
|-------|---------|
| users | All system users (student, tpo, admin) |
| student_profiles | Academic data for students — 1-to-1 with users |
| companies | Companies that participate in placement drives |
| placement_drives | Individual drives linked to a company |
| drive_branches | Which branches are eligible per drive (separate table = 1NF) |
| applications | A student's application to a drive |
| application_rounds | Individual recruitment rounds per application |
| audit_logs | Immutable record of important system actions |

### Relationship Summary

- `users` 1:1 `student_profiles` — one student has one academic profile
- `companies` 1:N `placement_drives` — one company can run many drives
- `placement_drives` 1:N `drive_branches` — a drive can allow many branches
- `users (student)` N:M `placement_drives` through `applications`
- `applications` 1:N `application_rounds` — each application has multiple rounds

### Why separate drive_branches?

If we stored branches as a comma-separated string in `placement_drives`, we could not:
- Index on branch for fast lookup
- Enforce referential integrity
- Query "all CSE students eligible for this drive" efficiently

A separate `drive_branches` table puts us in **First Normal Form (1NF)**.

### Primary Keys

All tables use `id SERIAL PRIMARY KEY` (auto-incrementing integer) except:
- `drive_branches` uses a composite PK `(drive_id, branch)` — a branch can appear only once per drive

### Foreign Keys and Cascade Behavior

| FK | References | On Delete |
|----|-----------|-----------|
| student_profiles.user_id | users.id | CASCADE — deleting a user removes their profile |
| placement_drives.company_id | companies.id | RESTRICT — cannot delete a company with active drives |
| drive_branches.drive_id | placement_drives.id | CASCADE — deleting a drive removes its branch rules |
| applications.student_id | users.id | CASCADE |
| applications.drive_id | placement_drives.id | CASCADE |
| application_rounds.application_id | applications.id | CASCADE |
| audit_logs.user_id | users.id | SET NULL — logs survive user deletion |

### Unique Constraints

| Table | Constraint | Reason |
|-------|-----------|--------|
| users | email | No two accounts with the same email |
| student_profiles | user_id | One profile per user |
| student_profiles | roll_number | Each student has a unique roll number |
| applications | (student_id, drive_id) | Prevents duplicate applications at DB level |

### Indexes

| Table | Index column(s) | Reason |
|-------|----------------|--------|
| users | email | Fast login lookup |
| applications | student_id | Student's application list |
| applications | drive_id | Drive's applicant list |
| application_rounds | application_id | Round lookup per application |
| audit_logs | user_id | Filter logs by user |
| audit_logs | entity_type, entity_id | Filter logs by affected record |

### Application Status State Machine

Valid transitions only:

```
APPLIED -> APTITUDE
APTITUDE -> TECHNICAL
TECHNICAL -> HR
HR -> SELECTED
HR -> REJECTED
APTITUDE -> REJECTED
TECHNICAL -> REJECTED
APPLIED -> REJECTED
```

No other transitions are allowed. Enforced in the service layer, not just the DB.

---

## ER Diagram (Mermaid)

```mermaid
erDiagram
    users {
        int id PK
        varchar name
        varchar email UK
        varchar password_hash
        varchar role
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    student_profiles {
        int id PK
        int user_id FK UK
        varchar roll_number UK
        varchar branch
        decimal cgpa
        int active_backlogs
        int graduation_year
        varchar resume_url
        timestamp created_at
        timestamp updated_at
    }

    companies {
        int id PK
        varchar name
        varchar website
        text description
        timestamp created_at
        timestamp updated_at
    }

    placement_drives {
        int id PK
        int company_id FK
        varchar job_role
        text job_description
        decimal package_lpa
        varchar location
        decimal minimum_cgpa
        int maximum_backlogs
        int graduation_year
        timestamp application_deadline
        timestamp created_at
        timestamp updated_at
    }

    drive_branches {
        int drive_id FK
        varchar branch
    }

    applications {
        int id PK
        int student_id FK
        int drive_id FK
        varchar status
        timestamp applied_at
        timestamp updated_at
    }

    application_rounds {
        int id PK
        int application_id FK
        varchar round_name
        varchar status
        int round_order
        timestamp updated_at
    }

    audit_logs {
        int id PK
        int user_id FK
        varchar action
        varchar entity_type
        int entity_id
        jsonb metadata
        timestamp created_at
    }

    users ||--o| student_profiles : "has profile"
    companies ||--o{ placement_drives : "runs"
    placement_drives ||--o{ drive_branches : "allows branches"
    users ||--o{ applications : "submits"
    placement_drives ||--o{ applications : "receives"
    applications ||--o{ application_rounds : "has rounds"
    users ||--o{ audit_logs : "generates"
```

---

## Normalization Decisions

- **1NF**: No repeating groups. `drive_branches` stores one branch per row.
- **2NF**: All non-key attributes depend on the entire primary key. `application_rounds.round_name` depends on the round itself, not on student or drive separately.
- **3NF**: No transitive dependencies. Company name is not stored in `placement_drives` — only `company_id` (a FK). To get the name you join `companies`.

---

## Migration Strategy

Migrations live in `backend/migrations/` and are numbered:

```
001_create_users.sql
002_create_student_profiles.sql
003_create_companies.sql
004_create_placement_drives.sql
005_create_drive_branches.sql
006_create_applications.sql
007_create_application_rounds.sql
008_create_audit_logs.sql
```

A `migrate.js` script runs them in order and tracks which have been applied in a `schema_migrations` table.
