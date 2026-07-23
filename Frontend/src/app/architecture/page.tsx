'use client';

import React from 'react';
import { Layers, Server, Database, Shield, Cpu, Code2, Cloud, ArrowRight } from 'lucide-react';

export default function ArchitecturePage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
            <Layers size={16} />
            <span>System Architecture Overview</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 mt-1">SkyTech SPMS Architecture & Technology Stack</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Technical specifications, database topology, and full-stack system layout.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Frontend Layer */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Code2 size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Frontend Presentation Layer</h3>
            <span className="text-[11px] text-slate-500 font-medium">Next.js 16 (App Router) + React 19</span>
          </div>
          <ul className="text-xs text-slate-600 space-y-2 font-medium">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span>TailwindCSS v4 PostCSS styling engine</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span>Lucide React vector icon library</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span>Anti-flicker inline theme script</span>
            </li>
          </ul>
        </div>

        {/* Backend API Layer */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Server size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Backend API Services</h3>
            <span className="text-[11px] text-slate-500 font-medium">Express.js + TypeScript (Strict Mode)</span>
          </div>
          <ul className="text-xs text-slate-600 space-y-2 font-medium">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Zod request body validation middleware</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Winston structured JSON logger</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>CORS allowlist & credentials handling</span>
            </li>
          </ul>
        </div>

        {/* Database Layer */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Database size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Database & ORM Layer</h3>
            <span className="text-[11px] text-slate-500 font-medium">Prisma ORM v5.22 (SQLite Dev / Postgres Prod)</span>
          </div>
          <ul className="text-xs text-slate-600 space-y-2 font-medium">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              <span>Inquiry, WBS, Employee DB persistence</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              <span>WBS Task ↔ Inventory Item links (Job ID ↔ Item ID)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              <span>Microsoft SSO microsoftId mapping field</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
