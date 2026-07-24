"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  Briefcase,
  TrendingUp,
  X,
  Upload,
  CheckCircle
} from "lucide-react";
import { API_BASE_URL, getAuthHeaders } from "@/config/api";
import { ExcelUploadModal } from "@/components/ExcelUploadModal";

interface StockItem {
  id: string;
  itemCode: string;
  description: string;
  make?: string;
  partNo?: string;
  category: string;
  unit: string;
  openingStock: number;
  minStockLevel: number;
  unitRate: number;
  currentStock: number;
  stockValue: number;
  isLowStock: boolean;
  status: string;
  computedStatus: string;
}

interface Job {
  id: string;
  jobNo: string;
  clientName?: string;
  location?: string;
  status: string;
}

interface StockReceipt {
  id: string;
  receiptNo: string;
  date: string;
  itemCode: string;
  qtyIn: number;
  supplier?: string;
  invoiceNo?: string;
  stockItem?: StockItem;
}

interface StockIssue {
  id: string;
  issueNo: string;
  date: string;
  jobNo: string;
  itemCode: string;
  qtyOut: number;
  issuedTo?: string;
  stockItem?: StockItem;
  job?: Job;
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "items" | "stockIn" | "stockOut" | "summary">("dashboard");

  // Data states
  const [stats, setStats] = useState<any>(null);
  const [items, setItems] = useState<StockItem[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [receipts, setReceipts] = useState<StockReceipt[]>([]);
  const [issues, setIssues] = useState<StockIssue[]>([]);
  const [jobSummary, setJobSummary] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Modals
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isStockInOpen, setIsStockInOpen] = useState(false);
  const [isStockOutOpen, setIsStockOutOpen] = useState(false);

  // Forms
  const [newItem, setNewItem] = useState({
    itemCode: "",
    description: "",
    make: "",
    category: "Switchgear Parts",
    unit: "Nos",
    openingStock: 0,
    minStockLevel: 5,
    unitRate: 0
  });

  const [newReceipt, setNewReceipt] = useState({
    itemCode: "",
    qtyIn: 0,
    supplier: "",
    invoiceNo: ""
  });

  const [newIssue, setNewIssue] = useState({
    jobNo: "",
    itemCode: "",
    qtyOut: 0,
    issuedTo: ""
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const [dashRes, itemsRes, jobsRes, receiptsRes, issuesRes, summaryRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/inventory/dashboard`, { headers }),
        fetch(`${API_BASE_URL}/api/inventory/items`, { headers }),
        fetch(`${API_BASE_URL}/api/inventory/jobs`, { headers }),
        fetch(`${API_BASE_URL}/api/inventory/receipts`, { headers }),
        fetch(`${API_BASE_URL}/api/inventory/issues`, { headers }),
        fetch(`${API_BASE_URL}/api/inventory/summary/job-wise`, { headers })
      ]);

      if (dashRes.ok) setStats(await dashRes.json());
      if (itemsRes.ok) setItems(await itemsRes.json());
      if (jobsRes.ok) setJobs(await jobsRes.json());
      if (receiptsRes.ok) setReceipts(await receiptsRes.json());
      if (issuesRes.ok) setIssues(await issuesRes.json());
      if (summaryRes.ok) setJobSummary(await summaryRes.json());
    } catch (err) {
      console.error("Failed to fetch inventory data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Add Item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventory/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(newItem)
      });
      if (res.ok) {
        setIsAddItemOpen(false);
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Stock IN
  const handleStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventory/receipts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(newReceipt)
      });
      if (res.ok) {
        setIsStockInOpen(false);
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Stock OUT (Issue to Job)
  const handleStockOut = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventory/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(newIssue)
      });
      if (res.ok) {
        setIsStockOutOpen(false);
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Item Status (Active / Inactive)
  const handleToggleItemStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Inactive" ? "Active" : "Inactive";
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventory/items/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const categories = Array.from(new Set(items.map((i) => i.category)));
  const filteredItems = items.filter((i) => {
    const matchesSearch =
      i.itemCode.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase()) ||
      (i.make && i.make.toLowerCase().includes(search.toLowerCase())) ||
      (i.partNo && i.partNo.toLowerCase().includes(search.toLowerCase())) ||
      i.category.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === "ALL" || i.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
            <Package size={16} />
            <span>Store & Material Management</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Store Inventory & Job Issue Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Excel-synced material stock master, inbound receipts, and job-wise issue matrix
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExcelModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Upload size={16} />
            <span>Import Excel Workbook</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "dashboard" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Dashboard & Alerts
        </button>
        <button
          onClick={() => setActiveTab("items")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "items" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Item Master ({items.length})
        </button>
        <button
          onClick={() => setActiveTab("stockIn")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "stockIn" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Stock IN Log ({receipts.length})
        </button>
        <button
          onClick={() => setActiveTab("stockOut")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "stockOut" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Stock OUT (Job Issue) ({issues.length})
        </button>
        <button
          onClick={() => setActiveTab("summary")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "summary" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Job-wise Summary Matrix
        </button>
      </div>

      {/* TAB 1: DASHBOARD & ALERTS */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL INVENTORY VALUE</span>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">
                  ₹ {stats ? Number(stats.totalValue).toLocaleString("en-IN") : "0"}
                </div>
                <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Live stock valuation</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL STOCK ITEMS</span>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats?.totalItems || 0}</div>
                <span className="text-[11px] text-slate-500 mt-1 block">Cataloged materials</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Package size={20} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">LOW STOCK ALERTS</span>
                <div className="text-2xl font-extrabold text-rose-950 mt-1">{stats?.lowStockCount || 0}</div>
                <span className="text-[11px] text-rose-600 font-semibold mt-1 block">Re-order threshold breached</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">RUNNING JOBS</span>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats?.runningJobsCount || 0}</div>
                <span className="text-[11px] text-indigo-600 font-semibold mt-1 block">Active project jobs</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Briefcase size={20} />
              </div>
            </div>
          </div>

          {/* Low Stock Items Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Low Stock Re-order Alerts</h3>
                <p className="text-xs text-slate-500">Items where current physical stock is at or below minimum threshold</p>
              </div>
              <button
                onClick={() => setIsStockInOpen(true)}
                className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs px-3 py-2 rounded-xl transition-colors"
              >
                <Plus size={14} /> Record Inbound Stock
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0B1728] text-slate-300 text-[11px] font-bold uppercase">
                    <th className="py-3 px-4">ITEM CODE</th>
                    <th className="py-3 px-4">DESCRIPTION</th>
                    <th className="py-3 px-4">MAKE</th>
                    <th className="py-3 px-4 text-center">MIN LEVEL</th>
                    <th className="py-3 px-4 text-center">CURRENT STOCK</th>
                    <th className="py-3 px-4 text-right">UNIT RATE</th>
                    <th className="py-3 px-4 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {items.filter((i) => i.isLowStock).length > 0 ? (
                    items
                      .filter((i) => i.isLowStock)
                      .map((item) => (
                        <tr key={item.id} className="hover:bg-rose-50/50">
                          <td className="py-3 px-4 font-mono font-bold text-blue-600">{item.itemCode}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{item.description}</td>
                          <td className="py-3 px-4 text-slate-500">{item.make || "-"}</td>
                          <td className="py-3 px-4 text-center font-bold">{item.minStockLevel} {item.unit}</td>
                          <td className="py-3 px-4 text-center font-extrabold text-rose-600 bg-rose-50 rounded-lg">
                            {item.currentStock} {item.unit}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold">₹ {item.unitRate}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <AlertTriangle size={10} /> RE-ORDER NEEDED
                            </span>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        All stock levels are optimal! No low stock alerts.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ITEM MASTER */}
      {activeTab === "items" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            {/* Search & Category Filter */}
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search item code, description, make..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="py-2 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none bg-white font-semibold"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsAddItemOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all"
            >
              <Plus size={16} /> + Add New Item
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0B1728] text-slate-300 text-[11px] font-bold uppercase">
                  <th className="py-3 px-4">ITEM CODE</th>
                  <th className="py-3 px-4">DESCRIPTION</th>
                  <th className="py-3 px-4">MAKE</th>
                  <th className="py-3 px-4">CATEGORY</th>
                  <th className="py-3 px-4 text-center">OPENING</th>
                  <th className="py-3 px-4 text-center">MIN LEVEL</th>
                  <th className="py-3 px-4 text-center">CURRENT STOCK</th>
                  <th className="py-3 px-4 text-right">UNIT RATE</th>
                  <th className="py-3 px-4 text-right">STOCK VALUE</th>
                  <th className="py-3 px-4 text-center">STATUS</th>
                  <th className="py-3 px-4 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredItems.map((item) => {
                  const isReorder = item.computedStatus === "REORDER" || (item.status !== "Inactive" && item.currentStock <= item.minStockLevel);
                  const isInactive = item.status === "Inactive";

                  return (
                    <tr key={item.id} className={`hover:bg-slate-50 ${isInactive ? "opacity-60 bg-slate-50/50" : ""}`}>
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">{item.itemCode}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{item.description}</td>
                      <td className="py-3 px-4 text-slate-500">{item.make || "-"}</td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500">{item.openingStock} {item.unit}</td>
                      <td className="py-3 px-4 text-center font-semibold">{item.minStockLevel} {item.unit}</td>
                      <td className={`py-3 px-4 text-center font-extrabold ${isReorder ? "text-rose-600 bg-rose-50" : "text-emerald-700"}`}>
                        {item.currentStock} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">₹ {item.unitRate}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ₹ {item.stockValue.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isInactive ? (
                          <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            Inactive
                          </span>
                        ) : isReorder ? (
                          <span className="bg-rose-600 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-md tracking-wider shadow-xs animate-pulse">
                            REORDER
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleItemStatus(item.id, item.status)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-colors ${
                            isInactive
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-rose-600"
                          }`}
                          title="Per rule: REMOVE a material = set Status to Inactive"
                        >
                          {isInactive ? "Set Active" : "Set Inactive"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: STOCK IN LOG */}
      {activeTab === "stockIn" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Stock IN Receipts (GRN Log)</h3>
              <p className="text-xs text-slate-500">Record inbound material deliveries from vendors</p>
            </div>
            <button
              onClick={() => setIsStockInOpen(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all"
            >
              <Plus size={16} /> Record Stock IN
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0B1728] text-slate-300 text-[11px] font-bold uppercase">
                  <th className="py-3 px-4">GRN / RECEIPT NO</th>
                  <th className="py-3 px-4">ITEM CODE</th>
                  <th className="py-3 px-4">DESCRIPTION</th>
                  <th className="py-3 px-4 text-center">QTY RECEIVED</th>
                  <th className="py-3 px-4">SUPPLIER</th>
                  <th className="py-3 px-4">DATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {receipts.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">{rec.receiptNo}</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{rec.itemCode}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{rec.stockItem?.description || "-"}</td>
                    <td className="py-3 px-4 text-center font-extrabold text-emerald-600 bg-emerald-50">
                      +{rec.qtyIn} {rec.stockItem?.unit || ""}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{rec.supplier || "-"}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(rec.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: STOCK OUT LOG (JOB ISSUE) */}
      {activeTab === "stockOut" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Stock OUT (Material Issue to Job)</h3>
              <p className="text-xs text-slate-500">Track material items issued specifically to running project Jobs (R9 Relation)</p>
            </div>
            <button
              onClick={() => setIsStockOutOpen(true)}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all"
            >
              <Plus size={16} /> Issue Material to Job
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0B1728] text-slate-300 text-[11px] font-bold uppercase">
                  <th className="py-3 px-4">ISSUE NO</th>
                  <th className="py-3 px-4">JOB NO (JOB ID)</th>
                  <th className="py-3 px-4">ITEM CODE (ITEM ID)</th>
                  <th className="py-3 px-4">ITEM DESCRIPTION</th>
                  <th className="py-3 px-4 text-center">QTY ISSUED</th>
                  <th className="py-3 px-4">ISSUED TO</th>
                  <th className="py-3 px-4">DATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {issues.map((iss) => (
                  <tr key={iss.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-rose-700">{iss.issueNo}</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{iss.jobNo}</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{iss.itemCode}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{iss.stockItem?.description || "-"}</td>
                    <td className="py-3 px-4 text-center font-extrabold text-rose-600 bg-rose-50">
                      -{iss.qtyOut} {iss.stockItem?.unit || ""}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{iss.issuedTo || "-"}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(iss.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: JOB-WISE SUMMARY MATRIX */}
      {activeTab === "summary" && jobSummary && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Job-wise Material Issue Summary Matrix</h3>
            <p className="text-xs text-slate-500">Cross-tab summary showing total quantity of each material issued per Job</p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0B1728] text-slate-300 text-[10px] font-bold uppercase">
                  <th className="py-3 px-4 sticky left-0 bg-[#0B1728] border-r border-slate-700 min-w-[200px]">JOB DETAILS</th>
                  {jobSummary.items.map((item: any) => (
                    <th key={item.itemCode} className="py-3 px-3 text-center min-w-[90px]">
                      {item.itemCode}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {jobSummary.jobs.map((job: any) => (
                  <tr key={job.jobNo} className="hover:bg-slate-50">
                    <td className="py-3 px-4 sticky left-0 bg-white border-r border-slate-200">
                      <span className="font-mono font-bold text-indigo-700 block">{job.jobNo}</span>
                      <span className="text-[11px] text-slate-500 truncate block">{job.clientName}</span>
                    </td>
                    {jobSummary.items.map((item: any) => {
                      const qty = jobSummary.matrix[job.jobNo]?.[item.itemCode] || 0;
                      return (
                        <td
                          key={item.itemCode}
                          className={`py-3 px-3 text-center font-mono font-bold ${
                            qty > 0 ? "bg-indigo-50 text-indigo-900" : "text-slate-300"
                          }`}
                        >
                          {qty > 0 ? qty : "-"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EXCEL UPLOAD MODAL */}
      <ExcelUploadModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onSuccess={() => {
          setIsExcelModalOpen(false);
          fetchAllData();
        }}
      />

      {/* ADD ITEM MODAL */}
      {isAddItemOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900">Add New Stock Item</h3>
              <button onClick={() => setIsAddItemOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-600 mb-1">Item Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MCB-016"
                  value={newItem.itemCode}
                  onChange={(e) => setNewItem({ ...newItem, itemCode: e.target.value })}
                  className="w-full p-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MCB 16A SP C-Curve"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full p-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Make</label>
                  <input
                    type="text"
                    placeholder="Siemens"
                    value={newItem.make}
                    onChange={(e) => setNewItem({ ...newItem, make: e.target.value })}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Unit</label>
                  <input
                    type="text"
                    placeholder="Nos"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Opening Stock</label>
                  <input
                    type="number"
                    value={newItem.openingStock}
                    onChange={(e) => setNewItem({ ...newItem, openingStock: Number(e.target.value) })}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Min Level</label>
                  <input
                    type="number"
                    value={newItem.minStockLevel}
                    onChange={(e) => setNewItem({ ...newItem, minStockLevel: Number(e.target.value) })}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Unit Rate (₹)</label>
                  <input
                    type="number"
                    value={newItem.unitRate}
                    onChange={(e) => setNewItem({ ...newItem, unitRate: Number(e.target.value) })}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddItemOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOCK IN MODAL */}
      {isStockInOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900">Record Stock IN (Inbound Material)</h3>
              <button onClick={() => setIsStockInOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleStockIn} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-600 mb-1">Select Stock Item</label>
                <select
                  required
                  value={newReceipt.itemCode}
                  onChange={(e) => setNewReceipt({ ...newReceipt, itemCode: e.target.value })}
                  className="w-full p-2 border rounded-xl bg-white"
                >
                  <option value="">-- Choose Item --</option>
                  {items.map((i) => (
                    <option key={i.itemCode} value={i.itemCode}>
                      [{i.itemCode}] {i.description}
                    </option>
                  ))}
                </select>
              </div>

              {items.find((i) => i.itemCode === newReceipt.itemCode) && (
                <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-100 space-y-1 text-[11px] text-blue-900 font-medium">
                  <div><strong>Auto-Filled Description:</strong> {items.find((i) => i.itemCode === newReceipt.itemCode)?.description}</div>
                  <div><strong>Make & Unit:</strong> {items.find((i) => i.itemCode === newReceipt.itemCode)?.make || "Generic"} ({items.find((i) => i.itemCode === newReceipt.itemCode)?.unit})</div>
                  <div><strong>Current Physical Stock:</strong> {items.find((i) => i.itemCode === newReceipt.itemCode)?.currentStock} {items.find((i) => i.itemCode === newReceipt.itemCode)?.unit}</div>
                </div>
              )}

              <div>
                <label className="block text-slate-600 mb-1">Quantity Received</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newReceipt.qtyIn}
                  onChange={(e) => setNewReceipt({ ...newReceipt, qtyIn: Number(e.target.value) })}
                  className="w-full p-2 border rounded-xl font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Supplier Name</label>
                <input
                  type="text"
                  placeholder="e.g. Siemens India Ltd"
                  value={newReceipt.supplier}
                  onChange={(e) => setNewReceipt({ ...newReceipt, supplier: e.target.value })}
                  className="w-full p-2 border rounded-xl"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStockInOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                  Record Stock IN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOCK OUT MODAL */}
      {isStockOutOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900">Issue Material to Job (Stock OUT)</h3>
              <button onClick={() => setIsStockOutOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleStockOut} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-600 mb-1">Select Job (Job ID)</label>
                <select
                  required
                  value={newIssue.jobNo}
                  onChange={(e) => setNewIssue({ ...newIssue, jobNo: e.target.value })}
                  className="w-full p-2 border rounded-xl bg-white"
                >
                  <option value="">-- Choose Job --</option>
                  {jobs.map((j) => (
                    <option key={j.jobNo} value={j.jobNo}>
                      [{j.jobNo}] {j.clientName}
                    </option>
                  ))}
                </select>
              </div>

              {jobs.find((j) => j.jobNo === newIssue.jobNo) && (
                <div className="p-2 bg-indigo-50/70 rounded-xl border border-indigo-100 text-[11px] text-indigo-950 font-medium">
                  <strong>Job Details:</strong> {jobs.find((j) => j.jobNo === newIssue.jobNo)?.clientName} ({jobs.find((j) => j.jobNo === newIssue.jobNo)?.location || "Site"})
                </div>
              )}

              <div>
                <label className="block text-slate-600 mb-1">Select Stock Item (Item ID)</label>
                <select
                  required
                  value={newIssue.itemCode}
                  onChange={(e) => setNewIssue({ ...newIssue, itemCode: e.target.value })}
                  className="w-full p-2 border rounded-xl bg-white"
                >
                  <option value="">-- Choose Item --</option>
                  {items.map((i) => (
                    <option key={i.itemCode} value={i.itemCode}>
                      [{i.itemCode}] {i.description} (Stock: {i.currentStock})
                    </option>
                  ))}
                </select>
              </div>

              {items.find((i) => i.itemCode === newIssue.itemCode) && (
                <div className="p-2.5 bg-rose-50/70 rounded-xl border border-rose-100 space-y-1 text-[11px] text-rose-950 font-medium">
                  <div><strong>Auto-Filled Description:</strong> {items.find((i) => i.itemCode === newIssue.itemCode)?.description}</div>
                  <div><strong>Available Physical Stock:</strong> {items.find((i) => i.itemCode === newIssue.itemCode)?.currentStock} {items.find((i) => i.itemCode === newIssue.itemCode)?.unit}</div>
                </div>
              )}

              <div>
                <label className="block text-slate-600 mb-1">Quantity to Issue</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newIssue.qtyOut}
                  onChange={(e) => setNewIssue({ ...newIssue, qtyOut: Number(e.target.value) })}
                  className="w-full p-2 border rounded-xl font-bold text-rose-700"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Issued To (Person/Technician)</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Engineer"
                  value={newIssue.issuedTo}
                  onChange={(e) => setNewIssue({ ...newIssue, issuedTo: e.target.value })}
                  className="w-full p-2 border rounded-xl"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStockOutOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl">
                  Issue Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
