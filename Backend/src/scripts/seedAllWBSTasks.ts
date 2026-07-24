import { PrismaClient } from "@prisma/client";
import { seedStandardWBSTasksForInquiry } from "../utils/wbsSeeder";

const prisma = new PrismaClient();

async function seedAll() {
  console.log("Seeding WBS boilerplate tasks for all active jobs/inquiries...");

  const inquiries = await prisma.inquiry.findMany();
  console.log(`Found ${inquiries.length} inquiries in DB.`);

  for (const inq of inquiries) {
    console.log(`Populating WBS tasks for project: ${inq.inquiryCode} (${inq.client})`);
    await seedStandardWBSTasksForInquiry(inq.id);
  }

  const totalTasks = await prisma.wBSTask.count();
  console.log(`Successfully seeded WBS tasks! Total WBS Tasks in DB: ${totalTasks}`);
}

seedAll()
  .catch((e) => {
    console.error("Error seeding WBS tasks:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
