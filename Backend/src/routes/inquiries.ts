import { Router } from 'express';
import { prisma } from '../db/prisma';
import { logSystemEvent } from '../data/mockData';

const router = Router();

// GET all inquiries from Database
router.get('/', async (req, res) => {
  try {
    const inquiries = await prisma.inquiry.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(inquiries);
  } catch (err: any) {
    console.error('[DB Error] GET /api/inquiries:', err);
    res.status(500).json({ error: 'Failed to fetch inquiries' });
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
      where: { status: 'Confirmed' }
    });
    const unconfirmed = await prisma.inquiry.count({
      where: { status: { in: ['Unconfirmed', 'Inquiry Received'] } }
    });
    const winRate = offersSent > 0 ? Math.round((confirmed / offersSent) * 100) : 0;

    res.json({
      totalInquiries: total,
      offersSent,
      confirmedOrders: confirmed,
      unconfirmed,
      winRate
    });
  } catch (err: any) {
    console.error('[DB Error] GET /api/inquiries/stats:', err);
    res.status(500).json({ error: 'Failed to compute inquiry stats' });
  }
});

// POST create new inquiry in Database
router.post('/', async (req, res) => {
  try {
    const count = await prisma.inquiry.count();
    const inquiryCode = `INQ-${101 + count}`;

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
        ...(req.body.remarks !== undefined && { remarks: req.body.remarks })
      }
    });

    logSystemEvent('API Server', `Inquiry ${updated.inquiryCode} updated in DB to ${updated.status}`, 'info');
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
