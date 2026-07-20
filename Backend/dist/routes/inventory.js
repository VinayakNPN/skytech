"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mockData_1 = require("../data/mockData");
const router = (0, express_1.Router)();
// GET all requests
router.get('/requests', (req, res) => {
    (0, mockData_1.logSystemEvent)('API Server', 'GET /api/inventory/requests', 'info');
    res.json((0, mockData_1.getMaterialRequests)());
});
// POST new request
router.post('/requests', (req, res) => {
    const { orderId, itemName, quantity, requestedBy } = req.body;
    if (!itemName || !quantity) {
        return res.status(400).json({ error: 'itemName and quantity are required' });
    }
    const newReq = (0, mockData_1.createMaterialRequest)({ orderId, itemName, quantity, requestedBy });
    res.status(201).json(newReq);
});
// PUT update status (Approve / Reject)
router.put('/requests/:id/status', (req, res) => {
    const { status } = req.body;
    if (status !== 'Approved' && status !== 'Rejected') {
        return res.status(400).json({ error: 'Status must be Approved or Rejected' });
    }
    const updatedReq = (0, mockData_1.updateMaterialRequestStatus)(req.params.id, status);
    if (!updatedReq) {
        return res.status(404).json({ error: 'Request not found' });
    }
    res.json(updatedReq);
});
exports.default = router;
