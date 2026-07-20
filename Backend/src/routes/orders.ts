import { Router } from 'express';
import { 
  getOrders, 
  getOrderById, 
  createOrder, 
  updateOrderStage, 
  toggleTaskCompletion, 
  updateOrderDeptRemark,
  logSystemEvent 
} from '../data/mockData';

const router = Router();

// GET all orders
router.get('/', (req, res) => {
  logSystemEvent('API Server', 'GET /api/orders', 'info');
  res.json(getOrders());
});

// GET single order by ID
router.get('/:id', (req, res) => {
  const order = getOrderById(req.params.id);
  if (!order) {
    logSystemEvent('API Server', `GET /api/orders/${req.params.id} failed - Not Found`, 'warn');
    return res.status(404).json({ error: 'Order not found' });
  }
  logSystemEvent('API Server', `GET /api/orders/${req.params.id} successful`, 'info');
  res.json(order);
});

// POST new order
router.post('/', (req, res) => {
  const { clientName, projectName, panels, priority, deadline } = req.body;
  if (!clientName || !projectName) {
    return res.status(400).json({ error: 'clientName and projectName are required' });
  }
  const newOrder = createOrder({ clientName, projectName, panels, priority, deadline });
  res.status(201).json(newOrder);
});

// PUT update order stage
router.put('/:id/stage', (req, res) => {
  const { stage, user } = req.body;
  if (!stage || !user) {
    return res.status(400).json({ error: 'stage and user are required' });
  }
  const updatedOrder = updateOrderStage(req.params.id, stage, user);
  if (!updatedOrder) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(updatedOrder);
});

// PUT update department remark
router.put('/:id/remarks', (req, res) => {
  const { dept, remark, user } = req.body;
  if (!dept || remark === undefined || !user) {
    return res.status(400).json({ error: 'dept, remark and user are required' });
  }
  const updatedOrder = updateOrderDeptRemark(req.params.id, dept, remark, user);
  if (!updatedOrder) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(updatedOrder);
});

// PUT toggle task completion
router.put('/:id/tasks/:taskId/toggle', (req, res) => {
  const updatedOrder = toggleTaskCompletion(req.params.id, req.params.taskId);
  if (!updatedOrder) {
    return res.status(404).json({ error: 'Order or task not found' });
  }
  res.json(updatedOrder);
});

export default router;
