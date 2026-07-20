import { Router } from 'express';
import { 
  getMaterialRequests, 
  createMaterialRequest, 
  updateMaterialRequestStatus, 
  logSystemEvent 
} from '../data/mockData';

const router = Router();

// GET all requests
router.get('/requests', (req, res) => {
  logSystemEvent('API Server', 'GET /api/inventory/requests', 'info');
  res.json(getMaterialRequests());
});

// POST new request
router.post('/requests', (req, res) => {
  const { orderId, itemName, quantity, requestedBy } = req.body;
  if (!itemName || !quantity) {
    return res.status(400).json({ error: 'itemName and quantity are required' });
  }
  const newReq = createMaterialRequest({ orderId, itemName, quantity, requestedBy });
  res.status(201).json(newReq);
});

// PUT update status (Approve / Reject)
router.put('/requests/:id/status', (req, res) => {
  const { status } = req.body;
  if (status !== 'Approved' && status !== 'Rejected') {
    return res.status(400).json({ error: 'Status must be Approved or Rejected' });
  }
  const updatedReq = updateMaterialRequestStatus(req.params.id, status);
  if (!updatedReq) {
    return res.status(404).json({ error: 'Request not found' });
  }
  res.json(updatedReq);
});

export default router;
