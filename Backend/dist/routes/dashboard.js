"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mockData_1 = require("../data/mockData");
const router = (0, express_1.Router)();
router.get('/stats', (req, res) => {
    const orders = (0, mockData_1.getOrders)();
    const employees = mockData_1.mockEmployees;
    const requests = (0, mockData_1.getMaterialRequests)();
    // Metrics
    const activeOrdersCount = orders.length;
    const highPriorityCount = orders.filter(o => o.priority === 'High').length;
    const completedOrdersCount = orders.filter(o => o.currentStage === 'Support & Service').length;
    const pendingTasksCount = orders.reduce((sum, o) => sum + o.tasks.filter(t => !t.completed).length, 0);
    // Department orders distribution
    const departmentLoads = {};
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
exports.default = router;
