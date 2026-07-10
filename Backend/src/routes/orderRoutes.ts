import { Router } from 'express';
import { prisma } from '../config/db';

const router = Router();

// GET all orders
router.get('/', async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        customer: true,
      },
    });
    res.json({
      status: 'success',
      data: orders,
    });
  } catch (error) {
    next(error);
  }
});

// GET order by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        tasks: {
          include: {
            assignee: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        status: 'fail',
        message: 'Order not found',
      });
    }

    res.json({
      status: 'success',
      data: order,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
