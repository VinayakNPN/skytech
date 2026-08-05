'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { API_BASE_URL, getAuthHeaders } from '@/config/api';
import { 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FolderTree, 
  User, 
  Calendar,
  X,
  FileSpreadsheet,
  Download,
  Sparkles,
  Edit2,
  Trash2,
  Workflow,
  AlertTriangle,
  Building2,
  Send,
  Briefcase,
  CheckCircle,
  Upload,
  Users
} from 'lucide-react';
import { ExcelUploadModal } from '@/components/ExcelUploadModal';
import { AssignEmployeeModal } from '@/components/AssignEmployeeModal';

interface WBSTask {
  id: string;
  wbsCode: string;
  name: string;
  phaseId: string;
  phaseName: string;
  phaseBadge: string;
  projectId: string; // Connected Confirmed Inquiry / Project ID
  owner: string;
  planHours: number;
  actualHours: number;
  status: 'DONE' | 'IN PROGRESS' | 'NOT STARTED';
  progress: number;
  assignments?: any[];
}

interface WBSPhase {
  id: string;
  wbsCode: string;
  name: string;
  badge: string;
  badgeBg: string;
  badgeText: string;
  owner: string;
  tasks: WBSTask[];
}

interface ConfirmedInquiryProject {
  id: string;
  inquiryCode?: string;
  client: string;
  project: string;
  amount: string;
  date: string;
  status: string;
}

const DEFAULT_CONFIRMED_PROJECTS: ConfirmedInquiryProject[] = [];

const GENERATE_INITIAL_WBS = (): WBSPhase[] => [
  {
    id: 'phase-1',
    wbsCode: '1.0',
    name: 'INQUIRY & OFFER PHASE',
    badge: 'INQUIRY',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
    owner: 'Vinayak NPN',
    tasks: [
      { id: '1.1', wbsCode: '1.1', name: 'Inquiry Received to Skytech', phaseId: 'phase-1', phaseName: 'INQUIRY & OFFER PHASE', phaseBadge: 'INQUIRY', projectId: 'JOB-01', owner: 'Sales Team', planHours: 4, actualHours: 4, status: 'DONE', progress: 100 },
      { id: '1.2', wbsCode: '1.2', name: 'Design & Costing Proposal', phaseId: 'phase-1', phaseName: 'INQUIRY & OFFER PHASE', phaseBadge: 'INQUIRY', projectId: 'JOB-01', owner: 'Design Lead', planHours: 16, actualHours: 16, status: 'DONE', progress: 100 },
      { id: '1.3', wbsCode: '1.3', name: 'Quotation Offer Ready', phaseId: 'phase-1', phaseName: 'INQUIRY & OFFER PHASE', phaseBadge: 'INQUIRY', projectId: 'JOB-01', owner: 'Costing Team', planHours: 8, actualHours: 8, status: 'DONE', progress: 100 },
      { id: '1.4', wbsCode: '1.4', name: 'Offer Sent to Client', phaseId: 'phase-1', phaseName: 'INQUIRY & OFFER PHASE', phaseBadge: 'INQUIRY', projectId: 'JOB-01', owner: 'Sales Manager', planHours: 2, actualHours: 2, status: 'DONE', progress: 100 },
      { id: '1.5', wbsCode: '1.5', name: 'Client Order Confirmation', phaseId: 'phase-1', phaseName: 'INQUIRY & OFFER PHASE', phaseBadge: 'INQUIRY', projectId: 'JOB-01', owner: 'Vinayak NPN', planHours: 4, actualHours: 4, status: 'DONE', progress: 100 },
      
      { id: '1.1-102', wbsCode: '1.1', name: 'Inquiry Received to Skytech', phaseId: 'phase-1', phaseName: 'INQUIRY & OFFER PHASE', phaseBadge: 'INQUIRY', projectId: 'JOB-02', owner: 'Sales Team', planHours: 4, actualHours: 4, status: 'DONE', progress: 100 },
      { id: '1.5-102', wbsCode: '1.5', name: 'Client Order Confirmation', phaseId: 'phase-1', phaseName: 'INQUIRY & OFFER PHASE', phaseBadge: 'INQUIRY', projectId: 'JOB-02', owner: 'Vinayak NPN', planHours: 4, actualHours: 4, status: 'DONE', progress: 100 }
    ]
  },
  {
    id: 'phase-2',
    wbsCode: '2.0',
    name: 'COSTING DEPT.',
    badge: 'COSTING',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-700',
    owner: 'Design Lead',
    tasks: [
      { id: '2.1', wbsCode: '2.1', name: 'Ga Drawing', phaseId: 'phase-2', phaseName: 'COSTING DEPT.', phaseBadge: 'COSTING', projectId: 'JOB-01', owner: 'Amol M.', planHours: 12, actualHours: 12, status: 'DONE', progress: 100 },
      { id: '2.2', wbsCode: '2.2', name: 'SLD (Single Line Diagram)', phaseId: 'phase-2', phaseName: 'COSTING DEPT.', phaseBadge: 'COSTING', projectId: 'JOB-01', owner: 'Amol M.', planHours: 8, actualHours: 8, status: 'DONE', progress: 100 },
      { id: '2.3', wbsCode: '2.3', name: 'Control Drawing', phaseId: 'phase-2', phaseName: 'COSTING DEPT.', phaseBadge: 'COSTING', projectId: 'JOB-01', owner: 'Design Team', planHours: 16, actualHours: 16, status: 'DONE', progress: 100 },
      { id: '2.4', wbsCode: '2.4', name: 'All Drawing Approve', phaseId: 'phase-2', phaseName: 'COSTING DEPT.', phaseBadge: 'COSTING', projectId: 'JOB-01', owner: 'Client Eng.', planHours: 8, actualHours: 8, status: 'DONE', progress: 100 },
      { id: '2.5', wbsCode: '2.5', name: 'BOQ (Bill of Quantities)', phaseId: 'phase-2', phaseName: 'COSTING DEPT.', phaseBadge: 'COSTING', projectId: 'JOB-01', owner: 'Costing Team', planHours: 10, actualHours: 10, status: 'DONE', progress: 100 },
      { id: '2.6', wbsCode: '2.6', name: 'Job Loaded', phaseId: 'phase-2', phaseName: 'COSTING DEPT.', phaseBadge: 'COSTING', projectId: 'JOB-01', owner: 'System Admin', planHours: 2, actualHours: 2, status: 'DONE', progress: 100 },
      { id: '2.7', wbsCode: '2.7', name: 'Job file Send to Dept.', phaseId: 'phase-2', phaseName: 'COSTING DEPT.', phaseBadge: 'COSTING', projectId: 'JOB-01', owner: 'Dispatch Lead', planHours: 2, actualHours: 2, status: 'DONE', progress: 100 },

      { id: '2.1-102', wbsCode: '2.1', name: 'Ga Drawing', phaseId: 'phase-2', phaseName: 'COSTING DEPT.', phaseBadge: 'COSTING', projectId: 'JOB-02', owner: 'Amol M.', planHours: 12, actualHours: 12, status: 'DONE', progress: 100 },
      { id: '2.4-102', wbsCode: '2.4', name: 'All Drawing Approve', phaseId: 'phase-2', phaseName: 'COSTING DEPT.', phaseBadge: 'COSTING', projectId: 'JOB-02', owner: 'Client Eng.', planHours: 8, actualHours: 8, status: 'DONE', progress: 100 }
    ]
  },
  {
    id: 'phase-3',
    wbsCode: '3.0',
    name: 'STORE DEPT.',
    badge: 'STORE',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-700',
    owner: 'Store Manager',
    tasks: [
      { id: '3.1', wbsCode: '3.1', name: 'Job File Received', phaseId: 'phase-3', phaseName: 'STORE DEPT.', phaseBadge: 'STORE', projectId: 'JOB-01', owner: 'Store Clerk', planHours: 2, actualHours: 2, status: 'DONE', progress: 100 },
      { id: '3.2', wbsCode: '3.2', name: 'Order Material Shortlisted', phaseId: 'phase-3', phaseName: 'STORE DEPT.', phaseBadge: 'STORE', projectId: 'JOB-01', owner: 'Store Manager', planHours: 6, actualHours: 6, status: 'DONE', progress: 100 },
      { id: '3.3', wbsCode: '3.3', name: 'Material Order', phaseId: 'phase-3', phaseName: 'STORE DEPT.', phaseBadge: 'STORE', projectId: 'JOB-01', owner: 'Purchase Exec.', planHours: 8, actualHours: 8, status: 'DONE', progress: 100 },
      { id: '3.4', wbsCode: '3.4', name: 'Material Received', phaseId: 'phase-3', phaseName: 'STORE DEPT.', phaseBadge: 'STORE', projectId: 'JOB-01', owner: 'Warehouse Supervisor', planHours: 12, actualHours: 12, status: 'DONE', progress: 100 },
      { id: '3.5', wbsCode: '3.5', name: 'Material Handover to Dept.', phaseId: 'phase-3', phaseName: 'STORE DEPT.', phaseBadge: 'STORE', projectId: 'JOB-01', owner: 'Store Officer', planHours: 4, actualHours: 4, status: 'DONE', progress: 100 },

      { id: '3.1-103', wbsCode: '3.1', name: 'Job File Received', phaseId: 'phase-3', phaseName: 'STORE DEPT.', phaseBadge: 'STORE', projectId: 'JOB-03', owner: 'Store Clerk', planHours: 2, actualHours: 2, status: 'DONE', progress: 100 },
      { id: '3.3-103', wbsCode: '3.3', name: 'Material Order', phaseId: 'phase-3', phaseName: 'STORE DEPT.', phaseBadge: 'STORE', projectId: 'JOB-03', owner: 'Purchase Exec.', planHours: 8, actualHours: 4, status: 'IN PROGRESS', progress: 50 }
    ]
  },
  {
    id: 'phase-4',
    wbsCode: '4.0',
    name: 'MECHANICAL DEPT.',
    badge: 'MECHANICAL',
    badgeBg: 'bg-cyan-100',
    badgeText: 'text-cyan-700',
    owner: 'Mech Supervisor',
    tasks: [
      { id: '4.1', wbsCode: '4.1', name: 'Job File Received', phaseId: 'phase-4', phaseName: 'MECHANICAL DEPT.', phaseBadge: 'MECHANICAL', projectId: 'JOB-01', owner: 'Mech Lead', planHours: 2, actualHours: 2, status: 'DONE', progress: 100 },
      { id: '4.2', wbsCode: '4.2', name: 'Sheet Cutting', phaseId: 'phase-4', phaseName: 'MECHANICAL DEPT.', phaseBadge: 'MECHANICAL', projectId: 'JOB-01', owner: 'Operator A', planHours: 16, actualHours: 16, status: 'DONE', progress: 100 },
      { id: '4.3', wbsCode: '4.3', name: 'Bending', phaseId: 'phase-4', phaseName: 'MECHANICAL DEPT.', phaseBadge: 'MECHANICAL', projectId: 'JOB-01', owner: 'Operator B', planHours: 12, actualHours: 12, status: 'DONE', progress: 100 },
      { id: '4.4', wbsCode: '4.4', name: 'Fabrication', phaseId: 'phase-4', phaseName: 'MECHANICAL DEPT.', phaseBadge: 'MECHANICAL', projectId: 'JOB-01', owner: 'Fabrication Team', planHours: 24, actualHours: 24, status: 'DONE', progress: 100 },
      { id: '4.5', wbsCode: '4.5', name: 'Painting', phaseId: 'phase-4', phaseName: 'MECHANICAL DEPT.', phaseBadge: 'MECHANICAL', projectId: 'JOB-01', owner: 'Coat Tech', planHours: 16, actualHours: 16, status: 'DONE', progress: 100 },
      { id: '4.6', wbsCode: '4.6', name: 'Dispatch to Busbar Dept.', phaseId: 'phase-4', phaseName: 'MECHANICAL DEPT.', phaseBadge: 'MECHANICAL', projectId: 'JOB-01', owner: 'Floor Logistics', planHours: 2, actualHours: 2, status: 'DONE', progress: 100 },

      { id: '4.2-102', wbsCode: '4.2', name: 'Sheet Cutting', phaseId: 'phase-4', phaseName: 'MECHANICAL DEPT.', phaseBadge: 'MECHANICAL', projectId: 'JOB-02', owner: 'Operator A', planHours: 16, actualHours: 16, status: 'DONE', progress: 100 },
      { id: '4.4-102', wbsCode: '4.4', name: 'Fabrication', phaseId: 'phase-4', phaseName: 'MECHANICAL DEPT.', phaseBadge: 'MECHANICAL', projectId: 'JOB-02', owner: 'Fabrication Team', planHours: 24, actualHours: 24, status: 'DONE', progress: 100 }
    ]
  },
  {
    id: 'phase-5',
    wbsCode: '5.0',
    name: 'ASSEMBLY & BUSBAR DEPT.',
    badge: 'ASSEMBLY',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-700',
    owner: 'Assembly Lead',
    tasks: [
      { id: '5.1', wbsCode: '5.1', name: 'Job File Received', phaseId: 'phase-5', phaseName: 'ASSEMBLY & BUSBAR DEPT.', phaseBadge: 'ASSEMBLY', projectId: 'JOB-01', owner: 'Assembly Tech', planHours: 2, actualHours: 2, status: 'DONE', progress: 100 },
      { id: '5.2', wbsCode: '5.2', name: 'Panel Assemble', phaseId: 'phase-5', phaseName: 'ASSEMBLY & BUSBAR DEPT.', phaseBadge: 'ASSEMBLY', projectId: 'JOB-01', owner: 'Fitter Team', planHours: 20, actualHours: 20, status: 'DONE', progress: 100 },
      { id: '5.3', wbsCode: '5.3', name: 'Busbar & Switchgear fitted', phaseId: 'phase-5', phaseName: 'ASSEMBLY & BUSBAR DEPT.', phaseBadge: 'ASSEMBLY', projectId: 'JOB-01', owner: 'Busbar Tech', planHours: 18, actualHours: 18, status: 'DONE', progress: 100 },
      { id: '5.4', wbsCode: '5.4', name: 'Busbar tightening', phaseId: 'phase-5', phaseName: 'ASSEMBLY & BUSBAR DEPT.', phaseBadge: 'ASSEMBLY', projectId: 'JOB-01', owner: 'QC Inspector', planHours: 10, actualHours: 5, status: 'IN PROGRESS', progress: 50 },
      { id: '5.5', wbsCode: '5.5', name: 'Accessories Fitted', phaseId: 'phase-5', phaseName: 'ASSEMBLY & BUSBAR DEPT.', phaseBadge: 'ASSEMBLY', projectId: 'JOB-01', owner: 'Assembly Tech', planHours: 8, actualHours: 0, status: 'NOT STARTED', progress: 0 },
      { id: '5.6', wbsCode: '5.6', name: 'Dispatch to Electrical Dept.', phaseId: 'phase-5', phaseName: 'ASSEMBLY & BUSBAR DEPT.', phaseBadge: 'ASSEMBLY', projectId: 'JOB-01', owner: 'Floor Supervisor', planHours: 2, actualHours: 0, status: 'NOT STARTED', progress: 0 },

      { id: '5.3-102', wbsCode: '5.3', name: 'Busbar & Switchgear fitted', phaseId: 'phase-5', phaseName: 'ASSEMBLY & BUSBAR DEPT.', phaseBadge: 'ASSEMBLY', projectId: 'JOB-02', owner: 'Busbar Tech', planHours: 18, actualHours: 18, status: 'DONE', progress: 100 },
      { id: '5.4-102', wbsCode: '5.4', name: 'Busbar tightening', phaseId: 'phase-5', phaseName: 'ASSEMBLY & BUSBAR DEPT.', phaseBadge: 'ASSEMBLY', projectId: 'JOB-02', owner: 'QC Inspector', planHours: 10, actualHours: 8, status: 'IN PROGRESS', progress: 80 }
    ]
  },
  {
    id: 'phase-6',
    wbsCode: '6.0',
    name: 'ELECTRICAL DEPT.',
    badge: 'ELECTRICAL',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
    owner: 'Electrical Lead',
    tasks: [
      { id: '6.1', wbsCode: '6.1', name: 'Job File Received', phaseId: 'phase-6', phaseName: 'ELECTRICAL DEPT.', phaseBadge: 'ELECTRICAL', projectId: 'JOB-01', owner: 'Wire Lead', planHours: 2, actualHours: 2, status: 'DONE', progress: 100 },
      { id: '6.2', wbsCode: '6.2', name: 'Power Wiring', phaseId: 'phase-6', phaseName: 'ELECTRICAL DEPT.', phaseBadge: 'ELECTRICAL', projectId: 'JOB-01', owner: 'Electrician A', planHours: 16, actualHours: 16, status: 'DONE', progress: 100 },
      { id: '6.3', wbsCode: '6.3', name: 'Control Wiring', phaseId: 'phase-6', phaseName: 'ELECTRICAL DEPT.', phaseBadge: 'ELECTRICAL', projectId: 'JOB-01', owner: 'Electrician B', planHours: 20, actualHours: 8, status: 'IN PROGRESS', progress: 40 },
      { id: '6.4', wbsCode: '6.4', name: 'Accessories Wiring', phaseId: 'phase-6', phaseName: 'ELECTRICAL DEPT.', phaseBadge: 'ELECTRICAL', projectId: 'JOB-01', owner: 'Wire Asst', planHours: 12, actualHours: 0, status: 'NOT STARTED', progress: 0 },
      { id: '6.5', wbsCode: '6.5', name: 'Dispatch to Testing Dept.', phaseId: 'phase-6', phaseName: 'ELECTRICAL DEPT.', phaseBadge: 'ELECTRICAL', projectId: 'JOB-01', owner: 'Elec Supervisor', planHours: 2, actualHours: 0, status: 'NOT STARTED', progress: 0 },

      { id: '6.2-104', wbsCode: '6.2', name: 'Power Wiring', phaseId: 'phase-6', phaseName: 'ELECTRICAL DEPT.', phaseBadge: 'ELECTRICAL', projectId: 'JOB-04', owner: 'Electrician A', planHours: 16, actualHours: 4, status: 'IN PROGRESS', progress: 25 }
    ]
  },
  {
    id: 'phase-7',
    wbsCode: '7.0',
    name: 'TESTING DEPT.',
    badge: 'TESTING',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
    owner: 'QC Manager',
    tasks: [
      { id: '7.1', wbsCode: '7.1', name: 'Job File Received', phaseId: 'phase-7', phaseName: 'TESTING DEPT.', phaseBadge: 'TESTING', projectId: 'JOB-01', owner: 'QC Inspector', planHours: 2, actualHours: 2, status: 'DONE', progress: 100 },
      { id: '7.2', wbsCode: '7.2', name: 'Short Material List', phaseId: 'phase-7', phaseName: 'TESTING DEPT.', phaseBadge: 'TESTING', projectId: 'JOB-01', owner: 'QC Tech', planHours: 4, actualHours: 0, status: 'NOT STARTED', progress: 0 },
      { id: '7.3', wbsCode: '7.3', name: 'Panel operation Test', phaseId: 'phase-7', phaseName: 'TESTING DEPT.', phaseBadge: 'TESTING', projectId: 'JOB-01', owner: 'Test Eng.', planHours: 12, actualHours: 0, status: 'NOT STARTED', progress: 0 },
      { id: '7.4', wbsCode: '7.4', name: 'All Parameter Checked by Approve list', phaseId: 'phase-7', phaseName: 'TESTING DEPT.', phaseBadge: 'TESTING', projectId: 'JOB-01', owner: 'QC Head', planHours: 8, actualHours: 0, status: 'NOT STARTED', progress: 0 },
      { id: '7.5', wbsCode: '7.5', name: 'Ready for Dispatch.', phaseId: 'phase-7', phaseName: 'TESTING DEPT.', phaseBadge: 'TESTING', projectId: 'JOB-01', owner: 'Final Release Manager', planHours: 2, actualHours: 0, status: 'NOT STARTED', progress: 0 }
    ]
  },
  {
    id: 'phase-8',
    wbsCode: '8.0',
    name: 'ACCOUNTS & DISPATCH',
    badge: 'ACCOUNTS',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-700',
    owner: 'Accounts Officer',
    tasks: [
      { id: '8.1', wbsCode: '8.1', name: 'Final Invoice Generated', phaseId: 'phase-8', phaseName: 'ACCOUNTS & DISPATCH', phaseBadge: 'ACCOUNTS', projectId: 'JOB-01', owner: 'Accounts Team', planHours: 4, actualHours: 0, status: 'NOT STARTED', progress: 0 },
      { id: '8.2', wbsCode: '8.2', name: 'Payment Clearance', phaseId: 'phase-8', phaseName: 'ACCOUNTS & DISPATCH', phaseBadge: 'ACCOUNTS', projectId: 'JOB-01', owner: 'Finance Lead', planHours: 4, actualHours: 0, status: 'NOT STARTED', progress: 0 },
      { id: '8.3', wbsCode: '8.3', name: 'Ready For Dispatch Clearance', phaseId: 'phase-8', phaseName: 'ACCOUNTS & DISPATCH', phaseBadge: 'ACCOUNTS', projectId: 'JOB-01', owner: 'Dispatch Manager', planHours: 2, actualHours: 0, status: 'NOT STARTED', progress: 0 }
    ]
  },
  {
    id: 'phase-9',
    wbsCode: '9.0',
    name: 'SUPPORT & SERVICE DEPT.',
    badge: 'SUPPORT',
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-700',
    owner: 'Service Manager',
    tasks: [
      { id: '9.1', wbsCode: '9.1', name: 'Service Call Received', phaseId: 'phase-9', phaseName: 'SUPPORT & SERVICE DEPT.', phaseBadge: 'SUPPORT', projectId: 'JOB-01', owner: 'Support Desk', planHours: 2, actualHours: 2, status: 'DONE', progress: 100 },
      { id: '9.2', wbsCode: '9.2', name: 'Assigned Engineer', phaseId: 'phase-9', phaseName: 'SUPPORT & SERVICE DEPT.', phaseBadge: 'SUPPORT', projectId: 'JOB-01', owner: 'Service Lead', planHours: 2, actualHours: 2, status: 'DONE', progress: 100 },
      { id: '9.3', wbsCode: '9.3', name: 'Service call done', phaseId: 'phase-9', phaseName: 'SUPPORT & SERVICE DEPT.', phaseBadge: 'SUPPORT', projectId: 'JOB-01', owner: 'Field Engineer', planHours: 16, actualHours: 0, status: 'NOT STARTED', progress: 0 },
      { id: '9.4', wbsCode: '9.4', name: 'Submit service report', phaseId: 'phase-9', phaseName: 'SUPPORT & SERVICE DEPT.', phaseBadge: 'SUPPORT', projectId: 'JOB-01', owner: 'Field Engineer', planHours: 4, actualHours: 0, status: 'NOT STARTED', progress: 0 }
    ]
  }
];

export default function WBSPage() {
  const [wbsData, setWbsData] = useState<WBSPhase[]>(GENERATE_INITIAL_WBS());
  const [confirmedProjects, setConfirmedProjects] = useState<ConfirmedInquiryProject[]>(DEFAULT_CONFIRMED_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('INQ-101'); // Default to first confirmed project

  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({
    'phase-1': true,
    'phase-2': true,
    'phase-3': true,
    'phase-4': true,
    'phase-5': true,
    'phase-6': true,
    'phase-7': true,
    'phase-8': true,
    'phase-9': true
  });

  useEffect(() => {
    expandAll();
  }, [selectedProjectId]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Excel Modal State
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  // Add Task Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTaskPhaseId, setNewTaskPhaseId] = useState('phase-5');
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskOwner, setNewTaskOwner] = useState('Vinayak NPN');
  const [newTaskPlanHours, setNewTaskPlanHours] = useState(8);
  const [newTaskStatus, setNewTaskStatus] = useState<'DONE' | 'IN PROGRESS' | 'NOT STARTED'>('NOT STARTED');

  // Edit Task Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<WBSTask | null>(null);

  // Delete Task Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingTask, setDeletingTask] = useState<WBSTask | null>(null);

  // Assign Staff Modal State
  const [assigningTask, setAssigningTask] = useState<WBSTask | null>(null);

  // Fetch WBS tree from Backend API (Database)
  const fetchWBS = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/wbs`);
      if (res.ok) {
        const dbPhases = await res.json();
        if (dbPhases && dbPhases.length > 0) {
          const mapped: WBSPhase[] = dbPhases.map((p: any) => ({
            id: p.id,
            wbsCode: p.wbsCode,
            name: p.name,
            badge: p.badge,
            badgeBg: 'bg-[#0B1728]/10 text-slate-700',
            badgeText: 'text-slate-800',
            owner: p.owner,
            tasks: p.tasks.map((t: any) => ({
              id: t.id,
              wbsCode: t.wbsCode,
              name: t.name,
              phaseId: t.phaseId,
              phaseName: p.name,
              phaseBadge: p.badge,
              projectId: t.inquiry?.inquiryCode || t.inquiryId || 'INQ_01',
              owner: t.owner,
              planHours: t.planHours,
              actualHours: t.actualHours,
              status: t.status as any,
              progress: t.progress
            }))
          }));
          setWbsData(mapped);
        }
      }
    } catch (err) {
      console.error('Fetching WBS tree from DB:', err);
    }
  };

  // Fetch confirmed inquiries live from Backend API
  useEffect(() => {
    const fetchConfirmedInquiries = async () => {
      try {
        const headers = getAuthHeaders();
        const [inqRes, jobsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/inquiries`, { headers }),
          fetch(`${API_BASE_URL}/api/inventory/jobs`, { headers })
        ]);

        let combined: ConfirmedInquiryProject[] = [];

        if (inqRes.ok) {
          const inqData = await inqRes.json();
          combined = inqData
            .filter((i: any) => i.status === 'Confirmed')
            .map((i: any) => ({
              id: i.inquiryCode || i.id,
              inquiryCode: i.inquiryCode || i.id,
              client: i.client,
              project: i.project,
              amount: String(i.amount || 1500000),
              date: i.date || new Date().toISOString(),
              status: 'Confirmed'
            }));
        }

        if (combined.length === 0 && jobsRes.ok) {
          const jobsData = await jobsRes.json();
          combined = jobsData.map((j: any) => ({
            id: j.jobNo,
            inquiryCode: j.jobNo,
            client: j.clientName || j.jobNo,
            project: j.clientName || 'Job Master',
            amount: '1500000',
            date: new Date().toISOString(),
            status: 'Confirmed'
          }));
        }

        if (combined.length > 0) {
          setConfirmedProjects(combined);
          const defaultId = combined[0].inquiryCode || combined[0].id;
          setSelectedProjectId(prev => (prev === 'INQ-101' || prev === 'INQ_01' ? defaultId : prev));
        }
      } catch (err) {
        console.error('Fetching confirmed inquiries for WBS fallback:', err);
      }
    };
    fetchConfirmedInquiries();
    fetchWBS();

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('skytech_selected_project_id');
      if (saved) setSelectedProjectId(saved);
    }

    const handleProjectEvent = (e: any) => {
      const saved = localStorage.getItem('skytech_selected_project_id');
      if (saved) setSelectedProjectId(saved);
    };
    window.addEventListener('projectChanged', handleProjectEvent);
    return () => window.removeEventListener('projectChanged', handleProjectEvent);
  }, []);

  // Currently selected confirmed project object
  const selectedProject = confirmedProjects.find(p => p.id === selectedProjectId || p.inquiryCode === selectedProjectId);

  // Toggle Phase Expansion
  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => ({ ...prev, [phaseId]: !prev[phaseId] }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    wbsData.forEach(p => allExpanded[p.id] = true);
    setExpandedPhases(allExpanded);
  };

  const collapseAll = () => {
    const allCollapsed: Record<string, boolean> = {};
    wbsData.forEach(p => allCollapsed[p.id] = false);
    setExpandedPhases(allCollapsed);
  };

  // Add New Task Handler (Database Persisted)
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    try {
      const targetPhase = wbsData.find(p => p.id === newTaskPhaseId);
      const subtaskCount = (targetPhase?.tasks.length || 0) + 1;
      const subtaskNum = (targetPhase?.wbsCode || '1.0').replace('.0', '') + '.' + subtaskCount;

      const res = await fetch(`${API_BASE_URL}/api/wbs/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wbsCode: subtaskNum,
          name: newTaskName,
          phaseId: newTaskPhaseId,
          owner: newTaskOwner || 'Assigned Eng',
          planHours: Number(newTaskPlanHours) || 8,
          status: newTaskStatus
        })
      });

      if (res.ok) {
        await fetchWBS();
        setNewTaskName('');
        setIsAddModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to create task in DB:', err);
    }
  };

  // Open Edit Task Modal
  const openEditModal = (task: WBSTask) => {
    setEditingTask({ ...task });
    setIsEditModalOpen(true);
  };

  // Save Edit Task Handler (Database Persisted)
  const handleSaveEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/wbs/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTask)
      });

      if (res.ok) {
        await fetchWBS();
        setIsEditModalOpen(false);
        setEditingTask(null);
      }
    } catch (err) {
      console.error('Failed to update task in DB:', err);
    }
  };

  // Open Delete Confirmation Modal
  const openDeleteModal = (task: WBSTask) => {
    setDeletingTask(task);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete Task Handler (Database Persisted)
  const handleConfirmDeleteTask = async () => {
    if (!deletingTask) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/wbs/tasks/${deletingTask.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        await fetchWBS();
        setIsDeleteModalOpen(false);
        setDeletingTask(null);
      }
    } catch (err) {
      console.error('Failed to delete task from DB:', err);
    }
  };

  // Toggle single task completion status directly in DB
  const toggleTaskStatus = async (phaseId: string, taskId: string) => {
    const targetTask = wbsData.flatMap(p => p.tasks).find(t => t.id === taskId);
    if (!targetTask) return;

    const nextStatus = targetTask.status === 'DONE' ? 'NOT STARTED' : (targetTask.status === 'NOT STARTED' ? 'IN PROGRESS' : 'DONE');
    const nextProgress = nextStatus === 'DONE' ? 100 : (nextStatus === 'IN PROGRESS' ? 50 : 0);

    try {
      const res = await fetch(`${API_BASE_URL}/api/wbs/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          progress: nextProgress
        })
      });

      if (res.ok) {
        await fetchWBS();
      }
    } catch (err) {
      console.error('Failed to toggle task status in DB:', err);
    }
  };

  // Export WBS Tasks to Excel (.xlsx) file handler
  const handleExportExcel = () => {
    const exportRows: any[] = [];

    wbsData.forEach((phase) => {
      const subtasks = phase.tasks.filter(t => {
        const matchesProject = selectedProjectId === 'ALL' || 
                              t.projectId === selectedProjectId || 
                              (selectedProject && (t.projectId === selectedProject.inquiryCode || t.projectId === selectedProject.id));
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              t.wbsCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              t.owner.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
        return matchesProject && matchesSearch && matchesStatus;
      });

      subtasks.forEach((t) => {
        const proj = confirmedProjects.find(p => p.id === t.projectId || p.inquiryCode === t.projectId);
        exportRows.push({
          'WBS Code': t.wbsCode,
          'Phase / Department': t.phaseName || phase.name,
          'Task Name': t.name,
          'Inquiry ID': t.projectId,
          'Client Name': proj ? proj.client : 'SkyTech Internal',
          'Project Description': proj ? proj.project : 'Standard WBS Task',
          'Owner / Responsible': t.owner,
          'Plan Hours (hrs)': t.planHours,
          'Actual Hours (hrs)': t.actualHours,
          'Status': t.status,
          'Progress (%)': `${t.progress}%`
        });
      });
    });

    if (exportRows.length === 0) {
      alert('No WBS tasks available to export matching your current filters.');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    worksheet['!cols'] = [
      { wch: 12 }, // WBS Code
      { wch: 28 }, // Phase / Department
      { wch: 38 }, // Task Name
      { wch: 14 }, // Inquiry ID
      { wch: 28 }, // Client Name
      { wch: 32 }, // Project Description
      { wch: 22 }, // Owner / Responsible
      { wch: 18 }, // Plan Hours
      { wch: 18 }, // Actual Hours
      { wch: 15 }, // Status
      { wch: 14 }  // Progress
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'WBS Tasks');

    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = selectedProjectId === 'ALL'
      ? `SkyTech_WBS_Full_Report_${dateStr}.xlsx`
      : `SkyTech_WBS_${selectedProjectId}_Report_${dateStr}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  // Calculate WBS Metrics dynamically filtered by selected project!
  let totalTasksCount = 0;
  let totalCompletedCount = 0;
  let totalPlannedHours = 0;
  let totalActualHours = 0;

  wbsData.forEach(p => {
    p.tasks.forEach(t => {
      const matchesProject = selectedProjectId === 'ALL' || 
                            t.projectId === selectedProjectId || 
                            (selectedProject && (t.projectId === selectedProject.inquiryCode || t.projectId === selectedProject.id));
      if (matchesProject) {
        totalTasksCount++;
        if (t.status === 'DONE') totalCompletedCount++;
        totalPlannedHours += t.planHours;
        totalActualHours += t.actualHours;
      }
    });
  });

  const overallProgressPercentage = totalTasksCount > 0 ? Math.round((totalCompletedCount / totalTasksCount) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Prominent Project Selector */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Active Project</span>
            {confirmedProjects.length === 0 ? (
              <div className="flex items-center gap-2 py-2">
                <div className="w-2 h-2 rounded-full bg-slate-300" />
                <span className="text-sm font-semibold text-slate-400">No confirmed projects found. Connect backend to load projects.</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <select
                  value={selectedProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('skytech_selected_project_id', e.target.value);
                      window.dispatchEvent(new Event('projectChanged'));
                    }
                  }}
                  className="text-base font-extrabold text-slate-900 bg-transparent border-0 focus:ring-0 focus:outline-none cursor-pointer pr-8 appearance-none"
                >
                  {confirmedProjects.map(p => (
                    <option key={p.id} value={p.inquiryCode || p.id}>
                      [{p.inquiryCode || p.id}] {p.project} — {p.client}
                    </option>
                  ))}
                </select>
                {selectedProject && (
                  <span className="text-xs text-slate-400 font-medium hidden sm:block">
                    {selectedProject.client}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={expandAll}
              className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              Expand All
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Top Header Bar & Confirmed Project Selection Dropdown */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
              <Workflow size={16} />
              <span>Operational Structure & WBS</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              Work Breakdown Structure (WBS)
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Hierarchical task breakdown across confirmed client inquiries and manufacturing phases
            </p>
          </div>

          {/* Action Controls (+ Add Task) */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
            >
              <Plus size={16} />
              <span>+ Add Task</span>
            </button>

            <button
              type="button"
              onClick={() => setIsExcelModalOpen(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Upload size={15} />
              <span>Import Excel</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              <FileSpreadsheet size={15} className="text-slate-500" />
              <span className="hidden sm:inline">Export Excel</span>
            </button>
          </div>
        </div>

      </div>

      {/* Summary KPI Widgets (Dynamically filtered by selected project) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Total Tasks */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PROJECT WBS TASKS</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-slate-900">{totalTasksCount}</span>
              <span className="text-xs font-semibold text-slate-500">Tasks</span>
            </div>
            <span className="text-[11px] text-blue-600 font-semibold mt-1 block">
              {selectedProjectId === 'ALL' ? 'All Active Projects' : `Project ${selectedProjectId}`}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <FolderTree size={20} />
          </div>
        </div>

        {/* KPI 2: Completed Tasks */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TASKS COMPLETED</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-slate-900">{totalCompletedCount} / {totalTasksCount}</span>
              <span className="text-xs font-bold text-emerald-600">{overallProgressPercentage}%</span>
            </div>
            <div className="w-28 bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${overallProgressPercentage}%` }} />
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>

        {/* KPI 3: Planned Hours */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PLANNED WORKLOAD</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-slate-900">{totalPlannedHours}</span>
              <span className="text-xs font-semibold text-slate-500">Man-Hours</span>
            </div>
            <span className="text-[11px] text-indigo-600 font-semibold mt-1 block">Actual Logged: {totalActualHours} hrs</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>

        {/* KPI 4: Pending Tasks */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">REMAINING TASKS</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-slate-900">{totalTasksCount - totalCompletedCount}</span>
              <span className="text-xs font-semibold text-amber-600">Pending</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">In production pipeline</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle size={20} />
          </div>
        </div>

      </div>

      {/* Main WBS Tree Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        
        {/* Controls Bar: Search, Status Filter, Expand/Collapse */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          
          {/* Search Bar */}
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search task name, WBS code, owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 font-medium"
            />
          </div>

          {/* Filters & Expand/Collapse Toggles */}
          <div className="flex items-center gap-2">
            
            {/* Status Filter */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${statusFilter === 'ALL' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'hover:text-slate-900'}`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('IN PROGRESS')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${statusFilter === 'IN PROGRESS' ? 'bg-white text-amber-600 shadow-xs font-bold' : 'hover:text-slate-900'}`}
              >
                In Progress
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('DONE')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${statusFilter === 'DONE' ? 'bg-white text-emerald-600 shadow-xs font-bold' : 'hover:text-slate-900'}`}
              >
                Done
              </button>
            </div>

            {/* Expand / Collapse All */}
            <button
              type="button"
              onClick={expandAll}
              className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Expand All
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Collapse All
            </button>

          </div>

        </div>

        {/* Hierarchical WBS Tree Table (Filtered by Project) */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0B1728] text-slate-300 text-[11px] font-bold uppercase tracking-wider border-b border-slate-800">
                <th className="py-3 px-4 w-24">WBS</th>
                <th className="py-3 px-4">TASK / PHASE NAME</th>
                <th className="py-3 px-4 w-32">PHASE</th>
                <th className="py-3 px-4 w-32">OWNER</th>
                <th className="py-3 px-4 w-28 text-center">PLAN / ACT HRS</th>
                <th className="py-3 px-4 w-32 text-center">STATUS</th>
                <th className="py-3 px-4 w-32 text-center">% PROGRESS</th>
                <th className="py-3 px-4 w-24 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              
              {wbsData.map((phase) => {
                const isExpanded = expandedPhases[phase.id];
                
                // Filter subtasks based on Project Selection, Search & Status
                const filteredSubtasks = phase.tasks.filter(t => {
                  const matchesProject = selectedProjectId === 'ALL' || 
                                        t.projectId === selectedProjectId || 
                                        (selectedProject && (t.projectId === selectedProject.inquiryCode || t.projectId === selectedProject.id));
                  const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        t.wbsCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        t.owner.toLowerCase().includes(searchQuery.toLowerCase());
                  const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
                  return matchesProject && matchesSearch && matchesStatus;
                });

                if (searchQuery && filteredSubtasks.length === 0) return null;

                const completedCount = filteredSubtasks.filter(t => t.status === 'DONE').length;
                const totalCount = filteredSubtasks.length;
                const phaseProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                return (
                  <React.Fragment key={phase.id}>
                    
                    {/* Phase Parent Row */}
                    <tr 
                      onClick={() => togglePhase(phase.id)}
                      className="bg-slate-900/90 text-white font-bold cursor-pointer hover:bg-slate-900 transition-colors border-b border-slate-800"
                    >
                      <td className="py-3 px-4 text-slate-200 font-mono font-bold">{phase.wbsCode}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button type="button" className="p-0.5 rounded hover:bg-slate-800 text-slate-300">
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                          <span className="tracking-wide text-xs text-white">{phase.name}</span>
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full ml-2 font-normal">
                            {completedCount}/{totalCount} Done
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-white/20 text-white tracking-wider border border-white/20">
                          {phase.badge}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-200 font-normal">{phase.owner}</td>
                      <td className="py-3 px-4 text-center text-slate-300 font-mono text-xs">
                        {filteredSubtasks.reduce((sum, t) => sum + t.planHours, 0)} hrs
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          phaseProgress === 100 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {phaseProgress === 100 ? 'COMPLETED' : 'IN PROGRESS'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${phaseProgress}%` }} />
                          </div>
                          <span className="text-[10px] text-blue-400 font-bold">{phaseProgress}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewTaskPhaseId(phase.id);
                            setIsAddModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Add Sub-task to Phase"
                        >
                          <Plus size={16} />
                        </button>
                      </td>
                    </tr>

                    {/* Sub-task Rows (Rendered when expanded) */}
                    {isExpanded && filteredSubtasks.map((task) => (
                      <tr 
                        key={task.id} 
                        className="bg-white hover:bg-slate-50/80 transition-colors text-slate-800 border-b border-slate-100"
                      >
                        <td className="py-2.5 px-4 font-mono text-slate-400 text-xs pl-8">{task.wbsCode}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800 pl-8">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                            <span>{task.name}</span>
                            <span className="text-[9px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 font-bold ml-1">
                              {task.projectId}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {task.phaseBadge}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 font-medium">
                          <div className="flex items-center gap-1.5">
                            <User size={13} className="text-slate-400" />
                            <span>{task.owner}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono text-xs text-slate-600">
                          {task.planHours} / {task.actualHours} hrs
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => toggleTaskStatus(phase.id, task.id)}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer inline-flex items-center gap-1 ${
                              task.status === 'DONE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : task.status === 'IN PROGRESS'
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {task.status === 'DONE' && <CheckCircle2 size={12} className="text-emerald-600" />}
                            {task.status === 'IN PROGRESS' && <Clock size={12} className="text-amber-600" />}
                            <span>{task.status}</span>
                          </button>
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/60">
                              <div 
                                className={`h-full rounded-full transition-all duration-300 ${
                                  task.status === 'DONE' ? 'bg-emerald-500' : 'bg-blue-600'
                                }`} 
                                style={{ width: `${task.progress}%` }} 
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-600">{task.progress}%</span>
                          </div>
                        </td>
                        {/* ACTION COLUMN: Assign, Pencil (Edit) & Delete (Trash) */}
                        <td className="py-2.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setAssigningTask(task)}
                              className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                              title="Assign Staff to Task"
                            >
                              <Users size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditModal(task)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Task Details"
                            >
                              <Edit2 size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() => openDeleteModal(task)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Task"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                  </React.Fragment>
                );
              })}

            </tbody>
          </table>
        </div>

      </div>

      {/* 1. ADD TASK MODAL DIALOG */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <Plus size={18} className="text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Add WBS Task for Project</h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="p-6 space-y-4">
              
              {/* Target Project display */}
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">Assigned Project:</span>
                <span className="font-extrabold text-blue-800 font-mono">
                  {selectedProjectId === 'ALL' ? 'INQ-101 (Reliance Green Energy)' : `${selectedProjectId} (${selectedProject?.client})`}
                </span>
              </div>

              {/* Parent Phase Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Target WBS Phase
                </label>
                <select
                  value={newTaskPhaseId}
                  onChange={(e) => setNewTaskPhaseId(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  {wbsData.map(phase => (
                    <option key={phase.id} value={phase.id}>
                      {phase.wbsCode} - {phase.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Task Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Task Name / Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Busbar Tightening & Torque Inspection"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Owner & Planned Hours */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Assigned Owner / Lead
                  </label>
                  <input
                    type="text"
                    value={newTaskOwner}
                    onChange={(e) => setNewTaskOwner(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Planned Work Hours
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newTaskPlanHours}
                    onChange={(e) => setNewTaskPlanHours(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Initial Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Initial Status
                </label>
                <select
                  value={newTaskStatus}
                  onChange={(e) => setNewTaskStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="NOT STARTED">NOT STARTED</option>
                  <option value="IN PROGRESS">IN PROGRESS</option>
                  <option value="DONE">DONE</option>
                </select>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-colors cursor-pointer"
                >
                  Create Task
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 2. EDIT TASK POPUP MODAL */}
      {isEditModalOpen && editingTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <Edit2 size={18} className="text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Edit Task Column Details</h3>
              </div>
              <button 
                onClick={() => { setIsEditModalOpen(false); setEditingTask(null); }}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditTask} className="p-6 space-y-4">
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    WBS Code
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTask.wbsCode}
                    onChange={(e) => setEditingTask({ ...editingTask, wbsCode: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-blue-600 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Task Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editingTask.name}
                    onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Assigned Confirmed Project
                </label>
                <select
                  value={editingTask.projectId}
                  onChange={(e) => setEditingTask({ ...editingTask, projectId: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-mono"
                >
                  {confirmedProjects.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.id}] {p.client} - {p.project}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  WBS Phase
                </label>
                <select
                  value={editingTask.phaseId}
                  onChange={(e) => setEditingTask({ ...editingTask, phaseId: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  {wbsData.map(phase => (
                    <option key={phase.id} value={phase.id}>
                      {phase.wbsCode} - {phase.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Owner / Lead
                  </label>
                  <input
                    type="text"
                    value={editingTask.owner}
                    onChange={(e) => setEditingTask({ ...editingTask, owner: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Plan Hours
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editingTask.planHours}
                    onChange={(e) => setEditingTask({ ...editingTask, planHours: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Actual Hours
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingTask.actualHours}
                    onChange={(e) => setEditingTask({ ...editingTask, actualHours: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Task Status
                  </label>
                  <select
                    value={editingTask.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as any;
                      const newProgress = newStatus === 'DONE' ? 100 : (newStatus === 'IN PROGRESS' ? 50 : 0);
                      setEditingTask({ ...editingTask, status: newStatus, progress: newProgress });
                    }}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="NOT STARTED">NOT STARTED</option>
                    <option value="IN PROGRESS">IN PROGRESS</option>
                    <option value="DONE">DONE</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Progress %
                    </label>
                    <span className="text-xs font-extrabold text-blue-600">{editingTask.progress}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={editingTask.progress}
                    onChange={(e) => {
                      const p = Number(e.target.value);
                      const st = p === 100 ? 'DONE' : (p > 0 ? 'IN PROGRESS' : 'NOT STARTED');
                      setEditingTask({ ...editingTask, progress: p, status: st });
                    }}
                    className="w-full accent-blue-600 cursor-pointer mt-2"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setEditingTask(null); }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 3. CONFIRM DELETE TASK MODAL DIALOG */}
      {isDeleteModalOpen && deletingTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            
            <div className="px-6 py-4 border-b border-rose-100 flex items-center justify-between bg-rose-50/60">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertTriangle size={20} className="text-rose-600" />
                <h3 className="text-base font-bold text-slate-900">Confirm Task Deletion</h3>
              </div>
              <button 
                onClick={() => { setIsDeleteModalOpen(false); setDeletingTask(null); }}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-xs font-medium text-slate-700 leading-relaxed">
                Are you sure you want to delete task <strong className="text-slate-900 font-extrabold">"{deletingTask.name}"</strong> (<span className="font-mono text-blue-600">{deletingTask.wbsCode}</span>)?
              </p>
              
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span className="font-semibold">Project:</span>
                  <span className="font-bold text-blue-600">{deletingTask.projectId}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="font-semibold">Phase:</span>
                  <span className="font-medium text-slate-800">{deletingTask.phaseName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="font-semibold">Owner:</span>
                  <span className="font-medium text-slate-800">{deletingTask.owner}</span>
                </div>
              </div>

              <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 pt-1">
                <span>⚠️ Note: This action will permanently remove this task from the WBS tree.</span>
              </p>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => { setIsDeleteModalOpen(false); setDeletingTask(null); }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTask}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-500/20 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>Delete Task</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* EXCEL UPLOAD MODAL */}
      <ExcelUploadModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        endpointUrl={`${API_BASE_URL}/api/wbs/upload-excel`}
        title="Import WBS Excel Schedule"
        onSuccess={() => {
          setIsExcelModalOpen(false);
          fetchWBS();
        }}
      />

      {/* ASSIGN EMPLOYEE MODAL */}
      {assigningTask && (
        <AssignEmployeeModal
          taskId={assigningTask.id}
          taskName={assigningTask.name}
          currentAssignments={assigningTask.assignments}
          onClose={() => setAssigningTask(null)}
          onUpdate={() => {
            fetchWBS();
          }}
        />
      )}

    </div>
  );
}
