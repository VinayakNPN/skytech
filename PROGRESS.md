# Skytech Project Progress Log

This document tracks daily progress, commits, and major milestones achieved during the development of the Skytech software project.

## July 23, 2026

### Frontend & UI Improvements
- **Dashboard Scope & KPI Update:** Upgraded dashboard KPI metrics (overall progress, active departments, tasks completed, staff attendance, etc.) to derive from project-specific state rather than generic overall data.
- **Production Flow Sequential Workflow:** Implemented a strict sequential workflow for department phases on the dashboard. A project cannot move to the next department (e.g., Mechanical) until the previous department (e.g., Design) is 100% complete.
- **Visual Lock State:** Added UI lock states (greyed out UI, lock icons, blocked toggles) for incomplete future phases to prevent accidental skipping in the workflow.
- **Context Banners:** Added a "Selected Project Context Banner" to explicitly show the inquiry code, project title, and client name when interacting with project phases.
- **Navigation Tweaks:** Configured the logo/header in the Employee Hub sidebar to redirect back to the employee dashboard.
- **Hold Modal & List Filtering Fix:** Fixed tab filtering logic so that placing a project on hold immediately removes it from active list views (`All`, `Confirmed`, `Offer Sent`, etc.) and moves it exclusively to the `On Hold` tab. Added optimistic UI updates for both `Hold` and `Resume` actions to ensure immediate responsive UI feedback.
- **Hold Modal Fixes:** Removed pre-filled text in the project "Hold" reason modal to ensure genuine remarks are captured.

### Backend & Architecture
- **Hold Status API Enhancements:** Updated `/api/inquiries/:id/hold` and `/api/inquiries/:id/resume` routes to look up projects by either their Database UUID or their readable `inquiryCode` (e.g., INQ_01).
- **CORS Configuration:** Verified CORS setup on the Render backend to allow traffic from the Vercel frontend domain.
- **Error Handling:** Integrated Zod validation, Winston logging, and global error middleware to harden the backend against improper payloads.

---

## July 24, 2026

### Order Management Removal & WBS Single Truth (Phase 2)
- **Order System Removal:** Fully deleted legacy `/orders` route, `orders.ts` backend endpoints, and mock order models.
- **WBS-Centric Dashboard Data:** Redirected all dashboard data requests (KPI stats, phase pipeline, checklist items) to `/api/wbs`, `/api/wbs/stats`, and `/api/wbs/phases`.
- **Project Dropdown Selector:** Created `ProjectDropdown.tsx` to allow switching active project context directly from the main dashboard cockpit.

### Authentication, RBAC & Project Teams (Phase 3)
- **SSO & Auth Infrastructure:** Integrated Microsoft Entra ID MSAL authentication (`msalConfig.ts`), JWT session validation middleware, and `AuthContext.tsx`.
- **Project Team Assignments:** Implemented `ProjectTeam` schema, `projectTeams.ts` route, and `AssignTeamModal.tsx` UI component to assign project leads and members.
- **RBAC Permissions:** Added role-based access control (`permissions.ts`) across Admin, Manager, HR, Engineer, Supervisor, and Operator roles.

### Excel Inventory Schema Integration (Phase 4)
- **1:1 Excel Mapping:** Created `Job`, `StockItem`, `StockReceipt`, and `StockIssue` models aligned 1:1 with `Skytech_Store_Inventory_Management.xlsx`.
- **Job-Item Join Table (R9):** Implemented core relationship joining `jobNo` (job_id) and `itemCode` (item_id) via `StockIssue` for material tracking.
- **Auto Job Creation:** Enabled automated `Job` record creation whenever an Inquiry status transitions to `Confirmed`.

---

## July 25, 2026

### Employee Hub Database Persistence (Phase 5)
- **WBS Task Alignment (R5):** Replaced standalone employee tasks with WBS task assignments (`WBSTaskAssignment`), establishing WBS as the single source for task management.
- **WBS Task Assignment Modal:** Built `AssignEmployeeModal.tsx` allowing managers to assign team members to specific WBS tasks.
- **Database Persistence:** Migrated Attendance (`AttendanceTab.tsx`), Visit Reports, Running Jobs, and Salary Slips from mock arrays to Prisma DB models.

### Leave System & HR Workflows (Phase 6)
- **Flexible Leave Types (R6):** Added support for `Full Day`, `Half Day - AM`, and `Half Day - PM` leave applications.
- **Hierarchical Approval Routing (R7):** Implemented automated role-based routing (`leaveRouting.ts`) directing leave applications to the designated approver (Manager -> Admin, Staff -> HR).
- **Email Notifications:** Integrated `emailService.ts` using `nodemailer` for automated email alerts on leave application submission and status updates.
- **Frontend Leave UI:** Updated `/employee-management` UI with leave application modals and pending approval sub-tabs.

---

## August 6, 2026

### Inquiry Management & Status Workflows
- **Dual UUID & InquiryCode Lookup:** Updated `Backend/src/routes/inquiries.ts` (`PUT /:id` and `DELETE /:id`) to resolve inquiries by either UUID or human-readable `inquiryCode` (e.g., `JOB-09`), fixing DB status updates when moving inquiries to `Confirmed`.
- **Strict Contact Phone Validation:** Enforced 10-digit Indian mobile number validation (`/^(?:\+91)?([6-9]\d{9})$/`) across both Add and Edit inquiry forms.
- **Gated Offer Details Modal:** Integrated automated quotation details modal check whenever an inquiry is set to `Offer Sent` during creation or editing.
- **Edit Modal Hardening:** Fixed Edit Inquiry status dropdown locking logic (`editingInquiryOriginalStatus`) and added inline `{formError}` alert banner rendering.

### WBS & Project Roster Persistence
- **Inquiry Management Team Linkage:** Dynamically resolved WBS phase `OWNER` fields from the project team roster assigned in Inquiry Management (`/api/projects/:inquiryId/team`), replacing generic seed text (`Design Lead`, `Store Manager`, `Mech Supervisor`, etc.) with real employee names.
- **Persistent Project Context:** Updated WBS to persist active project selection in `localStorage` (`skytech_selected_project_id`). Navigating away from WBS and returning now automatically loads the active project without requiring re-selection.
- **WBS Staff Assignment Modal:** Enhanced `AssignEmployeeModal.tsx` to fetch the project team roster and prioritize project roster members at the top of the list with a `[Project Roster]` badge.
- **Excel Upload Modal Hook Fix:** Resolved React Rules of Hooks crash in `ExcelUploadModal.tsx` by moving `useRef` calls above early returns, and made the entire dropzone clickable.

### Dashboard & Navigation Refinements
- **Running Jobs on Main Dashboard:** Transferred field engineering site projects directly onto the main home dashboard (`page.tsx`) complete with interactive progress sliders (`0-100%`) for live site tracking.
- **Sidebar Active Programme Filter:** Filtered the sidebar `ACTIVE PROGRAMME` project dropdown to strictly display confirmed, active inquiries (`status === 'Confirmed' && !holdStatus`), eliminating unconfirmed projects (`JOB-11`, `JOB-12`) from the list.
- **Assigned Team Overlay Theme Alignment:** Styled the "Assigned Team Roster" modal overlay with SkyTech's signature dark navy (`#0B1728`) and crisp emerald theme (`#0E3B68` avatars, emerald badges, dark header).
- **Confirmed Projects List Clean-up:** Removed software `⚠ Check` warning badge from confirmed project list items on the main dashboard.

### Inventory Management & Tool Analytics
- **Job-wise Summary Matrix Redesign:** Re-engineered the matrix view to display vertical Job columns based on user specifications.
- **Empty Job Filter:** Filtered the Job-wise summary view to show only jobs with actual issued materials, completely removing empty job columns.
- **Tool Inventory KPI Analytics:** Added 4 analytics cards (*Tools In Use*, *Site Issue Trips*, *Most Used Tool*, *Jobs Supplied*) below Low Stock Alerts.
- **Interactive KPI Cards:** Configured stock valuation to render steadily on load, made *TOTAL STOCK ITEMS* switch tabs, and made *LOW STOCK ALERTS* smoothly scroll down to the alert table.

### WBS & Employee Hub Streamlining
- **WBS Duplicate Controls Cleanup:** Removed duplicate Expand All / Collapse All buttons from the WBS project selector bar while keeping the main Controls Bar buttons intact.
- **Tab Consolidation:** Removed legacy standalone Tasks tab (fully replaced by WBS) and disabled the Running Jobs tab in Employee Management with clean redirects.

### Employee Directory Administration
- **Edit Employee Details:** Implemented `PUT /api/employees/:id` backend endpoint and added an admin-only Edit Employee modal (`employees/page.tsx`) to update employee name, email, designation, department, RBAC role, and status.

---

## August 12, 2026

### API & Authentication Fixes
- **Employee Management Fetch URL Fix:** Fixed critical bug where ~10 `fetch()` calls in `employee-management/page.tsx` used single-quoted template strings (`'${API_BASE_URL}/...'`), preventing string interpolation and breaking backend communication. Converted all fetch calls to proper template literals.

### Global Toast System & App Loading
- **Toast Notification System:** Built `Toast.tsx` (`ToastProvider` & `useToast` hook) with dark navy/emerald styling, auto-dismiss, and slide-in animations. Replaced blocking browser `alert()` popups across the app with clean, non-blocking toast notifications. Wrapped `DashboardLayout` with `ToastProvider` for app-wide availability.
- **App Loading Skeleton:** Added `loading.tsx` to `Frontend/src/app` with animated dot-pulse indicator for instant loading feedback.

### Calendar Progress History (localStorage)
- **Historical Date Snapshots:** Implemented local history snapshots for project progress on the main dashboard (`page.tsx`). Toggling task completion on any date automatically saves a dated snapshot (`skytech_progress_history_${projectId}_${dateStr}`).
- **Snapshot Navigation Banner:** Clicking a past date on the calendar loads that day's saved progress state and displays a prominent *"Viewing Historical Progress Snapshot"* banner with a single-click *"Return to Today"* button.

### WBS Enhancements & Backend Notes Integration
- **WBS Notes & Error/Issue Tracking:** Added `notes` and `errorFlag` optional columns to the `WBSTask` Prisma model and executed database schema sync (`prisma db push`).
- **WBS Table Inline Editing:** Added `NOTES` and `ERROR / ISSUE` columns to the WBS hierarchical tree table with inline blur-to-save API persistence, as well as input fields in the Edit Task modal.
- **Dashboard Notes Sync:** Renamed Card 5 on the main dashboard pipeline from *"REMARK"* to *"NOTES"* and added auto-saving with instant toast feedback (`✓ Note saved for [Dept]`).

### Employee Leave Balances & HR Controls
- **Per-Employee Leave Balances:** Added `casualLeaveBalance`, `sickLeaveBalance`, and `privilegeLeaveBalance` fields to the `Employee` model and built `PATCH /api/employees/:id/leave-balance` backend route.
- **Dynamic Leave UI & HR Editing:** Updated Leave Management UI to show live per-employee leave balances based on selected employee context, and added an HR-editable inline control for Casual Leave (CL) balances. Added automated balance deduction and toast alerts upon leave approval.

### Inventory Toolkit & Excel Integration
- **Excel Toolkit Template Generator:** Integrated `XLSX` template generator in `inventory/page.tsx` with a *"Template"* button to download `SkyTech_Inventory_Toolkit_Template.xlsx` pre-populated with sample sheets (*Job Master*, *Item Master*, *Stock IN*, *Stock OUT*).
- **Import Excel Button:** Placed a prominent *"Import Excel"* button in the Tool Inventory & Site Visit Analytics header opening the dropzone upload modal.
- **Upload Error Messaging:** Updated `ExcelUploadModal.tsx` error handler to provide clear diagnostic feedback when the backend API server is unreachable.

---

## August 13, 2026

### Employee Management, Leave Deduction & Site Visits
- **Leave Category Deduction Fix (CL / SL / PL):** Fixed leave deduction system so approved leaves deduct strictly from the selected category (`casualLeaveBalance` for CL, `sickLeaveBalance` for SL, `privilegeLeaveBalance` for PL). Added local storage and payload hydration (`leaveCategory`) ensuring categories persist across backend syncs and page reloads.
- **Site Visit Log Toast Notification:** Removed double-toast alerts on site visit report logging. Unified online and offline fallback flows into a single clean success toast (`✓ Site visit logged successfully`).

### Dashboard Notes & Notification System
- **Clean Notes Card Initialization:** Resolved issue where unedited projects displayed static mock remarks in the Dashboard NOTES card. Projects with no manual notes now initialize with clean empty text boxes and explicit placeholders.
- **Client-Tailored Activity Notifications:** Replaced technical developer toast text with client-friendly activity log notifications (`📝 New note added for [JOB-01] Electrical: "Control wiring..."`) and seeded initial bell dropdown items with client-centric events.

### WBS Table Layout & Team Roster
- **100% Non-Scrollable Table Layout:** Re-architected WBS tree table column widths to proportional percentage allocations (`5% WBS`, `24% Task Name`, `7% Phase`, `12% Owner`, `7% Plan/Act`, `9% Status`, `11% Progress`, `9% Notes`, `11% Issue`, `9% Actions`), providing even horizontal breathing room across all columns without requiring horizontal scrollbars.
- **Table & Modal Typography Polish:** Unbolded `OWNER` and `PLAN/ACT` table cells (`font-normal`) and unbolded text inside the "Assigned Team Roster" modal for clean, spacious, and un-congested visual presentation.
- **Project-Scoped Team Counter:** Scoped Assigned Members counter and team overlay modal strictly to the active project ID (`selectedProjectId`), accurately displaying `0 Members on project` for projects without team assignments.

### Inventory & UI Enhancements
- **Technician Badge Typography:** Upgraded "Issued To" technician text in Job-wise Material Summary to high-contrast `text-xs font-bold` badges.
- **Interactive Refresh Feedback:** Added an animated spinning icon state and toast confirmation (**`✓ System metrics refreshed`**) to the Inventory Refresh Data button.

---
*Note: Order Management has been fully removed from the codebase. WBS serves as the single source of truth for project execution.*



