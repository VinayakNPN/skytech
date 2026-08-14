/**
 * One-time script: seeds chouhanvinayak86@gmail.com as an admin employee
 * so they are pre-approved and skip the approval checkpoint.
 * Run with: npx ts-node src/scripts/seedAdmin.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ADMIN_FULL_PERMISSIONS = JSON.stringify({
  dashboard:   { read: true, write: true, delete: true },
  inquiries:   { read: true, write: true, delete: true },
  wbs:         { read: true, write: true, delete: true },
  inventory:   { read: true, write: true, delete: true },
  employees:   { read: true, write: true, delete: true },
  employeeHub: { read: true, write: true, delete: true },
  reports:     { read: true, write: true, delete: true },
  leaveApproval: { canApprove: true }
});

async function main() {
  // Find next available empCode
  const lastEmp = await prisma.employee.findFirst({
    orderBy: { empCode: 'desc' },
    where: { empCode: { startsWith: 'EMP-' } }
  });
  let nextNum = 1;
  if (lastEmp) {
    const num = parseInt(lastEmp.empCode.split('-')[1], 10);
    if (!isNaN(num)) nextNum = num + 1;
  }
  const empCode = `EMP-${String(nextNum).padStart(2, '0')}`;

  const existing = await prisma.employee.findUnique({
    where: { email: 'chouhanvinayak86@gmail.com' }
  });

  if (existing) {
    await prisma.employee.update({
      where: { email: 'chouhanvinayak86@gmail.com' },
      data: {
        isAdmin: true,
        status: 'Active',
        permissions: ADMIN_FULL_PERMISSIONS
      }
    });
    console.log(`[SeedAdmin] Updated existing employee ${existing.empCode} as admin.`);
  } else {
    const created = await prisma.employee.create({
      data: {
        empCode,
        name: 'Vinayak Chouhan',
        email: 'chouhanvinayak86@gmail.com',
        passwordHash: '',
        department: 'Management',
        designation: 'Administrator',
        role: 'Admin',
        isAdmin: true,
        status: 'Active',
        permissions: ADMIN_FULL_PERMISSIONS
      }
    });
    console.log(`[SeedAdmin] Created admin employee ${created.empCode} for chouhanvinayak86@gmail.com`);
  }

  console.log('[SeedAdmin] Done.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
