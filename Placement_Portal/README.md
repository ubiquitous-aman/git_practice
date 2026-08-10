# College Placement Management Portal

A production-style, full-stack web application for managing college campus placements.

---

## Features

- JWT-based authentication with three roles: **Student**, **TPO Officer**, **Admin**
- Student academic profile management with real-time drive eligibility evaluation
- Recruitment company registration and management
- Placement drive creation with branch, CGPA, and backlog eligibility rules
- Student application submission with duplicate prevention
- Recruitment workflow state machine (APPLIED → APTITUDE → TECHNICAL → HR → SELECTED/REJECTED)
- Audit logging for all status changes

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Tailwind CSS, Vanilla JavaScript (ES6), jQuery |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Authentication | JWT, bcrypt |
| CI | Jenkins |

> **Future phases** will introduce React, MongoDB/Mongoose, Docker, and Kubernetes.

---

## Project Structure

```
Placement_Portal/
├── backend/                  Node.js + Express REST API
│   ├── migrations/           PostgreSQL schema migration files
│   ├── scripts/              migrate.js, seed.js
│   ├── src/
│   │   ├── config/           Database connection
│   │   ├── controllers/      HTTP request handlers
│   │   ├── middleware/        Auth, error handling
│   │   ├── repositories/     Database queries (Data Access Layer)
│   │   ├── routes/           API route definitions
│   │   ├── services/         Business logic
│   │   ├── utils/            JWT, password, state machine helpers
│   │   └── validators/       Input validation rules
│   └── tests/                Jest integration tests
│
├── frontend/                 Plain HTML + CSS + JS frontend (Phase 1)
│   ├── css/styles.css        External CSS design system
│   ├── js/
│   │   ├── api.js            Fetch + jQuery AJAX API client
│   │   ├── auth.js           Authentication logic
│   │   ├── ui.js             Shared UI utilities (jQuery)
│   │   ├── student.js        Student dashboard logic
│   │   └── tpo.js            TPO dashboard logic
│   ├── index.html            Login page
│   ├── register.html         Student registration page
│   ├── student.html          Student dashboard
│   └── tpo.html              TPO dashboard
│
├── frontend-react/           React + Vite frontend (reserved for Phase 2)
├── docs/                     Architecture documentation
├── Jenkinsfile               CI pipeline definition
└── PHASE-ROADMAP.md          Phase planning document
```

---

## Installation & Setup

### Prerequisites

- Node.js v18 or higher
- PostgreSQL v14 or higher
- Git

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database connection and JWT secret
npm run migrate
npm run seed
npm run dev
```

Backend runs at `http://localhost:5000`

### Frontend

The frontend is plain HTML — no build step required.

Open `frontend/index.html` directly in your browser, or serve it with any static server:

```bash
# Option 1: Python (no install required)
cd frontend
python3 -m http.server 3000

# Option 2: Node serve
npx serve frontend
```

Frontend available at `http://localhost:3000` (or whichever port you use).

---

## Environment Variables

Configure `backend/.env`:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/placement_portal
TEST_DATABASE_URL=postgresql://postgres:password@localhost:5432/placement_portal_test
JWT_SECRET=your_secure_jwt_secret_here
CORS_ORIGIN=http://localhost:3000
```

> Never commit `.env` to version control. Use `.env.example` as the template.

---

## Running Tests

```bash
cd backend
npm test
```

The test suite runs 37 integration tests across:
- Authentication (login, register, JWT validation)
- Student profiles (UPSERT, validation)
- Company management (CRUD, duplicate prevention)
- Placement drives (eligibility engine)
- Applications (state machine, audit logs)

---

## Git Workflow

```
main              Production-ready code
develop           Integration branch
feature/*         New features (e.g. feature/student-dashboard)
fix/*             Bug fixes
refactor/*        Code refactoring
```

### Commit Convention

```
feat(scope): short description
fix(scope): short description
refactor(scope): short description
docs(scope): short description
test(scope): short description
```

Examples:
```bash
git commit -m "feat(auth): add JWT refresh token support"
git commit -m "fix(api): handle 401 token expiry redirect"
git commit -m "docs(readme): update installation instructions"
```

---

## CI/CD

A `Jenkinsfile` is included at the project root.

Pipeline stages:
1. **Checkout** — Pull source from Git
2. **Install** — `npm ci` backend dependencies
3. **Lint** — ESLint static analysis
4. **Test** — Jest integration suite
5. **Validate Frontend** — Verify HTML/JS files are present
6. **Security Audit** — `npm audit`

> Credentials (DATABASE_URL, JWT_SECRET) are managed via Jenkins Credentials — never hardcoded.

---

## API Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register student |
| POST | `/api/auth/login` | Public | Login, receive JWT |
| GET | `/api/auth/me` | Auth | Get current user |
| GET/PUT | `/api/students/profile` | Student | Academic profile |
| GET/POST/PUT/DELETE | `/api/companies` | TPO/All | Company management |
| GET/POST/PUT/DELETE | `/api/drives` | TPO/All | Placement drives |
| GET | `/api/drives/:id/eligibility` | Auth | Check eligibility |
| POST | `/api/applications/drives/:id/apply` | Student | Submit application |
| GET | `/api/applications/me` | Student | My applications |
| PATCH | `/api/applications/:id/status` | TPO | Update status |
