'use client';

import React from 'react';
import { Package, Upload, Layers, Boxes, Sparkles, FileSpreadsheet } from 'lucide-react';

export default function InventoryPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header & Hero Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
            <Package size={16} />
            <span>Stock & Material Control</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Inventory Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Centralized raw material tracking, component stock levels, and store requisition pipeline
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => alert('Please drop your Inventory Excel (.xlsx) file into the codebase!')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Upload size={16} />
            <span>Upload Excel File</span>
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 p-6 rounded-2xl border border-blue-200/80 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
          <FileSpreadsheet size={20} />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <span>Ready for Excel Business Logic Integration</span>
            <Sparkles size={14} className="text-amber-500" />
          </h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Move your <code className="bg-white px-2 py-0.5 rounded border text-blue-700 font-mono font-bold">.xlsx</code> file into the repository root directory or workspace folder. I will inspect all worksheets, formulas, inventory data schemas, and stock calculations to automatically convert your Excel spreadsheet into a dynamic, full-stack inventory management module!
          </p>
        </div>
      </div>

      {/* KPI Cards Placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL STOCK ITEMS</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">--</div>
            <span className="text-[11px] text-slate-400 mt-1 block">Awaiting Excel data</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Boxes size={20} />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">REORDER ALERTS</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">--</div>
            <span className="text-[11px] text-amber-600 font-semibold mt-1 block">Low stock threshold</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Layers size={20} />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MATERIAL ISSUED</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">--</div>
            <span className="text-[11px] text-slate-400 mt-1 block">To production floor</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Package size={20} />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL INVENTORY VALUE</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">₹ --</div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Valuation balance</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            ₹
          </div>
        </div>
      </div>

    </div>
  );
}
