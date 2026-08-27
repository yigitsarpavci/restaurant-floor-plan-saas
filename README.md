# Seated - Restaurant Management & Live-Ops SaaS

A modern, multi-tenant SaaS platform designed for restaurants to manage floor plans, reservations, and live operations in real-time. Built with Next.js 16 (App Router), Prisma, and Zustand for highly interactive drag-and-drop table management.

---

## Tech Stack

- **Framework:** [Next.js 16 (App Router)](https://nextjs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/) for complex global UI state.
- **Database:** PostgreSQL (via [Prisma ORM](https://www.prisma.io/))
- **Interactive UI:** `react-rnd` for drag-and-drop floor plan building.
- **Validation:** Zod for robust schema validation.

---

## Core Features

- **Multi-Tenant Architecture:** Secure isolation between different restaurant tenants using slug-based routing (`/manage/[tenantSlug]`).
- **Interactive Floor Plan Builder:** 
    - Drag, drop, and resize tables using `react-rnd`.
    - Support for multiple table shapes (Rectangle, Circle, Square, Booth).
    - Real-time coordinate (`x`, `y`) and dimension saving.
- **Live-Ops Dashboard:**
    - Live view of the floor plan for hosts and waitstaff.
    - Walk-in management and pending reservation queues.
    - Status tracking (Pending, Confirmed, Seated, Cleared, No-Show).
- **Reservation System:**
    - Support for both TIMED and UNTIMED reservation modes.
    - Advanced Table Merging: Assign multiple tables to a single large reservation using a Many-to-Many Prisma relationship.
- **Modern UI:** Clean, highly responsive interface with custom theme toggling (Dark/Light mode).

---

## Folder Structure

```text
├── prisma/
│   └── schema.prisma    # Database models (Tenant, FloorPlan, Table, Reservation)
├── app/                 # Next.js App Router
│   ├── actions/         # Server Actions (auth, booking, floor-plan, tenant)
│   ├── booking/         # Customer-facing booking flows
│   ├── liveops/         # Live operations dashboard
│   ├── manage/          # Admin/Tenant management console
│   └── globals.css      # Global styles and Tailwind directives
├── components/
│   ├── booking/         # Booking dialogs and customer views
│   ├── floor-plan/      # Canvas, Builder, and Properties panel
│   ├── live-ops/        # Walk-in bars, alerts, and live queues
│   └── manage/          # Tenant creation and administration UI
├── lib/                 # Shared utilities and helpers
├── middleware.ts        # Global Route Protection and redirection
└── package.json         # Project dependencies and scripts
```

---

## Installation and Setup

### 1. Clone the repository
```bash
git clone https://github.com/yigitsarpavci/seated.git
cd seated
```

### 2. Install dependencies
```bash
npm install
```

### 3. Database Setup
Ensure you have your environment variables configured in a `.env` file:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/seated"
```

Then, push the database schema:
```bash
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

---

Built by Yigit Sarp Avci.
