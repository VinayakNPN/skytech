---
phase: 5
plans: 6
---

# Plan 5.1: Employee Hub Database Schema

## Objective
Update `Backend/prisma/schema.prisma` to include models required for the persistent Employee Hub: `WBSTaskAssignment`, `VisitReport`, `LeaveApplication`, `RunningJob`, and `SalarySlip`, and generate the database migration.

## Context
- .gsd/ROADMAP.md
- Backend/prisma/schema.prisma

## Tasks

<task type="auto">
  <name>Add Employee Hub Models to Prisma Schema</name>
  <files>Backend/prisma/schema.prisma</files>
  <action>
    Add the following models:
    - `WBSTaskAssignment`: join table between `WBSTask` and `Employee`
    - `VisitReport`: `employeeId`, `clientName`, `location`, `purpose`, `visitDate`, `remarks`
    - `LeaveApplication`: `employeeId`, `leaveType`, `fromDate`, `toDate`, `halfDayTime`, `reason`, `status`, `routedToRole`
    - `RunningJob`: `employeeId`, `inquiryId`, `description`, `progress`, `startDate`, `dueDate`
    - `SalarySlip`: `employeeId`, `month`, `year`, `basicSalary`, `allowances`, `deductions`, `netSalary`
    Connect relation fields to `Employee` and `WBSTask`.
  </action>
  <verify>npx prisma validate --schema Backend/prisma/schema.prisma</verify>
  <done>Prisma schema is updated and valid.</done>
</task>

<task type="auto">
  <name>Generate and Apply Migration</name>
  <files>Backend/prisma/schema.prisma</files>
  <action>
    Run `npx prisma migrate dev --name add_employee_hub_models` from the `Backend` directory.
  </action>
  <verify>npx prisma studio --help</verify>
  <done>Prisma migration applied to SQLite database.</done>
</task>

## Success Criteria
- [ ] Prisma schema contains all required Employee Hub models.
- [ ] Database migration successfully generated and applied.

---

# Plan 5.2: WBS Task Assignment API & UI

## Objective
Implement backend routes to assign employees to WBS tasks and add an assignment modal component in the WBS dashboard.

## Context
- Backend/src/routes/wbs.ts
- Frontend/src/app/wbs/page.tsx

## Tasks

<task type="auto">
  <name>Implement Task Assignment API Routes</name>
  <files>Backend/src/routes/wbs.ts</files>
  <action>
    - Implement `POST /api/wbs/tasks/:taskId/assign` (body: `{ employeeId }`).
    - Implement `DELETE /api/wbs/tasks/:taskId/assign/:employeeId`.
    - Ensure `GET /api/wbs` includes task assignments and assigned employee metadata.
  </action>
  <verify>curl -s http://localhost:5000/api/wbs</verify>
  <done>API routes for task assignment created and working.</done>
</task>

<task type="auto">
  <name>Build AssignEmployeeModal Component & UI</name>
  <files>Frontend/src/components/wbs/AssignEmployeeModal.tsx, Frontend/src/app/wbs/page.tsx</files>
  <action>
    - Build `AssignEmployeeModal.tsx` allowing assignment/unassignment of staff.
    - Wire modal trigger button into each task row in `Frontend/src/app/wbs/page.tsx`.
  </action>
  <verify>npm run build --prefix Frontend</verify>
  <done>WBS UI shows assigned employees and allows managing assignments.</done>
</task>

## Success Criteria
- [ ] WBS tasks can be assigned to employees in the DB and UI.

---

# Plan 5.3: Employee Tasks API & UI (WBS-Aligned)

## Objective
Derive employee tasks directly from assigned WBS tasks (per client requirement R5), removing standalone task creation.

## Context
- Backend/src/routes/employeeManagement.ts
- Frontend/src/app/employee-management/page.tsx

## Tasks

<task type="auto">
  <name>Implement Employee Tasks API</name>
  <files>Backend/src/routes/employeeManagement.ts</files>
  <action>
    - Implement `GET /api/employee-management/tasks?employeeId=X`.
    - Query `WBSTaskAssignment` joining `WBSTask` and `Inquiry` (with `Job` link for `jobNo`).
    - Return assigned tasks formatted for the employee task view.
  </action>
  <verify>curl -s http://localhost:5000/api/employee-management/tasks</verify>
  <done>Employee tasks endpoint returns WBS-assigned tasks with Job No.</done>
</task>

<task type="auto">
  <name>Update Task Tab UI</name>
  <files>Frontend/src/app/employee-management/page.tsx</files>
  <action>
    - Remove the "+ Add Task" button and standalone task creation form from the Tasks tab (per R5).
    - Connect Task tab to `GET /api/employee-management/tasks`.
    - Display `Job No` badge on each task item.
  </action>
  <verify>npm run build --prefix Frontend</verify>
  <done>Tasks tab derives exclusively from WBS task assignments.</done>
</task>

## Success Criteria
- [ ] Employee tasks are derived from WBS task assignments.
- [ ] Standalone task creation is removed.

---

# Plan 5.4: Attendance & Visit Reports Migration

## Objective
Migrate Attendance and Visit Reports in Employee Hub from mock data to Prisma DB persistence.

## Context
- Backend/src/routes/employeeManagement.ts
- Frontend/src/app/employee-management/page.tsx

## Tasks

<task type="auto">
  <name>Attendance & Visit Reports API</name>
  <files>Backend/src/routes/employeeManagement.ts</files>
  <action>
    - Implement `GET /api/employee-management/attendance` & `POST /api/employee-management/attendance/clock` (clock-in/clock-out).
    - Implement `GET /api/employee-management/visit-reports` & `POST /api/employee-management/visit-reports`.
  </action>
  <verify>curl -s http://localhost:5000/api/employee-management/attendance</verify>
  <done>Attendance and Visit Reports APIs connected to Prisma DB.</done>
</task>

<task type="auto">
  <name>Connect Frontend Attendance & Visit Reports Tabs</name>
  <files>Frontend/src/app/employee-management/page.tsx</files>
  <action>
    - Replace mock data calls in Attendance and Visit Reports tabs with `fetch()` calls to the new backend endpoints.
  </action>
  <verify>npm run build --prefix Frontend</verify>
  <done>Attendance and Visit Reports tabs display real DB data.</done>
</task>

## Success Criteria
- [ ] Attendance and Visit Reports persist in SQLite via Prisma.

---

# Plan 5.5: Running Jobs & Salary Slips Migration

## Objective
Migrate Running Jobs and Salary Slips in Employee Hub from mock data to Prisma DB persistence.

## Context
- Backend/src/routes/employeeManagement.ts
- Frontend/src/app/employee-management/page.tsx

## Tasks

<task type="auto">
  <name>Running Jobs & Salary Slips API</name>
  <files>Backend/src/routes/employeeManagement.ts</files>
  <action>
    - Implement `GET /api/employee-management/running-jobs` & `PUT /api/employee-management/running-jobs/:id/progress`.
    - Implement `GET /api/employee-management/salary-slips` & `POST /api/employee-management/salary-slips`.
  </action>
  <verify>curl -s http://localhost:5000/api/employee-management/salary-slips</verify>
  <done>Running Jobs and Salary Slips APIs connected to Prisma DB.</done>
</task>

<task type="auto">
  <name>Connect Frontend Running Jobs & Salary Slips Tabs</name>
  <files>Frontend/src/app/employee-management/page.tsx</files>
  <action>
    - Update Running Jobs and Salary Slips tabs to use `fetch()` to load and update DB records.
  </action>
  <verify>npm run build --prefix Frontend</verify>
  <done>Running Jobs and Salary Slips tabs display real DB data.</done>
</task>

## Success Criteria
- [ ] Running Jobs and Salary Slips persist in SQLite via Prisma.

---

# Plan 5.6: HR Dashboard & Mock Data Cleanup

## Objective
Connect HR Dashboard metrics to real DB data and purge runtime mock data arrays from `mockData.ts`.

## Context
- Backend/src/routes/employeeManagement.ts
- Frontend/src/app/employee-management/page.tsx
- Frontend/src/lib/mockData.ts

## Tasks

<task type="auto">
  <name>HR Dashboard Metrics Endpoint</name>
  <files>Backend/src/routes/employeeManagement.ts</files>
  <action>
    - Implement `GET /api/employee-management/dashboard`: query total employees, today present count, on leave count, pending leave applications, active WBS tasks.
    - Connect HR Dashboard stats overview in `Frontend/src/app/employee-management/page.tsx` to this endpoint.
  </action>
  <verify>curl -s http://localhost:5000/api/employee-management/dashboard</verify>
  <done>HR Dashboard shows real metrics from Prisma DB.</done>
</task>

<task type="auto">
  <name>Purge Runtime Arrays from mockData.ts</name>
  <files>Frontend/src/lib/mockData.ts</files>
  <action>
    - Remove runtime mock arrays (`mockOrders`, `mockEmployeeAttendance`, `mockLeaveApplications`, `mockRunningJobs`, `mockSalarySlips`, `mockVisitReports`).
    - Keep only TypeScript interfaces and constants.
  </action>
  <verify>npm run build --prefix Frontend</verify>
  <done>mockData.ts contains only TypeScript interfaces with zero runtime arrays.</done>
</task>

## Success Criteria
- [ ] HR Dashboard metrics are live from the database.
- [ ] Runtime mock arrays are completely eliminated.
