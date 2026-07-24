# SkyTech SPMS — Architectural & Design Decisions

> **Project**: SkyTech Program Management System (SPMS)  
> **Client**: Skytech Switchgear Pvt. Ltd.  
> **Last Updated**: 2026-07-25  

This document logs all key architectural, technical, and domain decisions made during the development of SkyTech SPMS, including the rationale, trade-offs, and alternative approaches considered.

---

## 📋 Summary of Decisions

| # | Decision Topic | Status | Chosen Approach | Alternatives Considered |
|---|----------------|--------|-----------------|-------------------------|
| **AD-01** | Single Source of Truth for Progress | **Approved & Implemented** | WBS Module (`/api/wbs`) as sole source of truth | Dual Order & WBS tracking |
| **AD-02** | Inventory & Job Linkage (R9) | **Approved & Implemented** | `Job.jobNo` ↔ `StockItem.itemCode` via `StockIssue` | Storing materials inside WBS tasks |
| **AD-03** | Employee Task Assignment (R5) | **Approved & Implemented** | Tasks derived 100% from `WBSTaskAssignment` | Separate Employee Task creation form |
| **AD-04** | Global Project State Scope (R1) | **Approved & Implemented** | Sidepanel selector + `localStorage` + `CustomEvent` | Redux / React Context state tree |
| **AD-05** | Leave Management Workflows (R6, R7) | **Approved & Implemented** | Half-Day/Full-Day support with role-based routing | Basic single-approver full-day leave |
| **AD-06** | Database Architecture | **Approved & Implemented** | SQLite via Prisma ORM (PG-ready) | Raw `sqlite3` or NoSQL (MongoDB) |
| **AD-07** | Input Validation & Safety | **Approved & Implemented** | Express Zod schema validation middleware | Manual per-route `if (!field)` checks |

---

## 🔍 Detailed Decision Records

### AD-01: Single Source of Truth for Manufacturing Progress (WBS vs Order Management)

- **Context**: Initially, the application had both an Order Management module (`/api/orders`) and a WBS module (`/api/wbs`). This created duplicate representations of manufacturing stages and progress metrics.
- **Decision Taken**: **Fully eliminate Order Management** and deprecate `/api/orders`. Every dashboard widget, production pipeline, department checklist, and KPI statistic fetches data directly from the WBS API (`/api/wbs`).
- **Alternatives Considered**:
  1. *Maintain both Order Management and WBS*: Sync data bidirectionally between `Order` and `WBSTask`.
     - *Why Rejected*: High complexity, potential race conditions, and user confusion over which view represents true progress.
  2. *Use Order Management as primary and WBS as secondary*:
     - *Why Rejected*: The client explicitly specified that project execution and department progress are structured around WBS phases.
- **Consequences & Benefits**:
  - Simplified database schema (`schema.prisma`).
  - Zero state synchronization bugs.
  - Clear domain alignment with client business operations.

---

### AD-02: Inventory Management & Job Master Mapping (R9)

- **Context**: Client workbook `Skytech_Store_Inventory_Management.xlsx` contains Job Master, Item Master, Stock IN, Stock OUT, and Job-wise Issue Summary sheets.
- **Decision Taken**: Implement a **1:1 Prisma model translation of the Excel workbook**:
  - `Job.jobNo` (e.g. `JOB-01`) auto-created upon `Inquiry` confirmation.
  - `StockItem.itemCode` (e.g. `MCB-006`) as master stock items.
  - `StockIssue` as the core join table linking `jobNo` (job_id) and `itemCode` (item_id).
- **Alternatives Considered**:
  1. *Embed material requests directly inside WBS tasks*:
     - *Why Rejected*: Deviates from store manager operations; inventory issues happen at the store room level per job, not per subtask.
  2. *Build a complex multi-warehouse ERP inventory*:
     - *Why Rejected*: Over-engineered for client's single-location store room setup.
- **Consequences & Benefits**:
  - Seamless Excel data import/export compatibility.
  - Exact match with store manager's existing workflow.

---

### AD-03: Employee Task Allocation (R5)

- **Context**: Employees needed visibility into assigned work in the Employee Hub.
- **Decision Taken**: **Derive employee tasks 100% from WBS task assignments (`WBSTaskAssignment`)**. Standalone task creation forms were removed.
- **Alternatives Considered**:
  1. *Allow dual task creation*: Independent tasks created in Employee Hub alongside WBS assignments.
     - *Why Rejected*: Client explicitly requested (R5) that employees do not have separate tasks outside of project WBS assignments.
- **Consequences & Benefits**:
  - All employee hours and tasks map directly to billable/trackable WBS sub-tasks.
  - Clear accountability per project.

---

### AD-04: Active Project Context & Navigation (R1)

- **Context**: Users need to select an active project from anywhere in the application and have all views (Dashboard, WBS, Inventory) automatically scope to that project.
- **Decision Taken**: Build a persistent **Active Programme selector in `DashboardLayout.tsx` sidepanel**. Selected `inquiryId` is persisted in `localStorage` (`skytech_selected_project_id`) and broadcast across components using `window.dispatchEvent(new CustomEvent('projectChanged'))`.
- **Alternatives Considered**:
  1. *Global Redux / React Context provider*:
     - *Why Rejected*: Requires wrapping top-level Next.js layout, causing unnecessary page re-renders on route changes.
  2. *URL Query Parameters (`?projectId=XYZ`)*:
     - *Why Rejected*: Clutters URLs and requires passing query params manually across every link navigation.
- **Consequences & Benefits**:
  - Instant cross-tab and cross-page synchronization.
  - Clean URLs and lightweight client state.

---

### AD-05: Leave Workflow & Approval Routing (R6, R7)

- **Context**: Employee leave requests require flexible durations and hierarchy-aware approval.
- **Decision Taken**: Add support for `Full Day`, `Half Day - AM`, and `Half Day - PM` leave types. Implement automated role-based routing (`routedToRole`):
  - Operator / Supervisor / Engineer → **HR**
  - HR → **Manager**
  - Manager → **Admin**
- **Alternatives Considered**:
  1. *Single static approver (e.g. Admin only)*:
     - *Why Rejected*: Overburdens Admin and ignores company management structure.
- **Consequences & Benefits**:
  - Realistic workplace leave tracking (half-days).
  - Proper organizational hierarchy enforcement.

---

### AD-06: Database Engine & ORM Selection

- **Context**: Rapid local prototyping vs. future production cloud deployment.
- **Decision Taken**: **Prisma ORM with SQLite for local development**.
- **Alternatives Considered**:
  1. *Raw SQL queries with `sqlite3`*:
     - *Why Rejected*: Lack of type safety, schema migrations, and high refactoring effort when switching to PostgreSQL.
  2. *MongoDB / NoSQL*:
     - *Why Rejected*: Project data is highly relational (Inquiries ↔ Jobs ↔ WBS ↔ Stock Issues ↔ Employees).
- **Consequences & Benefits**:
  - Full TypeScript type safety across backend.
  - Zero-code-change migration to PostgreSQL for production deployment in Phase 9.

---

### AD-07: Backend Input Validation & Code Hardening

- **Context**: Preventing invalid payloads (e.g., negative stock issues, malformed emails) from corrupting the database.
- **Decision Taken**: Implement **Zod schema validation middleware** (`validateBody`) on all mutating express routes.
- **Alternatives Considered**:
  1. *Manual inline checks inside controller functions*:
     - *Why Rejected*: Error-prone, repetitive, and inconsistent error responses.
- **Consequences & Benefits**:
  - Standardized 400 validation error formatting.
  - Guaranteed data integrity at API entry points.
