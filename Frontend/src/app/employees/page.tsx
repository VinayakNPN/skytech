'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Mail, 
  Tag, 
  UserCheck, 
  UserX, 
  UserMinus,
  Briefcase,
  Layers,
  Activity,
  Plus,
  X,
  UserPlus,
  Sparkles
} from 'lucide-react';
import { API_BASE_URL } from '@/config/api';

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  role: string;
  status: 'Active' | 'On Leave' | 'Suspended';
}

const PREDEFINED_DEPARTMENTS = [
  'Design & Costing',
  'Mechanical Dept.',
  'Assembly & Busbar Dept.',
  'Electrical Dept.',
  'Testing Dept.',
  'Store Dept.',
  'Support & Service Dept.',
  'Management'
];

export default function EmployeeDirectory() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  // Add Employee Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpDept, setNewEmpDept] = useState('Mechanical Dept.');
  const [newEmpDesignation, setNewEmpDesignation] = useState('Production Engineer');
  const [newEmpRole, setNewEmpRole] = useState('Engineer');
  const [newEmpStatus, setNewEmpStatus] = useState<'Active' | 'On Leave' | 'Suspended'>('Active');

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/employees`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Update employee status
  const handleStatusChange = async (empId: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/employees/${empId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchEmployees();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Add New Employee Handler
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim() || !newEmpEmail.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newEmpName,
          email: newEmpEmail,
          department: newEmpDept,
          designation: newEmpDesignation,
          role: newEmpRole,
          status: newEmpStatus
        })
      });

      if (res.ok) {
        await fetchEmployees();
        setIsAddModalOpen(false);
        // Reset Form
        setNewEmpName('');
        setNewEmpEmail('');
        setNewEmpDept('Mechanical Dept.');
        setNewEmpDesignation('Production Engineer');
        setNewEmpRole('Engineer');
        setNewEmpStatus('Active');
      }
    } catch (err) {
      console.error('Error adding employee:', err);
    }
  };

  const getStatusBadge = (status: 'Active' | 'On Leave' | 'Suspended') => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'On Leave':
        return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'Suspended':
        return 'bg-rose-100 text-rose-700 border border-rose-200';
    }
  };

  // Unique departments for filtering
  const departments = ['All', ...Array.from(new Set(employees.map(e => e.department)))];

  // Filter employees list
  const filteredEmployees = employees.filter(e => {
    const matchesSearch = 
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.designation.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === 'All' || e.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Loading employee directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Page Heading & Add Employee Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
            <Users size={16} />
            <span>Human Resources & Workforce</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Staff & Employee Directory
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage employee accounts, assign department roles, configure role-based access control permissions
          </p>
        </div>

        {/* Primary Action Button (+ Add New Employee) */}
        <div>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
          >
            <UserPlus size={16} />
            <span>+ Add New Employee</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search employees by name, email, or designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 bg-slate-50/50 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 border border-slate-200 px-3.5 py-2 rounded-xl bg-slate-50/50 text-slate-600 text-xs">
          <Layers size={14} className="text-slate-400" />
          <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-400">Department:</span>
          <select 
            value={deptFilter} 
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-transparent focus:outline-none font-bold text-slate-800 cursor-pointer"
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map(emp => (
          <div key={emp.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4">
            
            {/* Top row: Initials & Base info */}
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-extrabold flex items-center justify-center border border-blue-100 shadow-xs">
                    {emp.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 leading-tight">{emp.name}</h3>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{emp.id}</span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${getStatusBadge(emp.status)}`}>
                  {emp.status}
                </span>
              </div>

              {/* Attributes */}
              <div className="space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-2">
                  <Mail size={13} className="text-slate-400" />
                  <span className="truncate">{emp.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase size={13} className="text-slate-400" />
                  <span>{emp.designation}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Layers size={13} className="text-slate-400" />
                  <span>Dept: <span className="font-bold text-slate-800">{emp.department}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag size={13} className="text-slate-400" />
                  <span>RBAC Role: <span className="text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded uppercase tracking-wider">{emp.role}</span></span>
                </div>
              </div>
            </div>

            {/* Bottom Row Actions */}
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              {emp.status === 'Active' ? (
                <button
                  type="button"
                  onClick={() => handleStatusChange(emp.id, 'On Leave')}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-100 text-amber-700 font-bold text-xs py-2 rounded-xl transition-all duration-200 cursor-pointer"
                >
                  <UserMinus size={13} />
                  Mark On Leave
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleStatusChange(emp.id, 'Active')}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 font-bold text-xs py-2 rounded-xl transition-all duration-200 cursor-pointer"
                >
                  <UserCheck size={13} />
                  Mark Active
                </button>
              )}
            </div>

          </div>
        ))}
      </div>

      {/* ADD NEW EMPLOYEE MODAL DIALOG */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <UserPlus size={18} className="text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Register New Employee Account</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddEmployee} className="p-6 space-y-4">
              
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Kumar"
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rajesh@skytech.com"
                  value={newEmpEmail}
                  onChange={(e) => setNewEmpEmail(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Department & Designation */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <select
                    value={newEmpDept}
                    onChange={(e) => setNewEmpDept(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    {PREDEFINED_DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Designation / Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior QC Inspector"
                    value={newEmpDesignation}
                    onChange={(e) => setNewEmpDesignation(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* RBAC Role & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    System RBAC Role
                  </label>
                  <select
                    value={newEmpRole}
                    onChange={(e) => setNewEmpRole(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Engineer">Engineer</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Operator">Operator</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Initial Account Status
                  </label>
                  <select
                    value={newEmpStatus}
                    onChange={(e) => setNewEmpStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
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
                  Register Employee
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
