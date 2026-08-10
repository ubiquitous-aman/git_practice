# Placement Portal — Phase Roadmap

## Current Phase: Phase 1 ✅

### FSD Experiments Covered

| Experiment | Concept | Where Applied |
|-----------|---------|---------------|
| 1 | Semantic HTML | `index.html`, `register.html`, `student.html`, `tpo.html` — `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<form>`, `<table>`, ARIA roles |
| 2 | CSS + Tailwind | `css/styles.css` (external CSS, design tokens, responsive), Tailwind CDN utility classes on all pages |
| 3 | JavaScript + AJAX | `js/api.js` (Fetch API), `js/student.js`, `js/tpo.js` — async/await AJAX data loading |
| 4 | DOM Manipulation | Dynamic drive cards, application table rows, badge updates, modal toggling via JS |
| 5 | jQuery + JSON + ES6 | `js/ui.js` (jQuery toasts, modals), `js/tpo.js` (jQuery AJAX for applicants), ES6 throughout (const/let, arrows, template literals, destructuring) |

### DevOps Modules Covered

| Module | Concept | How Applied |
|--------|---------|-------------|
| 1 | DevOps Introduction | DevOps mindset adopted: automated tests, CI pipeline, IaC concepts documented |
| 2 | DevOps Lifecycle | Build → Test → Validate cycle defined, Jenkinsfile stages map to full lifecycle |
| 3 | Version Control / Git | Feature branch workflow documented, meaningful commit conventions established |
| 4 | CI / Jenkins | `Jenkinsfile` with 6 stages: Checkout, Install, Lint, Test, Validate Frontend, Security Audit |

---

## Phase 2 — Planned

### FSD Experiments (Next 5)

| Experiment | Concept | Plan |
|-----------|---------|------|
| 6 | React functional components | Migrate frontend from HTML/JS to React components |
| 7 | React Router | SPA navigation replacing multi-page HTML |
| 8 | Node.js | Extend backend with file system operations |
| 9 | Express.js | Already in place — extend with additional middleware |
| 10 | MongoDB + Mongoose | Add MongoDB alongside/replacing PostgreSQL for document storage |

### DevOps Modules (Next 2)

| Module | Concept | Plan |
|--------|---------|------|
| 5 | CD + Docker | Containerise backend and frontend, add Docker Compose |
| 6 | Kubernetes + Monitoring | Kubernetes manifests, Prometheus metrics, Grafana dashboards |

---

## DevOps Lifecycle — Current State

```
PLAN     ── PHASE-ROADMAP.md, README.md
CODE     ── Feature branches (feature/*, fix/*, refactor/*)
BUILD    ── npm ci (backend), static serve (frontend)
TEST     ── Jest 37 integration tests (npm test)
RELEASE  ── Manual (future: automated via Jenkins CD)
DEPLOY   ── Manual (future: Docker + Kubernetes)
OPERATE  ── npm run dev (local), npm start (production)
MONITOR  ── prom-client installed, metrics endpoint planned
IMPROVE  ── Phase-by-phase incremental enhancement
```

---

## Git Branch Strategy

```
main          ── Stable, production-ready commits
develop       ── Integration branch (merge feature/* here first)
feature/*     ── New features
fix/*         ── Bug fixes
refactor/*    ── Code quality improvements
```
