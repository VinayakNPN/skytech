# SkyTech SPMS — Comprehensive Progress Report (Till Date)

> **Project Name**: SkyTech Program Management System (SPMS)  
> **Client**: Skytech Switchgear Pvt. Ltd.  
> **Status**: Core Features & Database Integration Completed  
> **Last Updated**: July 19, 2026  

---

## Executive Summary

The **SkyTech Program Management System (SPMS)** is an enterprise manufacturing management and program execution web application built specifically for switchgear and electrical panel manufacturing.

To date, the core frontend user interface, backend Express API server, dynamic WBS engine, commercial inquiry pipeline, employee management directory, auto-advancing production workflow engine, and full **Prisma ORM Database Persistence Layer** have been successfully implemented and verified.

---

## 1. Accomplished Key Features & Modules

### A. Navigation & Shell Layout System
- **Dark Navy Side Panel**: Matches enterprise design standards (`#0B1728` Navy background, uppercase section headers `PROGRAMME` & `MANAGEMENT`, blue active pills `#1D89F5`, quick task search input).
- **Persistent Sidebar State**: Remembers expand/collapse state in browser `localStorage` (`skytech_sidebar_open`).
- **Flicker-Free Render**: Implemented pre-paint inline script + mounted transition locks to eliminate initial render flash.
- **Top Navigation Bar**: Displays page titles, connection status indicators, quick alert badges, and user profile popover.

---

### B. Dynamic Main Dashboard (`/`)
- **Header Control Bar**: Interactive Date Picker with real-time day navigation and calendar view.
- **Commercial Inquiry Pipeline Summary Bar**: Compact live backend-connected conversion metrics bar displaying Total Inquiries, Offers Sent, Confirmed Orders, Unconfirmed Inquiries, and Conversion Win Rate %.
- **4 Key Performance Indicator (KPI) Stat Cards**: Overall Completion %, Active Tasks Count, Staff Attendance %, and Active Manufacturing Phase.
- **Production Flow & Phases Overview Pipeline**:
  - Visual nodes representing 7 manufacturing departments (`Design`, `Mechanical`, `Assembly & Busbar`, `Electrical`, `Testing`, `Store`, `Support & Service`).
  - **Dynamic Phase Auto-Advancement Engine**: Automatically advances active department focus to the next incomplete phase in sequence (e.g. when Assembly & Busbar reaches 6/6 complete, focus advances to Electrical Dept.).
  - **Interactive Department Task Checklist & Remark Notes Box**: Real-time task completion checkboxes and remark autosaving.

---

### C. Inquiry Management Module (`/inquiries`)
- **Dedicated Page**: Separated heavy inquiry management off the main dashboard into a standalone view.
- **Commercial Funnel Visualizer**: Interactive chart comparing inquiries over 1-week, 4-week, and 8-week horizons.
- **Client Inquiry Table**: Searchable table with status filters (`Confirmed`, `Offer Sent`, `Unconfirmed`).
- **`+ Add Inquiry` Modal Dialog**: Allows registering new client inquiries, proposal amounts, client contacts, and statuses live in the database.

---

### D. Work Breakdown Structure (WBS) Module (`/wbs`)
- **Confirmed Project Selector**: Top dropdown populated with confirmed customer inquiries (e.g., `INQ-101`, `INQ-103`, `INQ-105`, `INQ-107`).
- **Hierarchical WBS Tree Table**: Displays 9 manufacturing phases (`1.0` through `9.0`) with sub-tasks.
- **Edit Task Modal Popup**: Pencil icon opens modal dialog to edit WBS Code, Task Name, Target Phase, Owner, Plan/Actual Hours, Status, and % Progress.
- **Confirm Task Deletion Modal**: Trash icon triggers warning popup before removing tasks.
- **`+ Add Task` Modal**: Allows adding custom sub-tasks under any phase.

---

### E. Staff & Employee Directory (`/employees`)
- **Employee Cards Grid**: Displays staff members, department allocations, designations, and RBAC access roles (`Admin`, `Engineer`, `Supervisor`, `Operator`, `Viewer`).
- **`+ Add New Employee` Modal Dialog**: Form to register new staff accounts with department and role assignments.
- **Status Toggles**: Quick buttons to mark employees `Active` or `On Leave`.
- **Microsoft OAuth SSO Identifier**: Database schema prepared with `microsoftId` for SSO integration.

---

## 2. Database Architecture & API Layer

### Database Engine & Prisma ORM
- **Engine**: SQLite for local zero-config development (`dev.db`), 100% path to deploy to **PostgreSQL on AWS EC2** via Prisma config.
- **Prisma Client**: Type-safe database client (`Backend/src/db/prisma.ts`) generating TypeScript types for all database models.
- **Automated Seeding**: [`Backend/prisma/seed.ts`](file:///c:/Users/Vinayak/Documents/Freelance/SkyTech/skytech/Backend/prisma/seed.ts) populates inquiries, employee accounts, and WBS phase tasks upon initial setup.

### Express REST API Routes
| Endpoint | Method | Description | Persistence |
| :--- | :--- | :--- | :--- |
| `/api/inquiries` | GET, POST, PUT, DELETE | Client inquiries & conversion metrics | Live Database |
| `/api/inquiries/stats` | GET | Calculated pipeline win rates | Live Database |
| `/api/wbs` | GET | Full 9-phase WBS hierarchy with sub-tasks | Live Database |
| `/api/wbs/tasks` | POST, PUT, DELETE | WBS task CRUD & completion progress | Live Database |
| `/api/employees` | GET, POST, PUT | Staff directory & account registration | Live Database |

---

## 3. Progress Summary & Status Matrix

| Module / Requirement | Status | Verification |
| :--- | :---: | :--- |
| Dark Navy Side Panel Styling & Persistence | **Completed** | Verified in `DashboardLayout.tsx` |
| Sidebar Collapse Flicker Prevention | **Completed** | Verified via pre-paint inline script |
| Dashboard Inquiry Pipeline Summary | **Completed** | Connected to live backend stats API |
| Dynamic Phase Auto-Advancement Logic | **Completed** | Automatically advances completed phases |
| Standalone Inquiry Management Page | **Completed** | Verified at `/inquiries` |
| `+ Add Inquiry` Modal Popup | **Completed** | Saves directly to database |
| WBS Confirmed Project Dropdown | **Completed** | Integrates confirmed inquiries with WBS |
| WBS Task Edit & Delete Popup Modals | **Completed** | Full CRUD wired to database |
| Staff Directory & `+ Add New Employee` Modal | **Completed** | Verified at `/employees` |
| Prisma ORM & Database Persistence | **Completed** | Verified SQLite `dev.db` & Prisma Client |
| Zero Build Errors (Frontend & Backend) | **Completed** | Both `npm run build` commands pass |

---

## 4. Next Milestone Roadmap

1. **Microsoft OAuth SSO Integration**: Implement Azure AD / Entra ID authentication login for employee accounts.
2. **Order Management & BOM Requisition (`/orders`)**: Connect panel manufacturing jobs to store material requisitions.
3. **AWS EC2 Cloud Deployment**: Push backend code and migrate Prisma schema to cloud PostgreSQL instance on AWS EC2.
