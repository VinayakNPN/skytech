"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mockData_1 = require("../data/mockData");
const router = (0, express_1.Router)();
// GET system architecture nodes status and logs
router.get('/status', (req, res) => {
    // Simulate active variations in CPU/memory usage
    const generateMetrics = (baseCpu, baseRam) => {
        return {
            cpu: Math.min(100, Math.max(1, Math.round(baseCpu + (Math.random() * 10 - 5)))),
            memory: Math.min(100, Math.max(1, Math.round(baseRam + (Math.random() * 4 - 2)))),
            latency: Math.round(5 + Math.random() * 25)
        };
    };
    const components = {
        frontend: { name: 'Next.js App (Vercel)', status: 'Online', ...generateMetrics(12, 45) },
        backend: { name: 'Express.js API', status: 'Online', ...generateMetrics(18, 55) },
        database: { name: 'PostgreSQL Database (Neon)', status: 'Online', ...generateMetrics(8, 30), connections: Math.round(15 + Math.random() * 5) },
        storage: { name: 'Azure Blob Storage', status: 'Online', latency: Math.round(40 + Math.random() * 20), usageGb: '184.5 GB' },
        integrations: {
            microsoftGraph: { name: 'Microsoft Entra ID / Graph', status: 'Online', latency: Math.round(120 + Math.random() * 30) },
            emailService: { name: 'Email SMTP Service', status: 'Online', latency: Math.round(80 + Math.random() * 20) },
            whatsappGateway: { name: 'WhatsApp/SMS Gateway', status: 'Online', latency: Math.round(95 + Math.random() * 15) },
            paymentGateway: { name: 'Payment Gateway (Razorpay)', status: 'Online', latency: Math.round(150 + Math.random() * 50) },
            googleMaps: { name: 'Google Maps Location API', status: 'Online', latency: Math.round(60 + Math.random() * 10) }
        }
    };
    // Add a random log message occasionally to look dynamic
    if (Math.random() > 0.6) {
        const services = ['API Server', 'PostgreSQL DB', 'Azure Blob', 'Next.js App'];
        const messages = [
            'Heartbeat check OK',
            'Database query executed (SELECT * FROM "Order" WHERE id = $1)',
            'Token validation succeeded for session',
            'Blob asset successfully uploaded: CAD_Drawing_Rev3.pdf',
            'Sent status update notification email'
        ];
        const levels = ['info', 'info', 'info', 'info', 'warn'];
        const idx = Math.floor(Math.random() * messages.length);
        const serviceIdx = Math.floor(Math.random() * services.length);
        (0, mockData_1.logSystemEvent)(services[serviceIdx], messages[idx], levels[idx]);
    }
    res.json({
        components,
        logs: mockData_1.systemLogs
    });
});
exports.default = router;
