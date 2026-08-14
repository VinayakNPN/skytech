import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'chouhanvinayak86@gmail.com';
  console.log(`Setting ${email} as Admin...`);

  // Check if employee exists
  let employee = await prisma.employee.findUnique({ where: { email } });

  if (employee) {
    employee = await prisma.employee.update({
      where: { email },
      data: {
        isAdmin: true,
        role: 'Admin',
        status: 'Active'
      }
    });
    console.log(`Successfully updated existing employee: ${employee.name} to Admin.`);
  } else {
    // Generate new employee code
    const lastEmployee = await prisma.employee.findFirst({
      orderBy: { empCode: 'desc' },
      where: { empCode: { startsWith: 'EMP-' } }
    });
    let num = 1;
    if (lastEmployee) {
      const parsed = parseInt(lastEmployee.empCode.split('-')[1], 10);
      if (!isNaN(parsed)) num = parsed + 1;
    }
    const empCode = `EMP-${String(num).padStart(2, '0')}`;

    employee = await prisma.employee.create({
      data: {
        empCode,
        name: 'Vinayak Chouhan',
        email,
        department: 'Management',
        designation: 'Administrator',
        role: 'Admin',
        isAdmin: true,
        status: 'Active',
        permissions: '{}'
      }
    });
    console.log(`Successfully created new employee: ${employee.name} (${employee.empCode}) as Admin.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
