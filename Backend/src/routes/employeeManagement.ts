import { Router } from 'express';
import { 
  mockEmployees,
  mockEmployeeAttendance,
  mockEmployeeTasks,
  mockVisitReports,
  mockLeaveApplications,
  mockRunningJobs,
  mockSalarySlips,
  getEmployeeDashboardStats,
  clockEmployeeIn,
  createEmployeeTask,
  updateEmployeeTaskStatus,
  createVisitReport,
  updateVisitReport,
  deleteVisitReport,
  applyForLeave,
  updateLeaveStatus,
  updateRunningJobProgress,
  logSystemEvent
} from '../data/mockData';

const router = Router();

// GET Employee Management Dashboard Summary data
router.get('/dashboard', (req, res) => {
  logSystemEvent('API Server', 'GET /api/employee-management/dashboard', 'info');
  
  // Sort today's attendance: put specific employees from screenshot first
  const orderOfDisplay = ['EMP-011', 'EMP-012', 'EMP-013', 'EMP-014', 'EMP-015'];
  const todayAttendance = [...mockEmployeeAttendance].sort((a, b) => {
    const idxA = orderOfDisplay.indexOf(a.employeeId);
    const idxB = orderOfDisplay.indexOf(b.employeeId);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return 0;
  });

  res.json({
    stats: getEmployeeDashboardStats(),
    todayAttendance: todayAttendance.slice(0, 5), // top 5 for dashboard
    activeTasks: mockEmployeeTasks.slice(0, 4), // top 4 active tasks for dashboard
    runningJobs: mockRunningJobs.slice(0, 3) // top 3 running jobs for dashboard
  });
});

// GET all attendance logs
router.get('/attendance', (req, res) => {
  logSystemEvent('API Server', 'GET /api/employee-management/attendance', 'info');
  res.json(mockEmployeeAttendance);
});

// POST clock-in
router.post('/attendance/clock', (req, res) => {
  const { employeeId, time } = req.body;
  if (!employeeId || !time) {
    return res.status(400).json({ error: 'employeeId and time are required' });
  }
  const result = clockEmployeeIn(employeeId, time);
  if (!result) {
    return res.status(404).json({ error: 'Employee not found' });
  }
  res.json({ stats: result, attendance: mockEmployeeAttendance });
});

// GET all tasks
router.get('/tasks', (req, res) => {
  logSystemEvent('API Server', 'GET /api/employee-management/tasks', 'info');
  res.json(mockEmployeeTasks);
});

// POST new task
router.post('/tasks', (req, res) => {
  const { title, assignedTo, dueDate } = req.body;
  if (!title || !assignedTo) {
    return res.status(400).json({ error: 'title and assignedTo are required' });
  }
  const newTask = createEmployeeTask({ title, assignedTo, dueDate });
  res.status(201).json(newTask);
});

// PUT update task status
router.put('/tasks/:id/status', (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }
  const updated = updateEmployeeTaskStatus(req.params.id, status);
  if (!updated) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(updated);
});

// GET all visit reports
router.get('/visits', (req, res) => {
  logSystemEvent('API Server', 'GET /api/employee-management/visits', 'info');
  res.json(mockVisitReports);
});

// POST new visit report
router.post('/visits', (req, res) => {
  const { title, client, location, engineer, date, notes, status } = req.body;
  if (!title || !client || !location || !engineer) {
    return res.status(400).json({ error: 'title, client, location and engineer are required' });
  }
  const newVisit = createVisitReport({ title, client, location, engineer, date, notes, status });
  res.status(201).json(newVisit);
});

// PUT update visit report
router.put('/visits/:id', (req, res) => {
  const updated = updateVisitReport(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Visit report not found' });
  }
  res.json(updated);
});

// DELETE visit report
router.delete('/visits/:id', (req, res) => {
  const deleted = deleteVisitReport(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Visit report not found' });
  }
  res.json(deleted);
});

// GET all leaves
router.get('/leaves', (req, res) => {
  logSystemEvent('API Server', 'GET /api/employee-management/leaves', 'info');
  res.json(mockLeaveApplications);
});

// POST apply leave
router.post('/leaves', (req, res) => {
  const { employeeId, employeeName, startDate, endDate, type, reason } = req.body;
  if (!startDate || !endDate || !type || !reason) {
    return res.status(400).json({ error: 'startDate, endDate, type and reason are required' });
  }
  const newLeave = applyForLeave({ employeeId, employeeName, startDate, endDate, type, reason });
  res.status(201).json(newLeave);
});

// PUT approve/reject leave
router.put('/leaves/:id/status', (req, res) => {
  const { status } = req.body;
  if (!status || (status !== 'Approved' && status !== 'Rejected')) {
    return res.status(400).json({ error: 'status must be Approved or Rejected' });
  }
  const updated = updateLeaveStatus(req.params.id, status);
  if (!updated) {
    return res.status(404).json({ error: 'Leave request not found' });
  }
  res.json(updated);
});

// GET all running jobs
router.get('/jobs', (req, res) => {
  logSystemEvent('API Server', 'GET /api/employee-management/jobs', 'info');
  res.json(mockRunningJobs);
});

// PUT update running job progress
router.put('/jobs/:id/progress', (req, res) => {
  const { progress, status } = req.body;
  if (progress === undefined) {
    return res.status(400).json({ error: 'progress is required' });
  }
  const updated = updateRunningJobProgress(req.params.id, progress, status);
  if (!updated) {
    return res.status(404).json({ error: 'Job not found' });
  }
  res.json(updated);
});

// GET all salary slips
router.get('/salary', (req, res) => {
  logSystemEvent('API Server', 'GET /api/employee-management/salary', 'info');
  res.json(mockSalarySlips);
});

export default router;
