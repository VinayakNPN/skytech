import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authorize } from '../middleware/authorize';

const router = Router();
const prisma = new PrismaClient();

// GET all teams across projects (Admins/Managers)
router.get('/', authorize(['Admin', 'Manager', 'HR']), async (req, res) => {
  try {
    const teams = await prisma.projectTeam.findMany({
      include: { employee: true, inquiry: true }
    });
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// GET team members for a specific project
router.get('/:inquiryId/team', async (req, res) => {
  try {
    const { inquiryId } = req.params;
    const inq = await prisma.inquiry.findFirst({
      where: { OR: [{ id: inquiryId }, { inquiryCode: inquiryId }] }
    });
    const targetId = inq ? inq.id : inquiryId;

    const team = await prisma.projectTeam.findMany({
      where: { inquiryId: targetId },
      include: {
        employee: { select: { id: true, name: true, department: true, designation: true, email: true, empCode: true } }
      }
    });
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// POST add member to project (Admin/Manager)
router.post('/:inquiryId/team', authorize(['Admin', 'Manager']), async (req, res) => {
  try {
    const { inquiryId } = req.params;
    const { employeeId, role, department } = req.body;

    const inq = await prisma.inquiry.findFirst({
      where: { OR: [{ id: inquiryId }, { inquiryCode: inquiryId }] }
    });
    if (!inq) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }
    const targetId = inq.id;

    const isLeadershipRole = role === 'Program Manager' || role === 'Project Lead';
    const assignedDepartment = isLeadershipRole ? null : (department || null);

    const member = await prisma.projectTeam.create({
      data: {
        inquiryId: targetId,
        employeeId,
        role: role || 'Member',
        department: assignedDepartment,
        assignedBy: req.user?.id
      },
      include: { employee: { select: { id: true, name: true, department: true, designation: true, email: true, empCode: true } } }
    });

    res.json(member);
  } catch (err: any) {
    console.error('[ProjectTeam Error]', err);
    res.status(400).json({ error: 'Failed to add team member or assignment already exists' });
  }
});


// DELETE remove member from project (Admin/Manager)
router.delete('/team/:id', authorize(['Admin', 'Manager']), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.projectTeam.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove team member' });
  }
});

export default router;
