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
*Note: We have temporarily deferred the deletion of the Order Management system while considering the best architectural approach for inventory management mapping.*
