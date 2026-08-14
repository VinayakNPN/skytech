import { Router, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/authorize';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-do-not-use-in-prod';

// Google OAuth2 client — verifies id_tokens server-side (secure approach)
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─────────────────────────────────────────────────────────────────────────────
// SSE: Admin real-time notification stream
// Clients connect to GET /api/auth/admin/events and receive push events
// ─────────────────────────────────────────────────────────────────────────────
type SSEClient = { id: string; res: Response };
const sseClients: SSEClient[] = [];

export function pushApprovalEvent(payload: object) {
  const data = JSON.stringify(payload);
  for (const client of sseClients) {
    try {
      client.res.write(`data: ${data}\n\n`);
    } catch {
      // client disconnected — will be cleaned up on 'close'
    }
  }
}

router.get('/admin/events', authenticate, requireAdmin(), (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = `${Date.now()}-${Math.random()}`;
  sseClients.push({ id: clientId, res });
  logger.info(`[SSE] Admin client connected: ${clientId}`);

  // Heartbeat every 25s to keep connection alive through proxies
  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch { /* ignore */ }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    const idx = sseClients.findIndex(c => c.id === clientId);
    if (idx !== -1) sseClients.splice(idx, 1);
    logger.info(`[SSE] Admin client disconnected: ${clientId}`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper: build next EMP-XX code
// ─────────────────────────────────────────────────────────────────────────────
async function getNextEmpCode(): Promise<string> {
  const last = await prisma.employee.findFirst({
    orderBy: { empCode: 'desc' },
    where: { empCode: { startsWith: 'EMP-' } }
  });
  let num = 1;
  if (last) {
    const parsed = parseInt(last.empCode.split('-')[1], 10);
    if (!isNaN(parsed)) num = parsed + 1;
  }
  return `EMP-${String(num).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: sign a JWT for an employee
// ─────────────────────────────────────────────────────────────────────────────
function signEmployeeJwt(employee: any): string {
  let permissionsObj: any = {};
  try { permissionsObj = JSON.parse(employee.permissions); } catch { /* empty */ }

  const payload = {
    id: employee.id,
    empCode: employee.empCode,
    email: employee.email,
    name: employee.name,
    role: employee.role,
    department: employee.department,
    isAdmin: employee.isAdmin,
    permissions: permissionsObj
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/google/callback
// Frontend sends { code } from Google Authorization Code flow.
// Backend exchanges it for tokens, verifies id_token, and handles login logic.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/google/callback', async (req: Request, res: Response) => {
  try {
    const { code, redirectUri } = req.body as { code: string; redirectUri: string };
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      logger.error('[GoogleAuth] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set');
      return res.status(500).json({ error: 'Google OAuth not configured on server' });
    }

    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri || 'http://localhost:3000',
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenRes.json() as any;
    if (!tokenRes.ok || !tokenData.id_token) {
      logger.error(`[GoogleAuth] Token exchange failed: ${JSON.stringify(tokenData)}`);
      return res.status(401).json({ error: 'Failed to exchange authorization code with Google' });
    }

    // Verify id_token server-side
    const ticket = await googleClient.verifyIdToken({
      idToken: tokenData.id_token,
      audience: clientId
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.sub) {
      return res.status(401).json({ error: 'Invalid Google ID token' });
    }

    const googleId = payload.sub;
    const email = payload.email || '';
    const name = payload.name || email;
    const avatarUrl = payload.picture || null;

    // ── Decision tree ────────────────────────────────────────────────────────

    // 1. Existing employee with matching googleId → issue JWT
    let employee = await prisma.employee.findUnique({ where: { googleId } });
    if (employee) {
      if (employee.status === 'Active') {
        const token = signEmployeeJwt(employee);
        let perms: any = {};
        try { perms = JSON.parse(employee.permissions); } catch { /* empty */ }
        return res.json({ token, user: { ...employee, permissions: perms } });
      }
      if (employee.status === 'Pending') {
        return res.status(403).json({ 
          code: 'PENDING_APPROVAL', 
          message: 'Your account is pending admin approval.',
          name: employee.name,
          email: employee.email,
          avatarUrl: employee.avatarUrl
        });
      }
      return res.status(403).json({ error: 'Account is inactive. Contact your administrator.' });
    }

    // 2. Existing employee matched by email (password-based account) → link googleId
    employee = await prisma.employee.findUnique({ where: { email } });
    if (employee && employee.status === 'Active') {
      await prisma.employee.update({
        where: { id: employee.id },
        data: { googleId, avatarUrl }
      });
      const token = signEmployeeJwt({ ...employee, googleId, avatarUrl });
      let perms: any = {};
      try { perms = JSON.parse(employee.permissions); } catch { /* empty */ }
      return res.json({ token, user: { ...employee, googleId, avatarUrl, permissions: perms } });
    }

    // 3. Completely new Google account → create ApprovalRequest
    const existing = await prisma.approvalRequest.findUnique({ where: { googleId } });
    if (existing) {
      if (existing.status === 'Pending') {
        return res.status(403).json({ 
          code: 'PENDING_APPROVAL', 
          message: 'Your account is pending admin approval.',
          name: existing.name,
          email: existing.email,
          avatarUrl: existing.avatarUrl
        });
      }
      if (existing.status === 'Rejected') {
        return res.status(403).json({ error: 'Your access request was rejected. Contact your administrator.' });
      }
    }

    const approvalReq = await prisma.approvalRequest.upsert({
      where: { googleId },
      update: { email, name, avatarUrl, status: 'Pending' },
      create: { googleId, email, name, avatarUrl, status: 'Pending' }
    });

    // Push real-time SSE notification to all connected admin dashboards
    pushApprovalEvent({
      type: 'NEW_APPROVAL_REQUEST',
      request: { id: approvalReq.id, googleId, email, name, avatarUrl }
    });

    logger.info(`[GoogleAuth] New approval request created for ${email}`);
    return res.status(403).json({
      code: 'PENDING_APPROVAL',
      requestId: approvalReq.id,
      message: 'Your account requires admin approval. You will be notified once approved.',
      name,
      email,
      avatarUrl
    });

  } catch (error: any) {
    logger.error(`[GoogleAuth] Callback error: ${error.message}`);
    return res.status(500).json({ error: 'Internal server error during Google authentication' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/approval-requests   (Admin only)
// Returns all pending (and recent) approval requests
// ─────────────────────────────────────────────────────────────────────────────
router.get('/approval-requests', authenticate, requireAdmin(), async (req: Request, res: Response) => {
  try {
    const requests = await prisma.approvalRequest.findMany({
      where: { status: 'Pending' },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(requests);
  } catch (error: any) {
    logger.error(`[GoogleAuth] Fetch approval requests error: ${error.message}`);
    return res.status(500).json({ error: 'Failed to fetch approval requests' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/approval-requests/:id/approve   (Admin only)
// Body: { permissions: EmployeePermissions, name?, department?, designation?, role? }
// Creates/updates the Employee record → marks ApprovalRequest approved
// ─────────────────────────────────────────────────────────────────────────────
router.post('/approval-requests/:id/approve', authenticate, requireAdmin(), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { permissions, name, department, designation, role, isAdmin: makeAdmin } = req.body;

    const approvalReq = await prisma.approvalRequest.findUnique({ where: { id } });
    if (!approvalReq) {
      return res.status(404).json({ error: 'Approval request not found' });
    }
    if (approvalReq.status !== 'Pending') {
      return res.status(409).json({ error: `Request is already ${approvalReq.status}` });
    }

    const permString = typeof permissions === 'string' ? permissions : JSON.stringify(permissions || {});
    const displayName = name || approvalReq.name;
    const dept = department || 'Unassigned';
    const desg = designation || 'Employee';
    const userRole = role || 'Employee';
    const empCode = await getNextEmpCode();

    // Upsert employee — check if email already exists first (edge case)
    let employee = await prisma.employee.findUnique({ where: { email: approvalReq.email } });
    if (employee) {
      employee = await prisma.employee.update({
        where: { email: approvalReq.email },
        data: {
          googleId: approvalReq.googleId,
          avatarUrl: approvalReq.avatarUrl,
          status: 'Active',
          permissions: permString,
          isAdmin: makeAdmin || false,
          department: dept,
          designation: desg,
          role: userRole,
          name: displayName
        }
      });
    } else {
      employee = await prisma.employee.create({
        data: {
          empCode,
          name: displayName,
          email: approvalReq.email,
          googleId: approvalReq.googleId,
          avatarUrl: approvalReq.avatarUrl,
          passwordHash: '',
          department: dept,
          designation: desg,
          role: userRole,
          isAdmin: makeAdmin || false,
          status: 'Active',
          permissions: permString
        }
      });
    }

    // Mark approval request as resolved
    await prisma.approvalRequest.update({
      where: { id },
      data: {
        status: 'Approved',
        permissions: permString,
        resolvedAt: new Date(),
        resolvedBy: req.user?.empCode || 'Admin'
      }
    });

    logger.info(`[GoogleAuth] Approved ${approvalReq.email} as ${employee.empCode}`);
    return res.json({ message: 'User approved successfully', empCode: employee.empCode });

  } catch (error: any) {
    logger.error(`[GoogleAuth] Approve error: ${error.message}`);
    return res.status(500).json({ error: 'Failed to approve user' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/approval-requests/:id/reject   (Admin only)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/approval-requests/:id/reject', authenticate, requireAdmin(), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const approvalReq = await prisma.approvalRequest.findUnique({ where: { id } });
    if (!approvalReq) {
      return res.status(404).json({ error: 'Approval request not found' });
    }

    await prisma.approvalRequest.update({
      where: { id },
      data: {
        status: 'Rejected',
        resolvedAt: new Date(),
        resolvedBy: req.user?.empCode || 'Admin'
      }
    });

    logger.info(`[GoogleAuth] Rejected access for ${approvalReq.email}`);
    return res.json({ message: 'User rejected successfully' });

  } catch (error: any) {
    logger.error(`[GoogleAuth] Reject error: ${error.message}`);
    return res.status(500).json({ error: 'Failed to reject user' });
  }
});

export default router;
