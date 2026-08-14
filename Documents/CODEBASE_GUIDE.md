# SkyTech SPMS — Master Codebase Guide

> **Document Purpose**: Comprehensive explanation of every file in the workspace, their relevance, the relationships between them, the complete data flow of the system, and a thorough rationale for every architectural decision made so far.
>
> **Project**: SkyTech Program Management System (SPMS)
> **Client**: Skytech Switchgear Pvt. Ltd.
> **Status**: Active Development — Core Modules Complete
> **Last Updated**: July 21, 2026

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Workspace Directory Structure](#2-workspace-directory-structure)
3. [Every File — Purpose & Relevance](#3-every-file--purpose--relevance)
4. [Relationships Between Files](#4-relationships-between-files)
5. [Data Flow — How Information Moves](#5-data-flow--how-information-moves)
6. [Architecture & Design Decisions](#6-architecture--design-decisions)
7. [API Reference Summary](#7-api-reference-summary)
8. [Data Persistence Matrix](#8-data-persistence-matrix)

---

## 1. System Overview

SkyTech SPMS is a **full-stack TypeScript enterprise web application** built for Skytech Switchgear Pvt. Ltd. It digitizes the entire switchgear manufacturing lifecycle — from the moment a client inquiry is received, through design, fabrication, electrical work, testing, and finally dispatch and after-sales support.

The system is decoupled into two independently deployable applications:

```
Browser (User) → http://localhost:3000
         │
         │  HTTP/JSON REST API calls
         ▼
Next.js 16 Frontend (React 19)
App Router · TailwindCSS v4 · lucide-react
/Frontend  (Port 3000)
         │
         │  fetch → http://localhost:5000
         ▼
Express.js Backend API (Node.js)
TypeScript · Prisma ORM · dotenv · cors
/Backend  (Port 5000)
         │
         │  Prisma Client (type-safe SQL)
         ▼
SQLite Database (dev.db)
Dev: SQLite · Prod target: PostgreSQL (EC2)
```

---

## 2. Workspace Directory Structure

```
skytech-main/
│
├── Backend/                       # Express.js API Server
│   ├── .env                       # Environment variables (PORT, DATABASE_URL)
│   ├── package.json               # Node.js dependencies & scripts
│   ├── tsconfig.json              # TypeScript compiler config
│   ├── prisma/
│   │   ├── schema.prisma          # Relational DB schema (source of truth)
│   │   ├── seed.ts                # Database seeding script
│   │   └── dev.db                 # SQLite binary (auto-generated)
│   └── src/
│       ├── server.ts              # Express entry point, middleware & route mounting
│       ├── db/
│       │   └── prisma.ts          # Prisma client singleton
│       ├── data/
│       │   └── mockData.ts        # In-memory mock store & TypeScript interfaces
│       └── routes/
│           ├── dashboard.ts       # GET /api/dashboard/stats
│           ├── inquiries.ts       # CRUD /api/inquiries (Prisma)
│           ├── wbs.ts             # CRUD /api/wbs (Prisma)
│           ├── employees.ts       # CRUD /api/employees (Prisma)
│           ├── orders.ts          # CRUD /api/orders (Mock)
│           ├── inventory.ts       # CRUD /api/inventory (Mock)
│           ├── employeeManagement.ts  # /api/employee-management (Mock)
│           └── system.ts          # GET /api/system/status (Simulated metrics)
│
├── Frontend/                      # Next.js App Router Application
│   ├── package.json               # React/Next.js dependencies
│   ├── next.config.ts             # Next.js configuration
│   ├── tsconfig.json              # TypeScript path aliases (@/*)
│   ├── postcss.config.mjs         # TailwindCSS PostCSS integration
│   ├── eslint.config.mjs          # ESLint rules
│   └── src/
│       ├── components/
│       │   └── DashboardLayout.tsx    # Global shell: sidebar + header
│       └── app/
│           ├── layout.tsx             # Root HTML layout (anti-flicker script)
│           ├── globals.css            # Base styles + sidebar anti-flicker CSS
│           ├── page.tsx               # Dashboard cockpit (/)
│           ├── inquiries/page.tsx     # Inquiry Management (/inquiries)
│           ├── wbs/page.tsx           # Work Breakdown Structure (/wbs)
│           ├── employees/page.tsx     # Employee Directory (/employees)
│           ├── orders/page.tsx        # Order Management (/orders)
│           ├── employee-management/page.tsx  # Employee Hub (/employee-management)
│           └── architecture/page.tsx  # Redirects to /
│
├── Documents/                     # Project documentation
│   ├── README.md                  # Business scope & system blueprint
│   ├── TECHNICAL_SPECIFICATIONS.md  # Stack specs, DB schema, deployment guides
│   ├── PROJECT_PROGRESS.md        # Feature completion tracker & roadmap
│   ├── ARCHITECTURE_AND_DATA_FLOW.md  # Earlier architecture reference doc
│   └── CODEBASE_GUIDE.md          # This file — master codebase reference
│
└── GSD/                           # Developer environment metadata (agent tooling)
    ├── .agent/
    ├── .gemini/
    └── .gsd/
```

---

## 3. Every File — Purpose & Relevance

### A. Documents

---

#### `Documents/README.md`

**Purpose**: The business requirements document. Defines the "why" behind the system — the manufacturing workflow at Skytech Switchgear, the 11-stage production pipeline (Inquiry → Design → Fabrication → Assembly → Electrical → Testing → Dispatch → Accounts → Support), the core module list, and the production environment targets.

**Relevance**: Acts as the north star when aligning development priorities. Any developer picking up this codebase should read this first to understand the business domain.

---

#### `Documents/TECHNICAL_SPECIFICATIONS.md`

**Purpose**: Specifies the complete technology stack, database schema definitions, full REST API endpoint contract, and cloud deployment instructions for AWS EC2 with PostgreSQL.

**Relevance**: The reference spec for infrastructure decisions. Explains how switching from SQLite to PostgreSQL is achieved by changing `provider` in `schema.prisma` and updating `DATABASE_URL` in `.env`.

---

#### `Documents/PROJECT_PROGRESS.md`

**Purpose**: A living progress tracker. Documents every feature that has been built and verified, tracks which API endpoints persist to the database versus which operate in memory, and lists the upcoming development roadmap (Microsoft OAuth SSO, Order Management DB persistence, AWS EC2 deployment).

**Relevance**: Provides a clear current-state snapshot and prevents re-implementing already-completed work. Should be updated after every sprint.

---

#### `Documents/ARCHITECTURE_AND_DATA_FLOW.md`

**Purpose**: An earlier architecture reference document containing Mermaid sequence diagrams for both persistent and mock data flows, explaining core structural relations (Inquiry → Order → WBS), and documenting the first 6 architectural decisions.

**Relevance**: Predecessor to `CODEBASE_GUIDE.md`. Still useful as a concise data flow reference.

---

#### `Documents/CODEBASE_GUIDE.md` (This File)

**Purpose**: The master reference guide explaining every file, all file relationships, complete data flow, and the full rationale behind all architecture decisions.

---

### B. Backend — Configuration & Infrastructure

---

#### `Backend/package.json`

**Purpose**: The Node.js project manifest. Declares all server dependencies and scripts.

**Key Dependencies**:

| Dependency | Role |
|---|---|
| `express ^4.19` | HTTP server framework for REST API routing |
| `@prisma/client ^5.22` | Type-safe database ORM client |
| `cors ^2.8` | Enables Cross-Origin HTTP requests from the frontend (port 3000 → 5000) |
| `dotenv ^16.4` | Loads `.env` file values into `process.env` |
| `nodemon` (dev) | Auto-restarts server on TypeScript file changes during development |
| `ts-node` (dev) | Runs TypeScript files directly without a prior compile step |

**Scripts**:
- `npm run dev` — Runs `nodemon src/server.ts` (live-reload development server)
- `npm run build` — Runs `tsc` (compiles TypeScript to JavaScript in `/dist`)
- `npm run start` — Runs compiled production code `node dist/server.js`

---

#### `Backend/tsconfig.json`

**Purpose**: TypeScript compiler configuration. Sets `target: ES2020`, `module: commonjs`, enables `strict` mode and `esModuleInterop`, and outputs compiled JS to the `./dist` directory.

**Relevance**: Ensures TypeScript is compiled with production-safe settings. The `strict: true` flag enforces type safety across all route handlers, catching potential null-dereference errors at compile time rather than runtime.

---

#### `Backend/.env`

**Purpose**: Environment-specific configuration file. Not committed to version control.

```
PORT=5000
DATABASE_URL="file:./dev.db"
```

**Relevance**: Two critical values:
- `PORT=5000` — The Express server binds to this port. The frontend fetches from `http://localhost:5000`.
- `DATABASE_URL="file:./dev.db"` — Points Prisma to the local SQLite file. For production, this single line changes to a PostgreSQL connection string.

---

### C. Backend — Database Layer

---

#### `Backend/prisma/schema.prisma`

**Purpose**: The **single source of truth** for the entire database structure. Prisma reads this file to generate the TypeScript client (`@prisma/client`) and to create/migrate the actual database tables.

**Defined Models & Their Roles**:

| Model | Purpose | Key Relations |
|---|---|---|
| `Inquiry` | Client inquiries (commercial proposals) with status pipeline | → `Order[]`, `WBSTask[]` |
| `Order` | Confirmed manufacturing jobs linked to inquiries | → `Inquiry`, `PhaseRemark[]`, `PhaseChecklist[]`, `MaterialRequest[]` |
| `WBSPhase` | The 9 production department phases (Design, Mechanical, Assembly, etc.) | → `WBSTask[]` |
| `WBSTask` | Individual sub-tasks within a WBS phase | → `WBSPhase`, `Inquiry?` |
| `PhaseRemark` | Free-text department remarks per order | → `Order?` |
| `PhaseChecklist` | Checkbox completion state per department task | → `Order?` |
| `Employee` | Staff directory with RBAC roles and Microsoft OAuth SSO field | → `Attendance[]` |
| `Attendance` | Daily clock-in/clock-out logs | → `Employee` |
| `MaterialRequest` | Store material requests linked to orders | → `Order?` |

**Critical Status Enumerations** (stored as strings):
- Inquiry status: `"Inquiry Received"`, `"Offer Sent"`, `"Confirmed"`, `"Unconfirmed"`
- WBS Task status: `"DONE"`, `"IN PROGRESS"`, `"NOT STARTED"`
- Employee status: `"Active"`, `"On Leave"`, `"Suspended"`
- MaterialRequest status: `"Pending"`, `"Approved"`, `"Rejected"`

---

#### `Backend/prisma/seed.ts`

**Purpose**: A one-time initialization script that populates the SQLite database with realistic seed data for development and testing.

**What it seeds**:
1. **8 Client Inquiries** — Real-world Indian power/industrial companies (Reliance Green Energy, Tata Steel, Adani Solar, etc.) with mixed statuses
2. **8 Employees** — Matching the actual Skytech departments
3. **9 WBS Phases** — One per manufacturing department (Phase 1.0 through 9.0)
4. **WBS Tasks** — Sample sub-tasks for Phase 5.0 (Assembly & Busbar Dept.) tied to INQ-101

**How to run**: `npx ts-node prisma/seed.ts`

**Relevance**: Without this file, the application starts with an empty database, resulting in empty tables. The seed data enables the full UI flow to be visible without manually entering data.

---

#### `Backend/prisma/dev.db`

**Purpose**: The local SQLite binary database file. Auto-generated by `prisma migrate dev` or `prisma db push`. Contains all persisted records.

**Relevance**: The actual database during development. A single ~112 KB file — trivial to distribute, reset, or replace. Should not be committed to the main branch when going to production.

---

#### `Backend/src/db/prisma.ts`

**Purpose**: Creates and exports a **singleton Prisma Client instance**.

```typescript
const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

**Relevance**: Prevents creating a new database connection pool on every hot-reload during development. Without this singleton, each file change would create a new `PrismaClient`, eventually exhausting the SQLite file lock or PostgreSQL connection limit. All route files import `{ prisma }` from here — there is exactly one database client instance in the entire server process.

---

#### `Backend/src/data/mockData.ts`

**Purpose**: A 819-line TypeScript module serving three roles:

**1. Type Definitions**: Declares TypeScript interfaces for all data shapes: `Task`, `HistoryEntry`, `Order`, `Employee`, `MaterialRequest`, and complex types for the Employee Management sub-system (attendance logs, visit reports, leave applications, running jobs, salary slips).

**2. In-Memory Data Store**: Contains mutable JavaScript arrays (`mockOrders`, `mockEmployees`, `mockEmployeeAttendance`, `mockLeaveApplications`, `mockRunningJobs`, `mockSalarySlips`, `mockVisitReports`) initialized with realistic sample data.

**3. Exported Utility Functions**: Helper functions that manipulate in-memory stores:
- `getOrders()` / `getOrderById()` / `createOrder()` / `updateOrderStage()` / `toggleTaskCompletion()` / `updateOrderDeptRemark()`
- `getMaterialRequests()` / `createMaterialRequest()` / `updateMaterialRequestStatus()`
- `getEmployeeDashboardStats()` / `clockEmployeeIn()` / `createEmployeeTask()` / `updateEmployeeTaskStatus()`
- `createVisitReport()` / `updateVisitReport()` / `deleteVisitReport()`
- `applyForLeave()` / `updateLeaveStatus()` / `updateRunningJobProgress()`
- `logSystemEvent()` — appends timestamped events to the `systemLogs` in-memory array

**4. Business Constants**: Exports `BUSINESS_STAGES`, `DEVELOPMENT_STAGES`, `DEPARTMENTS`, and `DEFAULT_TASKS_BY_DEPT` — the canonical department list and per-department checklist task names used across both frontend and backend.

**Relevance**: This file is the prototype "database" for all modules not yet migrated to Prisma. When the server restarts, all changes to this data are lost — an intentional design choice during active UI development.

---

### D. Backend — Express API Server

---

#### `Backend/src/server.ts`

**Purpose**: The **entry point** for the entire backend application.

**What it does step by step**:
1. Loads environment variables from `.env` via `dotenv.config()`
2. Creates the Express `app` instance
3. Applies global middleware: `cors()` and `express.json()`
4. Mounts all route handlers on their respective paths:
   - `/api/dashboard` → dashboardRouter
   - `/api/orders` → ordersRouter
   - `/api/employees` → employeesRouter
   - `/api/inventory` → inventoryRouter
   - `/api/system` → systemRouter
   - `/api/employee-management` → employeeManagementRouter
   - `/api/inquiries` → inquiriesRouter
   - `/api/wbs` → wbsRouter
5. Registers a `/health` GET endpoint used by `DashboardLayout.tsx` to poll backend connectivity
6. Binds to `PORT` (default 5000) and logs startup with `logSystemEvent()`

**Relevance**: This is the only file that needs to be modified when adding a new route domain to the API. All domain-specific logic is delegated to the individual route files.

---

### E. Backend — API Route Handlers

---

#### `Backend/src/routes/inquiries.ts` — PERSISTENT (Prisma DB)

**Purpose**: Full CRUD REST API for client inquiries, backed by the `Inquiry` table in SQLite via Prisma.

| Method | Path | Action |
|---|---|---|
| `GET` | `/api/inquiries` | All inquiries ordered by `createdAt DESC` |
| `GET` | `/api/inquiries/stats` | Conversion funnel: total, offersSent, confirmed, unconfirmed, winRate% |
| `POST` | `/api/inquiries` | Create inquiry; auto-generates `inquiryCode` (INQ-101 + count) |
| `PUT` | `/api/inquiries/:id` | Partial update — only provided fields are updated |
| `DELETE` | `/api/inquiries/:id` | Permanently deletes from the database |

**Data it feeds**: Dashboard (`/`) consumes `/api/inquiries/stats`. Inquiries page (`/inquiries`) uses all endpoints.

---

#### `Backend/src/routes/wbs.ts` — PERSISTENT (Prisma DB)

**Purpose**: Manages the 9-phase Work Breakdown Structure hierarchy. Reads from `WBSPhase` (joined with `WBSTask[]`) and supports full CRUD on individual tasks.

| Method | Path | Action |
|---|---|---|
| `GET` | `/api/wbs` | All phases with nested tasks (`include: { tasks }`) |
| `POST` | `/api/wbs/tasks` | Create task under a `phaseId`; auto-calculates `progress` and `actualHours` from `status` |
| `PUT` | `/api/wbs/tasks/:id` | Partial update of any task field |
| `DELETE` | `/api/wbs/tasks/:id` | Removes task by `id` |

**Data it feeds**: WBS page (`/wbs`) for rendering the hierarchical phase tree and task management.

---

#### `Backend/src/routes/employees.ts` — PERSISTENT (Prisma DB)

**Purpose**: Manages the employee directory backed by the `Employee` table.

| Method | Path | Action |
|---|---|---|
| `GET` | `/api/employees` | All employees ordered by `empCode ASC` |
| `POST` | `/api/employees` | Create employee; auto-generates `empCode` (EMP-0{count+1}) |
| `PUT` | `/api/employees/:id/status` | Updates only the `status` field |

**Data it feeds**: Employee Directory page (`/employees`).

---

#### `Backend/src/routes/orders.ts` — MOCK (In-Memory)

**Purpose**: Manages manufacturing orders in memory using `mockData.ts`. Handles the full order lifecycle: creation, stage advancement, department remark updates, and task completion toggling.

| Method | Path | Action |
|---|---|---|
| `GET` | `/api/orders` | Returns `mockOrders` array |
| `GET` | `/api/orders/:id` | Returns a single order by ID |
| `POST` | `/api/orders` | Creates new order with auto-generated checklists via `generateDefaultTasks()` |
| `PUT` | `/api/orders/:id/stage` | Advances to a new pipeline stage; appends to history |
| `PUT` | `/api/orders/:id/remarks` | Saves a department-specific remark string |
| `PUT` | `/api/orders/:id/tasks/:taskId/toggle` | Toggles a department checklist item completion |

> All changes reset when the server restarts.

---

#### `Backend/src/routes/inventory.ts` — MOCK (In-Memory)

**Purpose**: Manages material requisitions in memory.

| Method | Path | Action |
|---|---|---|
| `GET` | `/api/inventory/requests` | All material requests |
| `POST` | `/api/inventory/requests` | Create a material request tied to an order |
| `PUT` | `/api/inventory/requests/:id/status` | Approve or reject a pending request |

---

#### `Backend/src/routes/employeeManagement.ts` — MOCK (In-Memory)

**Purpose**: Powers the Employee Hub sub-application — a full prototype ERP interface for HR operations.

| Feature Domain | Endpoints |
|---|---|
| HR Dashboard Summary | `GET /api/employee-management/dashboard` |
| Attendance Logs | `GET/POST /api/employee-management/attendance` |
| Clock-In Event | `POST /api/employee-management/attendance/clock` |
| Employee HR Tasks | `GET/POST/PUT /api/employee-management/tasks` |
| Field Visit Reports | `GET/POST/PUT/DELETE /api/employee-management/visits` |
| Leave Applications | `GET/POST/PUT /api/employee-management/leaves` |
| Running Jobs | `GET/PUT /api/employee-management/jobs` |
| Salary Slips | `GET /api/employee-management/salary` |

**Data it feeds**: Exclusively consumed by the Employee Management page (`/employee-management`).

---

#### `Backend/src/routes/dashboard.ts` — AGGREGATED (Mixed Sources)

**Purpose**: An aggregation endpoint pulling from `mockData.ts` to compute KPI metrics in a single response for the main dashboard.

**Endpoint**: `GET /api/dashboard/stats`

**Response**: `activeOrdersCount`, `highPriorityCount`, `completedOrdersCount`, `pendingTasksCount`, `pendingMaterialRequests`, `departmentLoads`, `employeeCount`, `activeEmployees`

---

#### `Backend/src/routes/system.ts` — SIMULATED (No Real Metrics)

**Purpose**: Simulates a live system monitoring endpoint. Generates realistic CPU, RAM, and latency metrics with randomized variance (`Math.random()`) to make the architecture monitor feel "live". Returns the in-memory `systemLogs` array.

**Simulated Components**: Next.js App, Express.js API, PostgreSQL DB (Neon), Azure Blob Storage, Microsoft Entra ID, Email SMTP, WhatsApp/SMS Gateway, Razorpay, Google Maps API.

---

### F. Frontend — Configuration & Infrastructure

---

#### `Frontend/package.json`

**Key Dependencies**:

| Dependency | Role |
|---|---|
| `next 16.2.10` | Full-stack React framework with App Router |
| `react 19.2.4` | UI component model with concurrent features |
| `lucide-react ^1.25.0` | Icon library providing all UI icons |
| `tailwindcss ^4` (dev) | Utility-first CSS framework for all styling |
| `typescript ^5` (dev) | Type safety across all component and page files |

---

#### `Frontend/next.config.ts`

**Purpose**: Next.js-specific build configuration. Currently holds default settings, serving as the extension point for future configurations (e.g., image domains, environment variable exposure, rewrites/redirects).

---

#### `Frontend/tsconfig.json`

**Purpose**: TypeScript configuration for the frontend. Most critically defines the `@/*` path alias pointing to `./src/*`, enabling imports like `import DashboardLayout from "@/components/DashboardLayout"` instead of relative paths.

---

#### `Frontend/postcss.config.mjs`

**Purpose**: Configures the PostCSS pipeline to include `@tailwindcss/postcss`, wiring TailwindCSS v4 into Next.js's CSS processing chain. Without this, Tailwind utility classes would not be compiled into the production stylesheet.

---

#### `Frontend/eslint.config.mjs`

**Purpose**: ESLint configuration using the `eslint-config-next` ruleset. Enforces code quality and catches common React and Next.js anti-patterns at development time.

---

### G. Frontend — Application Shell

---

#### `Frontend/src/app/globals.css`

**Purpose**: The global CSS file imported at the application root. Contains three important sections:

1. **Tailwind Import**: `@import "tailwindcss"` — activates all Tailwind utility classes
2. **CSS Variables**: Defines `:root` custom properties for background and foreground colors
3. **Anti-Flicker Rule**:
```css
html.sidebar-collapsed #main-sidebar {
  margin-left: -15rem !important;
}
```

This CSS rule collapses the sidebar *before* JavaScript loads, matched by the inline script in `layout.tsx`. It is the CSS half of the two-part anti-flicker system.

---

#### `Frontend/src/app/layout.tsx`

**Purpose**: The **root HTML layout** for the entire Next.js App Router application. Every page is wrapped by this component.

**What it does**:
1. Loads Google Fonts (`Geist`, `Geist_Mono`) via `next/font/google`
2. Sets SEO metadata: `title: "Skytech Program Management System"`
3. Injects an anti-flicker inline script in `<head>`:
```javascript
(function(){
  try{
    if(localStorage.getItem('skytech_sidebar_open')==='false'){
      document.documentElement.classList.add('sidebar-collapsed');
    }
  }catch(e){}
})();
```
This script runs **synchronously before the first paint**. If the user previously collapsed the sidebar, it adds `sidebar-collapsed` to `<html>`, triggering the `globals.css` rule.

4. Wraps all children in `<DashboardLayout>`, so the sidebar and header are present on every page.

**Relevance**: The core integration point between the shell component, global styles, and all routed pages.

---

#### `Frontend/src/components/DashboardLayout.tsx`

**Purpose**: The **application shell** — a `'use client'` component providing the persistent sidebar, top navigation bar, user profile system, and the content viewport. It renders on every page route.

**Key Features & Logic**:

**1. Sidebar State Management**:
- `sidebarOpen` state controls sidebar visibility
- Persisted to `localStorage` under key `skytech_sidebar_open`
- After mount, the `transition-none` class is replaced with `transition-all duration-300` to avoid animating on page load

**2. Anti-Flicker Mount Guard** (`mounted` state):
- On SSR (server render), `mounted = false` → no CSS transition is applied
- After `useEffect` runs (client-side), `mounted = true` → transitions are enabled
- Prevents the sidebar from animating from open → closed on the first render

**3. Backend Health Polling**:
- On mount, immediately fetches `http://localhost:5000/health`
- Repeats every **10 seconds** via `setInterval`
- Updates `backendStatus` state: `'Online'` | `'Offline'` | `'Checking'`

**4. Navigation Sections**:
```
PROGRAMME:
  Dashboard      → /
  Inquiry Mgmt   → /inquiries
  WBS            → /wbs
  Order Mgmt     → /orders
MANAGEMENT:
  Employee Dir.  → /employees
  Employee Hub   → /employee-management (Prototype label)
```

**5. Employee Hub Layout Bypass**:
```typescript
if (pathname?.startsWith('/employee-management')) {
  return <>{children}</>;
}
```

**6. User Profile System**:
- Displays `user.initials` in avatar button
- Profile dropdown with `Edit Profile` and `Sign Out` actions
- Edit Profile Modal: updates local React state only (no backend API call yet)
- Sign Out Toast: transient `Signed out successfully` notification (UI prototype)
- Click-outside listener closes the dropdown

---

### H. Frontend — Routed Pages

---

#### `Frontend/src/app/page.tsx` — Dashboard Cockpit (`/`)

**Purpose**: Main application entry point (1,022 lines). Acts as the operational cockpit.

**Features**:
- Interactive date picker with forward/backward day navigation
- **Inquiry Pipeline Summary Bar**: Fetches `GET /api/inquiries/stats`
- **KPI Stat Cards**: 4 metric cards (Overall Completion %, Active Tasks, Staff Attendance %, Active Phase)
- **Production Phase Pipeline**: 7 manufacturing departments as connected nodes
- **Phase Auto-Advancement Engine**: When all checklist tasks for a department complete, active focus shifts to the next department in `BUSINESS_STAGES`
- **Department Checklist & Remarks**: Interactive task checkboxes and free-text remark boxes — from `GET /api/orders`
- **Inline Components**: `CircularProgress` (SVG ring), `MiniBarChart` (bar visualization)

---

#### `Frontend/src/app/inquiries/page.tsx` — Inquiry Management (`/inquiries`)

**Purpose**: Dedicated commercial funnel management page (840 lines). Full CRUD interface backed by the live database.

**Features**:
- Stats summary row from `GET /api/inquiries/stats`
- Searchable + filterable table (status filter: ALL, Confirmed, Offer Sent, Inquiry Received, Unconfirmed)
- `+ Add Inquiry` Modal → calls `POST /api/inquiries`
- Edit Modal → calls `PUT /api/inquiries/:id`
- Delete Confirmation Modal → calls `DELETE /api/inquiries/:id`
- Color-coded status badges per inquiry

---

#### `Frontend/src/app/wbs/page.tsx` — Work Breakdown Structure (`/wbs`)

**Purpose**: Project execution tracking interface (1,283 lines). Hierarchical 9-phase WBS tree with full task management.

**Features**:
- **Confirmed Project Selector**: Fetches confirmed inquiries from `GET /api/inquiries` to filter WBS by project
- **WBS Tree Table**: Phase accordion rows with nested tasks showing WBS Code, Task Name, Owner, Plan/Actual Hours, Status, Progress%
- Add Task Modal → `POST /api/wbs/tasks`
- Edit Task Modal → `PUT /api/wbs/tasks/:id`
- Delete Task Confirmation Modal → `DELETE /api/wbs/tasks/:id`

---

#### `Frontend/src/app/employees/page.tsx` — Employee Directory (`/employees`)

**Purpose**: Staff directory (435 lines). Lists employees in card grid with department filtering.

**Features**:
- Department filter dropdown
- Employee cards showing name, initials avatar, department, designation, role badge, status indicator
- Status Toggle Buttons → `PUT /api/employees/:id/status`
- `+ Add New Employee` Modal → `POST /api/employees`

---

#### `Frontend/src/app/orders/page.tsx` — Order Management (`/orders`)

**Purpose**: Manufacturing order tracking (614 lines). Visualizes active orders with pipeline stage, priority, timeline, and checklist.

**Features**:
- Order cards with client, project, priority badge, current stage, progress bar, dates
- Stage Advancement Control → `PUT /api/orders/:id/stage`
- Department task checklist toggle → `PUT /api/orders/:id/tasks/:taskId/toggle`
- Department remark textarea → `PUT /api/orders/:id/remarks`
- `+ New Order` Modal → `POST /api/orders`

---

#### `Frontend/src/app/employee-management/page.tsx` — Employee Hub (`/employee-management`)

**Purpose**: Standalone, fullscreen ERP sub-application prototype (2,174 lines — the largest file in the project). Bypasses `DashboardLayout` to maximize screen real estate for dense data tables.

**Multi-Tab Sections**:

| Tab | Features | Backend Endpoint |
|---|---|---|
| Dashboard | HR stats, attendance, active tasks, running jobs | `GET /api/employee-management/dashboard` |
| Attendance | Calendar view, clock-in event | `GET/POST /api/employee-management/attendance` |
| Tasks | Task assignment, add/update status | `GET/POST/PUT /api/employee-management/tasks` |
| Visit Reports | Field visit tracking | `GET/POST/PUT/DELETE /api/employee-management/visits` |
| Leave Requests | Apply/approve/reject | `GET/POST/PUT /api/employee-management/leaves` |
| Running Jobs | Active job progress bars | `GET/PUT /api/employee-management/jobs` |
| Salary | Salary slip viewer | `GET /api/employee-management/salary` |

---

#### `Frontend/src/app/architecture/page.tsx`

**Purpose**: A placeholder redirect page. The architecture visualization that was previously intended for `/architecture` is now integrated directly into the main dashboard cockpit (`/`). This file exists as a catch/redirect for any bookmarked or old links.

```typescript
import { redirect } from 'next/navigation';
export default function ArchitecturePage() { redirect('/'); }
```

---

## 4. Relationships Between Files

### A. Module Dependency Summary

```
layout.tsx
  └── imports DashboardLayout.tsx (shell)
  └── imports globals.css (styles)

DashboardLayout.tsx
  ├── renders children: page.tsx, inquiries/page.tsx, wbs/page.tsx,
  │                     employees/page.tsx, orders/page.tsx
  └── bypasses wrapper for: employee-management/page.tsx

page.tsx               → fetch /api/inquiries/stats, /api/orders
inquiries/page.tsx     → fetch /api/inquiries (CRUD)
wbs/page.tsx           → fetch /api/wbs (CRUD), /api/inquiries (project dropdown)
employees/page.tsx     → fetch /api/employees (CRUD)
orders/page.tsx        → fetch /api/orders (CRUD)
employee-management/page.tsx → fetch /api/employee-management/*
DashboardLayout.tsx    → fetch /health (every 10s)

server.ts mounts all routers:
  routes/inquiries.ts  → prisma.inquiry.*     → db/prisma.ts → dev.db
  routes/wbs.ts        → prisma.wBSPhase/Task → db/prisma.ts → dev.db
  routes/employees.ts  → prisma.employee.*    → db/prisma.ts → dev.db
  routes/orders.ts     → mockOrders[]         → data/mockData.ts
  routes/inventory.ts  → mockMaterialRequests → data/mockData.ts
  routes/employeeManagement.ts → mockAttendance, mockTasks, etc. → data/mockData.ts
  routes/dashboard.ts  → mockOrders + mockEmployees → data/mockData.ts
  routes/system.ts     → simulated metrics + systemLogs → data/mockData.ts
```

---

### B. Database Relational Links (schema.prisma)

```
Inquiry (1) ──────────────── (many) Order
           inquiryId FK

Inquiry (1) ──────────────── (many) WBSTask
           inquiryId FK (onDelete: SetNull)

WBSPhase (1) ────────────── (many) WBSTask
           phaseId FK (onDelete: Cascade)

Order (1) ─────────────────  (many) PhaseRemark
          orderId FK (onDelete: Cascade)

Order (1) ─────────────────  (many) PhaseChecklist
          orderId FK (onDelete: Cascade)

Order (1) ─────────────────  (many) MaterialRequest
          orderId FK (onDelete: SetNull)

Employee (1) ──────────────  (many) Attendance
          employeeId FK (onDelete: Cascade)
```

**Key cascade behaviors**:
- Deleting a `WBSPhase` → automatically deletes all its `WBSTask` records
- Deleting an `Employee` → automatically deletes all `Attendance` records
- Deleting an `Order` → cascades into `PhaseRemark` and `PhaseChecklist`; sets `MaterialRequest.orderId = NULL`
- Deleting an `Inquiry` → sets `WBSTask.inquiryId = NULL` (preserves tasks, unlinks from project)

---

## 5. Data Flow — How Information Moves

### A. Persistent Flow (Inquiries, WBS, Employees)

When a user performs a write operation on a database-backed module (e.g., editing a WBS task):

```
User clicks "Save" in Edit Task Modal
        │
        ▼
wbs/page.tsx: PUT http://localhost:5000/api/wbs/tasks/:id
  Body: { name, owner, planHours, actualHours, status, progress }
        │
        ▼
routes/wbs.ts → Router.put('/tasks/:id')
  Validates req.body fields
        │
        ▼
db/prisma.ts (singleton PrismaClient)
  prisma.wBSTask.update({ where: { id }, data: { ...partialFields } })
        │
        ▼
SQLite dev.db
  UPDATE "WBSTask" SET ... WHERE id = ?
  Returns: Updated row
        │
        ▼
logSystemEvent('API Server', 'WBS task updated', 'info')
  Appends to in-memory systemLogs array
        │
        ▼
res.json(updatedTask) → HTTP 200 + JSON
        │
        ▼
wbs/page.tsx
  Updates React local state → UI re-renders with smooth transition
```

---

### B. Mock / In-Memory Flow (Orders, Inventory, Employee Hub)

When a user performs a write operation on a prototype module (e.g., toggling an order task):

```
User checks a task checkbox in Orders page
        │
        ▼
orders/page.tsx: PUT http://localhost:5000/api/orders/:id/tasks/:taskId/toggle
        │
        ▼
routes/orders.ts → Router.put('/:id/tasks/:taskId/toggle')
        │
        ▼
data/mockData.ts → toggleTaskCompletion(orderId, taskId)
  Finds task in mockOrders[i].tasks array in Node.js heap memory
  Flips task.completed boolean
  Returns updated order object
        │
        ▼
res.json(updatedOrder) → HTTP 200 + JSON
        │
        ▼
orders/page.tsx
  Updates React state → UI re-renders checkbox as checked/unchecked

  ⚠️  If the Express server restarts, mockOrders resets to its
      initial definition — all session changes are permanently lost.
```

---

### C. Health-Check & Status Polling

```
DashboardLayout.tsx mounts (useEffect, [] dependency)
        │
        ▼
fetch('http://localhost:5000/health')
        │
    ┌───┴─────────────────────────────┐
    │ Response OK (200)               │ Error / Non-OK
    ▼                                 ▼
setBackendStatus('Online')   setBackendStatus('Offline')
        │
        ▼
setInterval(checkConnection, 10000) — repeats every 10 seconds
        │
useEffect cleanup:
  clearInterval(intervalId) when DashboardLayout unmounts
```

---

## 6. Architecture & Design Decisions

---

### Decision 1: Decoupled Full-Stack Architecture

**What was decided**: Run Next.js as an independent frontend (port 3000) and Express.js as a separate API server (port 5000), communicating exclusively through HTTP REST calls.

**Why this approach**:
- The Express server can be hosted on AWS EC2, Docker, PM2, or bare metal Linux with zero dependency on Vercel or any specific hosting provider
- If the API server becomes a bottleneck, it can be horizontally scaled independently without rebuilding the frontend
- Backend routes can be fully tested with Postman or `curl` without needing a browser

**Alternatives considered**: Next.js API Routes / Server Actions

**Why rejected**: Server Actions and `app/api` routes are tightly coupled to Vercel's serverless model with 10–60 second cold start timeouts — unsuitable for long-running database queries. Testing isolated from the Next.js runtime is also significantly harder.

---

### Decision 2: SQLite for Development, Prisma ORM as the Abstraction Layer

**What was decided**: Use SQLite (`dev.db`) as the local development database engine, with all database interactions going through Prisma ORM.

**Why this approach**:
- A new developer clones the repo, runs `npm install` and `npx prisma db push`, and has a fully functional database — no database server installation required
- Prisma generates TypeScript types from `schema.prisma`, making every database call type-checked at compile time
- Switching to PostgreSQL requires only changing `provider = "sqlite"` to `provider = "postgresql"` in `schema.prisma` and updating `DATABASE_URL`

**Alternatives considered**: PostgreSQL from day one, raw SQL/`better-sqlite3`, MongoDB/NoSQL

**Why rejected**:
- PostgreSQL locally forces every developer to install and configure a database server
- Raw SQL has no type safety, verbose query strings, and no migration system
- The data model is inherently relational (Inquiry → Order → WBS Tasks), making NoSQL a poor structural fit

---

### Decision 3: Hybrid Persistence Strategy (Database vs. In-Memory Mocks)

**What was decided**: Inquiries, WBS, and Employees are fully persisted in SQLite via Prisma. Orders, Inventory, and the Employee Hub operate entirely in-memory using `mockData.ts`.

**Why this approach**:
- Committing a feature to a database schema requires upfront thinking (foreign keys, constraints, migrations). During active UI prototyping, iterating on in-memory arrays is faster
- The three DB-backed modules proved the relational model is sound before expanding
- A bug in the mock data layer cannot corrupt the database; a restart resets mock state cleanly

**Alternatives considered**:
- Everything in DB from day one → slows development velocity when requirements shift
- Everything as mocks → hides database performance bottlenecks and schema errors until the last minute

**Migration path**: When Orders and Inventory are ready for production, route handlers simply swap `mockData.ts` function calls for `prisma.order.*` and `prisma.materialRequest.*` calls. Schema models are already defined.

---

### Decision 4: Anti-Flicker Sidebar State Persistence

**What was decided**: Sidebar state is saved to `localStorage`. An inline blocking `<script>` in `<head>` reads `localStorage` and adds `sidebar-collapsed` to `<html>` before the first paint. The corresponding CSS in `globals.css` applies the collapsed margin immediately.

**The technical flow**:
```
Browser loads HTML
  → <script> in <head> executes synchronously (blocks paint)
  → Reads localStorage['skytech_sidebar_open']
  → If 'false': adds class 'sidebar-collapsed' to <html>
  → CSS: html.sidebar-collapsed #main-sidebar { margin-left: -15rem }
  → Sidebar is visually collapsed before React loads
  → React mounts, reads same localStorage value, syncs useState
  → 'mounted' flag enables CSS transitions AFTER initial render
```

**Alternatives considered**:
- `useEffect` only → executes after first paint → unavoidable layout shift flash
- Server-side cookies → adds routing complexity and cookie header latency
- No persistence → sidebar always starts in the same state — poor UX

---

### Decision 5: Employee Hub Layout Bypass

**What was decided**: `DashboardLayout.tsx` checks if the URL starts with `/employee-management` and renders `{children}` directly without the sidebar or header.

**Why this approach**:
- The Employee Hub contains dense multi-column tables (attendance logs, salary slips, visit reports) that require maximum horizontal viewport width
- The 240px sidebar steals critical horizontal space in a data-heavy ERP view
- The Employee Hub has its own internal tab navigation, making the outer sidebar redundant

**Alternatives considered**:
- Nested layout within the sidebar → makes attendance tables and salary slips hard to read
- Separate `employee-management/layout.tsx` file → cleaner long-term solution, but the bypass logic already lives in `DashboardLayout` and works without additional files

---

### Decision 6: Single-File Page Architecture

**What was decided**: Each major page (WBS at 1,283 lines, Employee Management at 2,174 lines) is a single TypeScript file containing all UI components, modal dialogs, form state, API calls, and data types inline.

**Why this approach**:
- All modal forms, table data, loading states, and API fetch handlers share a single React component tree → simple, direct `useState`/`useEffect` interactions without prop drilling
- No global state library (Redux, Zustand, React Query) is needed — each page manages its own fetched data locally
- During active feature development, all related changes happen in one file

**Alternatives considered**:
- Splitting into component files → cleaner for long-term maintenance, but requires prop interfaces between components and makes shared state harder to trace during rapid development
- Global state stores → introduces unnecessary complexity when pages don't share state with each other

**When to refactor**: Once requirements stabilize and component reuse across pages emerges, individual components (modals, tables) should be extracted into `/components/` subdirectories.

---

### Decision 7: `lucide-react` as the Sole Icon Library

**What was decided**: All icons throughout the application use the `lucide-react` package exclusively.

**Why this approach**:
- A single library guarantees visual consistency across all icons (same stroke width, corner radius, optical sizing)
- Tree-shakeable — only imported icons are included in the bundle
- TypeScript-native: each icon is a React component with full type support

**Alternatives considered**:
- Font Awesome → requires CSS font loading (FOUC risk), larger bundle
- Heroicons / Phosphor Icons → comparable alternatives, but `lucide-react` had the specific icons needed (e.g., `Workflow` for WBS, `Send` for Inquiries)
- Inline SVG files → maximum control, but requires managing dozens of SVG files manually

---

## 7. API Reference Summary

| Method | Endpoint | Persistence | Description |
|---|---|---|---|
| `GET` | `/health` | — | Backend liveness check |
| `GET` | `/api/dashboard/stats` | Mock | Aggregated KPI metrics |
| `GET` | `/api/inquiries` | **DB** | All client inquiries |
| `GET` | `/api/inquiries/stats` | **DB** | Conversion funnel metrics |
| `POST` | `/api/inquiries` | **DB** | Create new inquiry |
| `PUT` | `/api/inquiries/:id` | **DB** | Partial update inquiry |
| `DELETE` | `/api/inquiries/:id` | **DB** | Delete inquiry |
| `GET` | `/api/wbs` | **DB** | Full WBS phase + task tree |
| `POST` | `/api/wbs/tasks` | **DB** | Add WBS task |
| `PUT` | `/api/wbs/tasks/:id` | **DB** | Update WBS task |
| `DELETE` | `/api/wbs/tasks/:id` | **DB** | Delete WBS task |
| `GET` | `/api/employees` | **DB** | All employees |
| `POST` | `/api/employees` | **DB** | Register new employee |
| `PUT` | `/api/employees/:id/status` | **DB** | Update employee status |
| `GET` | `/api/orders` | Mock | All manufacturing orders |
| `POST` | `/api/orders` | Mock | Create new order |
| `PUT` | `/api/orders/:id/stage` | Mock | Advance order stage |
| `PUT` | `/api/orders/:id/remarks` | Mock | Update dept remark |
| `PUT` | `/api/orders/:id/tasks/:taskId/toggle` | Mock | Toggle task completion |
| `GET` | `/api/inventory/requests` | Mock | All material requests |
| `POST` | `/api/inventory/requests` | Mock | New material request |
| `PUT` | `/api/inventory/requests/:id/status` | Mock | Approve/Reject request |
| `GET` | `/api/employee-management/dashboard` | Mock | HR dashboard summary |
| `GET/POST` | `/api/employee-management/attendance` | Mock | Attendance logs |
| `POST` | `/api/employee-management/attendance/clock` | Mock | Clock-in event |
| `GET/POST/PUT` | `/api/employee-management/tasks` | Mock | Employee tasks |
| `GET/POST/PUT/DELETE` | `/api/employee-management/visits` | Mock | Visit reports |
| `GET/POST` | `/api/employee-management/leaves` | Mock | Leave applications |
| `PUT` | `/api/employee-management/leaves/:id/status` | Mock | Approve/Reject leave |
| `GET` | `/api/employee-management/jobs` | Mock | Running jobs |
| `PUT` | `/api/employee-management/jobs/:id/progress` | Mock | Update job progress |
| `GET` | `/api/employee-management/salary` | Mock | Salary slips |
| `GET` | `/api/system/status` | Simulated | System component metrics & logs |

---

## 8. Data Persistence Matrix

| Module / Feature | Frontend Page | Backend Route | Persistence | Resets on Restart? |
|---|---|---|---|---|
| Client Inquiries | `/inquiries` | `routes/inquiries.ts` | SQLite via Prisma | No |
| Inquiry Stats | `/` dashboard | `routes/inquiries.ts` | SQLite via Prisma | No |
| WBS Phases & Tasks | `/wbs` | `routes/wbs.ts` | SQLite via Prisma | No |
| Employee Directory | `/employees` | `routes/employees.ts` | SQLite via Prisma | No |
| Manufacturing Orders | `/orders` | `routes/orders.ts` | In-Memory Mock | Yes |
| Material Requests | `/orders` | `routes/inventory.ts` | In-Memory Mock | Yes |
| Dashboard KPI Stats | `/` dashboard | `routes/dashboard.ts` | Computed from Mocks | Yes |
| Attendance Logs | `/employee-management` | `routes/employeeManagement.ts` | In-Memory Mock | Yes |
| Leave Applications | `/employee-management` | `routes/employeeManagement.ts` | In-Memory Mock | Yes |
| Visit Reports | `/employee-management` | `routes/employeeManagement.ts` | In-Memory Mock | Yes |
| Salary Slips | `/employee-management` | `routes/employeeManagement.ts` | In-Memory Mock | Yes |
| System Event Logs | Dashboard system monitor | `routes/system.ts` | In-Memory Stack | Yes |
| Sidebar State | All pages | `DashboardLayout.tsx` | localStorage | No |
| User Profile | All pages | `DashboardLayout.tsx` | React State Only | Yes |
