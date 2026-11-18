# Workshop House

A full-stack, accessible web application for running short intensive courses and technical workshops.  
Built for the **Advanced Web Programming (SFWE475)** course project.

---

## 1. Stack & Architectural Principles

- **Runtime & Language**: Node.js 20+ with TypeScript in strict mode (`strict: true`, `noUncheckedIndexedAccess: true`), native ESM.
- **Web Framework**: Express 5 with thin routing and business rules strictly encapsulated within `src/services/`.
- **Database**: PostgreSQL 16+ via `pg` with plain parameterized SQL queries. **No ORM** – explicit transactions and row-level locks (`SELECT ... FOR UPDATE`).
- **Validation**: Server-side request validation using Zod (one schema per request type).
- **Templating**: Server-rendered HTML using Nunjucks with semantic HTML5 landmarks and accessible components.
- **Sessions & Auth**: Cookie-based sessions using `express-session` backed by PostgreSQL (`connect-pg-simple`), HTTP-only, SameSite=Lax, and Argon2 password hashing.
- **Accessibility**: Built to conform strictly with **WCAG 2.2 AA** standards from the foundation.
- **Testing**: Automated testing with Vitest + Supertest, and accessibility auditing with Playwright + `@axe-core/playwright`.

---

## 2. Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: `v20.0.0` or higher (verified on Node.js v24+)
- **npm**: `v10.0.0` or higher
- **Docker**: For running PostgreSQL via Docker Compose (or an existing PostgreSQL instance)

---

## 3. Quick Start & Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy the provided `.env.example` file to create `.env`:
```bash
cp .env.example .env
```
*(On Windows PowerShell: `Copy-Item .env.example .env`)*

The default configuration in `.env` connects to the Docker Compose PostgreSQL database on port `5435`:
```env
PORT=3000
NODE_ENV=development
SESSION_SECRET=workshop-house-session-secret-change-in-production-123456
DATABASE_URL=postgresql://postgres:postgrespassword@127.0.0.1:5435/workshop_house
```

### Step 3: Start the PostgreSQL Database
Start the database container in the background:
```bash
npm run db:up
```

### Step 4: Run Migrations
Apply the initial SQL database schema:
```bash
npm run migrate
```

### Step 5: Seed Demo Data
Populate the database with courses, trainers, learners, and workshop sessions:
```bash
npm run seed
```
*(The seed script is idempotent and can be re-run at any time to reset to a clean demo state).*

### Step 6: Start the Development Server
```bash
npm run dev
```
Open your browser and navigate to: **`http://localhost:3000`**

---

## 4. Demo User Accounts

All demo accounts share the password: **`Password123!`**

| Role | Email Address | Description |
| :--- | :--- | :--- |
| **Coordinator** | `coordinator@workshophouse.test` | Full access to manage courses, sessions, and view platform dashboard. |
| **Trainer 1** | `alice.trainer@workshophouse.test` | Instructor for Course 1. Can manage attendance, check-in, announcements, and materials for assigned sessions. |
| **Trainer 2** | `bob.trainer@workshophouse.test` | Instructor for Course 2. |
| **Learner 1** | `charlie.learner@workshophouse.test` | Enrolled learner with active sessions, check-in codes, and course access. |
| **Learner 2** | `diana.learner@workshophouse.test` | Enrolled learner. |

---

## 5. Available Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm run dev` | `tsx watch src/server.ts` | Runs the development server with live reload. |
| `npm run build` | `tsc` | Compiles TypeScript under strict mode to `./dist`. |
| `npm start` | `node dist/server.js` | Runs the compiled production server. |
| `npm test` | `vitest run` | Runs all 56 unit and integration tests sequentially. |
| `npm run test:watch` | `vitest` | Runs tests in interactive watch mode. |
| `npm run test:a11y` | `playwright test tests/a11y` | Runs automated axe-core accessibility and keyboard walkthrough tests. |
| `npm run migrate` | `tsx src/db/migrate.ts` | Executes pending SQL migration files. |
| `npm run seed` | `tsx src/db/seed.ts` | Resets and seeds demo accounts, sessions, and enrollments. |
| `npm run db:up` | `docker compose up -d` | Starts the Docker PostgreSQL container. |

---

## 6. Core Business Rules Implemented

- **BR-01 / NFR-03 (Row-Level Locking Concurrency)**: Workshop enrollment executes inside an atomic SQL transaction with an explicit `SELECT ... FROM sessions WHERE id=$1 FOR UPDATE` lock. Simultaneous requests for the last available seat guarantee exactly one success and one refusal (`"X of X seats taken"`).
- **Dynamic Seats**: Remaining seats are always computed on query (`capacity - COUNT(active enrollments)`), never stored as a database field.
- **Seat Reclaim & Re-enrollment**: Cancelling an enrollment frees the seat immediately. Re-enrolling reactivates the previous row (`status='active'`, `cancelled_at=NULL`) without creating duplicate records.
- **Capacity Floor**: Coordinators cannot reduce session capacity below the current count of active enrollments.
- **Trainer Isolation**: Trainers may only modify resources, view attendance, conduct check-ins, and publish announcements for their own assigned sessions. Cross-session operations return `403 Forbidden`.
- **Resource Protection**: Course material links are only revealed to actively enrolled learners, the session's trainer, and coordinators.
- **Check-in Window & Code Integrity**: Code check-in is restricted to 30 minutes before session start until session end. Cancelled enrollments, invalid codes, or codes from other sessions are rejected with clear error feedback. Scanning the same code twice produces no duplicate record.

---

## 7. Accessibility (WCAG 2.2 AA) Features

- **Semantic Landmarks**: Semantic header, navigation, main content, and footer landmarks on every page.
- **Skip Link**: Accessible `.skip-link` at the top of the DOM to jump straight to `#main-content`.
- **Error Summary & ARIA**: Form validation errors trigger an accessible error summary banner (`role="alert"`, `tabindex="-1"`) with anchored links to invalid inputs connected via `aria-describedby` and `aria-invalid`.
- **Live Regions**: Dynamic flash messages render inside `role="status"` and `role="alert"` regions.
- **Contrast & Zoom**: Minimum 4.5:1 contrast ratio across normal text; touch targets $\ge 44 \times 44\text{ px}$; scales smoothly up to 200% zoom.
- **Customizable Preferences**: Users can toggle 100%, 125%, 150% font scaling, High Contrast mode, Reduced Motion, and Keyboard Shortcuts via `/preferences`.
- **Keyboard Shortcuts (WCAG 2.1.4)**: Modifiers (`Alt + Shift`) ensure shortcuts do not conflict with screen readers or speech typing:
  - `Alt + Shift + S`: Browse Workshops
  - `Alt + Shift + M`: My Sessions
  - `Alt + Shift + D`: Dashboard
  - `Alt + Shift + A`: Trainer Sessions / Attendance
  - `Alt + Shift + K`: Focus Check-in Code Field
  - `Alt + Shift + H`: Open Keyboard Help Modal
  - `Esc`: Close open modal dialogs

---

## 8. License

Course Project &bull; Advanced Web Programming (SFWE475). All rights reserved.
