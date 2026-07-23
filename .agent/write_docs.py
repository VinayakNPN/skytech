import sys, os
sys.stdout.reconfigure(encoding='utf-8')

# ============================================================
# ROADMAP.md
# ============================================================
roadmap = """# SkyTech SPMS — Project Roadmap

> **Project**: SkyTech Program Management System (SPMS)
> **Client**: Skytech Switchgear Pvt. Ltd.
> **Developer**: Vinayak NPN
> **Created**: 2026-07-23
> **Last Updated**: 2026-07-24 (v3 — Excel Schema Integrated, WBS-as-Single-Truth, Orders Fully Removed)
> **Status**: Phase 1 Complete — Phase 2 Next

---

## How to Use This Roadmap

This roadmap is divided into **sequential phases**. Each phase must be completed and verified before starting the next.

**Status Legend:**
- `✅ Completed` — Done and verified
- `🚧 In Progress` — Currently being worked on
- `⏳ Pending` — Not yet started
- `🔒 Blocked` — Blocked by a prerequisite phase

---

## 🗂️ Excel Schema — Source of Truth

The client's Excel workbook `Skytech_Store_Inventory_Management.xlsx` defines **the exact data model** for the Inventory Management system. Every table, column, and relationship in the system **must** match this schema precisely.

### Sheets and Their Database Equivalents

| Excel Sheet | DB Table | Purpose |
|-------------|----------|---------|
| **Job Master** | `Job` | Running jobs — each row is a project. `jobNo` (e.g. `JOB-01`) is the job_id FK in Stock OUT. |
| **Item Master** | `StockItem` | Master list of all materials. `itemCode` (e.g. `MCB-006`) is item_id FK in Stock IN/OUT. |
| **Stock IN** | `StockReceipt` | Material receipt log — inbound stock from vendors/suppliers. |
| **Stock OUT (Issue)** | `StockIssue` | Material issue log — outbound stock issued to jobs. **Joins job_id × item_id** |
| **Job-wise Issue Summary** | Computed view | Auto-aggregates qty issued per item per job (cross-tab: items × jobs). |
| **Dashboard** | API-computed | Live snapshot: active items, low stock count, total stock value. |
| **Instructions** | N/A | User guide for the Excel workbook. |

### Critical Relationship: job_id ↔ item_id (R9)

```
Job (jobNo = JOB-01, JOB-02, ...) <--FK--> StockIssue.jobNo  (= job_id)
                                                   |
StockItem (itemCode = MCB-006, ...) <--FK--> StockIssue.itemCode (= item_id)

StockIssue IS the join table:
  StockIssue { date, jobNo (job_id), itemCode (item_id), qtyOut, issuedTo, issuedBy, remarks }
```

### Job Master Schema (from Excel)

| Column | Field | Type | Notes |
|--------|-------|------|-------|
| Job No | `jobNo` | String PK | e.g. `JOB-01` — THIS IS job_id |
| Job / Client Name | `clientName` | String? | e.g. Britannia Rudrapur |
| Location | `location` | String? | e.g. Rudrapur, Kanpur |
| Start Date | `startDate` | DateTime? | |
| Status | `status` | String | `Running` \\| `Completed` \\| `On Hold` |
| Remarks | `remarks` | String? | |

**Actual jobs in client data:**
| jobNo | clientName | location | status |
|-------|-----------|---------|--------|
| JOB-01 | Britannia Rudrapur - DGF Oven PLC/HMI | Rudrapur | Running |
| JOB-02 | Ordnance Parachute Factory Kanpur - HT/LT Panel | Kanpur | Running |
| JOB-03 | Flour Mill - Instrumentation | Kolkata | Running |
| JOB-04 | (empty) | — | Running |
| JOB-05 | (empty) | — | Running |

### Item Master Schema (from Excel) — 18 Items

| Column | Field | Notes |
|--------|-------|-------|
| Item Code | `itemCode` | String PK — THIS IS item_id |
| Description | `description` | e.g. MCB 06A SP C-Curve |
| Make | `make` | Brand e.g. Schneider Electric |
| Part No. | `partNo` | Manufacturer catalog number |
| Category | `category` | Switchgear Parts, Cable, PLC & Automation, etc. |
| Unit | `unit` | Nos, Mtr, Kg |
| Opening Stock | `openingStock` | Float — initial qty on hand |
| Min Stock Level | `minStockLevel` | Float — reorder threshold |
| Rate (₹) | `unitRate` | Float — per-unit cost in INR |
| Total IN | `totalIn` | **COMPUTED** from StockReceipt |
| Total OUT | `totalOut` | **COMPUTED** from StockIssue |
| Current Stock | `currentStock` | **COMPUTED**: openingStock + totalIn - totalOut |
| Stock Value (₹) | `stockValue` | **COMPUTED**: currentStock × unitRate |
| Status | `status` | `Active` \\| `Inactive` |
| Location/Rack | `locationRack` | String? |
| Remarks | `remarks` | String? |

**All 18 client items:**

| itemCode | Description | Make | Category | Unit | Opening | MinLevel | Rate(₹) |
|----------|------------|------|---------|------|---------|---------|--------|
| MCB-006 | MCB 06A SP C-Curve | Schneider Electric | Switchgear Parts | Nos | 20 | 5 | 180 |
| MCB-032 | MCB 32A SP C-Curve | Schneider Electric | Switchgear Parts | Nos | 20 | 5 | 180 |
| MCCB-001 | MCCB 100A TP | Siemens | Switchgear Parts | Nos | 5 | 2 | 4500 |
| CONT-001 | Contactor 32A 3-Pole | Siemens | Contactors & Relays | Nos | 10 | 3 | 1200 |
| RLY-001 | Control Relay 230V 2C/O | OMRON | Contactors & Relays | Nos | 15 | 5 | 220 |
| CBL-001 | Cable 2.5 sqmm Cu (FRLS) | Polycab | Cable | Mtr | 500 | 100 | 42 |
| CBL-002 | Cable 4 sqmm Cu (FRLS) | Polycab | Cable | Mtr | 300 | 100 | 65 |
| WIRE-001 | Control Wire 1.5 sqmm | Finolex | Wire | Mtr | 400 | 100 | 18 |
| LUG-001 | Copper Lug 4 sqmm (Ring) | Dowells | Lugs & Ferrules | Nos | 100 | 20 | 8 |
| LUG-002 | Bootlace Ferrule 1.5 sqmm | Dowells | Lugs & Ferrules | Nos | 500 | 100 | 2 |
| NB-001 | Hex Bolt M6 x 20mm SS | Local/Generic | Nut Bolts & Fasteners | Nos | 500 | 100 | 3 |
| NB-002 | Nut M6 SS | Local/Generic | Nut Bolts & Fasteners | Nos | 500 | 100 | 1 |
| TB-001 | Terminal Block 4mm | Elmex | Terminal Blocks | Nos | 200 | 50 | 15 |
| PLC-001 | PLC Module - Digital I/O | Siemens | PLC & Automation | Nos | 3 | 1 | 8500 |
| HMI-001 | HMI 7 inch Touch Panel | Siemens | HMI & Display | Nos | 2 | 1 | 15000 |
| BUS-001 | Copper Bus Bar 25x5mm | Local/Generic | Bus Bar | Mtr | 40 | 10 | 650 |
| GLD-001 | Glow Indicator Lamp 22mm | L&T | Indicators & Pilot Devices | Nos | 60 | 15 | 45 |
| CG-001 | Cable Gland PG-13.5 | Local/Generic | Cable Glands & Accessories | Nos | 150 | 30 | 12 |

**Total opening stock value: ~₹1,81,700**

### Stock IN Schema (= StockReceipt)

| Column | Field | Notes |
|--------|-------|-------|
| Date | `date` | Receipt date |
| Item Code | `itemCode` | FK → StockItem.itemCode (= item_id) |
| Description | auto-fill | From Item Master |
| Unit | auto-fill | From Item Master |
| Qty IN | `qtyIn` | Quantity received |
| Supplier / Vendor | `supplier` | Vendor name |
| Invoice / Challan No. | `invoiceNo` | Reference document |
| Received By | `receivedBy` | Employee code |
| Remarks | `remarks` | |

### Stock OUT (Issue) Schema — THE Core R9 Join Table (= StockIssue)

| Column | Field | Notes |
|--------|-------|-------|
| Date | `date` | Issue date |
| **Job No** | `jobNo` | **FK → Job.jobNo (= job_id)** |
| **Item Code** | `itemCode` | **FK → StockItem.itemCode (= item_id)** |
| Description | auto-fill | From Item Master |
| Unit | auto-fill | From Item Master |
| Qty OUT | `qtyOut` | Quantity issued |
| Issued To | `issuedTo` | Person/team receiving |
| Issued By | `issuedBy` | Store Admin who issued |
| Remarks | `remarks` | |

### Job-wise Issue Summary (Computed Cross-Tab)

- Rows = Items (itemCode + description + unit)
- Columns = JOB-01, JOB-02, ... + Total Issued
- Data = `SUM(qtyOut) GROUP BY itemCode, jobNo` from StockIssue
- **Not stored** — always computed on demand from StockIssue table

---

## 🔑 Architectural Mandate: WBS is the Single Source of Truth

> **All data requests from the Dashboard and every other frontend module go to the WBS API (`/api/wbs`). No Order Management API exists anywhere in the system. Every dashboard API call that previously went to `/api/orders` now goes to `/api/wbs`.**

| Old (Removed) | New (WBS-centric) | Purpose |
|---------------|-------------------|---------|
| `GET /api/orders` | `GET /api/wbs?inquiryId=X` | Dept checklist & pipeline data |
| `GET /api/orders/:id/stage` | `GET /api/wbs/phases?inquiryId=X` | Current production phase |
| `PUT /api/orders/:id/tasks/:t/toggle` | `PUT /api/wbs/tasks/:id` | Toggle task completion |
| `PUT /api/orders/:id/remarks` | `PUT /api/wbs/tasks/:id` (remark field) | Save department remarks |
| `GET /api/dashboard/stats` (orders KPIs) | `GET /api/wbs/stats?inquiryId=X` | KPI metrics |

---

## Client Requirements — Change Log (v3)

| # | Requirement | Impact | Phase |
|---|------------|--------|-------|
| **R1** | Project dropdown on home/dashboard to select active project | UI — Dashboard page | Phase 2 |
| **R2** | Hold status for projects — hidden from dashboard but visible in list | Schema change + UI filter | Phase 2 |
| **R3** | Remove Order Management; add Inventory (Admin-only, WBS-linked) | Removes `/orders`; replaces Phase 4 | Phase 4 |
| **R4** | Assign team members, start date, duration, lead; scoped employee dashboard | ProjectTeam model | Phase 3 + Phase 4 |
| **R5** | Employee tasks from WBS only — no separate task creation | Removes EmployeeTask model | Phase 5 |
| **R6** | Leave: Half-Day (AM/PM) + Full-Day | LeaveApplication schema | Phase 6 |
| **R7** | Leave approval hierarchy by role + email routing | Role-aware routing | Phase 3 + Phase 6 |
| **R8** | Employee Hub sidebar fixed (not scroll) | CSS position sticky | Phase 2 |
| **R9** | Map WBS job_id with Inventory item_id | job_id=Job.jobNo (auto-created on Inquiry confirmed), item_id=StockItem.itemCode, joined in StockIssue | Phase 4 |

---

## Current Status Snapshot

| Area | Status |
|------|--------|
| Frontend Shell & Navigation | ✅ Completed |
| Dashboard Cockpit | ✅ Completed (R1 Project Dropdown added) |
| Inquiry Management (DB-backed) | ✅ Completed (R2 Hold/Resume added) |
| WBS Module (DB-backed) | ✅ Completed (validation added) |
| Employee Directory (DB-backed) | ✅ Completed (collision-safe IDs added) |
| Employee Hub Sidebar | ✅ Fixed (R8 fixed sidebar) |
| Codebase Quality & Hardening | ✅ Completed (Zod, Winston, ErrorBoundary) |
| Order Management | ⏳ **Must be fully deleted before Phase 4** |
| Inventory Management | ⏳ Pending — Excel schema-aligned, WBS-linked (R3, R9) |
| Authentication / SSO | ⏳ Pending |

---

## Phase Overview

```
Phase 1  ✅  Foundation & Core UI                [COMPLETE]
Phase 2  ⏳  Cleanup, UI Fixes & Hardening       [NEXT — includes WBS Stats API]
Phase 3  ⏳  Authentication, RBAC & Project Teams [Blocked by Phase 2]
Phase 4  ⏳  Inventory Management (Excel-schema)  [Blocked by Phase 3]
Phase 5  ⏳  Employee Hub — Full DB Persistence   [Blocked by Phase 3]
Phase 6  ⏳  Leave System & HR Workflows         [Blocked by Phase 5]
Phase 7  ⏳  File Management & Document Uploads  [Blocked by Phase 4]
Phase 8  ⏳  Notifications & Reporting           [Blocked by Phase 6]
Phase 9  ⏳  Cloud Deployment & Production       [Blocked by Phase 7-8]
Phase 10 ⏳  ERP Expansion & Polish              [Blocked by Phase 9]
```

---

## Phase 1 — Foundation & Core UI ✅ COMPLETE

### 1.1 Project Setup & Infrastructure ✅
- [x] Initialise Next.js 16 (App Router) frontend project
- [x] Initialise Express.js + TypeScript backend project
- [x] Configure Prisma ORM with SQLite for local development
- [x] Set up TypeScript with `strict: true` on both sides
- [x] Configure TailwindCSS v4 with PostCSS pipeline
- [x] Define initial `schema.prisma` with all core models
- [x] Write `seed.ts` with 8 inquiries, 8 employees, 9 WBS phases

### 1.2 Application Shell & Navigation ✅
- [x] Build dark-navy `DashboardLayout.tsx` with sidebar + topbar
- [x] Implement sidebar collapse/expand with `localStorage` persistence
- [x] Build topbar: page title, backend health badge, alert icons, user profile popover
- [x] Wire backend health polling (`GET /health` every 10 s)
- [x] Implement Employee Hub fullscreen layout bypass for `/employee-management`
- [x] Set up route structure: `/`, `/inquiries`, `/wbs`, `/employees`, `/employee-management`

### 1.3 Dashboard Cockpit (`/`) ✅
- [x] Build interactive date picker with day navigation
- [x] Connect Inquiry Pipeline Summary Bar (`GET /api/inquiries/stats`)
- [x] Build 4 KPI Stat Cards (Overall Completion %, Active Tasks, Staff Attendance %, Active Phase)
- [x] Build 7-node Production Phase Pipeline visualisation
- [x] Build per-department checklist checkboxes + remark text boxes
- [x] **v3 note:** Dashboard checklist/pipeline data NOW comes from `GET /api/wbs` — NOT `GET /api/orders`

### 1.4 Inquiry Management Module ✅
- [x] Full CRUD Prisma routes for inquiries
- [x] `GET /api/inquiries/stats` — conversion funnel metrics
- [x] Searchable + filterable inquiry table with modals

### 1.5 WBS Module ✅
- [x] Full CRUD Prisma routes for WBS phases + tasks
- [x] Hierarchical 9-phase WBS tree with accordion rows
- [x] Confirmed Project Selector dropdown

### 1.6 Employee Directory ✅
- [x] Full CRUD Prisma routes for employees
- [x] Employee card grid, `+ Add New Employee` modal, status toggles

### 1.7 Order Management UI ✅ *(FULLY DELETED in Phase 2)*
- [x] Mock-only — **being removed entirely**

### 1.8 Employee Hub ERP ✅ *(Mock-only — major rework in Phase 5–6)*
- [x] Fullscreen 7-tab ERP prototype wired to mock routes

---

## Phase 2 — Cleanup, UI Fixes & Environment Hardening ⏳ NEXT

> **Objective:** Apply all client requirement changes without authentication, remove Order Management, fix UI bugs, and harden the codebase.

### 2.1 🗑️ Remove Order Management System (R3) — MANDATORY

> The Order Management system is completely removed. No `/orders` route, no mock orders, no dashboard calls to `/api/orders`. **Every frontend data request that previously went to `/api/orders` must now go to `/api/wbs`.**

- [ ] Delete `Frontend/src/app/orders/page.tsx` and `orders/` route directory
- [ ] Delete `Backend/src/routes/orders.ts`
- [ ] Remove `/api/orders` mount from `Backend/src/server.ts`
- [ ] Remove `orders` navigation link from `DashboardLayout.tsx` sidebar
- [ ] **Replace** `GET /api/orders` in `Frontend/src/app/page.tsx` → `GET /api/wbs?inquiryId=<selected>` + `GET /api/wbs/phases?inquiryId=<selected>`
- [ ] Remove `mockOrders`, `updateOrderStage()`, `toggleTaskCompletion()`, `updateOrderDeptRemark()`, `generateDefaultTasks()` from `mockData.ts`
- [ ] Verify zero TypeScript errors after deletion (`tsc --noEmit`)

**Dashboard API Replacement Map (Orders → WBS):**

| Was calling | Now calls | Purpose |
|-------------|-----------|---------|
| `GET /api/orders` | `GET /api/wbs?inquiryId=X` | Dept checklist & production pipeline data |
| `GET /api/orders/:id/stage` | `GET /api/wbs/phases?inquiryId=X` | Current production phase |
| `PUT /api/orders/:id/tasks/:t/toggle` | `PUT /api/wbs/tasks/:id` | Toggle task/checklist completion |
| `PUT /api/orders/:id/remarks` | `PUT /api/wbs/tasks/:id` (remark field) | Save department remarks |
| `GET /api/dashboard/stats` (orders-based) | `GET /api/wbs/stats?inquiryId=X` | Active tasks count, overall completion % |

### 2.2 🏠 Dashboard — Project Dropdown Selector (R1)

- [ ] Add `GET /api/inquiries/confirmed` — returns only `status = "Confirmed"` inquiries
- [ ] Build `ProjectDropdown` component in `Frontend/src/components/dashboard/ProjectDropdown.tsx`
  - Dropdown lists all active (non-hold) confirmed inquiries by name + code
- [ ] Update `page.tsx` dashboard:
  - WBS phase pipeline → `GET /api/wbs/phases?inquiryId=<selected>`
  - Department checklist → `GET /api/wbs?inquiryId=<selected>`
  - KPI cards → `GET /api/wbs/stats?inquiryId=<selected>`
- [ ] Show `"Select a project to view details"` empty-state if no project selected

### 2.3 ⏸️ Project "Hold" Status (R2)

- [ ] Migration: add `holdStatus` boolean, `holdReason`, `heldAt` to `Inquiry`
- [ ] `PUT /api/inquiries/:id/hold` and `PUT /api/inquiries/:id/resume`
- [ ] Update `GET /api/inquiries/confirmed` to exclude `holdStatus = true`
- [ ] UI: Hold/Resume buttons, On Hold badge (amber), filter tab

### 2.4 🔧 Employee Hub — Fixed Sidebar (R8)

- [ ] Apply `position: sticky` + `top: 0` + `height: 100vh` to sidebar container
- [ ] Ensure right content area has `overflow-y: auto` and `flex: 1`
- [ ] Test all 7 tabs

### 2.5 🌍 Environment Variable Centralisation

- [ ] Create `NEXT_PUBLIC_API_URL` in `Frontend/.env.local`
- [ ] Replace all ~35 hardcoded `http://localhost:5000` strings with env var
- [ ] Create `.env.example` files for both Frontend and Backend

### 2.6 🛡️ Backend Input Validation

- [ ] Install `zod` in Backend
- [ ] Create validators: `inquiry.validator.ts`, `wbs.validator.ts`, `employee.validator.ts`, `inventory.validator.ts`

### 2.7 🔒 CORS Hardening

- [ ] Replace `app.use(cors())` with explicit origin allowlist
- [ ] Set `credentials: true` for auth cookies

### 2.8 📋 Structured Logging & Error Handling

- [ ] Install `winston` — create `Backend/src/utils/logger.ts`
- [ ] Create `errorHandler.ts` and `notFound.ts` middleware
- [ ] Add `React ErrorBoundary` component

### 2.9 🧹 Large File Decomposition

- [ ] Extract WBS components: `WBSPhaseRow`, `WBSTaskRow`, `AddTaskModal`, `EditTaskModal`, `DeleteTaskModal`
- [ ] Extract all 7 Employee Hub tabs as individual components

### 2.10 🔢 Fix Collision-Prone ID Generation

- [ ] Fix INQ code generation to use `MAX(inquiryCode)`
- [ ] Fix EMP code generation to use `MAX(empCode)`

### 2.11 🆕 Add WBS Stats Endpoint (Replaces Dashboard Orders API)

> New endpoint required because dashboard previously fetched KPI data from orders mock.

- [ ] Add `GET /api/wbs/stats` in `Backend/src/routes/wbs.ts`:
  - Optional `?inquiryId=` param
  - Returns: `{ totalTasks, doneTasks, inProgressTasks, notStartedTasks, overallCompletionPct, activePhase, totalPlanHours, totalActualHours }`
  - Scoped to project if `inquiryId` provided; aggregated across all if not
- [ ] Add `GET /api/wbs/phases` in `Backend/src/routes/wbs.ts`:
  - Optional `?inquiryId=` param
  - Returns phases with tasks and checklist completion status
  - Used by dashboard production pipeline visualisation
- [ ] Update `Frontend/src/app/page.tsx` dashboard KPI cards to use `GET /api/wbs/stats`
- [ ] Update `Frontend/src/app/page.tsx` production pipeline to use `GET /api/wbs/phases`

---

## Phase 3 — Authentication, RBAC & Project Teams ⏳

> **Objective:** Microsoft Entra ID SSO, JWT session management, RBAC, project team assignment.
> **Prerequisites:** Phase 2 complete.

### 3.1 Backend Auth Infrastructure

- [ ] Install: `@azure/msal-node`, `jsonwebtoken`, `@types/jsonwebtoken`
- [ ] Add to `.env`: `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID`, `JWT_SECRET`
- [ ] Create `auth/msalConfig.ts`, `auth/authRoutes.ts`
  - `GET /auth/login`, `GET /auth/callback`, `POST /auth/logout`, `GET /api/auth/me`
- [ ] Create `middleware/authenticate.ts` — validates JWT, attaches `req.user`
- [ ] Create `middleware/authorize.ts` — RBAC middleware factory
- [ ] Apply `authenticate` to all `/api/*` routes

### 3.2 Employee Model — SSO + Role Mapping (R7 foundation)

- [ ] Verify `Employee.microsoftId` and `Employee.email` fields exist
- [ ] Auto-link Microsoft `oid` to `Employee.microsoftId` on first SSO login
- [ ] Return `403` if SSO email has no matching `Employee` record

### 3.3 Project Team Assignment (R4)

- [ ] Add `ProjectTeam` model: `id`, `inquiryId`, `employeeId`, `role` (Lead/Member), `assignedAt`, `assignedBy`
- [ ] Add `Inquiry.startDate`, `estimatedDuration`, `projectLead` fields
- [ ] `POST /api/projects/:inquiryId/team`, `GET` team, `DELETE` member, `GET /api/projects/my`
- [ ] Build `AssignTeamModal.tsx` in inquiries page

### 3.4 Employee-Scoped Dashboard View (R4)

- [ ] Update `GET /api/wbs/stats` — filter by `ProjectTeam` for non-admin users
- [ ] Update `GET /api/inquiries/confirmed` — scope by `ProjectTeam` for non-admin users
- [ ] Show empty state for unassigned employees

### 3.5 Frontend Auth Integration

- [ ] Install `@azure/msal-react`, `@azure/msal-browser`
- [ ] Wrap `layout.tsx` with `MsalProvider`
- [ ] Build `/login` page, `middleware.ts` redirect
- [ ] Store JWT in `httpOnly` cookie, attach to all `fetch()` calls

### 3.6 RBAC UI Enforcement

| Role | Dashboard | WBS | Inventory | Employees | Employee Hub |
|------|-----------|-----|-----------|-----------|--------------|
| Admin | All projects | Full CRUD | Full CRUD | Full CRUD | All employees |
| Manager | Assigned | Read/Write | Read + Approve | Read | Own team |
| HR | Assigned | Read-only | Read-only | Read + Add | All (HR view) |
| Engineer | Own | Own tasks | Read-only | Read-only | Own profile |
| Supervisor | Own | Own tasks | Request only | Read-only | Own profile |
| Operator | Own | View only | Request only | Read-only | Own profile |

- [ ] Implement `useAuth()` hook returning `{ user, role, isAdmin, isHR, isManager }`
- [ ] Hide Inventory nav link from non-Admin users

### 3.7 Session Management

- [ ] MSAL refresh token flow
- [ ] Sign Out: clear JWT + MSAL logout
- [ ] Handle `401` globally — redirect to `/login`

---

## Phase 4 — Inventory Management (Excel-Schema, WBS-Linked) ⏳

> **Objective:** Build Inventory Management exactly matching the Excel workbook. Admin-only.
> `job_id` (= `Job.jobNo`) ↔ `item_id` (= `StockItem.itemCode`) is the core relationship via `StockIssue` join table.
> **Prerequisites:** Phase 3 complete + Phase 2 complete (Order Management fully removed).

### 4.1 🗄️ Database Schema — Inventory Models (Excel-Aligned)

> **Do NOT deviate from the Excel column names/types.** The DB is a 1:1 translation of the Excel workbook.

**Job Model (= Job Master sheet):**
```prisma
model Job {
  id          String   @id @default(uuid())
  jobNo       String   @unique   // e.g. "JOB-01" — THIS IS job_id
  clientName  String?            // e.g. "Britannia Rudrapur - DGF Oven PLC/HMI"
  location    String?            // e.g. "Rudrapur"
  startDate   DateTime?
  status      String   @default("Running")  // "Running" | "Completed" | "On Hold"
  remarks     String?
  inquiryId   String?            // FK -> Inquiry.id (links Job to WBS project)
  inquiry     Inquiry? @relation(fields: [inquiryId], references: [id], onDelete: SetNull)
  stockIssues StockIssue[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

> A `Job` is created automatically when an `Inquiry` is Confirmed. `jobNo` is auto-generated as `JOB-NN`. `inquiryId` links the job back to the WBS project.

**StockItem Model (= Item Master sheet):**
```prisma
model StockItem {
  id            String   @id @default(uuid())
  itemCode      String   @unique   // e.g. "MCB-006" — THIS IS item_id
  description   String             // e.g. "MCB 06A SP C-Curve"
  make          String?            // Brand: "Schneider Electric", "Siemens", etc.
  partNo        String?            // Manufacturer's part/catalog number
  category      String             // "Switchgear Parts" | "Cable" | "PLC & Automation" | etc.
  unit          String             // "Nos" | "Mtr" | "Kg" | "Set"
  openingStock  Float    @default(0)
  minStockLevel Float    @default(0)  // Reorder threshold
  unitRate      Float    @default(0)  // Rate in INR
  status        String   @default("Active")  // "Active" | "Inactive"
  locationRack  String?            // Warehouse shelf/bin location
  remarks       String?
  // Computed at query time (NOT stored):
  // totalIn      = SUM(stockReceipts.qtyIn)
  // totalOut     = SUM(stockIssues.qtyOut)
  // currentStock = openingStock + totalIn - totalOut
  // stockValue   = currentStock * unitRate
  stockReceipts StockReceipt[]
  stockIssues   StockIssue[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

> **Seed data:** The 18 items from the client's Item Master sheet must be seeded on first run.

**StockReceipt Model (= Stock IN sheet):**
```prisma
model StockReceipt {
  id          String    @id @default(uuid())
  receiptNo   String    @unique   // Auto-generated: "GRN-001"
  date        DateTime
  itemCode    String              // FK -> StockItem.itemCode (= item_id)
  stockItem   StockItem @relation(fields: [itemCode], references: [itemCode])
  qtyIn       Float
  supplier    String?             // Vendor/supplier name
  invoiceNo   String?             // Invoice or Challan number
  receivedBy  String?             // Employee empCode
  remarks     String?
  createdAt   DateTime @default(now())
  @@index([itemCode])
  @@index([date])
}
```

**StockIssue Model (= Stock OUT sheet) — THE Core R9 JOIN TABLE:**
```prisma
model StockIssue {
  id        String    @id @default(uuid())
  issueNo   String    @unique   // Auto-generated: "ISS-001"
  date      DateTime
  jobNo     String              // FK -> Job.jobNo  (= job_id)
  job       Job       @relation(fields: [jobNo], references: [jobNo])
  itemCode  String              // FK -> StockItem.itemCode  (= item_id)
  stockItem StockItem @relation(fields: [itemCode], references: [itemCode])
  qtyOut    Float
  issuedTo  String?             // Person/team receiving material
  issuedBy  String?             // Store Admin empCode
  remarks   String?
  createdAt DateTime @default(now())
  @@index([jobNo])
  @@index([itemCode])
  @@index([date])
}
```

> `StockIssue` is the R9 implementation. `jobNo` IS `job_id`. `itemCode` IS `item_id`.

- [ ] Add all 4 models to `Backend/prisma/schema.prisma`
- [ ] Add `Job[]` relation to `Inquiry` model
- [ ] Run migration: `npx prisma migrate dev --name add_inventory_models_v3`
- [ ] Seed 18 StockItems from Excel + 5 Jobs (JOB-01 to JOB-05) from Excel
- [ ] **REMOVE** old `WBSInventoryLink` model if it was added (replaced by `StockIssue`)
- [ ] **REMOVE** old `Vendor` model placeholder (replaced by `supplier` text field in `StockReceipt`)
- [ ] **REMOVE** old `PurchaseOrder` model placeholder (optional Phase 10 addition)

### 4.2 🔌 Backend Inventory Routes (Admin-only, Prisma-backed)

> All routes gated with `authorize(['Admin'])`. File: `Backend/src/routes/inventory.ts` — **zero mocks**.

**Job Routes:**
- [ ] `GET /api/inventory/jobs` — all jobs with status and `inquiryId`
- [ ] `POST /api/inventory/jobs` — create job (auto-gen `jobNo` as next `JOB-NN`)
- [ ] `PUT /api/inventory/jobs/:jobNo` — update job

**Stock Item Routes:**
- [ ] `GET /api/inventory/items` — all items with computed fields (`totalIn`, `totalOut`, `currentStock`, `stockValue`)
- [ ] `GET /api/inventory/items/:itemCode` — single item with receipt + issue history
- [ ] `POST /api/inventory/items` — create item (validate `itemCode` unique, `unit` required)
- [ ] `PUT /api/inventory/items/:itemCode` — update item
- [ ] `PUT /api/inventory/items/:itemCode/status` — set `Active`/`Inactive` (no delete if transactions exist)
- [ ] `GET /api/inventory/items/low-stock` — items where `currentStock <= minStockLevel`

**Stock IN Routes:**
- [ ] `GET /api/inventory/receipts` — all receipts; optional `?itemCode=` filter
- [ ] `POST /api/inventory/receipts` — log receipt (auto-gen `receiptNo = GRN-NNN`); validate `itemCode` exists and Active

**Stock OUT Routes — Core R9: job_id ↔ item_id:**
- [ ] `GET /api/inventory/issues` — all issues; optional `?jobNo=` and/or `?itemCode=` filters
- [ ] `POST /api/inventory/issues` — log issue (auto-gen `issueNo = ISS-NNN`):
  - Validate `jobNo` exists in `Job`, `itemCode` is Active
  - **Validate** `qtyOut <= currentStock` (prevent negative stock)
- [ ] `GET /api/inventory/issues?jobNo=JOB-01` — all issues for a specific job
- [ ] `GET /api/inventory/issues?itemCode=MCB-006` — all issues for a specific item

**Job-wise Summary Route:**
- [ ] `GET /api/inventory/summary/job-wise` — returns matrix items × jobs:
```json
{
  "jobs": ["JOB-01", "JOB-02", "JOB-03"],
  "items": [
    {
      "itemCode": "MCB-006",
      "description": "MCB 06A SP C-Curve",
      "unit": "Nos",
      "issues": { "JOB-01": 5, "JOB-02": 0, "JOB-03": 2 },
      "totalIssued": 7
    }
  ]
}
```
Built with `prisma.stockIssue.groupBy({ by: ['jobNo', 'itemCode'], _sum: { qtyOut: true } })`

**Inventory Dashboard Stats:**
- [ ] `GET /api/inventory/dashboard` — returns `{ totalActiveItems, itemsBelowReorderLevel, totalStockValue, totalReceipts, totalIssues }`

### 4.3 🔗 WBS ↔ Inventory Integration (R9)

> The connection is through the `Job` model. Inquiry confirmed → Job auto-created → `Job.jobNo` is `job_id` in `StockIssue`.

- [ ] Update `GET /api/wbs?inquiryId=X` to include job data: `inquiry.job { jobNo, status, clientName }`
- [ ] Add `GET /api/wbs/tasks/:taskId/materials` — materials issued for the job linked to this task's inquiry
- [ ] WBS page: add "Job Materials" expandable section per WBS phase (Admin-only)
- [ ] Display `Job No` badge next to WBS project name in project selector

### 4.4 🖥️ Frontend — Inventory Module (`/inventory`) — Admin-only

- [ ] Create `Frontend/src/app/inventory/page.tsx`
- [ ] Add "Inventory" nav link in sidebar — **visible only when `role === "Admin"`**
- [ ] Build **5-tab layout** matching the Excel workbook:

**Tab 1 — 📋 Item Master:**
- [ ] Table: Item Code | Description | Make | Part No. | Category | Unit | Opening Stock | Min Level | Rate (₹) | Total IN | Total OUT | Current Stock | Stock Value | Status | Location | Remarks
- [ ] **Red** row when `currentStock = 0`, **amber** when `currentStock <= minStockLevel`
- [ ] `+ Add Item` modal → `POST /api/inventory/items`
- [ ] Edit modal → `PUT /api/inventory/items/:itemCode`
- [ ] Set Inactive → `PUT /api/inventory/items/:itemCode/status` (no hard delete if transactions exist)
- [ ] Category filter, status filter (Active/Inactive), search

**Tab 2 — 📥 Stock IN:**
- [ ] Table: S.No | Date | Item Code | Description | Unit | Qty IN | Supplier/Vendor | Invoice/Challan No. | Received By | Remarks
- [ ] Item Code dropdown (auto-fills Description and Unit from Item Master)
- [ ] `+ Record Receipt` form → `POST /api/inventory/receipts`

**Tab 3 — 📤 Stock OUT / Issue (Core R9 tab):**
- [ ] Table: S.No | Date | **Job No** | **Item Code** | Description | Unit | Qty OUT | Issued To | Issued By | Remarks
- [ ] **Job No dropdown** from `GET /api/inventory/jobs` (running jobs)
- [ ] **Item Code dropdown** from `GET /api/inventory/items` (active items, auto-fills Description + Unit + shows current stock)
- [ ] Warning if `qtyOut > currentStock`
- [ ] `+ Issue Material` form → `POST /api/inventory/issues`

**Tab 4 — 📊 Job-wise Summary:**
- [ ] Cross-tab table: rows=Items, columns=JOB-01..JOB-N + Total Issued
- [ ] Data from `GET /api/inventory/summary/job-wise`
- [ ] Highlight non-zero cells, show totals row and column

**Tab 5 — 🏗️ Jobs:**
- [ ] Table: S.No | Job No | Job/Client Name | Location | Start Date | Status | Remarks
- [ ] Show linked Inquiry name/code alongside each Job
- [ ] `+ Add Job` → `POST /api/inventory/jobs` (manual jobs)
- [ ] Auto-generated jobs (from confirmed inquiries) shown with "Auto" badge
- [ ] Status filter: Running | Completed | On Hold

### 4.5 Dashboard Integration

- [ ] Add "Low Stock Alerts" KPI card (Admin only) from `GET /api/inventory/dashboard`
- [ ] Show low-stock alert badge in topbar (Admin only)
- [ ] All dashboard data continues through WBS (`GET /api/wbs/stats`, `GET /api/wbs/phases`) — Inventory KPIs are additive

### 4.6 Auto-Job Creation on Inquiry Confirmation

> When an inquiry's status changes to "Confirmed", a `Job` record is automatically created. This is the bridge between the WBS world and the Inventory world.

- [ ] Update `PUT /api/inquiries/:id` in `inquiries.ts`:
  - If `status` changes to `"Confirmed"` AND no `Job` exists for this inquiry:
    - Auto-generate `jobNo = JOB-NN` (next sequential)
    - Create `Job { jobNo, inquiryId, clientName, status: "Running", startDate: now }`
    - Log: `"Job JOB-NN created for Inquiry INQ-XXX"`
- [ ] Update `GET /api/inquiries` response to include `job { jobNo }` if exists

---

## Phase 5 — Employee Hub — Full Database Persistence ⏳

> **Objective:** Migrate Employee Hub from mock to Prisma. Align tasks with WBS (R5). Half-day/full-day leave (R6).
> **Prerequisites:** Phase 3 complete.

### 5.1 🗄️ Database Schema — Employee Hub Models

> `EmployeeTask` model is **NOT created** per R5. Employee tasks derive from WBS task assignments.

- [ ] `WBSTaskAssignment`: `id`, `wbsTaskId` FK, `employeeId` FK, `assignedAt`, `assignedBy`; unique(`wbsTaskId`, `employeeId`)
- [ ] `VisitReport`: `id`, `employeeId`, `clientName`, `location`, `purpose`, `visitDate`, `remarks`
- [ ] `LeaveApplication`: `id`, `employeeId`, `leaveType` (`Full Day`|`Half Day - AM`|`Half Day - PM`), `fromDate`, `toDate`, `halfDayTime`, `reason`, `status`, `routedToRole`
- [ ] `RunningJob`: `id`, `employeeId`, `inquiryId?`, `description`, `progress`, `startDate`, `dueDate`
- [ ] `SalarySlip`: `id`, `employeeId`, `month`, `year`, `basicSalary`, `allowances`, `deductions`, `netSalary`; unique(`employeeId`, `month`, `year`)
- [ ] Run migration: `npx prisma migrate dev --name add_employee_hub_models`

### 5.2 Employee Tasks — WBS-Aligned (R5)

- [ ] `GET /api/employee-management/tasks` — WBS tasks where `WBSTaskAssignment.employeeId = req.user.id`
  - Include: `wbsTask { wbsCode, name, status, progress, planHours, actualHours, phase { name } }`
  - Include job context: `wbsTask.inquiry.job { jobNo, clientName }` (inventory link)
- [ ] Remove `POST /api/employee-management/tasks` (no standalone task creation — R5)
- [ ] Task tab UI: each task shows **Job No** badge, **no "Add Task" button**

### 5.3 WBS Task Assignment — Manager UI

- [ ] `POST /api/wbs/tasks/:taskId/assign`, `DELETE /api/wbs/tasks/:taskId/assign/:employeeId`
- [ ] Build `AssignEmployeeModal.tsx`

### 5.4 Attendance — DB Migration

- [ ] Replace mock with `prisma.attendance.*`
- [ ] `GET /api/employee-management/attendance`, `POST clock`

### 5.5 Visit Reports — DB Migration

- [ ] Replace mock with `prisma.visitReport.*`; full CRUD

### 5.6 Running Jobs — DB Migration

- [ ] Replace mock with `prisma.runningJob.*`; `GET`, `PUT progress`

### 5.7 Salary Slips — DB Migration

- [ ] Replace mock with `prisma.salarySlip.*`; `GET` (employee), `POST` (Admin/HR)

### 5.8 HR Dashboard Metrics

- [ ] `GET /api/employee-management/dashboard` from real DB: active/on-leave counts, today clock-in, pending leaves, WBS tasks near deadline

### 5.9 Clean Up mockData.ts

- [ ] `mockData.ts` contains **only TypeScript interfaces** — no runtime arrays
- [ ] Remove: `mockOrders`, `mockEmployeeAttendance`, `mockLeaveApplications`, `mockRunningJobs`, `mockSalarySlips`, `mockVisitReports`, `systemLogs`
- [ ] Move interfaces to `Backend/src/types/`

---

## Phase 6 — Leave System & HR Workflows ⏳

> **Prerequisites:** Phase 5 complete.

### 6.1 Leave Application — Half-Day / Full-Day (R6)

- [ ] `POST /api/employee-management/leaves` — create application (auto-set `routedToRole`)
- [ ] `GET /api/employee-management/leaves` — own leaves
- [ ] `GET /api/employee-management/leaves/pending` — pending for approval (role-scoped)
- [ ] `PUT /api/employee-management/leaves/:id/status` — approve/reject
- [ ] UI: `Full Day` | `Half Day - AM` | `Half Day - PM`; Pending Approvals sub-tab for HR/Manager/Admin

### 6.2 Leave Approval Routing Hierarchy (R7)

| Applicant Role | Leave Routes To |
|---------------|----------------|
| Manager | Admin |
| HR | Manager |
| Engineer | HR |
| Supervisor | HR |
| Operator | HR |
| Viewer | HR |

- [ ] Create `Backend/src/utils/leaveRouting.ts`
- [ ] Auto-set `routedToRole` on leave creation based on applicant's role

### 6.3 Email Notification for Leave (R7)

- [ ] Install `nodemailer`, add `SMTP_*` vars to `.env`
- [ ] Create `Backend/src/utils/emailService.ts`
- [ ] Templates: to approver on application; to applicant on approval/rejection

---

## Phase 7 — File Management & Document Uploads ⏳

> **Prerequisites:** Phase 4 complete.

- [ ] Install `multer` and `@azure/storage-blob`
- [ ] `POST /api/files/upload`, `DELETE /api/files/:blob`, `GET /api/files?entityType=&entityId=`
- [ ] `FileAttachment` model: `entityType`, `entityId`, `fileName`, `blobUrl`, `uploadedBy`, `fileSize`, `mimeType`
- [ ] Build `FileUploader.tsx` (drag-and-drop), `FileGallery.tsx` (list + download)
- [ ] Attach to: Inquiry, WBS task, Stock Items (spec sheets/datasheets)

---

## Phase 8 — Notifications & Reporting ⏳

> **Prerequisites:** Phase 6 complete.

### 8.1 In-App Notification System
- [ ] `Notification` model: `recipientId`, `type`, `title`, `body`, `entityType`, `entityId`, `isRead`
- [ ] `GET /api/notifications`, `PUT /api/notifications/:id/read`
- [ ] Triggers: WBS task assigned, deadline ≤ 2 days, leave status changed, stock issued for job, low stock (Admin), new Job auto-created

### 8.2 Reporting Engine
- [ ] Install `exceljs` and `pdfkit`
- [ ] `GET /api/reports/wbs/:inquiryId` — WBS progress (planned vs actual hours)
- [ ] `GET /api/reports/inventory` — stock levels + job-wise summary (Excel export)
- [ ] `GET /api/reports/inventory/job-wise?jobNo=JOB-01` — materials used per job
- [ ] `GET /api/reports/attendance?month=&year=`, `GET /api/reports/leave?month=&year=`
- [ ] Build `Frontend/src/app/reports/page.tsx`

### 8.3 Analytics Dashboard Upgrade
- [ ] Install `recharts`
- [ ] WBS task completion trend chart, inventory stock level trend, job-wise material consumption chart

---

## Phase 9 — Cloud Deployment & Production ⏳

> **Prerequisites:** Phases 7 & 8 complete. All mock data eliminated.

- [ ] PostgreSQL provisioning (AWS RDS or Neon/Supabase)
- [ ] Change `schema.prisma` provider to `postgresql`
- [ ] Seed production DB (18 items, 5 jobs, employees)
- [ ] AWS EC2: Ubuntu 22.04, Node.js 20.x, PM2, Nginx reverse proxy, SSL (Certbot)
- [ ] Vercel: set `NEXT_PUBLIC_API_URL` to production EC2 URL
- [ ] GitHub Actions CI/CD: type-check + build + deploy on push to `main`
- [ ] HTTPS-only, rate-limit auth routes, secure cookie flags

---

## Phase 10 — ERP Expansion & Polish ⏳

> **Prerequisites:** Phase 9 complete.

- [ ] `Customer` model; link `Customer → Inquiry → Job` chain
- [ ] `AuditLog` model + `auditLogger.ts` middleware; build `/audit` (Admin-only)
- [ ] Gantt Chart view, WBS task dependencies, critical path highlighting
- [ ] Optional: `Vendor` + `PurchaseOrder` models; PO lifecycle → auto-creates `StockReceipt` on Received
- [ ] Replace simulated metrics with real `os.loadavg()`, `process.memoryUsage()`
- [ ] Mobile responsiveness, pagination, DB indexes
- [ ] `vitest` unit tests, `playwright` E2E tests (≥ 80% coverage)
- [ ] E2E flow: create inquiry → confirm → auto-create job → issue material → view job-wise summary

---

## Summary — Phase Dependencies

```mermaid
flowchart TD
    P1["✅ Phase 1\\nFoundation & Core UI"]
    P2["⏳ Phase 2\\nCleanup + UI Fixes\\n+ WBS Stats API (R1, R2, R3-remove, R8)"]
    P3["⏳ Phase 3\\nAuth + RBAC + Project Teams\\n(R4, R7-foundation)"]
    P4["⏳ Phase 4\\nInventory — Excel Schema\\nJob+StockItem+StockReceipt+StockIssue\\n(R3, R9)"]
    P5["⏳ Phase 5\\nEmployee Hub DB\\n(R5, R6-schema)"]
    P6["⏳ Phase 6\\nLeave System + HR Workflows\\n(R6, R7)"]
    P7["⏳ Phase 7\\nFile Management"]
    P8["⏳ Phase 8\\nNotifications + Reports"]
    P9["⏳ Phase 9\\nCloud Deployment"]
    P10["⏳ Phase 10\\nERP Expansion + Polish"]

    P1 --> P2
    P2 --> P3
    P3 --> P4
    P3 --> P5
    P4 --> P7
    P5 --> P6
    P6 --> P8
    P7 --> P8
    P8 --> P9
    P9 --> P10
```

---

## Milestone Targets

| Milestone | Phase(s) | Goal |
|-----------|---------|------|
| **M1 — Stable & Clean** | Phase 2 | Orders removed; all dashboard data from WBS; project dropdown + hold; sidebar fixed; WBS stats endpoint live |
| **M2 — Secured & Scoped** | Phase 3 | Microsoft SSO; all routes protected; team assignment; scoped employee views |
| **M3 — Inventory Live** | Phase 4 | Excel-schema inventory: Item Master, Stock IN, Stock OUT, Job Master, Job-wise Summary; Job auto-created on Inquiry confirmation; `job_id ↔ item_id` via `StockIssue` working |
| **M4 — HR Module Live** | Phase 5+6 | All Employee Hub in DB; WBS-aligned tasks with Job context; half-day leave; role-based routing |
| **M5 — Documents Live** | Phase 7 | File uploads; spec sheets attached to stock items |
| **M6 — Fully Communicating** | Phase 8 | Email notifications; Excel reports (inventory job-wise summary, WBS progress, attendance) |
| **M7 — Production Launch** | Phase 9 | Live on AWS EC2 + Vercel + PostgreSQL with CI/CD |
| **M8 — Enterprise ERP** | Phase 10 | Customer module; audit logs; Gantt charts; mobile; test suite |

---

## Requirements Traceability Matrix

| Client Req | Description | Phase | Tasks |
|------------|-------------|-------|-------|
| R1 | Project dropdown on homepage | 2 | §2.2 |
| R2 | Project Hold status | 2 | §2.3 |
| R3 | Remove Orders; Admin-only Inventory (Excel schema) | 2 (remove) + 4 (build) | §2.1, §4.1–4.6 |
| R4 | Project team assignment; employee-scoped view | 3 | §3.3, §3.4 |
| R5 | Employee tasks from WBS only | 5 | §5.2 |
| R6 | Half-day (AM/PM) + full-day leave | 5 (schema) + 6 (UI) | §5.1, §6.1 |
| R7 | Leave approval hierarchy by role + email routing | 3 (foundation) + 6 (full) | §3.2, §6.2, §6.3 |
| R8 | Fixed sidebar in Employee Hub | 2 | §2.4 |
| R9 | `job_id` (= `Job.jobNo`, auto-created on Inquiry confirmation) ↔ `item_id` (= `StockItem.itemCode`) via `StockIssue` join table | 4 | §4.1, §4.2, §4.3, §4.4 |

---

## Data Flow — WBS as Single Source of Truth

```
Frontend Request              → Backend API                          → Data Source
─────────────────────────────────────────────────────────────────────────────────────
Dashboard KPIs                → GET /api/wbs/stats?inquiryId=X       → WBS DB (Prisma)
Dashboard Production Pipeline → GET /api/wbs/phases?inquiryId=X      → WBS DB (Prisma)
Dashboard Dept. Checklist     → GET /api/wbs?inquiryId=X             → WBS DB (Prisma)
Project Dropdown              → GET /api/inquiries/confirmed          → Inquiries DB (Prisma)
Inventory Item Master         → GET /api/inventory/items              → StockItem (Prisma)
Stock IN Log                  → GET /api/inventory/receipts           → StockReceipt (Prisma)
Stock OUT Log (job×item R9)   → GET /api/inventory/issues             → StockIssue (Prisma)
Job-wise Summary              → GET /api/inventory/summary/job-wise   → Computed from StockIssue
Jobs (Job Master)             → GET /api/inventory/jobs               → Job (Prisma)
Inventory Dashboard KPIs      → GET /api/inventory/dashboard          → Computed from DB
Employee Tasks                → GET /api/employee-management/tasks    → WBSTaskAssignment (Prisma)
Leave Requests                → GET /api/employee-management/leaves   → LeaveApplication (Prisma)

❌ DELETED — NEVER USE THESE:
  GET /api/orders
  POST /api/orders
  PUT /api/orders/:id/stage
  PUT /api/orders/:id/remarks
  PUT /api/orders/:id/tasks/:t/toggle
```
"""

with open(r'd:\\Codes\\Free Lancing\\skytech\\ROADMAP.md', 'w', encoding='utf-8') as f:
    f.write(roadmap)
print(f'ROADMAP.md written: {len(roadmap)} chars, {len(roadmap.splitlines())} lines')
