import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanMockData() {
  console.log("Cleaning up old mock data...");

  // Delete inquiries that do not start with JOB-
  const deletedInquiries = await prisma.inquiry.deleteMany({
    where: {
      NOT: {
        inquiryCode: {
          startsWith: "JOB-"
        }
      }
    }
  });

  console.log(`Deleted ${deletedInquiries.count} old mock inquiries.`);

  // Verify remaining inquiries in database
  const remainingInquiries = await prisma.inquiry.findMany();
  console.log("Remaining Inquiries in Database:");
  remainingInquiries.forEach((inq) => {
    console.log(` - [${inq.inquiryCode}] ${inq.client}`);
  });

  // Verify jobs in database
  const jobs = await prisma.job.findMany();
  console.log("Jobs in Database:");
  jobs.forEach((job) => {
    console.log(` - [${job.jobNo}] ${job.clientName}`);
  });
}

cleanMockData()
  .catch((e) => {
    console.error("Cleanup error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
