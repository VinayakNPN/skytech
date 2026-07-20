import { Router } from 'express';
import { getOrders, mockEmployees, getMaterialRequests } from '../data/mockData';

const router = Router();

router.get('/stats', (req, res) => {
  const orders = getOrders();
  const employees = mockEmployees;
  const requests = getMaterialRequests();

  // Metrics
  const activeOrdersCount = orders.length;
  const highPriorityCount = orders.filter(o => o.priority === 'High').length;
  const completedOrdersCount = orders.filter(o => o.currentStage === 'Support & Service').length;
  const pendingTasksCount = orders.reduce((sum, o) => sum + o.tasks.filter(t => !t.completed).length, 0);

  // Department orders distribution
  const departmentLoads: Record<string, number> = {};
  orders.forEach(o => {
    departmentLoads[o.currentStage] = (departmentLoads[o.currentStage] || 0) + 1;
  });

  // Material requests count
  const pendingMaterialRequests = requests.filter(r => r.status === 'Pending').length;

  res.json({
    activeOrdersCount,
    highPriorityCount,
    completedOrdersCount,
    pendingTasksCount,
    pendingMaterialRequests,
    departmentLoads,
    employeeCount: employees.length,
    activeEmployees: employees.filter(e => e.status === 'Active').length
  });
});

export default router;
