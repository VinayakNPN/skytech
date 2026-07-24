import { Router } from 'express';
import { prisma } from '../db/prisma';
import { logSystemEvent } from '../data/mockData';
import { validateBody, createWBSTaskSchema } from '../validators';
import multer from 'multer';
import * as XLSX from 'xlsx';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET all WBS phases with tasks from Database
router.get('/', async (req, res) => {
  try {
    const phases = await prisma.wBSPhase.findMany({
      include: {
        tasks: {
          include: {
            inquiry: {
              select: { id: true, inquiryCode: true }
            },
            assignments: {
              include: {
                employee: {
                  select: { id: true, empCode: true, name: true, role: true, department: true }
                }
              }
            }
          },
          orderBy: { wbsCode: 'asc' }
        }
      },
      orderBy: { wbsCode: 'asc' }
    });
    res.json(phases);
  } catch (err: any) {
    console.error('[DB Error] GET /api/wbs:', err);
    res.status(500).json({ error: 'Failed to fetch WBS tree' });
  }
});

// POST assign employee to WBS task
router.post('/tasks/:taskId/assign', async (req, res) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) return res.status(400).json({ error: 'employeeId is required' });

    const assignment = await prisma.wBSTaskAssignment.upsert({
      where: {
        wbsTaskId_employeeId: {
          wbsTaskId: req.params.taskId,
          employeeId
        }
      },
      create: {
        wbsTaskId: req.params.taskId,
        employeeId
      },
      update: {},
      include: {
        employee: { select: { id: true, empCode: true, name: true, role: true } }
      }
    });

    logSystemEvent('API Server', `Assigned employee ${employeeId} to WBS task ${req.params.taskId}`, 'info');
    res.status(201).json(assignment);
  } catch (err: any) {
    console.error('[DB Error] POST /api/wbs/tasks/:taskId/assign:', err);
    res.status(500).json({ error: 'Failed to assign employee to task' });
  }
});

// DELETE unassign employee from WBS task
router.delete('/tasks/:taskId/assign/:employeeId', async (req, res) => {
  try {
    await prisma.wBSTaskAssignment.delete({
      where: {
        wbsTaskId_employeeId: {
          wbsTaskId: req.params.taskId,
          employeeId: req.params.employeeId
        }
      }
    });

    logSystemEvent('API Server', `Unassigned employee ${req.params.employeeId} from WBS task ${req.params.taskId}`, 'info');
    res.json({ message: 'Employee unassigned successfully' });
  } catch (err: any) {
    console.error('[DB Error] DELETE /api/wbs/tasks/:taskId/assign/:employeeId:', err);
    res.status(500).json({ error: 'Failed to unassign employee' });
  }
});

// POST add new task to WBS phase in Database
router.post('/tasks', validateBody(createWBSTaskSchema), async (req, res) => {
  try {
    let { wbsCode, name, phaseId, inquiryId, owner, planHours, status } = req.body;
    
    // Resolve inquiryId if inquiryCode string (e.g. INQ_01) was passed
    if (inquiryId && typeof inquiryId === 'string' && inquiryId.startsWith('INQ')) {
      const dbInq = await prisma.inquiry.findUnique({ where: { inquiryCode: inquiryId } });
      if (dbInq) inquiryId = dbInq.id;
    }

    const progress = status === 'DONE' ? 100 : (status === 'IN PROGRESS' ? 50 : 0);
    const actualHours = status === 'DONE' ? Number(planHours) : (status === 'IN PROGRESS' ? Math.round(Number(planHours)/2) : 0);

    const newTask = await prisma.wBSTask.create({
      data: {
        wbsCode: wbsCode || '1.1',
        name: name || 'New WBS Sub-task',
        phaseId: phaseId,
        inquiryId: inquiryId || null,
        owner: owner || 'Assigned Eng',
        planHours: Number(planHours) || 8,
        actualHours: actualHours,
        status: status || 'NOT STARTED',
        progress: progress
      }
    });

    logSystemEvent('API Server', `New WBS task created in DB: ${newTask.wbsCode} - ${newTask.name}`, 'info');
    res.status(201).json(newTask);
  } catch (err: any) {
    console.error('[DB Error] POST /api/wbs/tasks:', err);
    res.status(500).json({ error: 'Failed to create WBS task' });
  }
});

// PUT update WBS task in Database
router.put('/tasks/:id', async (req, res) => {
  try {
    const { wbsCode, name, phaseId, inquiryId, owner, planHours, actualHours, status, progress } = req.body;

    const updated = await prisma.wBSTask.update({
      where: { id: req.params.id },
      data: {
        ...(wbsCode && { wbsCode }),
        ...(name && { name }),
        ...(phaseId && { phaseId }),
        ...(inquiryId !== undefined && { inquiryId }),
        ...(owner && { owner }),
        ...(planHours !== undefined && { planHours: Number(planHours) }),
        ...(actualHours !== undefined && { actualHours: Number(actualHours) }),
        ...(status && { status }),
        ...(progress !== undefined && { progress: Number(progress) })
      }
    });

    logSystemEvent('API Server', `WBS task ${updated.wbsCode} updated in DB`, 'info');
    res.json(updated);
  } catch (err: any) {
    console.error('[DB Error] PUT /api/wbs/tasks/:id:', err);
    res.status(500).json({ error: 'Failed to update WBS task' });
  }
});

// DELETE WBS task from Database
router.delete('/tasks/:id', async (req, res) => {
  try {
    const deleted = await prisma.wBSTask.delete({
      where: { id: req.params.id }
    });

    logSystemEvent('API Server', `WBS task ${deleted.wbsCode} deleted from DB`, 'info');
    res.json({ message: 'Task deleted', deleted });
  } catch (err: any) {
    console.error('[DB Error] DELETE /api/wbs/tasks/:id:', err);
    res.status(500).json({ error: 'Failed to delete WBS task' });
  }
});


// GET WBS stats
router.get('/stats', async (req, res) => {
  try {
    const { inquiryId } = req.query;
    let whereClause: any = inquiryId ? { inquiryId: String(inquiryId) } : {};

    if (req.user && !['Admin', 'Manager', 'HR'].includes(req.user.role)) {
      const teams = await prisma.projectTeam.findMany({ where: { employeeId: req.user.id } });
      const assignedIds = teams.map(t => t.inquiryId);
      if (inquiryId && !assignedIds.includes(String(inquiryId))) {
        return res.status(403).json({ error: 'Not assigned to this project' });
      }
      if (!inquiryId) {
        whereClause.inquiryId = { in: assignedIds };
      }
    }

    const tasks = await prisma.wBSTask.findMany({ where: whereClause });
    const phases = await prisma.wBSPhase.findMany({ orderBy: { wbsCode: 'asc' } });

    const totalTasks = tasks.length;
    const doneTasks = tasks.filter(t => t.status === 'DONE').length;
    const inProgressTasks = tasks.filter(t => t.status === 'IN PROGRESS').length;
    const notStartedTasks = tasks.filter(t => t.status === 'NOT STARTED').length;

    let overallCompletionPct = 0;
    if (totalTasks > 0) {
      overallCompletionPct = Math.round((doneTasks / totalTasks) * 100);
    }

    // Determine active phase
    let activePhase = 'None';
    const activeTask = tasks.find(t => t.status === 'IN PROGRESS');
    if (activeTask) {
      const p = phases.find(ph => ph.id === activeTask.phaseId);
      if (p) activePhase = p.name;
    } else {
      const nextTask = tasks.find(t => t.status === 'NOT STARTED');
      if (nextTask) {
        const p = phases.find(ph => ph.id === nextTask.phaseId);
        if (p) activePhase = p.name;
      } else if (totalTasks > 0 && doneTasks === totalTasks) {
        activePhase = 'Completed';
      }
    }

    const totalPlanHours = tasks.reduce((sum, t) => sum + (t.planHours || 0), 0);
    const totalActualHours = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);

    res.json({
      totalTasks,
      doneTasks,
      inProgressTasks,
      notStartedTasks,
      overallCompletionPct,
      activePhase,
      totalPlanHours,
      totalActualHours
    });
  } catch (err: any) {
    console.error('[DB Error] GET /api/wbs/stats:', err);
    res.status(500).json({ error: 'Failed to fetch WBS stats' });
  }
});

// GET WBS phases for pipeline visualization
router.get('/phases', async (req, res) => {
  try {
    const { inquiryId } = req.query;
    
    // Default fetch all phases
    const phases = await prisma.wBSPhase.findMany({
      orderBy: { wbsCode: 'asc' }
    });

    let whereClause: any = inquiryId ? { inquiryId: String(inquiryId) } : {};

    if (req.user && !['Admin', 'Manager', 'HR'].includes(req.user.role)) {
      const teams = await prisma.projectTeam.findMany({ where: { employeeId: req.user.id } });
      const assignedIds = teams.map(t => t.inquiryId);
      if (inquiryId && !assignedIds.includes(String(inquiryId))) {
        return res.status(403).json({ error: 'Not assigned to this project' });
      }
      if (!inquiryId) {
        whereClause.inquiryId = { in: assignedIds };
      }
    }

    const tasks = await prisma.wBSTask.findMany({ where: whereClause });

    // Map tasks into phases
    const phasesWithTasks = phases.map(phase => {
      const phaseTasks = tasks.filter(t => t.phaseId === phase.id);
      return {
        ...phase,
        tasks: phaseTasks,
        completed: phaseTasks.length > 0 && phaseTasks.every(t => t.status === 'DONE'),
        inProgress: phaseTasks.some(t => t.status === 'IN PROGRESS')
      };
    });

    res.json(phasesWithTasks);
  } catch (err: any) {
    console.error('[DB Error] GET /api/wbs/phases:', err);
    res.status(500).json({ error: 'Failed to fetch WBS phases pipeline' });
  }
});

// POST /api/wbs/upload-excel
router.post('/upload-excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    let tasksCreated = 0;

    const sheetName = workbook.SheetNames.find(sn => 
      ['wbs', 'tasks', 'schedule', 'programme'].some(k => sn.toLowerCase().includes(k))
    ) || workbook.SheetNames[0];

    const sheet = workbook.Sheets[sheetName];
    if (sheet) {
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);
      for (const row of rows) {
        const wbsCode = row['WBS Code'] || row['WBS'] || row['Code'] || row['wbsCode'];
        const name = row['Task Name'] || row['Name'] || row['Task'] || row['name'];
        if (wbsCode && name) {
          const phaseCode = String(wbsCode).split('.')[0] + '.0';
          const phase = await prisma.wBSPhase.findFirst({
            where: { wbsCode: phaseCode }
          }) || await prisma.wBSPhase.findFirst();

          if (phase) {
            const status = String(row['Status'] || 'NOT STARTED').toUpperCase();
            const planHours = Number(row['Plan Hours'] || row['Planned Hours'] || 8);
            const actualHours = Number(row['Actual Hours'] || 0);

            await prisma.wBSTask.create({
              data: {
                wbsCode: String(wbsCode).trim(),
                name: String(name).trim(),
                phaseId: phase.id,
                owner: row['Owner'] || row['Responsible'] || 'Assigned Eng',
                planHours,
                actualHours,
                status: ['DONE', 'IN PROGRESS', 'NOT STARTED'].includes(status) ? status : 'NOT STARTED',
                progress: status === 'DONE' ? 100 : (status === 'IN PROGRESS' ? 50 : 0)
              }
            });
            tasksCreated++;
          }
        }
      }
    }

    res.json({ message: `WBS Excel imported successfully! Added ${tasksCreated} tasks.`, tasksCreated });
  } catch (err: any) {
    console.error('WBS Excel upload failed:', err);
    res.status(500).json({ error: 'Failed to parse WBS Excel' });
  }
});

export default router;
