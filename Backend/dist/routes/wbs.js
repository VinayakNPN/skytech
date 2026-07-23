"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../db/prisma");
const mockData_1 = require("../data/mockData");
const validators_1 = require("../validators");
const router = (0, express_1.Router)();
// GET all WBS phases with tasks from Database
router.get('/', async (req, res) => {
    try {
        const phases = await prisma_1.prisma.wBSPhase.findMany({
            include: {
                tasks: {
                    include: {
                        inquiry: {
                            select: { id: true, inquiryCode: true }
                        }
                    },
                    orderBy: { wbsCode: 'asc' }
                }
            },
            orderBy: { wbsCode: 'asc' }
        });
        res.json(phases);
    }
    catch (err) {
        console.error('[DB Error] GET /api/wbs:', err);
        res.status(500).json({ error: 'Failed to fetch WBS tree' });
    }
});
// POST add new task to WBS phase in Database
router.post('/tasks', (0, validators_1.validateBody)(validators_1.createWBSTaskSchema), async (req, res) => {
    try {
        let { wbsCode, name, phaseId, inquiryId, owner, planHours, status } = req.body;
        // Resolve inquiryId if inquiryCode string (e.g. INQ_01) was passed
        if (inquiryId && typeof inquiryId === 'string' && inquiryId.startsWith('INQ')) {
            const dbInq = await prisma_1.prisma.inquiry.findUnique({ where: { inquiryCode: inquiryId } });
            if (dbInq)
                inquiryId = dbInq.id;
        }
        const progress = status === 'DONE' ? 100 : (status === 'IN PROGRESS' ? 50 : 0);
        const actualHours = status === 'DONE' ? Number(planHours) : (status === 'IN PROGRESS' ? Math.round(Number(planHours) / 2) : 0);
        const newTask = await prisma_1.prisma.wBSTask.create({
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
        (0, mockData_1.logSystemEvent)('API Server', `New WBS task created in DB: ${newTask.wbsCode} - ${newTask.name}`, 'info');
        res.status(201).json(newTask);
    }
    catch (err) {
        console.error('[DB Error] POST /api/wbs/tasks:', err);
        res.status(500).json({ error: 'Failed to create WBS task' });
    }
});
// PUT update WBS task in Database
router.put('/tasks/:id', async (req, res) => {
    try {
        const { wbsCode, name, phaseId, inquiryId, owner, planHours, actualHours, status, progress } = req.body;
        const updated = await prisma_1.prisma.wBSTask.update({
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
        (0, mockData_1.logSystemEvent)('API Server', `WBS task ${updated.wbsCode} updated in DB`, 'info');
        res.json(updated);
    }
    catch (err) {
        console.error('[DB Error] PUT /api/wbs/tasks/:id:', err);
        res.status(500).json({ error: 'Failed to update WBS task' });
    }
});
// DELETE WBS task from Database
router.delete('/tasks/:id', async (req, res) => {
    try {
        const deleted = await prisma_1.prisma.wBSTask.delete({
            where: { id: req.params.id }
        });
        (0, mockData_1.logSystemEvent)('API Server', `WBS task ${deleted.wbsCode} deleted from DB`, 'info');
        res.json({ message: 'Task deleted', deleted });
    }
    catch (err) {
        console.error('[DB Error] DELETE /api/wbs/tasks/:id:', err);
        res.status(500).json({ error: 'Failed to delete WBS task' });
    }
});
exports.default = router;
