'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { API_BASE_URL, getAuthHeaders } from '@/config/api';
import { AssignTeamModal } from '@/components/AssignTeamModal';
import { useAuth } from '@/contexts/AuthContext';

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

const DEFAULT_INQUIRIES: Inquiry[] = [];

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const { user } = useAuth();
  const isAdmin = user?.isAdmin || user?.role === 'Admin';
  const isManager = user?.role === 'Manager';

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

  const [formError, setFormError] = useState<string>('');

  const [highlightedInquiryId, setHighlightedInquiryId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // Offer details gated modal state
  const [isOfferDetailsModalOpen, setIsOfferDetailsModalOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{ inquiry: Inquiry; newStatus: string; isNew?: boolean } | null>(null);
  const [offerDetails, setOfferDetails] = useState({ sentBy: '', refNo: '' });
  const [offerDetailsError, setOfferDetailsError] = useState('');
  const [editingInquiryOriginalStatus, setEditingInquiryOriginalStatus] = useState<string>('');

  // Fetch inquiries from backend API
  const fetchInquiries = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/inquiries`, {
        headers: getAuthHeaders()
      });
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

  // Highlight an inquiry row for 3 seconds then clear
  const highlightInquiry = (id: string) => {
    setHighlightedInquiryId(id);
    setStatusFilter('ALL');
    setTimeout(() => {
      listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    setTimeout(() => setHighlightedInquiryId(null), 3000);
  };

  // Intercept status changes — gate Offer Sent with quotation details
  const handleStatusChangeAttempt = (inquiry: Inquiry, newStatus: string) => {
    if (inquiry.status === 'Inquiry Received' && newStatus === 'Offer Sent') {
      setPendingStatusChange({ inquiry, newStatus });
      setOfferDetails({ sentBy: '', refNo: '' });
      setOfferDetailsError('');
      setIsOfferDetailsModalOpen(true);
      return; // Don't change yet
    }
    // All other changes — apply directly in the edit form
    setFormInquiry({ ...formInquiry, status: newStatus as any });
  };

  const handleConfirmOfferDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerDetails.sentBy.trim()) {
      setOfferDetailsError('Please enter the name of person who sent the quotation.');
      return;
    }
    if (!offerDetails.refNo.trim()) {
      setOfferDetailsError('Please enter a quotation reference number.');
      return;
    }
    if (!pendingStatusChange) return;

    // Build new remarks string prefixed with offer details
    const remarkPrefix = `[Offer Sent] By: ${offerDetails.sentBy}, Ref: ${offerDetails.refNo}`;
    const updatedRemarks = remarkPrefix + (pendingStatusChange.inquiry.remarks ? ' | ' + pendingStatusChange.inquiry.remarks : '');

    try {
      if (pendingStatusChange.isNew) {
        // Creating a new inquiry directly with Offer Sent status
        const res = await fetch(`${API_BASE_URL}/api/inquiries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            ...pendingStatusChange.inquiry,
            status: 'Offer Sent',
            remarks: updatedRemarks,
            amount: Number(pendingStatusChange.inquiry.amount) || 0
          })
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
      } else {
        // Updating an existing inquiry status to Offer Sent
        const targetId = pendingStatusChange.inquiry.inquiryCode || pendingStatusChange.inquiry.id;
        const res = await fetch(`${API_BASE_URL}/api/inquiries/${targetId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            ...pendingStatusChange.inquiry,
            status: 'Offer Sent',
            remarks: updatedRemarks,
            amount: Number(pendingStatusChange.inquiry.amount) || 0
          })
        });
        if (res.ok) {
          await fetchInquiries();
        }
      }
    } catch (err) {
      console.error('Failed to update/create status:', err);
    }

    setIsOfferDetailsModalOpen(false);
    setPendingStatusChange(null);
    setIsEditModalOpen(false);
  };

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
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
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
    setFormError('');

    const clientVal = (formInquiry.client || '').trim();
    const projectVal = (formInquiry.project || '').trim();
    const personVal = (formInquiry.contactPerson || '').trim();
    const emailVal = (formInquiry.email || '').trim();
    const phoneVal = (formInquiry.phone || '').trim();

    // Client-side validations for mandatory fields
    if (!clientVal) {
      setFormError('Client / Company Name is required.');
      return;
    }
    if (!projectVal) {
      setFormError('Project Description / Panel Type is required.');
      return;
    }
    const numAmount = Number(formInquiry.amount);
    if (!formInquiry.amount || isNaN(numAmount) || numAmount <= 0) {
      setFormError('Quoted Amount (₹) must be a positive number greater than 0.');
      return;
    }
    if (!personVal) {
      setFormError('Contact Person Name is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailVal || !emailRegex.test(emailVal)) {
      setFormError('Contact Email is required and must follow standard format (e.g. client@company.com).');
      return;
    }
    const cleanPhone = phoneVal.replace(/[\s\-\(\)]/g, '');
    const indianPhoneRegex = /^(?:\+91)?([6-9]\d{9})$/;
    if (!phoneVal || !indianPhoneRegex.test(cleanPhone)) {
      setFormError('Contact Phone is required and must be a valid 10-digit Indian mobile number (e.g. 9876543210 or +91 9876543210).');
      return;
    }

    // If user selected Offer Sent status at creation, prompt for quotation details first
    if (formInquiry.status === 'Offer Sent') {
      setPendingStatusChange({
        inquiry: {
          ...formInquiry,
          client: clientVal,
          project: projectVal,
          contactPerson: personVal,
          email: emailVal,
          phone: phoneVal,
          amount: String(numAmount)
        } as Inquiry,
        newStatus: 'Offer Sent',
        isNew: true
      });
      setOfferDetails({ sentBy: '', refNo: '' });
      setOfferDetailsError('');
      setIsOfferDetailsModalOpen(true);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          ...formInquiry,
          amount: numAmount
        })
      });

      if (res.ok) {
        await fetchInquiries();
        setIsAddModalOpen(false);
        setFormError('');
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
      } else {
        const data = await res.json();
        setFormError(data.error || data.details?.[0]?.message || 'Failed to create inquiry on backend.');
      }
    } catch (err) {
      console.error('Failed to add inquiry:', err);
      setFormError('Network error while saving inquiry.');
    }
  };

  // Save Edit Inquiry Handler
  const handleSaveEditInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formInquiry.id) return;
    setFormError('');

    const phoneVal = (formInquiry.phone || '').trim();
    const cleanPhone = phoneVal.replace(/[\s\-\(\)]/g, '');
    const indianPhoneRegex = /^(?:\+91)?([6-9]\d{9})$/;
    if (!phoneVal || !indianPhoneRegex.test(cleanPhone)) {
      setFormError('Contact Phone is required and must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9 (e.g. 9876543210 or +91 9876543210).');
      return;
    }

    try {
      const targetId = formInquiry.id || formInquiry.inquiryCode;
      const res = await fetch(`${API_BASE_URL}/api/inquiries/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          ...formInquiry,
          amount: Number(formInquiry.amount) || 0
        })
      });
      if (res.ok) {
        await fetchInquiries();
        setIsEditModalOpen(false);
        setFormError('');
      } else {
        const data = await res.json();
        setFormError(data.error || 'Failed to update inquiry.');
      }
    } catch (err) {
      console.error('Failed to update inquiry:', err);
      setFormError('Network error while saving inquiry updates.');
    }
  };

  // Delete Inquiry Handler
  const handleConfirmDeleteInquiry = async () => {
    if (!deletingInquiry) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/inquiries/${deletingInquiry.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
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
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
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
        method: 'PUT',
        headers: getAuthHeaders()
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
              setFormError('');
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

      {/* Interactive Summary KPI Cards (Merged Conversion Funnel Stats) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: INQUIRIES RECEIVED */}
        <div 
          onClick={() => {
            const latest = [...inquiries].sort((a, b) =>
              new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
            )[0];
            if (latest) {
              highlightInquiry(latest.id);
            }
          }}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">1. INQUIRIES RECEIVED</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Layers size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-extrabold text-slate-900">{totalCount}</span>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                100% Total Leads
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Total client lead requests received</p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full w-full" />
          </div>
        </div>

        {/* Card 2: OFFERS SENT */}
        <div 
          onClick={() => { setStatusFilter('Offer Sent'); setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100); }}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider">2. OFFERS SENT</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Send size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-extrabold text-slate-900">{offersSentCount}</span>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                {totalCount > 0 ? Math.round((offersSentCount / totalCount) * 100) : 0}% Costed & Sent
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Quotation proposals sent to clients</p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${totalCount > 0 ? (offersSentCount / totalCount) * 100 : 0}%` }} />
          </div>
        </div>

        {/* Card 3: CONFIRMED ORDERS */}
        <div 
          onClick={() => { setStatusFilter('Confirmed'); setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100); }}
          className="bg-emerald-50/40 p-5 rounded-2xl border border-emerald-200/90 shadow-xs flex flex-col justify-between cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">3. CONFIRMED ORDERS</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <CheckCircle size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-extrabold text-emerald-950">{confirmedCount}</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                {winRatePercentage}% Conversion Rate
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">Confirmed orders in manufacturing</p>
          </div>
          <div className="w-full bg-emerald-200/60 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${totalCount > 0 ? (confirmedCount / totalCount) * 100 : 0}%` }} />
          </div>
        </div>

        {/* Card 4: UNCONFIRMED / PENDING */}
        <div 
          onClick={() => { setStatusFilter('Unconfirmed'); setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100); }}
          className="bg-amber-50/40 p-5 rounded-2xl border border-amber-200/90 shadow-xs flex flex-col justify-between cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">4. UNCONFIRMED / PENDING</span>
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Clock size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-extrabold text-amber-950">{unconfirmedCount}</span>
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                {totalCount > 0 ? Math.round((unconfirmedCount / totalCount) * 100) : 0}% Awaiting Confirmation
              </span>
            </div>
            <p className="text-[11px] text-amber-700 font-medium mt-1">Pending client confirmation / PO</p>
          </div>
          <div className="w-full bg-amber-200/60 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${totalCount > 0 ? (unconfirmedCount / totalCount) * 100 : 0}%` }} />
          </div>
        </div>

      </div>

      {/* Main Inquiries Records Table */}
      <div ref={listRef} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        
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
                  <tr key={inq.id} className={`transition-all text-slate-800 ${
                    highlightedInquiryId === inq.id
                      ? 'bg-blue-50 ring-2 ring-inset ring-blue-400'
                      : inq.holdStatus
                      ? 'bg-amber-50/40 hover:bg-amber-50/70'
                      : 'bg-white hover:bg-slate-50/80'
                  }`}>
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
                            setEditingInquiryOriginalStatus(inq.status);
                            setFormError('');
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
              
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Client / Company Name <span className="text-rose-500">*</span>
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
                  Project Description / Panel Type <span className="text-rose-500">*</span>
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
                    Quoted Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    placeholder="e.g. 1650000"
                    value={formInquiry.amount}
                    onChange={(e) => setFormInquiry({ ...formInquiry, amount: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Inquiry Date <span className="text-rose-500">*</span>
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
                    Contact Person Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
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
                    <option value="Inquiry Received">Inquiry Received (Default)</option>
                    <option value="Offer Sent">Offer Sent</option>
                    <option value="Unconfirmed">Unconfirmed / Pending</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Contact Email & Phone <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="email"
                      required
                      placeholder="client@company.com"
                      value={formInquiry.email}
                      onChange={(e) => setFormInquiry({ ...formInquiry, email: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">Must include @ and .com</span>
                  </div>
                  <div>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98000 00000"
                      value={formInquiry.phone}
                      onChange={(e) => setFormInquiry({ ...formInquiry, phone: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">Standard Indian / Int'l code</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Remarks / Specifications
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Single line diagram submitted. Advance expected."
                  value={formInquiry.remarks || ''}
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
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              
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
                    onChange={(e) => handleStatusChangeAttempt(formInquiry as Inquiry, e.target.value)}
                    disabled={editingInquiryOriginalStatus === 'Confirmed'}
                    className={`w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                      editingInquiryOriginalStatus === 'Confirmed' ? 'bg-slate-100 cursor-not-allowed opacity-75' : 'bg-white'
                    }`}
                  >
                    <option value="Inquiry Received">Inquiry Received</option>
                    <option value="Offer Sent">Offer Sent</option>
                    <option value="Confirmed">Confirmed (Order Won)</option>
                    <option value="Unconfirmed">Unconfirmed / Pending</option>
                  </select>
                  {editingInquiryOriginalStatus === 'Confirmed' && (
                    <p className="text-[10px] text-slate-400 font-medium mt-1">Confirmed orders cannot be reverted. Use the On Hold button to pause the project.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  value={formInquiry.remarks || ''}
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
                  value={holdReasonInput || ''}
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

      {/* Offer Details Gated Modal */}
      {isOfferDetailsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <Send size={18} className="text-indigo-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Quotation Details Required</h3>
                  <p className="text-[11px] text-slate-400">Required before changing status to Offer Sent</p>
                </div>
              </div>
              <button
                onClick={() => { setIsOfferDetailsModalOpen(false); setPendingStatusChange(null); }}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleConfirmOfferDetails} className="p-6 space-y-4">
              {offerDetailsError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{offerDetailsError}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Quotation Sent By <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Kumar"
                  value={offerDetails.sentBy}
                  onChange={(e) => setOfferDetails({ ...offerDetails, sentBy: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Quotation Reference No. <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. QTN-2026-001"
                  value={offerDetails.refNo}
                  onChange={(e) => setOfferDetails({ ...offerDetails, refNo: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsOfferDetailsModalOpen(false); setPendingStatusChange(null); }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-500/20 transition-colors cursor-pointer"
                >
                  Confirm & Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
