'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  Send, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Layers, 
  Sparkles, 
  X, 
  Edit3, 
  Trash2, 
  Phone, 
  Mail, 
  User, 
  Calendar, 
  DollarSign, 
  AlertTriangle,
  FileSpreadsheet,
  PauseCircle,
  PlayCircle,
  Users
} from 'lucide-react';
import { API_BASE_URL } from '@/config/api';
import { AssignTeamModal } from '@/components/AssignTeamModal';
import { useAuth } from '@/hooks/useAuth';

interface Inquiry {
  id: string;
  inquiryCode?: string;
  client: string;
  project: string;
  amount: string;
  contactPerson: string;
  email: string;
  phone: string;
  date: string;
  status: 'Inquiry Received' | 'Offer Sent' | 'Confirmed' | 'Unconfirmed';
  holdStatus?: boolean;
  holdReason?: string;
  heldAt?: string;
  remarks: string;
}

const DEFAULT_INQUIRIES: Inquiry[] = [
  { id: 'INQ_01', inquiryCode: 'INQ_01', client: 'Reliance Green Energy', project: '132kV Substation Panel', amount: '1850000', contactPerson: 'Rajesh Sharma', email: 'rajesh@reliance.com', phone: '+91 98250 12345', date: '2026-07-18', status: 'Confirmed', holdStatus: false, remarks: 'Design approved' },
  { id: 'INQ_02', inquiryCode: 'INQ_02', client: 'Tata Steel Infra', project: 'Control Desk & PCC Panel', amount: '1220000', contactPerson: 'Amit Patel', email: 'amit@tatasteel.com', phone: '+91 98795 67890', date: '2026-07-16', status: 'Offer Sent', holdStatus: false, remarks: 'Quotation sent' },
  { id: 'INQ_03', inquiryCode: 'INQ_03', client: 'Adani Solar Power', project: 'MCC Panel System', amount: '2400000', contactPerson: 'Suresh Verma', email: 'suresh@adani.com', phone: '+91 99090 11223', date: '2026-07-14', status: 'Confirmed', holdStatus: false, remarks: 'PO received' },
  { id: 'INQ_04', inquiryCode: 'INQ_04', client: 'L&T Construction', project: 'Distribution Board DB-04', amount: '840000', contactPerson: 'Vikas Mehta', email: 'vikas@lnt.com', phone: '+91 94260 44556', date: '2026-07-12', status: 'Unconfirmed', holdStatus: false, remarks: 'Follow up required' },
  { id: 'INQ_05', inquiryCode: 'INQ_05', client: 'Torrent Power Pvt Ltd', project: 'APFC Panel 440V', amount: '1510000', contactPerson: 'Pankaj Joshi', email: 'pankaj@torrent.com', phone: '+91 98240 33445', date: '2026-07-09', status: 'Confirmed', holdStatus: false, remarks: 'In testing phase' },
  { id: 'INQ_06', inquiryCode: 'INQ_06', client: 'JSW Energy Ltd', project: 'Busduct System 2000A', amount: '3100000', contactPerson: 'Karan Shah', email: 'karan@jsw.in', phone: '+91 97129 88776', date: '2026-07-05', status: 'Offer Sent', holdStatus: false, remarks: 'Revised quote requested' },
  { id: 'INQ_07', inquiryCode: 'INQ_07', client: 'BHEL Engineering', project: 'Generator Control Panel', amount: '2280000', contactPerson: 'Ramesh Gupta', email: 'ramesh@bhel.in', phone: '+91 99789 22334', date: '2026-06-28', status: 'Confirmed', holdStatus: false, remarks: 'Assembly started' },
  { id: 'INQ_08', inquiryCode: 'INQ_08', client: 'GMR Airports Pvt Ltd', project: 'Main Switchboard MSB-1', amount: '1940000', contactPerson: 'Deepak Kumar', email: 'deepak@gmr.in', phone: '+91 98980 55667', date: '2026-06-24', status: 'Unconfirmed', holdStatus: false, remarks: 'Initial discussion' }
];

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const { isAdmin, isManager } = useAuth();

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
  const [assignTeamInquiryId, setAssignTeamInquiryId] = useState<string | null>(null);
  const [holdingInquiry, setHoldingInquiry] = useState<Inquiry | null>(null);
  const [holdReasonInput, setHoldReasonInput] = useState('');

  // Form State
  const [formInquiry, setFormInquiry] = useState<Partial<Inquiry>>({
    client: '',
    project: '',
    amount: '',
    contactPerson: '',
    email: '',
    phone: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Inquiry Received',
    remarks: ''
  });

  const [deletingInquiry, setDeletingInquiry] = useState<Inquiry | null>(null);

  // Fetch inquiries from backend API
  const fetchInquiries = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/inquiries`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setInquiries(data);
          return;
        }
      }
    } catch (err) {
      console.error('Failed to fetch inquiries:', err);
    } finally {
      setLoading(false);
    }
    setInquiries(prev => prev.length > 0 ? prev : DEFAULT_INQUIRIES);
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  // Open Hold Modal
  const openHoldModal = (inq: Inquiry) => {
    setHoldingInquiry(inq);
    setHoldReasonInput('');
    setIsHoldModalOpen(true);
  };

  // Confirm Hold Inquiry Handler (R2)
  const handleConfirmHoldInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holdingInquiry) return;
    const targetId = holdingInquiry.inquiryCode || holdingInquiry.id;
    const reasonText = holdReasonInput.trim() || 'Project placed on hold by manager';

    // Optimistic UI update immediately
    setInquiries(prev => prev.map(inq =>
      (inq.id === holdingInquiry.id || (inq.inquiryCode && inq.inquiryCode === holdingInquiry.inquiryCode))
        ? { ...inq, holdStatus: true, holdReason: reasonText }
        : inq
    ));
    setIsHoldModalOpen(false);
    setHoldingInquiry(null);
    setHoldReasonInput('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/inquiries/${targetId}/hold`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reasonText })
      });
      if (res.ok) {
        await fetchInquiries();
      }
    } catch (err) {
      console.error('Failed to hold inquiry on server:', err);
    }
  };

  // Add Inquiry Handler
  const handleAddInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formInquiry)
      });
      if (res.ok) {
        await fetchInquiries();
        setIsAddModalOpen(false);
        setFormInquiry({
          client: '',
          project: '',
          amount: '',
          contactPerson: '',
          email: '',
          phone: '',
          date: new Date().toISOString().split('T')[0],
          status: 'Inquiry Received',
          remarks: ''
        });
      }
    } catch (err) {
      console.error('Failed to add inquiry:', err);
    }
  };

  // Save Edit Inquiry Handler
  const handleSaveEditInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formInquiry.id) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/inquiries/${formInquiry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formInquiry)
      });
      if (res.ok) {
        await fetchInquiries();
        setIsEditModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to update inquiry:', err);
    }
  };

  // Delete Inquiry Handler
  const handleConfirmDeleteInquiry = async () => {
    if (!deletingInquiry) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/inquiries/${deletingInquiry.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchInquiries();
        setIsDeleteModalOpen(false);
        setDeletingInquiry(null);
      }
    } catch (err) {
      console.error('Failed to delete inquiry:', err);
    }
  };

  // Hold Inquiry Handler (R2)
  const handleHoldInquiry = async (inquiryId: string) => {
    const reason = prompt('Enter reason for placing this project on hold:') || 'Project placed on hold by manager';
    try {
      const res = await fetch(`${API_BASE_URL}/api/inquiries/${inquiryId}/hold`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (res.ok) fetchInquiries();
    } catch (err) {
      console.error('Failed to hold inquiry:', err);
    }
  };

  // Resume Inquiry Handler (R2)
  const handleResumeInquiry = async (inquiryId: string) => {
    // Optimistic UI update immediately
    setInquiries(prev => prev.map(inq =>
      (inq.id === inquiryId || (inq.inquiryCode && inq.inquiryCode === inquiryId))
        ? { ...inq, holdStatus: false, holdReason: undefined }
        : inq
    ));

    try {
      const res = await fetch(`${API_BASE_URL}/api/inquiries/${inquiryId}/resume`, {
        method: 'PUT'
      });
      if (res.ok) fetchInquiries();
    } catch (err) {
      console.error('Failed to resume inquiry on server:', err);
    }
  };

  // Export Inquiries to Excel (.xlsx) file handler
  const handleExportInquiriesExcel = () => {
    if (inquiries.length === 0) {
      alert('No inquiries available to export.');
      return;
    }

    const exportRows = filteredInquiries.map((inq) => ({
      'Inquiry ID': inq.inquiryCode || inq.id,
      'Client Name': inq.client,
      'Project Name': inq.project,
      'Quoted Amount (₹)': Number(inq.amount),
      'Contact Person': inq.contactPerson,
      'Email': inq.email,
      'Phone': inq.phone,
      'Inquiry Date': inq.date,
      'Status': inq.holdStatus ? 'On Hold' : inq.status,
      'Hold Reason': inq.holdReason || '',
      'Remarks': inq.remarks
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    worksheet['!cols'] = [
      { wch: 14 },
      { wch: 28 },
      { wch: 32 },
      { wch: 20 },
      { wch: 22 },
      { wch: 28 },
      { wch: 18 },
      { wch: 15 },
      { wch: 18 },
      { wch: 25 },
      { wch: 40 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Client Inquiries');

    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `SkyTech_Inquiries_Database_${dateStr}.xlsx`);
  };

  // Dynamic Statistics Calculations
  const totalCount = inquiries.length;
  const offersSentCount = inquiries.filter(i => (i.status === 'Offer Sent' || i.status === 'Confirmed') && !i.holdStatus).length;
  const confirmedCount = inquiries.filter(i => i.status === 'Confirmed' && !i.holdStatus).length;
  const onHoldCount = inquiries.filter(i => i.holdStatus).length;
  const unconfirmedCount = inquiries.filter(i => (i.status === 'Unconfirmed' || i.status === 'Inquiry Received') && !i.holdStatus).length;
  const winRatePercentage = offersSentCount > 0 ? Math.round((confirmedCount / offersSentCount) * 100) : 0;

  // Filtered List (Sorted Ascending by Inquiry Code)
  const filteredInquiries = inquiries
    .filter(i => {
      const matchesSearch = i.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            i.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            i.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (i.inquiryCode && i.inquiryCode.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // On Hold Tab: ONLY show on-hold projects
      if (statusFilter === 'ON_HOLD') {
        return Boolean(i.holdStatus);
      }

      // Active Tabs (ALL, Confirmed, Offer Sent, Unconfirmed, Inquiry Received): EXCLUDE on-hold projects
      if (i.holdStatus) {
        return false;
      }

      return statusFilter === 'ALL' || i.status === statusFilter;
    })
    .sort((a, b) => (a.inquiryCode || a.id).localeCompare(b.inquiryCode || b.id, undefined, { numeric: true }));

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Header & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
            <Send size={16} />
            <span>Commercial Operations</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Inquiry & Quotation Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track client leads, manage quotation offers, and process confirmed order pipeline
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setFormInquiry({
                client: '',
                project: '',
                amount: '',
                contactPerson: '',
                email: '',
                phone: '',
                date: new Date().toISOString().split('T')[0],
                status: 'Inquiry Received',
                remarks: ''
              });
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Plus size={16} />
            <span>+ Add Inquiry</span>
          </button>

          <button
            type="button"
            onClick={handleExportInquiriesExcel}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            <FileSpreadsheet size={15} className="text-slate-500" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards (Connected to Backend API) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1 */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">INQUIRIES RECEIVED</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-slate-900">{totalCount}</span>
              <span className="text-xs font-semibold text-blue-600 flex items-center gap-0.5">
                <TrendingUp size={12} /> Live Count
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Total client lead requests</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Layers size={20} />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">OFFERS SENT</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-slate-900">{offersSentCount}</span>
              <span className="text-xs font-semibold text-indigo-600">Quotations Out</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Delivered proposals</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Send size={20} />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">ORDERS CONFIRMED</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-emerald-950">{confirmedCount}</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                {winRatePercentage}% Win Rate
              </span>
            </div>
            <span className="text-[11px] text-emerald-600 font-medium mt-1 block">Pushed into manufacturing</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <CheckCircle size={20} />
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">UNCONFIRMED / PENDING</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-amber-950">{unconfirmedCount}</span>
              <span className="text-xs font-semibold text-amber-700">Awaiting PO</span>
            </div>
            <span className="text-[11px] text-amber-700 font-medium mt-1 block">Pending client decision</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <Clock size={20} />
          </div>
        </div>

      </div>

      {/* Conversion Funnel Analytics Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Inquiry Conversion Funnel Analysis</h2>
            <p className="text-xs text-slate-500">Stage-by-stage drop-off from Inquiry → Offer → Confirmed Order</p>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-xl border border-blue-100">
            Real-Time Conversion Stats
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
          {/* Step 1 */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">1. INQUIRIES RECEIVED</span>
            <span className="text-xl font-extrabold text-slate-900 block mt-1">{totalCount} Inquiries</span>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-3 overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full w-full" />
            </div>
            <span className="text-[10px] text-slate-500 font-semibold mt-1 block">100% Total Leads</span>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">2. OFFERS SENT</span>
            <span className="text-xl font-extrabold text-slate-900 block mt-1">{offersSentCount} Offers</span>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-3 overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${totalCount > 0 ? (offersSentCount / totalCount) * 100 : 0}%` }} />
            </div>
            <span className="text-[10px] text-indigo-600 font-semibold mt-1 block">
              {totalCount > 0 ? Math.round((offersSentCount / totalCount) * 100) : 0}% Costed & Sent
            </span>
          </div>

          {/* Step 3 */}
          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200/80">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">3. CONFIRMED ORDERS</span>
            <span className="text-xl font-extrabold text-emerald-950 block mt-1">{confirmedCount} Confirmed</span>
            <div className="w-full bg-emerald-200/80 rounded-full h-2 mt-3 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${totalCount > 0 ? (confirmedCount / totalCount) * 100 : 0}%` }} />
            </div>
            <span className="text-[10px] text-emerald-700 font-extrabold mt-1 block">
              {totalCount > 0 ? Math.round((confirmedCount / totalCount) * 100) : 0}% Conversion Rate
            </span>
          </div>

          {/* Step 4 */}
          <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">4. UNCONFIRMED / PENDING</span>
            <span className="text-xl font-extrabold text-amber-950 block mt-1">{unconfirmedCount} Pending</span>
            <div className="w-full bg-amber-200/80 rounded-full h-2 mt-3 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: `${totalCount > 0 ? (unconfirmedCount / totalCount) * 100 : 0}%` }} />
            </div>
            <span className="text-[10px] text-amber-700 font-semibold mt-1 block">
              {totalCount > 0 ? Math.round((unconfirmedCount / totalCount) * 100) : 0}% Awaiting Confirmation
            </span>
          </div>
        </div>
      </div>

      {/* Main Inquiries Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        
        {/* Controls Bar: Search & Status Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by client, project, inquiry ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 font-medium"
            />
          </div>

          {/* Status Filter Buttons */}
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
              onClick={() => setStatusFilter('Inquiry Received')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${statusFilter === 'Inquiry Received' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'hover:text-slate-900'}`}
            >
              Inquiry
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Offer Sent')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${statusFilter === 'Offer Sent' ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'hover:text-slate-900'}`}
            >
              Offer Sent
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Confirmed')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${statusFilter === 'Confirmed' ? 'bg-white text-emerald-600 shadow-xs font-bold' : 'hover:text-slate-900'}`}
            >
              Confirmed
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Unconfirmed')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${statusFilter === 'Unconfirmed' ? 'bg-white text-amber-600 shadow-xs font-bold' : 'hover:text-slate-900'}`}
            >
              Unconfirmed
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ON_HOLD')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${statusFilter === 'ON_HOLD' ? 'bg-amber-500 text-white shadow-xs font-bold' : 'hover:text-slate-900 text-amber-700'}`}
            >
              On Hold ({onHoldCount})
            </button>
          </div>

        </div>

        {/* Table View */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0B1728] text-slate-300 text-[11px] font-bold uppercase tracking-wider border-b border-slate-800">
                <th className="py-3 px-4 w-24">INQ ID</th>
                <th className="py-3 px-4">CLIENT & PROJECT NAME</th>
                <th className="py-3 px-4 w-36 text-right">QUOTED AMOUNT</th>
                <th className="py-3 px-4 w-48">CONTACT DETAILS</th>
                <th className="py-3 px-4 w-28 text-center">DATE</th>
                <th className="py-3 px-4 w-36 text-center">STATUS</th>
                <th className="py-3 px-4 w-28 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {filteredInquiries.length > 0 ? (
                filteredInquiries.map((inq) => (
                  <tr key={inq.id} className={`transition-colors text-slate-800 ${inq.holdStatus ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'bg-white hover:bg-slate-50/80'}`}>
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{inq.inquiryCode || inq.id}</td>
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">{inq.client}</span>
                        <span className="text-[11px] text-slate-500 font-medium block">{inq.project}</span>
                        {inq.holdStatus && inq.holdReason && (
                          <span className="text-[10px] text-amber-700 italic block mt-0.5">
                            Hold Reason: {inq.holdReason}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900 font-mono text-xs">
                      ₹ {Number(inq.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>
                        <span className="font-semibold text-slate-800 block text-xs">{inq.contactPerson}</span>
                        <span className="text-[10px] text-slate-400 block">{inq.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500 font-medium">{inq.date}</td>
                    <td className="py-3 px-4 text-center">
                      {inq.holdStatus ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg border inline-flex items-center gap-1 bg-amber-100 text-amber-900 border-amber-300">
                          <PauseCircle size={12} className="text-amber-700" />
                          <span>On Hold</span>
                        </span>
                      ) : (
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border inline-flex items-center gap-1 ${
                          inq.status === 'Confirmed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : inq.status === 'Offer Sent'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : inq.status === 'Inquiry Received'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {inq.status === 'Confirmed' && <CheckCircle size={12} className="text-emerald-600" />}
                          {inq.status === 'Offer Sent' && <Send size={12} className="text-indigo-600" />}
                          {inq.status === 'Inquiry Received' && <Layers size={12} className="text-blue-600" />}
                          {inq.status === 'Unconfirmed' && <Clock size={12} className="text-amber-600" />}
                          <span>{inq.status}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {inq.holdStatus ? (
                          <button
                            type="button"
                            onClick={() => handleResumeInquiry(inq.id)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Resume Project"
                          >
                            <PlayCircle size={14} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openHoldModal(inq)}
                            className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Place Project on Hold"
                          >
                            <PauseCircle size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setFormInquiry({ ...inq });
                            setIsEditModalOpen(true);
                          }}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Inquiry Details"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeletingInquiry(inq);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Inquiry"
                        >
                          <Trash2 size={14} />
                        </button>
                        {(isAdmin || isManager) && (
                          <button
                            type="button"
                            onClick={() => setAssignTeamInquiryId(inq.id)}
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Assign Project Team"
                          >
                            <Users size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs font-medium">
                    No client inquiries found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* 1. ADD INQUIRY MODAL DIALOG */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <Plus size={18} className="text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Add New Client Inquiry</h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddInquiry} className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Client / Company Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tata Power Solar Pvt Ltd"
                  value={formInquiry.client}
                  onChange={(e) => setFormInquiry({ ...formInquiry, client: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Project Description / Panel Type
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 33kV Outdoor Switchgear Panel"
                  value={formInquiry.project}
                  onChange={(e) => setFormInquiry({ ...formInquiry, project: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Quoted Amount (₹)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1650000"
                    value={formInquiry.amount}
                    onChange={(e) => setFormInquiry({ ...formInquiry, amount: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Inquiry Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formInquiry.date}
                    onChange={(e) => setFormInquiry({ ...formInquiry, date: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Kumar"
                    value={formInquiry.contactPerson}
                    onChange={(e) => setFormInquiry({ ...formInquiry, contactPerson: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Status Stage
                  </label>
                  <select
                    value={formInquiry.status}
                    onChange={(e) => setFormInquiry({ ...formInquiry, status: e.target.value as any })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="Inquiry Received">Inquiry Received</option>
                    <option value="Offer Sent">Offer Sent</option>
                    <option value="Confirmed">Confirmed (Order Won)</option>
                    <option value="Unconfirmed">Unconfirmed / Pending</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Contact Email & Phone
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="email"
                    placeholder="client@company.com"
                    value={formInquiry.email}
                    onChange={(e) => setFormInquiry({ ...formInquiry, email: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="+91 98000 00000"
                    value={formInquiry.phone}
                    onChange={(e) => setFormInquiry({ ...formInquiry, phone: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Remarks / Specifications
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Single line diagram submitted. Advance expected."
                  value={formInquiry.remarks}
                  onChange={(e) => setFormInquiry({ ...formInquiry, remarks: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                />
              </div>

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
                  Save & Add Inquiry
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 2. EDIT INQUIRY MODAL DIALOG */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <Edit3 size={18} className="text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Edit Inquiry ({formInquiry.id})</h3>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditInquiry} className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Client / Company Name
                </label>
                <input
                  type="text"
                  required
                  value={formInquiry.client}
                  onChange={(e) => setFormInquiry({ ...formInquiry, client: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Project Description / Panel Type
                </label>
                <input
                  type="text"
                  required
                  value={formInquiry.project}
                  onChange={(e) => setFormInquiry({ ...formInquiry, project: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Quoted Amount (₹)
                  </label>
                  <input
                    type="text"
                    required
                    value={formInquiry.amount}
                    onChange={(e) => setFormInquiry({ ...formInquiry, amount: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Status Stage
                  </label>
                  <select
                    value={formInquiry.status}
                    onChange={(e) => setFormInquiry({ ...formInquiry, status: e.target.value as any })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="Inquiry Received">Inquiry Received</option>
                    <option value="Offer Sent">Offer Sent</option>
                    <option value="Confirmed">Confirmed (Order Won)</option>
                    <option value="Unconfirmed">Unconfirmed / Pending</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  value={formInquiry.remarks}
                  onChange={(e) => setFormInquiry({ ...formInquiry, remarks: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
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

      {/* 3. CONFIRM DELETE MODAL DIALOG */}
      {isDeleteModalOpen && deletingInquiry && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            
            <div className="px-6 py-4 border-b border-rose-100 flex items-center justify-between bg-rose-50/60">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertTriangle size={20} className="text-rose-600" />
                <h3 className="text-base font-bold text-slate-900">Delete Client Inquiry</h3>
              </div>
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-xs font-medium text-slate-700 leading-relaxed">
                Are you sure you want to delete inquiry <strong className="text-slate-900 font-extrabold">"{deletingInquiry.client}"</strong> (<span className="font-mono text-blue-600">{deletingInquiry.id}</span>)?
              </p>
              
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span className="font-semibold">Project:</span>
                  <span className="font-medium text-slate-800">{deletingInquiry.project}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="font-semibold">Quoted Amount:</span>
                  <span className="font-bold text-slate-900">₹ {Number(deletingInquiry.amount).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 pt-1">
                <span>⚠️ Note: This will permanently remove the inquiry from live system records.</span>
              </p>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteInquiry}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-500/20 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>Delete Inquiry</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 4. THEMED HOLD PROJECT MODAL DIALOG (R2) */}
      {isHoldModalOpen && holdingInquiry && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/80">
              <div className="flex items-center gap-2">
                <PauseCircle size={20} className="text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">Place Project on Hold</h3>
              </div>
              <button 
                onClick={() => setIsHoldModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmHoldInquiry} className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-900 font-medium">
                Placing <strong>[{holdingInquiry.inquiryCode || holdingInquiry.id}] {holdingInquiry.project}</strong> on hold will pause execution and move it into the <strong>On Hold</strong> list.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Reason for Hold
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Client requested temporary hold on design approvals..."
                  value={holdReasonInput}
                  onChange={(e) => setHoldReasonInput(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsHoldModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <PauseCircle size={14} />
                  <span>Confirm Hold</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. ASSIGN TEAM MODAL */}
      {assignTeamInquiryId && (
        <AssignTeamModal 
          inquiryId={assignTeamInquiryId} 
          onClose={() => setAssignTeamInquiryId(null)} 
        />
      )}

    </div>
  );
}
