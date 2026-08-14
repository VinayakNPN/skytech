import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Seeding SkyTech database...');

  // 1. Seed Inquiries
  const inquiriesData = [
    { inquiryCode: 'INQ_01', client: 'Reliance Green Energy', project: '132kV Substation Panel', amount: 1850000, contactPerson: 'Rohan Sharma', email: 'rohan@reliancegreen.com', phone: '+91 98201 12345', date: new Date('2026-07-18'), status: 'Confirmed', remarks: 'Client PO confirmed, pushed to Mechanical Dept.', weeksAgo: 1 },
    { inquiryCode: 'INQ_02', client: 'Tata Steel Infra', project: 'Control Desk & PCC Panel', amount: 1220000, contactPerson: 'Anish Verma', email: 'a.verma@tatasteel.com', phone: '+91 98310 54321', date: new Date('2026-07-16'), status: 'Offer Sent', remarks: 'Commercial proposal sent, awaiting approval.', weeksAgo: 1 },
    { inquiryCode: 'INQ_03', client: 'Adani Solar Power', project: 'MCC Panel System', amount: 2400000, contactPerson: 'Priya Mehta', email: 'p.mehta@adanisolar.com', phone: '+91 98450 67890', date: new Date('2026-07-14'), status: 'Confirmed', remarks: 'Technical clearance approved by client.', weeksAgo: 1 },
    { inquiryCode: 'INQ_04', client: 'L&T Construction', project: 'Distribution Board DB-04', amount: 840000, contactPerson: 'Vikram Joshi', email: 'v.joshi@lntconst.com', phone: '+91 98111 22334', date: new Date('2026-07-12'), status: 'Unconfirmed', remarks: 'Commercial renegotiation requested.', weeksAgo: 1 },
    { inquiryCode: 'INQ_05', client: 'Torrent Power Pvt Ltd', project: 'APFC Panel 440V', amount: 1510000, contactPerson: 'Deepak Patel', email: 'd.patel@torrent.com', phone: '+91 98980 99887', date: new Date('2026-07-09'), status: 'Confirmed', remarks: 'Advance payment received.', weeksAgo: 2 },
    { inquiryCode: 'INQ_06', client: 'JSW Energy Ltd', project: 'Busduct System 2000A', amount: 3100000, contactPerson: 'Sanjay Reddy', email: 's.reddy@jswenergy.com', phone: '+91 98777 44332', date: new Date('2026-07-05'), status: 'Offer Sent', remarks: 'Quotation submitted to procurement lead.', weeksAgo: 2 },
    { inquiryCode: 'INQ_07', client: 'BHEL Engineering', project: 'Generator Control Panel', amount: 2280000, contactPerson: 'Karan Malhotra', email: 'karan@bhel.in', phone: '+91 98190 33221', date: new Date('2026-06-28'), status: 'Confirmed', remarks: 'Manufacturing clearance given.', weeksAgo: 3 },
    { inquiryCode: 'INQ_08', client: 'GMR Airports Pvt Ltd', project: 'Main Switchboard MSB-1', amount: 1940000, contactPerson: 'Sunil Rao', email: 's.rao@gmr.com', phone: '+91 98222 11000', date: new Date('2026-06-24'), status: 'Unconfirmed', remarks: 'Project timeline deferred by client.', weeksAgo: 4 }
  ];

  for (const inq of inquiriesData) {
    await prisma.inquiry.upsert({
      where: { inquiryCode: inq.inquiryCode },
      update: inq,
      create: inq
    });
  }
  console.log('[Seed] Inquiries seeded successfully.');

  // 2. Seed Employees
  const defaultPasswordHash = await bcrypt.hash('password123', 10);
  
  const employeesData = [
    { empCode: 'EMP-01', name: 'Vinayak NPN', email: 'chouhanvinayak86@gmail.com', department: 'Management', designation: 'Program Manager', role: 'Admin', status: 'Active', passwordHash: defaultPasswordHash, isAdmin: true, permissions: JSON.stringify({}) },
    { empCode: 'EMP-09', name: 'Skytech Switchgear', email: 'switchgearskytech@gmail.com', department: 'Management', designation: 'Administrator', role: 'Admin', status: 'Active', passwordHash: defaultPasswordHash, isAdmin: true, permissions: JSON.stringify({}) },
    { empCode: 'EMP-02', name: 'Amol M.', email: 'amol@skytech.com', department: 'Design & Costing', designation: 'Senior Design Engineer', role: 'Engineer', status: 'Active', passwordHash: defaultPasswordHash, isAdmin: false, permissions: JSON.stringify({ dashboard: { read: false, write: false, delete: false }, employeeHub: { read: true, write: true, delete: false } }) },
    { empCode: 'EMP-03', name: 'Suresh K.', email: 'suresh@skytech.com', department: 'Mechanical Dept.', designation: 'Fabrication Lead', role: 'Supervisor', status: 'Active', passwordHash: defaultPasswordHash, isAdmin: false, permissions: JSON.stringify({ dashboard: { read: false, write: false, delete: false }, employeeHub: { read: true, write: true, delete: false } }) },
    { empCode: 'EMP-04', name: 'Pankaj R.', email: 'pankaj@skytech.com', department: 'Assembly & Busbar Dept.', designation: 'Assembly Tech', role: 'Operator', status: 'Active', passwordHash: defaultPasswordHash, isAdmin: false, permissions: JSON.stringify({ dashboard: { read: false, write: false, delete: false }, employeeHub: { read: true, write: true, delete: false } }) },
    { empCode: 'EMP-05', name: 'Rajesh V.', email: 'rajesh@skytech.com', department: 'Electrical Dept.', designation: 'Lead Electrician', role: 'Operator', status: 'Active', passwordHash: defaultPasswordHash, isAdmin: false, permissions: JSON.stringify({ dashboard: { read: false, write: false, delete: false }, employeeHub: { read: true, write: true, delete: false } }) },
    { empCode: 'EMP-06', name: 'Kiran T.', email: 'kiran@skytech.com', department: 'Testing Dept.', designation: 'QC Inspector', role: 'Supervisor', status: 'Active', passwordHash: defaultPasswordHash, isAdmin: false, permissions: JSON.stringify({ dashboard: { read: false, write: false, delete: false }, employeeHub: { read: true, write: true, delete: false } }) },
    { empCode: 'EMP-07', name: 'Mahesh P.', email: 'mahesh@skytech.com', department: 'Store Dept.', designation: 'Store Manager', role: 'Supervisor', status: 'Active', passwordHash: defaultPasswordHash, isAdmin: false, permissions: JSON.stringify({ dashboard: { read: false, write: false, delete: false }, employeeHub: { read: true, write: true, delete: false }, inventory: { read: true, write: true, delete: false } }) },
    { empCode: 'EMP-08', name: 'Rohan D.', email: 'rohan@skytech.com', department: 'Support & Service Dept.', designation: 'Field Service Engineer', role: 'Engineer', status: 'Active', passwordHash: defaultPasswordHash, isAdmin: false, permissions: JSON.stringify({ dashboard: { read: false, write: false, delete: false }, employeeHub: { read: true, write: true, delete: false } }) }
  ];

  for (const emp of employeesData) {
    await prisma.employee.upsert({
      where: { email: emp.email },
      update: emp,
      create: emp
    });
  }
  console.log('[Seed] Employees seeded successfully.');

  // 3. Seed WBS Phases & Tasks
  const phasesData = [
    { wbsCode: '1.0', name: 'INQUIRY & OFFER PHASE', badge: 'INQUIRY', owner: 'Vinayak NPN' },
    { wbsCode: '2.0', name: 'DESIGN & COSTING DEPT.', badge: 'DESIGN', owner: 'Design Lead' },
    { wbsCode: '3.0', name: 'STORE DEPT.', badge: 'STORE', owner: 'Store Manager' },
    { wbsCode: '4.0', name: 'MECHANICAL DEPT.', badge: 'MECHANICAL', owner: 'Mech Supervisor' },
    { wbsCode: '5.0', name: 'ASSEMBLY & BUSBAR DEPT.', badge: 'ASSEMBLY', owner: 'Assembly Lead' },
    { wbsCode: '6.0', name: 'ELECTRICAL DEPT.', badge: 'ELECTRICAL', owner: 'Electrical Lead' },
    { wbsCode: '7.0', name: 'TESTING DEPT.', badge: 'TESTING', owner: 'QC Manager' },
    { wbsCode: '8.0', name: 'ACCOUNTS & DISPATCH', badge: 'ACCOUNTS', owner: 'Accounts Officer' },
    { wbsCode: '9.0', name: 'SUPPORT & SERVICE DEPT.', badge: 'SUPPORT', owner: 'Service Manager' }
  ];

  for (const p of phasesData) {
    await prisma.wBSPhase.upsert({
      where: { wbsCode: p.wbsCode },
      update: p,
      create: p
    });
  }

  const confirmedInquiries = await prisma.inquiry.findMany({ where: { status: 'Confirmed' } });
  const allPhases = await prisma.wBSPhase.findMany();
  const phaseMap = new Map(allPhases.map(p => [p.wbsCode, p.id]));

  const standardPhaseTasks = [
    // Phase 1: 1.0 INQUIRY & OFFER PHASE
    { phaseWbsCode: '1.0', wbsCode: '1.1', name: 'Inquiry Received to Skytech', owner: 'Sales Team', planHours: 4, actualHours: 4, status: 'DONE', progress: 100 },
    { phaseWbsCode: '1.0', wbsCode: '1.2', name: 'Design & Costing Proposal', owner: 'Design Lead', planHours: 16, actualHours: 16, status: 'DONE', progress: 100 },
    { phaseWbsCode: '1.0', wbsCode: '1.3', name: 'Quotation Offer Ready', owner: 'Costing Team', planHours: 8, actualHours: 8, status: 'DONE', progress: 100 },
    { phaseWbsCode: '1.0', wbsCode: '1.4', name: 'Offer Sent to Client', owner: 'Sales Manager', planHours: 2, actualHours: 2, status: 'DONE', progress: 100 },
    { phaseWbsCode: '1.0', wbsCode: '1.5', name: 'Client Order Confirmation', owner: 'Vinayak NPN', planHours: 4, actualHours: 4, status: 'DONE', progress: 100 },

    // Phase 2: 2.0 DESIGN & COSTING DEPT.
    { phaseWbsCode: '2.0', wbsCode: '2.1', name: 'GA Drawing', owner: 'Amol M.', planHours: 12, actualHours: 12, status: 'DONE', progress: 100 },
    { phaseWbsCode: '2.0', wbsCode: '2.2', name: 'SLD (Single Line Diagram)', owner: 'Amol M.', planHours: 8, actualHours: 8, status: 'DONE', progress: 100 },
    { phaseWbsCode: '2.0', wbsCode: '2.3', name: 'Control Drawing', owner: 'Design Team', planHours: 16, actualHours: 16, status: 'DONE', progress: 100 },
    { phaseWbsCode: '2.0', wbsCode: '2.4', name: 'All Drawing Approve', owner: 'Client Eng.', planHours: 8, actualHours: 8, status: 'DONE', progress: 100 },
    { phaseWbsCode: '2.0', wbsCode: '2.5', name: 'BOQ (Bill of Quantities)', owner: 'Costing Team', planHours: 10, actualHours: 10, status: 'DONE', progress: 100 },
    { phaseWbsCode: '2.0', wbsCode: '2.6', name: 'Job Loaded', owner: 'System Admin', planHours: 2, actualHours: 2, status: 'DONE', progress: 100 },
    { phaseWbsCode: '2.0', wbsCode: '2.7', name: 'Job file Send to Dept.', owner: 'Dispatch Lead', planHours: 2, actualHours: 2, status: 'DONE', progress: 100 },

    // Phase 3: 3.0 STORE DEPT.
    { phaseWbsCode: '3.0', wbsCode: '3.1', name: 'Job File Received', owner: 'Store Clerk', planHours: 2, actualHours: 2, status: 'DONE', progress: 100 },
    { phaseWbsCode: '3.0', wbsCode: '3.2', name: 'Order Material Shortlisted', owner: 'Store Manager', planHours: 6, actualHours: 6, status: 'DONE', progress: 100 },
    { phaseWbsCode: '3.0', wbsCode: '3.3', name: 'Material Order', owner: 'Purchase Exec.', planHours: 8, actualHours: 8, status: 'DONE', progress: 100 },
    { phaseWbsCode: '3.0', wbsCode: '3.4', name: 'Material Received', owner: 'Warehouse Supervisor', planHours: 12, actualHours: 12, status: 'DONE', progress: 100 },
    { phaseWbsCode: '3.0', wbsCode: '3.5', name: 'Material Handover to Dept.', owner: 'Store Officer', planHours: 4, actualHours: 4, status: 'DONE', progress: 100 },

    // Phase 4: 4.0 MECHANICAL DEPT.
    { phaseWbsCode: '4.0', wbsCode: '4.1', name: 'Job File Received', owner: 'Mech Lead', planHours: 2, actualHours: 2, status: 'DONE', progress: 100 },
    { phaseWbsCode: '4.0', wbsCode: '4.2', name: 'Sheet Cutting', owner: 'Operator A', planHours: 16, actualHours: 16, status: 'DONE', progress: 100 },
    { phaseWbsCode: '4.0', wbsCode: '4.3', name: 'Bending', owner: 'Operator B', planHours: 12, actualHours: 12, status: 'DONE', progress: 100 },
    { phaseWbsCode: '4.0', wbsCode: '4.4', name: 'Fabrication', owner: 'Fabrication Team', planHours: 24, actualHours: 24, status: 'DONE', progress: 100 },
    { phaseWbsCode: '4.0', wbsCode: '4.5', name: 'Painting', owner: 'Coat Tech', planHours: 16, actualHours: 16, status: 'DONE', progress: 100 },
    { phaseWbsCode: '4.0', wbsCode: '4.6', name: 'Dispatch to Busbar Dept.', owner: 'Floor Logistics', planHours: 2, actualHours: 2, status: 'DONE', progress: 100 },

    // Phase 5: 5.0 ASSEMBLY & BUSBAR DEPT.
    { phaseWbsCode: '5.0', wbsCode: '5.1', name: 'Job File Received', owner: 'Assembly Tech', planHours: 2, actualHours: 2, status: 'DONE', progress: 100 },
    { phaseWbsCode: '5.0', wbsCode: '5.2', name: 'Panel Assemble', owner: 'Fitter Team', planHours: 20, actualHours: 20, status: 'DONE', progress: 100 },
    { phaseWbsCode: '5.0', wbsCode: '5.3', name: 'Busbar & Switchgear fitted', owner: 'Busbar Tech', planHours: 18, actualHours: 18, status: 'DONE', progress: 100 },
    { phaseWbsCode: '5.0', wbsCode: '5.4', name: 'Busbar tightening', owner: 'QC Inspector', planHours: 10, actualHours: 5, status: 'IN PROGRESS', progress: 50 },
    { phaseWbsCode: '5.0', wbsCode: '5.5', name: 'Accessories Fitted', owner: 'Assembly Tech', planHours: 8, actualHours: 0, status: 'NOT STARTED', progress: 0 },
    { phaseWbsCode: '5.0', wbsCode: '5.6', name: 'Dispatch to Electrical Dept.', owner: 'Floor Supervisor', planHours: 2, actualHours: 0, status: 'NOT STARTED', progress: 0 },

    // Phase 6: 6.0 ELECTRICAL DEPT.
    { phaseWbsCode: '6.0', wbsCode: '6.1', name: 'Job File Received', owner: 'Wire Lead', planHours: 2, actualHours: 2, status: 'DONE', progress: 100 },
    { phaseWbsCode: '6.0', wbsCode: '6.2', name: 'Power Wiring', owner: 'Electrician A', planHours: 16, actualHours: 16, status: 'DONE', progress: 100 },
    { phaseWbsCode: '6.0', wbsCode: '6.3', name: 'Control Wiring', owner: 'Electrician B', planHours: 20, actualHours: 8, status: 'IN PROGRESS', progress: 40 },
    { phaseWbsCode: '6.0', wbsCode: '6.4', name: 'Accessories Wiring', owner: 'Wire Asst', planHours: 12, actualHours: 0, status: 'NOT STARTED', progress: 0 },
    { phaseWbsCode: '6.0', wbsCode: '6.5', name: 'Dispatch to Testing Dept.', owner: 'Elec Supervisor', planHours: 2, actualHours: 0, status: 'NOT STARTED', progress: 0 },

    // Phase 7: 7.0 TESTING DEPT.
    { phaseWbsCode: '7.0', wbsCode: '7.1', name: 'Job File Received', owner: 'QC Inspector', planHours: 2, actualHours: 2, status: 'DONE', progress: 100 },
    { phaseWbsCode: '7.0', wbsCode: '7.2', name: 'Short Material List', owner: 'QC Tech', planHours: 4, actualHours: 0, status: 'NOT STARTED', progress: 0 },
    { phaseWbsCode: '7.0', wbsCode: '7.3', name: 'Panel operation Test', owner: 'Test Eng.', planHours: 12, actualHours: 0, status: 'NOT STARTED', progress: 0 },
    { phaseWbsCode: '7.0', wbsCode: '7.4', name: 'All Parameter Checked by Approve list', owner: 'QC Head', planHours: 8, actualHours: 0, status: 'NOT STARTED', progress: 0 },
    { phaseWbsCode: '7.0', wbsCode: '7.5', name: 'Ready for Dispatch.', owner: 'Final Release Manager', planHours: 2, actualHours: 0, status: 'NOT STARTED', progress: 0 },

    // Phase 8: 8.0 ACCOUNTS & DISPATCH
    { phaseWbsCode: '8.0', wbsCode: '8.1', name: 'Final Invoice Generated', owner: 'Accounts Team', planHours: 4, actualHours: 0, status: 'NOT STARTED', progress: 0 },
    { phaseWbsCode: '8.0', wbsCode: '8.2', name: 'Payment Clearance', owner: 'Finance Lead', planHours: 4, actualHours: 0, status: 'NOT STARTED', progress: 0 },
    { phaseWbsCode: '8.0', wbsCode: '8.3', name: 'Ready For Dispatch Clearance', owner: 'Dispatch Manager', planHours: 2, actualHours: 0, status: 'NOT STARTED', progress: 0 },

    // Phase 9: 9.0 SUPPORT & SERVICE DEPT.
    { phaseWbsCode: '9.0', wbsCode: '9.1', name: 'Service Call Received', owner: 'Support Desk', planHours: 2, actualHours: 2, status: 'DONE', progress: 100 },
    { phaseWbsCode: '9.0', wbsCode: '9.2', name: 'Assigned Engineer', owner: 'Service Lead', planHours: 2, actualHours: 2, status: 'DONE', progress: 100 },
    { phaseWbsCode: '9.0', wbsCode: '9.3', name: 'Service call done', owner: 'Field Engineer', planHours: 16, actualHours: 0, status: 'NOT STARTED', progress: 0 },
    { phaseWbsCode: '9.0', wbsCode: '9.4', name: 'Submit service report', owner: 'Field Engineer', planHours: 4, actualHours: 0, status: 'NOT STARTED', progress: 0 }
  ];

  for (const inq of confirmedInquiries) {
    for (const t of standardPhaseTasks) {
      const phaseId = phaseMap.get(t.phaseWbsCode);
      if (!phaseId) continue;

      const existingTask = await prisma.wBSTask.findFirst({
        where: { wbsCode: t.wbsCode, inquiryId: inq.id, phaseId }
      });

      if (!existingTask) {
        await prisma.wBSTask.create({
          data: {
            wbsCode: t.wbsCode,
            name: t.name,
            phaseId,
            inquiryId: inq.id,
            owner: t.owner,
            planHours: t.planHours,
            actualHours: t.actualHours,
            status: t.status,
            progress: t.progress
          }
        });
      }
    }
  }

  console.log('[Seed] WBS phases and tasks seeded successfully.');
  console.log('[Seed] Database initialization complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
