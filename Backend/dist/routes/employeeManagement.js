"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../db/prisma");
const mockData_1 = require("../data/mockData");
const leaveRouting_1 = require("../utils/leaveRouting");
const emailService_1 = require("../utils/emailService");
const router = (0, express_1.Router)();
// GET Employee Management Dashboard Summary data
router.get('/dashboard', async (req, res) => {
    try {
        (0, mockData_1.logSystemEvent)('API Server', 'GET /api/employee-management/dashboard', 'info');
        const totalEmployees = await prisma_1.prisma.employee.count();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const attendancesToday = await prisma_1.prisma.attendance.findMany({
            where: { date: { gte: today } },
            include: { employee: { select: { name: true, empCode: true, department: true } } }
        });
        const presentCount = attendancesToday.filter(a => a.status === 'Present' || a.status === 'Late').length;
        const leaveCount = await prisma_1.prisma.leaveApplication.count({
            where: { status: 'Approved', fromDate: { lte: new Date() }, toDate: { gte: new Date() } }
        });
        const pendingLeaves = await prisma_1.prisma.leaveApplication.count({ where: { status: 'Pending' } });
        const activeWbsTasksCount = await prisma_1.prisma.wBSTask.count({ where: { status: 'IN PROGRESS' } });
        const recentAttendance = await prisma_1.prisma.attendance.findMany({
            take: 5,
            orderBy: { date: 'desc' },
            include: { employee: { select: { name: true, empCode: true, department: true } } }
        });
        const activeTasks = await prisma_1.prisma.wBSTaskAssignment.findMany({
            take: 5,
            include: {
                wbsTask: {
                    include: {
                        inquiry: {
                            include: { jobs: true }
                        }
                    }
                },
                employee: { select: { name: true, empCode: true } }
            }
        });
        const runningJobs = await prisma_1.prisma.runningJob.findMany({
            take: 5,
            include: { employee: { select: { name: true, empCode: true } } }
        });
        res.json({
            stats: {
                totalEmployees,
                presentToday: presentCount,
                onLeaveToday: leaveCount,
                pendingLeaves,
                activeTasks: activeWbsTasksCount
            },
            todayAttendance: recentAttendance,
            activeTasks,
            runningJobs
        });
    }
    catch (err) {
        console.error('[DB Error] GET /api/employee-management/dashboard:', err);
        res.status(500).json({ error: 'Failed to fetch HR dashboard stats' });
    }
});
// GET all attendance logs
router.get('/attendance', async (req, res) => {
    try {
        (0, mockData_1.logSystemEvent)('API Server', 'GET /api/employee-management/attendance', 'info');
        const logs = await prisma_1.prisma.attendance.findMany({
            include: { employee: { select: { name: true, empCode: true, department: true } } },
            orderBy: { date: 'desc' }
        });
        res.json(logs);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch attendance logs' });
    }
});
// POST clock-in
router.post('/attendance/clock', async (req, res) => {
    try {
        const { employeeId, time, status = 'Present' } = req.body;
        if (!employeeId || !time) {
            return res.status(400).json({ error: 'employeeId and time are required' });
        }
        const record = await prisma_1.prisma.attendance.create({
            data: {
                employeeId,
                date: new Date(),
                clockIn: time,
                status
            },
            include: { employee: { select: { name: true, empCode: true, department: true } } }
        });
        res.json(record);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to clock attendance' });
    }
});
// GET all WBS-derived employee tasks (Client R5 requirement)
// GET all WBS-derived employee tasks with Department Scoping & Program Manager Leadership Bypass
router.get('/tasks', async (req, res) => {
    try {
        (0, mockData_1.logSystemEvent)('API Server', 'GET /api/employee-management/tasks', 'info');
        const { employeeId } = req.query;
        let isLeadership = false;
        let userDepts = [];
        if (employeeId) {
            const emp = await prisma_1.prisma.employee.findUnique({
                where: { id: String(employeeId) },
                include: { projectTeams: true }
            });
            if (emp) {
                if (emp.isAdmin || emp.role === 'Admin' || emp.role === 'Manager') {
                    isLeadership = true;
                }
                else {
                    // Check for Program Manager or Project Lead role
                    const hasLeadershipAssignment = emp.projectTeams.some(pt => pt.role === 'Program Manager' || pt.role === 'Project Lead' || pt.department === null);
                    if (hasLeadershipAssignment) {
                        isLeadership = true;
                    }
                    else {
                        const teamDepts = emp.projectTeams
                            .map(pt => pt.department)
                            .filter((d) => Boolean(d));
                        if (teamDepts.length > 0) {
                            userDepts = teamDepts;
                        }
                        else if (emp.department) {
                            userDepts = [emp.department];
                        }
                    }
                }
            }
        }
        else {
            isLeadership = true; // If no employeeId provided (global view), return all
        }
        // Fetch all WBS tasks with phase, assignments, and inquiry details
        const allWbsTasks = await prisma_1.prisma.wBSTask.findMany({
            include: {
                phase: true,
                inquiry: {
                    include: { jobs: true }
                },
                assignments: {
                    include: { employee: { select: { id: true, name: true, empCode: true } } }
                }
            },
            orderBy: { wbsCode: 'asc' }
        });
        // Helper to check if a task belongs to user's assigned department(s)
        const matchesUserDepartment = (phaseName, phaseBadge) => {
            if (userDepts.length === 0)
                return true;
            const combined = `${phaseName} ${phaseBadge}`.toLowerCase();
            return userDepts.some(dept => {
                const d = dept.toLowerCase();
                return combined.includes(d) || d.includes(phaseBadge.toLowerCase());
            });
        };
        // Filter tasks based on leadership vs department scope
        const filteredTasks = allWbsTasks.filter(task => {
            if (isLeadership)
                return true;
            // Check if user is directly assigned
            const isDirectlyAssigned = task.assignments.some(a => a.employeeId === String(employeeId) || a.employee?.id === String(employeeId));
            // Check if task belongs to user's department
            const isDeptTask = matchesUserDepartment(task.phase.name, task.phase.badge);
            return isDirectlyAssigned || isDeptTask;
        });
        const formattedTasks = filteredTasks.map(task => {
            const jobNo = task.inquiry?.jobs?.[0]?.jobNo || 'N/A';
            const assignedEmployeeNames = task.assignments.map(a => a.employee.name).join(', ') || task.owner || 'Unassigned';
            const assignedEmployeeCode = task.assignments[0]?.employee.empCode || '';
            return {
                id: task.id,
                assignmentId: task.assignments[0]?.id || task.id,
                title: task.name,
                wbsCode: task.wbsCode,
                jobNo,
                phaseName: task.phase.name,
                department: task.phase.badge,
                inquiryCode: task.inquiry?.inquiryCode || '',
                project: task.inquiry?.project || '',
                assignedTo: assignedEmployeeNames,
                assignedToCode: assignedEmployeeCode,
                status: task.status,
                progress: task.progress,
                planHours: task.planHours,
                actualHours: task.actualHours
            };
        });
        res.json(formattedTasks);
    }
    catch (err) {
        console.error('[Tasks API Error]', err);
        res.status(500).json({ error: 'Failed to fetch employee tasks' });
    }
});
// GET all visit reports
router.get('/visits', async (req, res) => {
    try {
        (0, mockData_1.logSystemEvent)('API Server', 'GET /api/employee-management/visits', 'info');
        const reports = await prisma_1.prisma.visitReport.findMany({
            include: { employee: { select: { name: true, empCode: true } } },
            orderBy: { visitDate: 'desc' }
        });
        res.json(reports);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch visit reports' });
    }
});
// POST new visit report
router.post('/visits', async (req, res) => {
    try {
        const { employeeId, clientName, location, purpose, remarks } = req.body;
        if (!employeeId || !clientName || !location || !purpose) {
            return res.status(400).json({ error: 'employeeId, clientName, location and purpose are required' });
        }
        const report = await prisma_1.prisma.visitReport.create({
            data: {
                employeeId,
                clientName,
                location,
                purpose,
                remarks
            },
            include: { employee: { select: { name: true, empCode: true } } }
        });
        res.status(201).json(report);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to create visit report' });
    }
});
// DELETE visit report
router.delete('/visits/:id', async (req, res) => {
    try {
        await prisma_1.prisma.visitReport.delete({ where: { id: req.params.id } });
        res.json({ message: 'Visit report deleted' });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to delete visit report' });
    }
});
// GET all leaves
router.get('/leaves', async (req, res) => {
    try {
        (0, mockData_1.logSystemEvent)('API Server', 'GET /api/employee-management/leaves', 'info');
        const { employeeId } = req.query;
        let whereClause = {};
        if (employeeId)
            whereClause.employeeId = String(employeeId);
        const leaves = await prisma_1.prisma.leaveApplication.findMany({
            where: whereClause,
            include: { employee: { select: { name: true, empCode: true, role: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(leaves);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch leave applications' });
    }
});
// GET pending leaves for approval
router.get('/leaves/pending', async (req, res) => {
    try {
        const { role } = req.query;
        let whereClause = { status: 'Pending' };
        if (role && role !== 'Admin') {
            whereClause.routedToRole = String(role);
        } // Admins can see all pending leaves by default
        const leaves = await prisma_1.prisma.leaveApplication.findMany({
            where: whereClause,
            include: { employee: { select: { name: true, empCode: true, role: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(leaves);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch pending leave applications' });
    }
});
// POST apply leave (Supports Half Day - AM / PM and Full Day per R6, with role routing per R7)
router.post('/leaves', async (req, res) => {
    try {
        const { employeeId, leaveType, fromDate, toDate, halfDayTime, reason } = req.body;
        if (!employeeId || !leaveType || !fromDate || !toDate || !reason) {
            return res.status(400).json({ error: 'employeeId, leaveType, fromDate, toDate and reason are required' });
        }
        const employee = await prisma_1.prisma.employee.findUnique({ where: { id: employeeId } });
        let routedToRole = 'HR';
        if (employee) {
            routedToRole = (0, leaveRouting_1.determineLeaveRoutingRole)(employee.role);
        }
        const leave = await prisma_1.prisma.leaveApplication.create({
            data: {
                employeeId,
                leaveType,
                fromDate: new Date(fromDate),
                toDate: new Date(toDate),
                halfDayTime,
                reason,
                routedToRole
            },
            include: { employee: { select: { name: true, empCode: true } } }
        });
        // Notify approver (Mocked approver email for now, in prod fetch actual approver email)
        const approverEmail = `approver-${routedToRole.toLowerCase()}@skytech.com`;
        await (0, emailService_1.sendLeaveApplicationEmail)(approverEmail, employee?.name || 'Unknown', leaveType, new Date(fromDate), new Date(toDate));
        res.status(201).json(leave);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to submit leave application' });
    }
});
// PUT approve/reject leave
router.put('/leaves/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!status || (status !== 'Approved' && status !== 'Rejected')) {
            return res.status(400).json({ error: 'status must be Approved or Rejected' });
        }
        const updated = await prisma_1.prisma.leaveApplication.update({
            where: { id: req.params.id },
            data: { status },
            include: { employee: { select: { name: true, email: true } } }
        });
        await (0, emailService_1.sendLeaveStatusEmail)(updated.employee.email, updated.employee.name, status, updated.leaveType);
        res.json(updated);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update leave status' });
    }
});
// GET all running jobs
router.get('/jobs', async (req, res) => {
    try {
        (0, mockData_1.logSystemEvent)('API Server', 'GET /api/employee-management/jobs', 'info');
        const jobs = await prisma_1.prisma.runningJob.findMany({
            include: { employee: { select: { name: true, empCode: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(jobs);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch running jobs' });
    }
});
// PUT update running job progress
router.put('/jobs/:id/progress', async (req, res) => {
    try {
        const { progress } = req.body;
        if (progress === undefined) {
            return res.status(400).json({ error: 'progress is required' });
        }
        const updated = await prisma_1.prisma.runningJob.update({
            where: { id: req.params.id },
            data: { progress: Number(progress) }
        });
        res.json(updated);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update job progress' });
    }
});
// GET all salary slips
router.get('/salary', async (req, res) => {
    try {
        (0, mockData_1.logSystemEvent)('API Server', 'GET /api/employee-management/salary', 'info');
        const slips = await prisma_1.prisma.salarySlip.findMany({
            include: { employee: { select: { name: true, empCode: true, designation: true } } },
            orderBy: [{ year: 'desc' }, { month: 'desc' }]
        });
        res.json(slips);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch salary slips' });
    }
});
// POST create salary slip
router.post('/salary', async (req, res) => {
    try {
        const { employeeId, month, year, basicSalary, allowances = 0, deductions = 0 } = req.body;
        if (!employeeId || !month || !year || basicSalary === undefined) {
            return res.status(400).json({ error: 'employeeId, month, year and basicSalary are required' });
        }
        const netSalary = Number(basicSalary) + Number(allowances) - Number(deductions);
        const slip = await prisma_1.prisma.salarySlip.create({
            data: {
                employeeId,
                month,
                year: Number(year),
                basicSalary: Number(basicSalary),
                allowances: Number(allowances),
                deductions: Number(deductions),
                netSalary
            },
            include: { employee: { select: { name: true, empCode: true, designation: true } } }
        });
        res.status(201).json(slip);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to create salary slip' });
    }
});
exports.default = router;
