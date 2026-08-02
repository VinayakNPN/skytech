"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const wbsSeeder_1 = require("../utils/wbsSeeder");
const prisma = new client_1.PrismaClient();
async function seedAll() {
    console.log("Seeding WBS boilerplate tasks for all active jobs/inquiries...");
    const inquiries = await prisma.inquiry.findMany();
    console.log(`Found ${inquiries.length} inquiries in DB.`);
    for (const inq of inquiries) {
        console.log(`Populating WBS tasks for project: ${inq.inquiryCode} (${inq.client})`);
        await (0, wbsSeeder_1.seedStandardWBSTasksForInquiry)(inq.id);
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
