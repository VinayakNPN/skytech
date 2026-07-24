import { prisma } from "../db/prisma";

export const DEFAULT_WBS_PHASES = [
  { wbsCode: "1.0", name: "INQUIRY & OFFER PHASE", badge: "INQUIRY", owner: "Vinayak NPN" },
  { wbsCode: "2.0", name: "DESIGN & COSTING DEPT.", badge: "DESIGN", owner: "Design Lead" },
  { wbsCode: "3.0", name: "STORE DEPT.", badge: "STORE", owner: "Store Manager" },
  { wbsCode: "4.0", name: "MECHANICAL DEPT.", badge: "MECHANICAL", owner: "Mech Supervisor" },
  { wbsCode: "5.0", name: "ASSEMBLY & BUSBAR DEPT.", badge: "ASSEMBLY", owner: "Assembly Lead" },
  { wbsCode: "6.0", name: "ELECTRICAL DEPT.", badge: "ELECTRICAL", owner: "Electrical Lead" },
  { wbsCode: "7.0", name: "TESTING DEPT.", badge: "TESTING", owner: "QC Manager" },
  { wbsCode: "8.0", name: "ACCOUNTS & DISPATCH", badge: "ACCOUNTS", owner: "Accounts Officer" },
  { wbsCode: "9.0", name: "SUPPORT & SERVICE DEPT.", badge: "SUPPORT", owner: "Service Manager" }
];

export const STANDARD_WBS_TASKS = [
  // Phase 1.0
  { phaseCode: "1.0", wbsCode: "1.1", name: "Inquiry Received to Skytech", owner: "Sales Team", planHours: 4 },
  { phaseCode: "1.0", wbsCode: "1.2", name: "Design & Costing Proposal", owner: "Design Lead", planHours: 16 },
  { phaseCode: "1.0", wbsCode: "1.3", name: "Quotation Offer Ready", owner: "Costing Team", planHours: 8 },
  { phaseCode: "1.0", wbsCode: "1.4", name: "Offer Sent to Client", owner: "Sales Manager", planHours: 2 },
  { phaseCode: "1.0", wbsCode: "1.5", name: "Client Order Confirmation", owner: "Vinayak NPN", planHours: 4 },

  // Phase 2.0
  { phaseCode: "2.0", wbsCode: "2.1", name: "Ga Drawing", owner: "Amol M.", planHours: 12 },
  { phaseCode: "2.0", wbsCode: "2.2", name: "SLD (Single Line Diagram)", owner: "Amol M.", planHours: 8 },
  { phaseCode: "2.0", wbsCode: "2.3", name: "Control Drawing", owner: "Design Team", planHours: 16 },
  { phaseCode: "2.0", wbsCode: "2.4", name: "All Drawing Approve", owner: "Client Eng.", planHours: 8 },
  { phaseCode: "2.0", wbsCode: "2.5", name: "BOQ (Bill of Quantities)", owner: "Costing Team", planHours: 10 },
  { phaseCode: "2.0", wbsCode: "2.6", name: "Job Loaded", owner: "System Admin", planHours: 2 },
  { phaseCode: "2.0", wbsCode: "2.7", name: "Job file Send to Dept.", owner: "Dispatch Lead", planHours: 2 },

  // Phase 3.0
  { phaseCode: "3.0", wbsCode: "3.1", name: "Job File Received", owner: "Store Clerk", planHours: 2 },
  { phaseCode: "3.0", wbsCode: "3.2", name: "Order Material Shortlisted", owner: "Store Manager", planHours: 6 },
  { phaseCode: "3.0", wbsCode: "3.3", name: "Material Order", owner: "Purchase Exec.", planHours: 8 },
  { phaseCode: "3.0", wbsCode: "3.4", name: "Material Received", owner: "Warehouse Supervisor", planHours: 12 },
  { phaseCode: "3.0", wbsCode: "3.5", name: "Material Handover to Dept.", owner: "Store Officer", planHours: 4 },

  // Phase 4.0
  { phaseCode: "4.0", wbsCode: "4.1", name: "Job File Received", owner: "Mech Lead", planHours: 2 },
  { phaseCode: "4.0", wbsCode: "4.2", name: "Sheet Cutting", owner: "Operator A", planHours: 16 },
  { phaseCode: "4.0", wbsCode: "4.3", name: "Bending", owner: "Operator B", planHours: 12 },
  { phaseCode: "4.0", wbsCode: "4.4", name: "Fabrication", owner: "Fabrication Team", planHours: 24 },
  { phaseCode: "4.0", wbsCode: "4.5", name: "Painting", owner: "Coat Tech", planHours: 16 },
  { phaseCode: "4.0", wbsCode: "4.6", name: "Dispatch to Busbar Dept.", owner: "Floor Logistics", planHours: 2 },

  // Phase 5.0
  { phaseCode: "5.0", wbsCode: "5.1", name: "Job File Received", owner: "Assembly Tech", planHours: 2 },
  { phaseCode: "5.0", wbsCode: "5.2", name: "Panel Assemble", owner: "Fitter Team", planHours: 20 },
  { phaseCode: "5.0", wbsCode: "5.3", name: "Busbar & Switchgear fitted", owner: "Busbar Tech", planHours: 18 },
  { phaseCode: "5.0", wbsCode: "5.4", name: "Busbar tightening", owner: "QC Inspector", planHours: 10 },
  { phaseCode: "5.0", wbsCode: "5.5", name: "Accessories Fitted", owner: "Assembly Tech", planHours: 8 },
  { phaseCode: "5.0", wbsCode: "5.6", name: "Dispatch to Electrical Dept.", owner: "Floor Supervisor", planHours: 2 },

  // Phase 6.0
  { phaseCode: "6.0", wbsCode: "6.1", name: "Job File Received", owner: "Wire Lead", planHours: 2 },
  { phaseCode: "6.0", wbsCode: "6.2", name: "Power Wiring", owner: "Electrician A", planHours: 16 },
  { phaseCode: "6.0", wbsCode: "6.3", name: "Control Wiring", owner: "Electrician B", planHours: 20 },
  { phaseCode: "6.0", wbsCode: "6.4", name: "Accessories Wiring", owner: "Wire Asst", planHours: 12 },
  { phaseCode: "6.0", wbsCode: "6.5", name: "Dispatch to Testing Dept.", owner: "Elec Supervisor", planHours: 2 },

  // Phase 7.0
  { phaseCode: "7.0", wbsCode: "7.1", name: "Job File Received", owner: "QC Inspector", planHours: 2 },
  { phaseCode: "7.0", wbsCode: "7.2", name: "Short Material List", owner: "QC Tech", planHours: 4 },
  { phaseCode: "7.0", wbsCode: "7.3", name: "Panel operation Test", owner: "Test Eng.", planHours: 12 },
  { phaseCode: "7.0", wbsCode: "7.4", name: "All Parameter Checked by Approve list", owner: "QC Head", planHours: 8 },
  { phaseCode: "7.0", wbsCode: "7.5", name: "Ready for Dispatch.", owner: "Final Release Manager", planHours: 2 },

  // Phase 8.0
  { phaseCode: "8.0", wbsCode: "8.1", name: "Final Invoice Generated", owner: "Accounts Team", planHours: 4 },
  { phaseCode: "8.0", wbsCode: "8.2", name: "Payment Clearance", owner: "Finance Lead", planHours: 4 },
  { phaseCode: "8.0", wbsCode: "8.3", name: "Ready For Dispatch Clearance", owner: "Dispatch Manager", planHours: 2 },

  // Phase 9.0
  { phaseCode: "9.0", wbsCode: "9.1", name: "Service Call Received", owner: "Support Desk", planHours: 2 },
  { phaseCode: "9.0", wbsCode: "9.2", name: "Assigned Engineer", owner: "Service Lead", planHours: 2 },
  { phaseCode: "9.0", wbsCode: "9.3", name: "Service call done", owner: "Field Engineer", planHours: 16 },
  { phaseCode: "9.0", wbsCode: "9.4", name: "Submit service report", owner: "Field Engineer", planHours: 4 }
];

export async function ensurePhasesExist() {
  const phaseMap: Record<string, string> = {};
  for (const p of DEFAULT_WBS_PHASES) {
    const existing = await prisma.wBSPhase.upsert({
      where: { wbsCode: p.wbsCode },
      update: { name: p.name, badge: p.badge, owner: p.owner },
      create: { wbsCode: p.wbsCode, name: p.name, badge: p.badge, owner: p.owner }
    });
    phaseMap[p.wbsCode] = existing.id;
  }
  return phaseMap;
}

export async function seedStandardWBSTasksForInquiry(inquiryId: string, isConfirmed: boolean = false) {
  const phaseMap = await ensurePhasesExist();

  const existingCount = await prisma.wBSTask.count({
    where: { inquiryId }
  });

  if (existingCount >= STANDARD_WBS_TASKS.length) {
    return;
  }

  for (const t of STANDARD_WBS_TASKS) {
    const phaseId = phaseMap[t.phaseCode];
    if (!phaseId) continue;

    let taskStatus = "NOT STARTED";
    let progress = 0;
    let actualHours = 0;

    if (isConfirmed) {
      if (t.phaseCode === "1.0") {
        taskStatus = "DONE";
        progress = 100;
        actualHours = t.planHours;
      } else if (t.wbsCode === "2.1") {
        taskStatus = "IN PROGRESS";
        progress = 50;
        actualHours = Math.round(t.planHours / 2);
      }
    } else {
      if (t.wbsCode === "1.1") {
        taskStatus = "IN PROGRESS";
        progress = 50;
        actualHours = Math.round(t.planHours / 2);
      }
    }

    const existingTask = await prisma.wBSTask.findFirst({
      where: { inquiryId, wbsCode: t.wbsCode }
    });

    if (!existingTask) {
      await prisma.wBSTask.create({
        data: {
          wbsCode: t.wbsCode,
          name: t.name,
          phaseId: phaseId,
          inquiryId: inquiryId,
          owner: t.owner,
          planHours: t.planHours,
          actualHours: actualHours,
          status: taskStatus,
          progress: progress
        }
      });
    }
  }
}

/**
 * Automatically marks Phase 1.0 (Inquiry & Offer Phase) as 100% DONE
 * when an Inquiry is updated from Inquiry Received/Offer Sent to Confirmed.
 */
export async function markPhase1CompletedForInquiry(inquiryId: string) {
  const phaseMap = await ensurePhasesExist();
  const phase1Id = phaseMap["1.0"];
  const phase2Id = phaseMap["2.0"];

  if (phase1Id) {
    const phase1Tasks = await prisma.wBSTask.findMany({
      where: { inquiryId, phaseId: phase1Id }
    });
    for (const task of phase1Tasks) {
      await prisma.wBSTask.update({
        where: { id: task.id },
        data: { status: "DONE", progress: 100, actualHours: task.planHours }
      });
    }
  }

  if (phase2Id) {
    const firstPhase2Task = await prisma.wBSTask.findFirst({
      where: { inquiryId, phaseId: phase2Id },
      orderBy: { wbsCode: "asc" }
    });
    if (firstPhase2Task && firstPhase2Task.status === "NOT STARTED") {
      await prisma.wBSTask.update({
        where: { id: firstPhase2Task.id },
        data: { status: "IN PROGRESS", progress: 50, actualHours: Math.round(firstPhase2Task.planHours / 2) }
      });
    }
  }
}
