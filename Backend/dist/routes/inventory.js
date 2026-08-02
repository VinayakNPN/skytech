"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const multer_1 = __importDefault(require("multer"));
const XLSX = __importStar(require("xlsx"));
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// Helper to compute stock stats for items
async function getEnrichedStockItems() {
    const items = await prisma.stockItem.findMany({
        include: {
            stockReceipts: true,
            stockIssues: true
        },
        orderBy: { itemCode: "asc" }
    });
    return items.map((item) => {
        const totalIn = item.stockReceipts.reduce((sum, r) => sum + r.qtyIn, 0);
        const totalOut = item.stockIssues.reduce((sum, i) => sum + i.qtyOut, 0);
        const currentStock = item.openingStock + totalIn - totalOut;
        const stockValue = currentStock * item.unitRate;
        const isLowStock = item.status !== "Inactive" && currentStock <= item.minStockLevel;
        const computedStatus = item.status === "Inactive" ? "Inactive" : (isLowStock ? "REORDER" : "Active");
        return {
            ...item,
            totalIn,
            totalOut,
            currentStock,
            stockValue,
            isLowStock,
            computedStatus
        };
    });
}
// 1. GET /api/inventory/dashboard
router.get("/dashboard", async (req, res) => {
    try {
        const items = await getEnrichedStockItems();
        const jobsCount = await prisma.job.count({ where: { status: "Running" } });
        const issuesCount = await prisma.stockIssue.count();
        const totalItems = items.length;
        const lowStockCount = items.filter((i) => i.isLowStock).length;
        const totalValue = items.reduce((sum, i) => sum + i.stockValue, 0);
        const categories = Array.from(new Set(items.map((i) => i.category)));
        res.json({
            totalItems,
            lowStockCount,
            totalValue,
            runningJobsCount: jobsCount,
            totalIssuesCount: issuesCount,
            categoriesCount: categories.length,
            recentLowStockItems: items.filter((i) => i.isLowStock).slice(0, 5)
        });
    }
    catch (error) {
        console.error("Failed to fetch inventory dashboard:", error);
        res.status(500).json({ error: "Failed to fetch inventory dashboard" });
    }
});
// 2. GET /api/inventory/items
router.get("/items", async (req, res) => {
    try {
        const items = await getEnrichedStockItems();
        res.json(items);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch stock items" });
    }
});
// 3. POST /api/inventory/items
router.post("/items", async (req, res) => {
    try {
        const { itemCode, description, make, partNo, category, unit, openingStock, minStockLevel, unitRate, locationRack } = req.body;
        const newItem = await prisma.stockItem.create({
            data: {
                itemCode,
                description,
                make,
                partNo,
                category: category || "General",
                unit: unit || "Nos",
                openingStock: Number(openingStock) || 0,
                minStockLevel: Number(minStockLevel) || 0,
                unitRate: Number(unitRate) || 0,
                locationRack
            }
        });
        res.status(201).json(newItem);
    }
    catch (error) {
        console.error(error);
        res.status(400).json({ error: "Failed to create item" });
    }
});
// 3.1 PUT /api/inventory/items/:id/status (Set Active / Inactive)
router.put("/items/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        const updatedItem = await prisma.stockItem.update({
            where: { id: req.params.id },
            data: { status: status === "Inactive" ? "Inactive" : "Active" }
        });
        res.json(updatedItem);
    }
    catch (error) {
        res.status(400).json({ error: "Failed to update item status" });
    }
});
// 4. GET /api/inventory/jobs
router.get("/jobs", async (req, res) => {
    try {
        const jobs = await prisma.job.findMany({
            include: { stockIssues: true },
            orderBy: { jobNo: "asc" }
        });
        res.json(jobs);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch jobs" });
    }
});
// 5. POST /api/inventory/jobs
router.post("/jobs", async (req, res) => {
    try {
        const { jobNo, clientName, location, status } = req.body;
        const newJob = await prisma.job.create({
            data: {
                jobNo,
                clientName,
                location,
                status: status || "Running"
            }
        });
        res.status(201).json(newJob);
    }
    catch (error) {
        res.status(400).json({ error: "Failed to create job" });
    }
});
// 6. GET /api/inventory/receipts
router.get("/receipts", async (req, res) => {
    try {
        const receipts = await prisma.stockReceipt.findMany({
            include: { stockItem: true },
            orderBy: { date: "desc" }
        });
        res.json(receipts);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch stock receipts" });
    }
});
// 7. POST /api/inventory/receipts (Stock IN)
router.post("/receipts", async (req, res) => {
    try {
        const { receiptNo, itemCode, qtyIn, supplier, invoiceNo, receivedBy, remarks } = req.body;
        const receipt = await prisma.stockReceipt.create({
            data: {
                receiptNo: receiptNo || `GRN-${Date.now().toString().slice(-6)}`,
                itemCode,
                qtyIn: Number(qtyIn),
                supplier,
                invoiceNo,
                receivedBy,
                remarks
            }
        });
        res.status(201).json(receipt);
    }
    catch (error) {
        console.error(error);
        res.status(400).json({ error: "Failed to record stock IN" });
    }
});
// 8. GET /api/inventory/issues
router.get("/issues", async (req, res) => {
    try {
        const issues = await prisma.stockIssue.findMany({
            include: { stockItem: true, job: true },
            orderBy: { date: "desc" }
        });
        res.json(issues);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch stock issues" });
    }
});
// 9. POST /api/inventory/issues (Stock OUT - Job ↔ Item)
router.post("/issues", async (req, res) => {
    try {
        const { issueNo, jobNo, itemCode, qtyOut, issuedTo, issuedBy, remarks } = req.body;
        const issue = await prisma.stockIssue.create({
            data: {
                issueNo: issueNo || `ISS-${Date.now().toString().slice(-6)}`,
                jobNo,
                itemCode,
                qtyOut: Number(qtyOut),
                issuedTo,
                issuedBy,
                remarks
            }
        });
        res.status(201).json(issue);
    }
    catch (error) {
        console.error(error);
        res.status(400).json({ error: "Failed to record stock OUT" });
    }
});
// 10. GET /api/inventory/summary/job-wise (Cross-tab Report)
router.get("/summary/job-wise", async (req, res) => {
    try {
        const jobs = await prisma.job.findMany({ orderBy: { jobNo: "asc" } });
        const items = await prisma.stockItem.findMany({ orderBy: { itemCode: "asc" } });
        const issues = await prisma.stockIssue.findMany();
        // Map: jobNo -> itemCode -> totalQty
        const matrix = {};
        jobs.forEach((job) => {
            matrix[job.jobNo] = {};
            items.forEach((item) => {
                matrix[job.jobNo][item.itemCode] = 0;
            });
        });
        issues.forEach((issue) => {
            if (matrix[issue.jobNo] && matrix[issue.jobNo][issue.itemCode] !== undefined) {
                matrix[issue.jobNo][issue.itemCode] += issue.qtyOut;
            }
        });
        res.json({
            jobs,
            items,
            matrix
        });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to generate job-wise summary" });
    }
});
// Helper to normalize keys (strip spaces, symbols, lowercase)
function normalizeKey(str) {
    if (!str)
        return "";
    return String(str).toLowerCase().replace(/[^a-z0-9]/g, "");
}
// Robust sheet parser that auto-detects header row index
function parseSheetRows(sheet) {
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    if (!rawData || rawData.length === 0)
        return [];
    let headerRowIndex = -1;
    let headerMap = [];
    for (let i = 0; i < Math.min(15, rawData.length); i++) {
        const row = rawData[i];
        if (!Array.isArray(row))
            continue;
        const normalizedRow = row.map((cell) => normalizeKey(cell));
        const hasHeaderKeyword = normalizedRow.some((k) => ["jobno", "jobid", "itemcode", "itemid", "description", "client", "clientname", "qtyin", "qtyout", "openingstock"].includes(k));
        if (hasHeaderKeyword) {
            headerRowIndex = i;
            headerMap = row
                .map((cell, colIdx) => ({
                index: colIdx,
                normalizedKey: normalizeKey(cell)
            }))
                .filter((h) => h.normalizedKey.length > 0);
            break;
        }
    }
    if (headerRowIndex === -1) {
        const defaultJson = XLSX.utils.sheet_to_json(sheet);
        return defaultJson.map((row) => {
            const normalizedRow = {};
            Object.keys(row).forEach((k) => {
                normalizedRow[normalizeKey(k)] = row[k];
            });
            return normalizedRow;
        });
    }
    const result = [];
    for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!Array.isArray(row) || row.every((c) => c === "" || c === null || c === undefined))
            continue;
        const rowObj = {};
        let hasValue = false;
        headerMap.forEach((h) => {
            const val = row[h.index];
            rowObj[h.normalizedKey] = val;
            if (val !== "" && val !== null && val !== undefined) {
                hasValue = true;
            }
        });
        if (hasValue) {
            result.push(rowObj);
        }
    }
    return result;
}
// 11. POST /api/inventory/upload-excel (Excel Import Endpoint)
router.post("/upload-excel", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No Excel file provided" });
        }
        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        let jobsCreated = 0;
        let itemsCreated = 0;
        let receiptsCreated = 0;
        let issuesCreated = 0;
        // Helper to find sheet by name flexible
        const findSheet = (keywords) => {
            const name = workbook.SheetNames.find((sn) => keywords.some((k) => sn.toLowerCase().includes(k.toLowerCase())));
            return name ? workbook.Sheets[name] : null;
        };
        // 1. Process Job Master Sheet
        const jobSheet = findSheet(["Job Master", "Job", "Jobs"]);
        if (jobSheet) {
            const jobRows = parseSheetRows(jobSheet);
            for (const row of jobRows) {
                const jobNo = row["jobno"] || row["jobid"] || row["job"];
                if (jobNo) {
                    const cleanJobNo = String(jobNo).trim();
                    const clientName = row["clientname"] || row["client"] || cleanJobNo;
                    await prisma.job.upsert({
                        where: { jobNo: cleanJobNo },
                        update: {
                            clientName,
                            location: row["location"] || row["site"] || undefined,
                            status: row["status"] || "Running"
                        },
                        create: {
                            jobNo: cleanJobNo,
                            clientName,
                            location: row["location"] || row["site"] || undefined,
                            status: row["status"] || "Running"
                        }
                    });
                    /*
                    // CLIENT REQUIREMENT UPDATE: Projects and WBS progress are created via Inquiry UI (/inquiries),
                    // rather than being extracted from Excel workbook. Excel only delivers Inventory Management.
                    // Commented out below so it can be restored if client falls back to Excel-driven project creation.
          
                    const inq = await prisma.inquiry.upsert({
                      where: { inquiryCode: cleanJobNo },
                      update: {
                        client: clientName,
                        project: clientName,
                        status: "Confirmed"
                      },
                      create: {
                        inquiryCode: cleanJobNo,
                        client: clientName,
                        project: clientName,
                        amount: 1500000,
                        status: "Confirmed"
                      }
                    });
          
                    // Seed standard WBS boilerplate tasks for this job
                    await seedStandardWBSTasksForInquiry(inq.id);
                    */
                    jobsCreated++;
                }
            }
        }
        // 2. Process Item Master Sheet
        const itemSheet = findSheet(["Item Master", "Items", "Item"]);
        if (itemSheet) {
            const itemRows = parseSheetRows(itemSheet);
            for (const row of itemRows) {
                const itemCode = row["itemcode"] || row["itemid"] || row["code"];
                if (itemCode) {
                    const cleanCode = String(itemCode).trim();
                    await prisma.stockItem.upsert({
                        where: { itemCode: cleanCode },
                        update: {
                            description: row["description"] || row["desc"] || cleanCode,
                            make: row["make"] || row["brand"] || undefined,
                            partNo: row["partno"] || row["partnumber"] || undefined,
                            category: row["category"] || row["type"] || "General",
                            unit: row["unit"] || row["uom"] || "Nos",
                            openingStock: Number(row["openingstock"] || row["opening"] || 0),
                            minStockLevel: Number(row["minstocklevel"] || row["minlevel"] || row["minstock"] || row["reorderlevel"] || 0),
                            unitRate: Number(row["unitrate"] || row["rate"] || row["price"] || 0),
                            status: row["status"] && String(row["status"]).toLowerCase().includes("inactive") ? "Inactive" : "Active"
                        },
                        create: {
                            itemCode: cleanCode,
                            description: row["description"] || row["desc"] || cleanCode,
                            make: row["make"] || row["brand"] || undefined,
                            partNo: row["partno"] || row["partnumber"] || undefined,
                            category: row["category"] || row["type"] || "General",
                            unit: row["unit"] || row["uom"] || "Nos",
                            openingStock: Number(row["openingstock"] || row["opening"] || 0),
                            minStockLevel: Number(row["minstocklevel"] || row["minlevel"] || row["minstock"] || row["reorderlevel"] || 0),
                            unitRate: Number(row["unitrate"] || row["rate"] || row["price"] || 0),
                            status: row["status"] && String(row["status"]).toLowerCase().includes("inactive") ? "Inactive" : "Active"
                        }
                    });
                    itemsCreated++;
                }
            }
        }
        // 3. Process Stock IN Sheet
        const inSheet = findSheet(["Stock IN", "Stock In", "Receipts", "GRN"]);
        if (inSheet) {
            const inRows = parseSheetRows(inSheet);
            for (const row of inRows) {
                const itemCode = row["itemcode"] || row["itemid"];
                const qtyIn = Number(row["qtyin"] || row["quantity"] || row["qty"] || 0);
                if (itemCode && qtyIn > 0) {
                    const cleanCode = String(itemCode).trim();
                    const receiptNo = row["receiptno"] || row["grnno"] || row["grn"] || `GRN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                    const itemExists = await prisma.stockItem.findUnique({ where: { itemCode: cleanCode } });
                    if (itemExists) {
                        await prisma.stockReceipt.upsert({
                            where: { receiptNo: String(receiptNo).trim() },
                            update: { qtyIn, supplier: row["supplier"] || row["vendor"] },
                            create: {
                                receiptNo: String(receiptNo).trim(),
                                itemCode: cleanCode,
                                qtyIn,
                                supplier: row["supplier"] || row["vendor"],
                                invoiceNo: row["invoiceno"] || row["invoice"]
                            }
                        });
                        receiptsCreated++;
                    }
                }
            }
        }
        // 4. Process Stock OUT Sheet
        const outSheet = findSheet(["Stock OUT", "Stock Out", "Issue", "Issues"]);
        if (outSheet) {
            const outRows = parseSheetRows(outSheet);
            for (const row of outRows) {
                const itemCode = row["itemcode"] || row["itemid"];
                const jobNo = row["jobno"] || row["jobid"] || row["job"];
                const qtyOut = Number(row["qtyout"] || row["quantity"] || row["qty"] || 0);
                if (itemCode && jobNo && qtyOut > 0) {
                    const cleanCode = String(itemCode).trim();
                    const cleanJobNo = String(jobNo).trim();
                    const issueNo = row["issueno"] || row["issueid"] || `ISS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                    const itemExists = await prisma.stockItem.findUnique({ where: { itemCode: cleanCode } });
                    const jobExists = await prisma.job.findUnique({ where: { jobNo: cleanJobNo } });
                    if (itemExists && jobExists) {
                        await prisma.stockIssue.upsert({
                            where: { issueNo: String(issueNo).trim() },
                            update: { qtyOut, issuedTo: row["issuedto"] || row["technician"] },
                            create: {
                                issueNo: String(issueNo).trim(),
                                jobNo: cleanJobNo,
                                itemCode: cleanCode,
                                qtyOut,
                                issuedTo: row["issuedto"] || row["technician"],
                                issuedBy: row["issuedby"],
                                remarks: row["remarks"]
                            }
                        });
                        issuesCreated++;
                    }
                }
            }
        }
        res.json({
            message: "Excel imported successfully!",
            summary: {
                jobsProcessed: jobsCreated,
                itemsProcessed: itemsCreated,
                receiptsProcessed: receiptsCreated,
                issuesProcessed: issuesCreated
            }
        });
    }
    catch (error) {
        console.error("Excel import failed:", error);
        res.status(500).json({ error: "Failed to process Excel file" });
    }
});
exports.default = router;
