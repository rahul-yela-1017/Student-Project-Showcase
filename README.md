# Student Project Showcase — Malla Reddy Vishwavidyapeeth

A full-stack platform where students of **B.Tech CSE (AI & ML), Section G, Batch 2025-2029**
publish, discover, and manage their academic projects — with GitHub repository and live-demo
links, technology tagging, student profiles, and an administrator approval workflow.

## Data layer (MongoDB only)

The application talks to your **existing** MongoDB directly:

- Database: `student_project_showcase` · Collections: `students`, `projects`
- The 87 existing student records are used as-is. Before writing auth logic the
  collection is inspected with `node scripts/inspect-db.mjs` (read-only), and the
  reader normalizes field aliases (`passwordHash`/`password`, `rollNumber`/`roll_number`)
  so it adapts to the real records without modifying them.
- **Initial password** for every pre-registered student is their **uppercase roll number**;
  verification supports bcrypt (primary) with md5/sha256 fallback for legacy hashes.
- First login forces a password change (`mustChangePassword` → `false` + new bcrypt hash).
- `isEmailVerified` is displayed but never asserted unless actually `true` in the record.

### MongoDB connection

- Configure `MONGODB_URI` in `.env.local` to connect to your Atlas cluster.
- MongoDB is the only data source. If the URI is missing or the cluster is
  unreachable, requests report a database error instead of returning sample
  or PostgreSQL replica records. The app retries the connection every 60s.

> If the MongoDB status banner reports a connection problem, check the Atlas
> URI, database user's credentials, and **Security → Network Access**. The
> banner shows the server's public IP to allowlist. The app retries every 60
> seconds; it never switches to demo data.

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local   # set MONGODB_URI + a strong JWT_SECRET
#    (Use .env.local so tooling never overwrites it; Next.js gives it
#     precedence over .env. It is git-ignored.)

# 3. (Optional, dev only) inspect the existing database — READ ONLY
MONGODB_URI="..." node scripts/inspect-db.mjs

# 3b. (Optional) Full end-to-end test of the MongoDB data path —
#     spins up an in-memory MongoDB + a second app instance and verifies
#     login (bcrypt + legacy hashes), CRUD, authorization, and admin flows.
node scripts/mongo-e2e.mjs

# 4. (Only if the students collection is EMPTY) seed the 87 students.
#    With your existing records this is a safe no-op that exits immediately.
MONGODB_URI="..." node scripts/seed-students.mjs

# 5. (Optional) Explicitly configure an administrator — never automatic
MONGODB_URI="..." node scripts/create-admin.mjs 25MVCSMR0545

# 6. Run
npm run dev                     # development
npm run build && npm start      # production
```

**Logging in (pre-registered students)**

- Email: lowercase roll number + `@mallareddyuniversity.ac.in`
  (e.g. `25mvcsmr0545@mallareddyuniversity.ac.in`)
- Initial password: the **uppercase roll number** (e.g. `25MVCSMR0545`)
- First login forces a password change (min 8 chars, upper, lower, number).

Project collection indexes are created idempotently on first use
(`owner`, `status`, `category`, `createdAt`; unique `students.rollNumber` and
`students.email` only if not already present) — existing indexes are never duplicated.

## REST API

All responses use `{ "success": true, "data": … }` or `{ "success": false, "error": "…" }`.

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| POST | `/api/auth/login` | — | Login (rate-limited, 10 attempts / 15 min per email). Sets HTTP-only session cookie. |
| POST | `/api/auth/logout` | session | Clears the session cookie. |
| GET | `/api/auth/me` | session | Current student (never includes the password hash). |
| POST | `/api/auth/change-password` | session | Verifies current password, updates hash, sets `mustChangePassword=false`. |
| GET | `/api/projects` | public | Published projects only. `q`, `category`, `tech`, `student`, `sort` (newest/oldest/az/za), `page`, `limit`. |
| GET | `/api/projects/mine` | session | Own projects, all statuses. |
| POST | `/api/projects` | session | Create project (owner is always the authenticated student). |
| GET | `/api/projects/:id` | public* | Details (*unpublished only visible to owner/admin). |
| PUT | `/api/projects/:id` | session | Update — ownership (or admin) enforced server-side. |
| DELETE | `/api/projects/:id` | session | Delete — owner or admin only. |
| GET | `/api/techs` | public | Distinct technologies for the filter UI. |
| GET | `/api/students?q=&page=` | public | Student directory (name/roll number search). |
| GET | `/api/students/:id` | public | Public profile (roll number or id; no private fields). |
| GET | `/api/students/:id/projects` | public | Student's published projects. |
| PUT | `/api/students/me` | session | Update permitted fields (bio). Roll number / email / role are immutable. |
| GET | `/api/dashboard/stats` | session | Real per-student counts by status. |
| GET | `/api/admin/projects` | admin | All submissions with filters. |
| PATCH | `/api/admin/projects/:id/status` | admin | Set status: `draft` / `pending` / `published` / `rejected`. |
| GET | `/api/admin/students` | admin | Full roster (no password fields). |

Project status model: `draft` → `pending` → `published` / `rejected`.
Unauthenticated users only ever see `published` projects.

## Security implementation

- **Passwords**: bcrypt (cost 10); plaintext is never stored or logged.
- **Sessions**: JWT signed with `JWT_SECRET`, stored in an **HTTP-only, SameSite=Lax cookie**;
  `Secure` flag automatic when `COOKIE_SECURE=true`. Role is always re-read from the
  database per request — never trusted from the token or the frontend.
- **CSRF**: every state-changing request must include the `x-requested-with` header
  (set automatically by the app's API client); SameSite=Lax provides the second layer.
- **Rate limiting** on `/api/auth/login` (10 attempts / 15 min / email → HTTP 429).
- **Authorization**: ownership checks on every update/delete; admin-only routes;
  `mustChangePassword` enforced on all protected pages.
- **Validation**: zod request validation on every write endpoint; external URLs must be
  public http(s); open links use `rel="noopener noreferrer nofollow"`.
- **Errors**: centralized handler — no stack traces or database details leak to clients.
- **Secrets**: `MONGODB_URI` and `JWT_SECRET` exist only in server-side environment;
  nothing sensitive is exposed to browser bundles. `.env` is git-ignored.

## Project structure

```
├── src/
│   ├── app/                  # Pages + API route handlers
│   │   ├── api/              # /api/auth, /api/projects, /api/students, /api/admin, /api/dashboard
│   │   ├── explore/          # Project discovery (search/filter/sort/pagination)
│   │   ├── projects/         # Details, new, edit
│   │   ├── dashboard/        # Student dashboard
│   │   ├── students/         # Directory + public profiles
│   │   ├── admin/            # Admin panel
│   │   ├── login/  change-password/  profile/
│   │   ├── layout.tsx  page.tsx  globals.css  not-found.tsx
│   ├── components/           # Navbar, Footer, cards, forms, dialogs, skeletons…
│   ├── context/              # AuthContext
│   ├── lib/
│   │   ├── data/             # MongoDB data layer and connection status
│   │   ├── auth.ts           # JWT / HTTP-only cookie session
│   │   ├── api-helpers.ts    # CSRF, rate limit, error handling, auth guards
│   │   ├── validators.ts     # zod schemas
│   │   ├── password.ts       # bcrypt + legacy hash fallbacks
│   │   └── constants.ts
│   └── db/                   # Legacy PostgreSQL adapter, not selected by the app
├── scripts/
│   ├── inspect-db.mjs        # READ-ONLY inspection of the existing MongoDB
│   ├── seed-students.mjs     # 87 students (skip-if-exists — never touches real data)
│   └── create-admin.mjs      # explicit admin configuration
├── .env.example  next.config.ts
```

## Environment variables

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `MONGODB_URI` | yes | MongoDB Atlas connection string (server-side only). |
| `JWT_SECRET` | yes (prod) | ≥32-char random secret for session tokens. |
| `COOKIE_SECURE` | no | `true` to mark the session cookie `Secure` over HTTPS. |
