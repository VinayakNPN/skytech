import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultItems = [
  { itemCode: "MCB-006", description: "MCB 06A SP C-Curve", make: "Schneider Electric", category: "Switchgear Parts", unit: "Nos", openingStock: 20, minStockLevel: 5, unitRate: 180 },
  { itemCode: "MCB-032", description: "MCB 32A SP C-Curve", make: "Schneider Electric", category: "Switchgear Parts", unit: "Nos", openingStock: 20, minStockLevel: 5, unitRate: 180 },
  { itemCode: "MCCB-001", description: "MCCB 100A TP", make: "Siemens", category: "Switchgear Parts", unit: "Nos", openingStock: 5, minStockLevel: 2, unitRate: 4500 },
  { itemCode: "CONT-001", description: "Contactor 32A 3-Pole", make: "Siemens", category: "Contactors & Relays", unit: "Nos", openingStock: 10, minStockLevel: 3, unitRate: 1200 },
  { itemCode: "RLY-001", description: "Control Relay 230V 2C/O", make: "OMRON", category: "Contactors & Relays", unit: "Nos", openingStock: 15, minStockLevel: 5, unitRate: 220 },
  { itemCode: "CBL-001", description: "Cable 2.5 sqmm Cu (FRLS)", make: "Polycab", category: "Cable", unit: "Mtr", openingStock: 500, minStockLevel: 100, unitRate: 42 },
  { itemCode: "CBL-002", description: "Cable 4 sqmm Cu (FRLS)", make: "Polycab", category: "Cable", unit: "Mtr", openingStock: 300, minStockLevel: 100, unitRate: 65 },
  { itemCode: "WIRE-001", description: "Control Wire 1.5 sqmm", make: "Finolex", category: "Wire", unit: "Mtr", openingStock: 400, minStockLevel: 100, unitRate: 18 },
  { itemCode: "LUG-001", description: "Copper Lug 4 sqmm (Ring)", make: "Dowells", category: "Lugs & Ferrules", unit: "Nos", openingStock: 100, minStockLevel: 20, unitRate: 8 },
  { itemCode: "LUG-002", description: "Bootlace Ferrule 1.5 sqmm", make: "Dowells", category: "Lugs & Ferrules", unit: "Nos", openingStock: 500, minStockLevel: 100, unitRate: 2 },
  { itemCode: "NB-001", description: "Hex Bolt M6 x 20mm SS", make: "Local/Generic", category: "Nut Bolts & Fasteners", unit: "Nos", openingStock: 500, minStockLevel: 100, unitRate: 3 },
  { itemCode: "NB-002", description: "Nut M6 SS", make: "Local/Generic", category: "Nut Bolts & Fasteners", unit: "Nos", openingStock: 500, minStockLevel: 100, unitRate: 1 },
  { itemCode: "TB-001", description: "Terminal Block 4mm", make: "Elmex", category: "Terminal Blocks", unit: "Nos", openingStock: 200, minStockLevel: 50, unitRate: 15 },
  { itemCode: "PLC-001", description: "PLC Module - Digital I/O", make: "Siemens", category: "PLC & Automation", unit: "Nos", openingStock: 3, minStockLevel: 1, unitRate: 8500 },
  { itemCode: "HMI-001", description: "HMI 7 inch Touch Panel", make: "Siemens", category: "HMI & Display", unit: "Nos", openingStock: 2, minStockLevel: 1, unitRate: 15000 },
  { itemCode: "BUS-001", description: "Copper Bus Bar 25x5mm", make: "Local/Generic", category: "Bus Bar", unit: "Mtr", openingStock: 40, minStockLevel: 10, unitRate: 650 },
  { itemCode: "GLD-001", description: "Glow Indicator Lamp 22mm", make: "L&T", category: "Indicators & Pilot Devices", unit: "Nos", openingStock: 60, minStockLevel: 15, unitRate: 45 },
  { itemCode: "CG-001", description: "Cable Gland PG-13.5", make: "Local/Generic", category: "Cable Glands & Accessories", unit: "Nos", openingStock: 150, minStockLevel: 30, unitRate: 12 }
];

const defaultJobs = [
  { jobNo: "JOB-01", clientName: "Britannia Rudrapur - DGF Oven PLC/HMI", location: "Rudrapur", status: "Running", amount: 1850000 },
  { jobNo: "JOB-02", clientName: "Ordnance Parachute Factory Kanpur - HT/LT Panel", location: "Kanpur", status: "Running", amount: 2400000 },
  { jobNo: "JOB-03", clientName: "Flour Mill - Instrumentation", location: "Kolkata", status: "Running", amount: 1510000 },
  { jobNo: "JOB-04", clientName: "Reliance Green Energy Panel", location: "Jamnagar", status: "Running", amount: 2280000 },
  { jobNo: "JOB-05", clientName: "Tata Steel Control Desk", location: "Jamshedpur", status: "Running", amount: 1940000 }
];

async function seed() {
  console.log("Seeding Inventory, Jobs & Confirmed Inquiries...");

  for (const job of defaultJobs) {
    await prisma.job.upsert({
      where: { jobNo: job.jobNo },
      update: {
        clientName: job.clientName,
        location: job.location,
        status: job.status
      },
      create: {
        jobNo: job.jobNo,
        clientName: job.clientName,
        location: job.location,
        status: job.status
      }
    });

    // Also sync to Inquiry table for WBS & Dashboard integration
    await prisma.inquiry.upsert({
      where: { inquiryCode: job.jobNo },
      update: {
        client: job.clientName,
        project: job.clientName,
        status: "Confirmed"
      },
      create: {
        inquiryCode: job.jobNo,
        client: job.clientName,
        project: job.clientName,
        amount: job.amount,
        status: "Confirmed"
      }
    });
  }

  for (const item of defaultItems) {
    await prisma.stockItem.upsert({
      where: { itemCode: item.itemCode },
      update: item,
      create: item
    });
  }

  console.log("Seeding completed successfully!");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
