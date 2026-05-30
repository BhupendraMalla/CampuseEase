# CampusEase

A full-stack **college / campus management system** — a single portal where
administrators, faculty, students and staff handle everything from user
management and course enrollment to attendance, internal marks, fees,
assignments, clubs, events, job vacancies and more.

- **Frontend:** Angular 17 (standalone components, Bootstrap 5, Highcharts, Socket.IO client)
- **Backend:** Node.js + Express 5, MongoDB (Mongoose), JWT auth, Socket.IO, Multer uploads
- **Realtime:** Socket.IO chat / notifications
- **Payments:** Khalti checkout integration for student fees

---

## Table of contents
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Test credentials](#test-credentials-seeded)
- [Seeding the database](#seeding-the-database)
- [Features by role](#features-by-role)
- [End-to-end testing & demo video](#end-to-end-testing--demo-video)
- [Project structure](#project-structure)
- [Environment variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

---

## Architecture

```
Browser (Angular SPA :4200)  ──HTTP/JSON + JWT──►  Express API (:3200)  ──►  MongoDB (Atlas)
            │                                            │
            └──────────────  Socket.IO  ────────────────┘   (chat / live updates)
```

The Angular app talks to the API at `http://localhost:3200` (see
`frontend/src/environments/environment.development.ts`). Auth is stateless: on
login the API returns a JWT that the frontend stores in `localStorage`
(`userToken`) and attaches to every request via an HTTP interceptor.

---

## Prerequisites

- **Node.js** ≥ 18 (tested on 20.x)
- **npm** ≥ 9
- A **MongoDB** database — either local (`mongodb://localhost:27017/campusease`)
  or MongoDB Atlas. The connection string lives in `backend/.env`.

> **Atlas note:** if you use Atlas, your current IP must be added to the
> cluster's **Network Access / IP whitelist**, otherwise the backend cannot
> connect (`Could not connect to any servers in your MongoDB Atlas cluster`).

---

## Quick start

Open two terminals.

**1 — Backend (port 3200)**
```bash
cd backend
npm install
npm run seed      # create test accounts + demo data (idempotent, safe)
npm run dev       # or: npm start
```

**2 — Frontend (port 4200)**
```bash
cd frontend
npm install
npm start         # ng serve  →  http://localhost:4200
```

Then open **http://localhost:4200** and log in with any account below.

---

## Test credentials (seeded)

`npm run seed` creates one ready-to-use, **pre-verified** account per primary role:

| Role            | Email                       | Password       |
|-----------------|-----------------------------|----------------|
| Admin           | `admin@campusease.com`      | `admin`        |
| Student         | `student@campusease.com`    | `student123`   |
| Faculty         | `faculty@campusease.com`    | `faculty123`   |
| Secretary       | `secretary@campusease.com`  | `secretary123` |
| Finance Officer | `finance@campusease.com`    | `finance123`   |

It also seeds:
- a **Department** — `academic` / *Computer Engineering* (HOD: Test Faculty)
- a **Semester enrollment** with key **`CSE-2024`** (semester 1, 3 subjects taught by `faculty@campusease.com`).
  As a student, go to **Semester Enroll → enter `CSE-2024` → Enroll Now** to load courses.

> Self-registration via `/signup` creates an account with `isVerified = false`.
> New users must be approved by an admin (User Management → verify) before they can log in.

---

## Seeding the database

```bash
cd backend && npm run seed
```

`backend/seed.js` is **idempotent and non-destructive** — it *upserts* the test
accounts and demo data by a stable key (email / department / enrollment key) and
**never drops the database**, so running it repeatedly is safe and your own data
is preserved.

---

## Features by role

**Admin** — User management (create/verify/delete users, all roles), fee
management, clubs, departments, class schedule, course-enrollment keys, course
list, attendance overview, results/routine, academic records, ID cards, events,
job vacancies, feedback, CV submissions, sponsorship/scholarship, notices.

**Faculty** — Profile, chat, my courses, take attendance (OTP / face / register),
class schedule, assignments, model questions, academic management, events,
feedback, internal valuations/marks, student work records, notices.

**Student** — Profile, chat, fee payment (Khalti), attendance (OTP / face),
semester enrollment, courses, class schedule, clubs, ID-card renewal,
assignments, model questions, sponsorship/scholarship, feedback, events,
notices, academic records.

**Secretary** — Profile, clubs, events, discussion/notices.

**Finance Officer** — Finance-scoped views (fees).

---

## End-to-end testing & demo video

A scripted Playwright walkthrough drives the **real running app** like a human:
logs in as every role, visits every sidebar feature (screenshotting each and
catching JS errors), performs real write actions (create department, enroll in a
semester, edit profile, submit feedback…), and **records the whole session to a
video**.

```bash
# backend (:3200) and frontend (:4200) must be running first
bash e2e/run.sh
```

Outputs land in `e2e/artifacts/`:
- `campusease-demo.webm` — full demo video of the session
- `screenshots/` — one screenshot per feature page, per role
- `report.md` / `report.json` — pass/fail table for every feature checked

> The runner borrows Playwright from the local Playwright-MCP install via
> `NODE_PATH` so nothing is added to the app's `package.json`. If Playwright
> isn't present, run `npx playwright install chromium` and set `PW_PATH`.

---

## Project structure

```
CampuseEase/
├── backend/                 # Express + MongoDB API
│   ├── index.js             # app entry, route wiring, Socket.IO
│   ├── db.js                # Mongoose connection
│   ├── seed.js              # idempotent test-data seeder
│   ├── socketServer.js      # realtime chat/notifications
│   ├── models/              # ~30 Mongoose models
│   ├── routes/              # ~30 feature route files
│   ├── middleware/          # JWT verify + role/permission checks
│   └── uploads/             # multer file uploads (served at /uploads)
├── frontend/                # Angular 17 SPA
│   └── src/app/
│       ├── pages/           # feature components (admin / teacher / shared)
│       ├── shared/dashboard # role-aware dashboard shell + sidebar
│       └── core/            # auth service, interceptor, guards
└── e2e/                     # Playwright end-to-end demo + smoke test
```

---

## Environment variables

`backend/.env`:

| Variable     | Description                                   |
|--------------|-----------------------------------------------|
| `MONGO_URI`  | MongoDB connection string (local or Atlas)    |
| `PORT`       | API port (default `3200`)                     |
| `SECRET_KEY` | JWT signing secret                            |
| `EMAIL_USER` / `EMAIL_PASS` | *(optional)* Gmail creds for OTP / password-reset emails |

> Email-dependent flows (signup OTP, password-reset mail, OTP attendance email)
> require `EMAIL_USER` / `EMAIL_PASS` to be set. They are optional for the core
> portal and the seeded demo accounts.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Could not connect to any servers in your MongoDB Atlas cluster` | Add your current IP to the Atlas Network-Access whitelist, or use a local Mongo URI. |
| Login says *"User is not verified"* | New self-signups need admin approval. Use a seeded account, or verify the user in **Admin → User Management**. |
| Frontend loads but API calls fail (CORS / network) | Make sure the backend is running on `:3200` (CORS is locked to `http://localhost:4200`). |
| Port already in use | Stop the process on `:3200`/`:4200` or change `PORT` / `ng serve --port`. |
