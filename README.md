# Restaurant Operations & Table Management SaaS

[![CI](https://github.com/yigitsarpavci/restaurant-floor-plan-saas/actions/workflows/ci.yml/badge.svg)](https://github.com/yigitsarpavci/restaurant-floor-plan-saas/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/badge/coverage-98%25%20security%20layer-brightgreen)](#testing)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A multi-tenant restaurant app: each restaurant designs its floor plan on a drag-and-drop canvas, guests request tables on a public booking page, and hosts run the evening from a live view with a pending-request queue, walk-ins, merged tables and no-show alerts. Next.js 16 server actions, Prisma and PostgreSQL.

---

## Quick Start

```bash
docker compose up --build
# http://localhost:3000, sign in as `admin` with the ADMIN_PASSWORD set in docker-compose.yml
```

---

## Screenshots

Captured from a production build with the seeded `demo` restaurant.

![Tour](docs/screenshots/tour.gif)

| | |
|---|---|
| ![Live operations: pending request, seated booth, table status](docs/screenshots/liveops.jpg) | ![Floor-plan designer (drag, drop, resize)](docs/screenshots/floorplan.jpg) |
| *Live operations: pending request, seated booth, table status* | *Floor-plan designer (drag, drop, resize)* |
| ![Platform admin console (tenants)](docs/screenshots/manage.jpg) |  |
| *Platform admin console (tenants)* |  |

---

## What It Does

- **Tenants.** A platform admin creates restaurants; each gets a slug, an owner login and its own floor plans and reservations. Every server action checks that the caller owns the tenant it touches (`lib/authz.ts`).
- **Floor-plan designer.** Tables (rectangle, circle, square, booth) are dragged and resized with `react-rnd`; positions and sizes are saved per table. Floor-plan state is held in a Zustand store while editing.
- **Public booking.** A guest picks a date, time and party size; tables are shown as available, partly available (free until the next booking) or booked, too-small tables are disabled, and the request lands in the owner's queue as `PENDING_APPROVAL`. Inputs are validated with Zod.
- **Live operations.** The host approves or rejects requests, seats walk-ins, merges several tables into one reservation (a many-to-many relation), clears tables, and gets alerts for no-shows and overstays.
- **Reservation modes.** `TIMED` bookings carry an end time; `UNTIMED` ones hold the table until it is cleared.

---

## Architecture

```mermaid
flowchart TB
    Guest["Guest<br/>/booking/tenantSlug"] --> MW
    Owner["Restaurant owner<br/>/liveops"] --> MW
    Admin["Platform admin<br/>/manage"] --> MW

    MW["Next.js middleware<br/>verifies the signed session cookie"] --> Pages["App Router pages<br/>Zustand + react-rnd canvas"]
    Pages --> Actions["Server Actions<br/>auth, tenant, floor-plan, live-ops, booking, alerts"]
    Actions --> Guards["lib/authz.ts<br/>admin / tenant ownership checks"]
    Guards --> Prisma["Prisma ORM"]
    Prisma --> PG[("PostgreSQL<br/>tenant-isolated rows")]
```

### Reservation lifecycle

```mermaid
stateDiagram-v2
    [*] --> PENDING_APPROVAL: guest submits a request
    [*] --> WALK_IN: host seats a walk-in
    PENDING_APPROVAL --> CONFIRMED: owner approves
    PENDING_APPROVAL --> [*]: owner rejects (request removed)
    CONFIRMED --> SEATED: guests arrive
    CONFIRMED --> NO_SHOW: grace period expires
    SEATED --> CLEARED: table cleared
    WALK_IN --> CLEARED: table cleared
    NO_SHOW --> [*]: table freed
    CLEARED --> [*]: table free for new bookings
```

---

## Design Decisions & Trade-offs

- **Server actions instead of a REST API.** Every mutation is a typed server action with its own authorization check, so there is no separate API to secure or version. The cost is that only this Next.js app can be a client.
- **Tenant isolation in application code.** Rows carry a `tenantId` and the guards in `lib/authz.ts` enforce ownership on every action. This is simple and fully unit-tested, but a forgotten guard would leak data; PostgreSQL row-level security would be a second line of defence.
- **Signed cookie sessions.** The role and tenant come from a `jose`-signed, HTTP-only cookie, never from a client-editable value, and need no session store.
- **Errors as values for login.** Production builds redact messages thrown from server actions, so `login` returns its error instead of throwing; the end-to-end test caught the generic message users were seeing before.
- **Accessible floor plan.** Bookable tables are keyboard-operable buttons labelled with name, capacity and availability, which also gives the end-to-end tests a stable target.

## Known Limitations

- **Availability is coarse.** A table is "booked" for a requested time if any reservation that day starts at or before it, and an untimed booking runs to the end of the day; `TIMED` end times are not yet used when checking availability.
- **No push updates.** The live view refreshes after actions and navigation; a second host's changes appear on the next refresh (SSE or WebSockets would fix this).
- **Times use the server's time zone,** so a restaurant in another zone than the server would see shifted slots.
- **No email or SMS** confirmations; the guest only sees the on-screen confirmation.

---

## Installation and Setup

### 1. Clone the repository
```bash
git clone https://github.com/yigitsarpavci/restaurant-floor-plan-saas.git
cd restaurant-floor-plan-saas
```

### 2. Install dependencies
```bash
npm install
```

### 3. Database Setup
Copy `.env.example` to `.env` and fill it in:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/seated"
SESSION_SECRET=""   # required in production (openssl rand -base64 32)
ADMIN_PASSWORD=""   # required in production; defaults to "admin" in development only
```

Then, push the database schema (and optionally seed a `demo` restaurant with 8 tables and sample reservations, owner password `demo1234`; the seed is idempotent):
```bash
npx prisma db push
npx prisma db seed
```

### Docker (optional)
```bash
docker compose up --build   # PostgreSQL + the production build on http://localhost:3000
```
Set real values for `SESSION_SECRET` and `ADMIN_PASSWORD` in `docker-compose.yml` before exposing it anywhere. CI verifies on every push that the image builds.

A prebuilt image is published to GitHub Container Registry:
```bash
docker pull ghcr.io/yigitsarpavci/restaurant-floor-plan-saas:latest
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

---

## Security Model

- **Signed sessions:** login issues an `httpOnly`, `SameSite=Lax` (and `Secure` in production) JWT cookie signed with `SESSION_SECRET` (`jose`, HS256). Roles and tenant IDs are never read from client-editable cookies.
- **Hashed passwords:** restaurant passwords are stored with bcrypt. Legacy plaintext rows are upgraded transparently on first successful login.
- **Authorization on every Server Action:** tenant management is admin-only; floor-plan, reservation and live-ops actions verify the caller owns the tenant (`lib/authz.ts`). Public guests can only create reservations.
- **Fail-fast configuration:** the app refuses to sign sessions in production without `SESSION_SECRET`, and the admin login is disabled without `ADMIN_PASSWORD`.

---

## Testing

```bash
npm test               # Vitest unit tests (21)
npm run test:coverage  # with a coverage gate on lib/ (98%; CI fails below 80%)
npm run build && npm run test:e2e   # Playwright, needs a seeded database
```

- **Unit (Vitest, 21 tests):** bcrypt hashing and the legacy-hash upgrade, the admin password check, session signing and tamper detection, the tenant / reservation / floor-plan authorization guards, and Zod booking validation.
- **End-to-end (Playwright, 2 tests):** a guest books a table on `/booking/demo` and the owner, after signing in, sees the request in the live-ops queue; `/liveops` redirects without a session and a wrong password shows a clear error.

CI runs the unit tests with the coverage gate, a production build, the Playwright suite against a PostgreSQL service with seeded data, and a Docker image build on every push. CodeQL and Dependabot run on the repository.

---

## License

[MIT](LICENSE) · Yiğit Sarp Avcı · [GitHub](https://github.com/yigitsarpavci) · [LinkedIn](https://www.linkedin.com/in/yigitsarpavci)
