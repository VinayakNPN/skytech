"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mockData_1 = require("../data/mockData");
const router = (0, express_1.Router)();
// GET all orders
router.get('/', (req, res) => {
    (0, mockData_1.logSystemEvent)('API Server', 'GET /api/orders', 'info');
    res.json((0, mockData_1.getOrders)());
});
// GET single order by ID
router.get('/:id', (req, res) => {
    const order = (0, mockData_1.getOrderById)(req.params.id);
    if (!order) {
        (0, mockData_1.logSystemEvent)('API Server', `GET /api/orders/${req.params.id} failed - Not Found`, 'warn');
        return res.status(404).json({ error: 'Order not found' });
    }
    (0, mockData_1.logSystemEvent)('API Server', `GET /api/orders/${req.params.id} successful`, 'info');
    res.json(order);
});
// POST new order
router.post('/', (req, res) => {
    const { clientName, projectName, panels, priority, deadline } = req.body;
    if (!clientName || !projectName) {
        return res.status(400).json({ error: 'clientName and projectName are required' });
    }
    const newOrder = (0, mockData_1.createOrder)({ clientName, projectName, panels, priority, deadline });
    res.status(201).json(newOrder);
});
// PUT update order stage
router.put('/:id/stage', (req, res) => {
    const { stage, user } = req.body;
    if (!stage || !user) {
        return res.status(400).json({ error: 'stage and user are required' });
    }
    const updatedOrder = (0, mockData_1.updateOrderStage)(req.params.id, stage, user);
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
    const updatedOrder = (0, mockData_1.updateOrderDeptRemark)(req.params.id, dept, remark, user);
    if (!updatedOrder) {
        return res.status(404).json({ error: 'Order not found' });
    }
    res.json(updatedOrder);
});
// PUT toggle task completion
router.put('/:id/tasks/:taskId/toggle', (req, res) => {
    const updatedOrder = (0, mockData_1.toggleTaskCompletion)(req.params.id, req.params.taskId);
    if (!updatedOrder) {
        return res.status(404).json({ error: 'Order or task not found' });
    }
    res.json(updatedOrder);
});
exports.default = router;
