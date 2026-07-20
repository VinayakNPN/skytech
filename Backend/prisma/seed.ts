import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Seeding SkyTech database...');

  // 1. Seed Inquiries
  const inquiriesData = [
    { inquiryCode: 'INQ-101', client: 'Reliance Green Energy', project: '132kV Substation Panel', amount: 1850000, contactPerson: 'Rohan Sharma', email: 'rohan@reliancegreen.com', phone: '+91 98201 12345', date: new Date('2026-07-18'), status: 'Confirmed', remarks: 'Client PO confirmed, pushed to Mechanical Dept.', weeksAgo: 1 },
    { inquiryCode: 'INQ-102', client: 'Tata Steel Infra', project: 'Control Desk & PCC Panel', amount: 1220000, contactPerson: 'Anish Verma', email: 'a.verma@tatasteel.com', phone: '+91 98310 54321', date: new Date('2026-07-16'), status: 'Offer Sent', remarks: 'Commercial proposal sent, awaiting approval.', weeksAgo: 1 },
    { inquiryCode: 'INQ-103', client: 'Adani Solar Power', project: 'MCC Panel System', amount: 2400000, contactPerson: 'Priya Mehta', email: 'p.mehta@adanisolar.com', phone: '+91 98450 67890', date: new Date('2026-07-14'), status: 'Confirmed', remarks: 'Technical clearance approved by client.', weeksAgo: 1 },
    { inquiryCode: 'INQ-104', client: 'L&T Construction', project: 'Distribution Board DB-04', amount: 840000, contactPerson: 'Vikram Joshi', email: 'v.joshi@lntconst.com', phone: '+91 98111 22334', date: new Date('2026-07-12'), status: 'Unconfirmed', remarks: 'Commercial renegotiation requested.', weeksAgo: 1 },
    { inquiryCode: 'INQ-105', client: 'Torrent Power Pvt Ltd', project: 'APFC Panel 440V', amount: 1510000, contactPerson: 'Deepak Patel', email: 'd.patel@torrent.com', phone: '+91 98980 99887', date: new Date('2026-07-09'), status: 'Confirmed', remarks: 'Advance payment received.', weeksAgo: 2 },
    { inquiryCode: 'INQ-106', client: 'JSW Energy Ltd', project: 'Busduct System 2000A', amount: 3100000, contactPerson: 'Sanjay Reddy', email: 's.reddy@jswenergy.com', phone: '+91 98777 44332', date: new Date('2026-07-05'), status: 'Offer Sent', remarks: 'Quotation submitted to procurement lead.', weeksAgo: 2 },
    { inquiryCode: 'INQ-107', client: 'BHEL Engineering', project: 'Generator Control Panel', amount: 2280000, contactPerson: 'Karan Malhotra', email: 'karan@bhel.in', phone: '+91 98190 33221', date: new Date('2026-06-28'), status: 'Confirmed', remarks: 'Manufacturing clearance given.', weeksAgo: 3 },
    { inquiryCode: 'INQ-108', client: 'GMR Airports Pvt Ltd', project: 'Main Switchboard MSB-1', amount: 1940000, contactPerson: 'Sunil Rao', email: 's.rao@gmr.com', phone: '+91 98222 11000', date: new Date('2026-06-24'), status: 'Unconfirmed', remarks: 'Project timeline deferred by client.', weeksAgo: 4 }
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
  const employeesData = [
    { empCode: 'EMP-01', name: 'Vinayak NPN', email: 'vinayak@skytech.com', department: 'Management', designation: 'Program Manager', role: 'Admin', status: 'Active' },
    { empCode: 'EMP-02', name: 'Amol M.', email: 'amol@skytech.com', department: 'Design & Costing', designation: 'Senior Design Engineer', role: 'Engineer', status: 'Active' },
    { empCode: 'EMP-03', name: 'Suresh K.', email: 'suresh@skytech.com', department: 'Mechanical Dept.', designation: 'Fabrication Lead', role: 'Supervisor', status: 'Active' },
    { empCode: 'EMP-04', name: 'Pankaj R.', email: 'pankaj@skytech.com', department: 'Assembly & Busbar Dept.', designation: 'Assembly Tech', role: 'Operator', status: 'Active' },
    { empCode: 'EMP-05', name: 'Rajesh V.', email: 'rajesh@skytech.com', department: 'Electrical Dept.', designation: 'Lead Electrician', role: 'Operator', status: 'Active' },
    { empCode: 'EMP-06', name: 'Kiran T.', email: 'kiran@skytech.com', department: 'Testing Dept.', designation: 'QC Inspector', role: 'Supervisor', status: 'Active' },
    { empCode: 'EMP-07', name: 'Mahesh P.', email: 'mahesh@skytech.com', department: 'Store Dept.', designation: 'Store Manager', role: 'Supervisor', status: 'Active' },
    { empCode: 'EMP-08', name: 'Rohan D.', email: 'rohan@skytech.com', department: 'Support & Service Dept.', designation: 'Field Service Engineer', role: 'Engineer', status: 'Active' }
  ];

  for (const emp of employeesData) {
    await prisma.employee.upsert({
      where: { empCode: emp.empCode },
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

  const dbInq101 = await prisma.inquiry.findUnique({ where: { inquiryCode: 'INQ-101' } });
  const dbPhase5 = await prisma.wBSPhase.findUnique({ where: { wbsCode: '5.0' } });

  if (dbPhase5 && dbInq101) {
    const tasksData = [
      { wbsCode: '5.1', name: 'Job File Received', phaseId: dbPhase5.id, inquiryId: dbInq101.id, owner: 'Assembly Tech', planHours: 2, actualHours: 2, status: 'DONE', progress: 100 },
      { wbsCode: '5.2', name: 'Panel Assemble', phaseId: dbPhase5.id, inquiryId: dbInq101.id, owner: 'Fitter Team', planHours: 20, actualHours: 20, status: 'DONE', progress: 100 },
      { wbsCode: '5.3', name: 'Busbar & Switchgear fitted', phaseId: dbPhase5.id, inquiryId: dbInq101.id, owner: 'Busbar Tech', planHours: 18, actualHours: 18, status: 'DONE', progress: 100 },
      { wbsCode: '5.4', name: 'Busbar tightening', phaseId: dbPhase5.id, inquiryId: dbInq101.id, owner: 'QC Inspector', planHours: 10, actualHours: 5, status: 'IN PROGRESS', progress: 50 },
      { wbsCode: '5.5', name: 'Accessories Fitted', phaseId: dbPhase5.id, inquiryId: dbInq101.id, owner: 'Assembly Tech', planHours: 8, actualHours: 0, status: 'NOT STARTED', progress: 0 },
      { wbsCode: '5.6', name: 'Dispatch to Electrical Dept.', phaseId: dbPhase5.id, inquiryId: dbInq101.id, owner: 'Floor Supervisor', planHours: 2, actualHours: 0, status: 'NOT STARTED', progress: 0 }
    ];

    for (const t of tasksData) {
      const existingTask = await prisma.wBSTask.findFirst({
        where: { wbsCode: t.wbsCode, inquiryId: t.inquiryId }
      });
      if (!existingTask) {
        await prisma.wBSTask.create({ data: t });
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
