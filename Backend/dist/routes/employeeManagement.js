"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mockData_1 = require("../data/mockData");
const router = (0, express_1.Router)();
// GET Employee Management Dashboard Summary data
router.get('/dashboard', (req, res) => {
    (0, mockData_1.logSystemEvent)('API Server', 'GET /api/employee-management/dashboard', 'info');
    // Sort today's attendance: put specific employees from screenshot first
    const orderOfDisplay = ['EMP-011', 'EMP-012', 'EMP-013', 'EMP-014', 'EMP-015'];
    const todayAttendance = [...mockData_1.mockEmployeeAttendance].sort((a, b) => {
        const idxA = orderOfDisplay.indexOf(a.employeeId);
        const idxB = orderOfDisplay.indexOf(b.employeeId);
        if (idxA !== -1 && idxB !== -1)
            return idxA - idxB;
        if (idxA !== -1)
            return -1;
        if (idxB !== -1)
            return 1;
        return 0;
    });
    res.json({
        stats: (0, mockData_1.getEmployeeDashboardStats)(),
        todayAttendance: todayAttendance.slice(0, 5), // top 5 for dashboard
        activeTasks: mockData_1.mockEmployeeTasks.slice(0, 4), // top 4 active tasks for dashboard
        runningJobs: mockData_1.mockRunningJobs.slice(0, 3) // top 3 running jobs for dashboard
    });
});
// GET all attendance logs
router.get('/attendance', (req, res) => {
    (0, mockData_1.logSystemEvent)('API Server', 'GET /api/employee-management/attendance', 'info');
    res.json(mockData_1.mockEmployeeAttendance);
});
// POST clock-in
router.post('/attendance/clock', (req, res) => {
    const { employeeId, time } = req.body;
    if (!employeeId || !time) {
        return res.status(400).json({ error: 'employeeId and time are required' });
    }
    const result = (0, mockData_1.clockEmployeeIn)(employeeId, time);
    if (!result) {
        return res.status(404).json({ error: 'Employee not found' });
    }
    res.json({ stats: result, attendance: mockData_1.mockEmployeeAttendance });
});
// GET all tasks
router.get('/tasks', (req, res) => {
    (0, mockData_1.logSystemEvent)('API Server', 'GET /api/employee-management/tasks', 'info');
    res.json(mockData_1.mockEmployeeTasks);
});
// POST new task
router.post('/tasks', (req, res) => {
    const { title, assignedTo, dueDate } = req.body;
    if (!title || !assignedTo) {
        return res.status(400).json({ error: 'title and assignedTo are required' });
    }
    const newTask = (0, mockData_1.createEmployeeTask)({ title, assignedTo, dueDate });
    res.status(201).json(newTask);
});
// PUT update task status
router.put('/tasks/:id/status', (req, res) => {
    const { status } = req.body;
    if (!status) {
        return res.status(400).json({ error: 'status is required' });
    }
    const updated = (0, mockData_1.updateEmployeeTaskStatus)(req.params.id, status);
    if (!updated) {
        return res.status(404).json({ error: 'Task not found' });
    }
    res.json(updated);
});
// GET all visit reports
router.get('/visits', (req, res) => {
    (0, mockData_1.logSystemEvent)('API Server', 'GET /api/employee-management/visits', 'info');
    res.json(mockData_1.mockVisitReports);
});
// POST new visit report
router.post('/visits', (req, res) => {
    const { title, client, location, engineer, date, notes } = req.body;
    if (!title || !client || !location || !engineer) {
        return res.status(400).json({ error: 'title, client, location and engineer are required' });
    }
    const newVisit = (0, mockData_1.createVisitReport)({ title, client, location, engineer, date, notes });
    res.status(201).json(newVisit);
});
// GET all leaves
router.get('/leaves', (req, res) => {
    (0, mockData_1.logSystemEvent)('API Server', 'GET /api/employee-management/leaves', 'info');
    res.json(mockData_1.mockLeaveApplications);
});
// POST apply leave
router.post('/leaves', (req, res) => {
    const { employeeId, employeeName, startDate, endDate, type, reason } = req.body;
    if (!startDate || !endDate || !type || !reason) {
        return res.status(400).json({ error: 'startDate, endDate, type and reason are required' });
    }
    const newLeave = (0, mockData_1.applyForLeave)({ employeeId, employeeName, startDate, endDate, type, reason });
    res.status(201).json(newLeave);
});
// PUT approve/reject leave
router.put('/leaves/:id/status', (req, res) => {
    const { status } = req.body;
    if (!status || (status !== 'Approved' && status !== 'Rejected')) {
        return res.status(400).json({ error: 'status must be Approved or Rejected' });
    }
    const updated = (0, mockData_1.updateLeaveStatus)(req.params.id, status);
    if (!updated) {
        return res.status(404).json({ error: 'Leave request not found' });
    }
    res.json(updated);
});
// GET all running jobs
router.get('/jobs', (req, res) => {
    (0, mockData_1.logSystemEvent)('API Server', 'GET /api/employee-management/jobs', 'info');
    res.json(mockData_1.mockRunningJobs);
});
// PUT update running job progress
router.put('/jobs/:id/progress', (req, res) => {
    const { progress, status } = req.body;
    if (progress === undefined) {
        return res.status(400).json({ error: 'progress is required' });
    }
    const updated = (0, mockData_1.updateRunningJobProgress)(req.params.id, progress, status);
    if (!updated) {
        return res.status(404).json({ error: 'Job not found' });
    }
    res.json(updated);
});
// GET all salary slips
router.get('/salary', (req, res) => {
    (0, mockData_1.logSystemEvent)('API Server', 'GET /api/employee-management/salary', 'info');
    res.json(mockData_1.mockSalarySlips);
});
exports.default = router;
