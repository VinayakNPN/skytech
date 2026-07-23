import { Router } from 'express';
import { prisma } from '../db/prisma';
import { logSystemEvent } from '../data/mockData';
import { validateBody, createInquirySchema } from '../validators';

const router = Router();

// GET all inquiries from Database
router.get('/', async (req, res) => {
  try {
    const inquiries = await prisma.inquiry.findMany({
      orderBy: { inquiryCode: 'asc' }
    });
    res.json(inquiries);
  } catch (err: any) {
    console.error('[DB Error] GET /api/inquiries:', err);
    res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
});

// GET all confirmed active (non-hold) projects for Dashboard & WBS dropdowns
router.get('/confirmed', async (req, res) => {
  try {
    let whereClause: any = {
      status: 'Confirmed',
      holdStatus: false
    };

    if (req.user && !['Admin', 'Manager', 'HR'].includes(req.user.role)) {
      const teams = await prisma.projectTeam.findMany({ where: { employeeId: req.user.id } });
      const assignedIds = teams.map(t => t.inquiryId);
      whereClause.id = { in: assignedIds };
    }

    const projects = await prisma.inquiry.findMany({
      where: whereClause,
      orderBy: { inquiryCode: 'asc' }
    });
    res.json(projects);
  } catch (err: any) {
    console.error('[DB Error] GET /api/inquiries/confirmed:', err);
    res.status(500).json({ error: 'Failed to fetch confirmed projects' });
  }
});

// GET inquiry stats summary from Database
router.get('/stats', async (req, res) => {
  try {
    const total = await prisma.inquiry.count();
    const offersSent = await prisma.inquiry.count({
      where: { status: { in: ['Offer Sent', 'Confirmed'] } }
    });
    const confirmed = await prisma.inquiry.count({
      where: { status: 'Confirmed', holdStatus: false }
    });
    const onHold = await prisma.inquiry.count({
      where: { holdStatus: true }
    });
    const unconfirmed = await prisma.inquiry.count({
      where: { status: { in: ['Unconfirmed', 'Inquiry Received'] } }
    });
    const winRate = offersSent > 0 ? Math.round((confirmed / offersSent) * 100) : 0;

    res.json({
      totalInquiries: total,
      offersSent,
      confirmedOrders: confirmed,
      onHold,
      unconfirmed,
      winRate
    });
  } catch (err: any) {
    console.error('[DB Error] GET /api/inquiries/stats:', err);
    res.status(500).json({ error: 'Failed to compute inquiry stats' });
  }
});

// POST create new inquiry in Database
router.post('/', validateBody(createInquirySchema), async (req, res) => {
  try {
    const lastInquiry = await prisma.inquiry.findFirst({
      orderBy: { inquiryCode: 'desc' }
    });

    let nextNum = 1;
    if (lastInquiry && lastInquiry.inquiryCode) {
      const match = lastInquiry.inquiryCode.match(/(\d+)$/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    const inquiryCode = `INQ_${String(nextNum).padStart(2, '0')}`;

    const newInquiry = await prisma.inquiry.create({
      data: {
        inquiryCode,
        client: req.body.client || 'New Client',
        project: req.body.project || 'New Project Order',
        amount: Number(req.body.amount) || 0,
        contactPerson: req.body.contactPerson || '',
        email: req.body.email || '',
        phone: req.body.phone || '',
        date: req.body.date ? new Date(req.body.date) : new Date(),
        status: req.body.status || 'Inquiry Received',
        holdStatus: false,
        remarks: req.body.remarks || '',
        weeksAgo: 1
      }
    });

    logSystemEvent('API Server', `New client inquiry registered in DB: ${newInquiry.inquiryCode} (${newInquiry.client})`, 'info');
    res.status(201).json(newInquiry);
  } catch (err: any) {
    console.error('[DB Error] POST /api/inquiries:', err);
    res.status(500).json({ error: 'Failed to create inquiry' });
  }
});

// PUT Hold inquiry (R2)
router.put('/:id/hold', async (req, res) => {
  try {
    const targetId = req.params.id;
    const existing = await prisma.inquiry.findFirst({
      where: {
        OR: [
          { id: targetId },
          { inquiryCode: targetId }
        ]
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    const updated = await prisma.inquiry.update({
      where: { id: existing.id },
      data: {
        holdStatus: true,
        holdReason: req.body.reason || 'Project placed on hold by manager',
        heldAt: new Date()
      }
    });

    logSystemEvent('API Server', `Project ${updated.inquiryCode} placed on HOLD: ${updated.holdReason}`, 'warn');
    res.json(updated);
  } catch (err: any) {
    console.error('[DB Error] PUT /api/inquiries/:id/hold:', err);
    res.status(500).json({ error: 'Failed to hold project' });
  }
});

// PUT Resume inquiry (R2)
router.put('/:id/resume', async (req, res) => {
  try {
    const targetId = req.params.id;
    const existing = await prisma.inquiry.findFirst({
      where: {
        OR: [
          { id: targetId },
          { inquiryCode: targetId }
        ]
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    const updated = await prisma.inquiry.update({
      where: { id: existing.id },
      data: {
        holdStatus: false,
        holdReason: null,
        heldAt: null
      }
    });

    logSystemEvent('API Server', `Project ${updated.inquiryCode} RESUMED from hold`, 'info');
    res.json(updated);
  } catch (err: any) {
    console.error('[DB Error] PUT /api/inquiries/:id/resume:', err);
    res.status(500).json({ error: 'Failed to resume project' });
  }
});

// PUT update inquiry in Database
router.put('/:id', async (req, res) => {
  try {
    const updated = await prisma.inquiry.update({
      where: { id: req.params.id },
      data: {
        ...(req.body.client && { client: req.body.client }),
        ...(req.body.project && { project: req.body.project }),
        ...(req.body.amount !== undefined && { amount: Number(req.body.amount) }),
        ...(req.body.contactPerson !== undefined && { contactPerson: req.body.contactPerson }),
        ...(req.body.email !== undefined && { email: req.body.email }),
        ...(req.body.phone !== undefined && { phone: req.body.phone }),
        ...(req.body.status && { status: req.body.status }),
        ...(req.body.holdStatus !== undefined && { holdStatus: req.body.holdStatus }),
        ...(req.body.holdReason !== undefined && { holdReason: req.body.holdReason }),
        ...(req.body.remarks !== undefined && { remarks: req.body.remarks })
      }
    });

    logSystemEvent('API Server', `Inquiry ${updated.inquiryCode} updated in DB`, 'info');
    res.json(updated);
  } catch (err: any) {
    console.error('[DB Error] PUT /api/inquiries/:id:', err);
    res.status(500).json({ error: 'Failed to update inquiry' });
  }
});

// DELETE inquiry from Database
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await prisma.inquiry.delete({
      where: { id: req.params.id }
    });

    logSystemEvent('API Server', `Inquiry ${deleted.inquiryCode} deleted from DB`, 'info');
    res.json({ message: 'Inquiry deleted', deleted });
  } catch (err: any) {
    console.error('[DB Error] DELETE /api/inquiries/:id:', err);
    res.status(500).json({ error: 'Failed to delete inquiry' });
  }
});

export default router;
