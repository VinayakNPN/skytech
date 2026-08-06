'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Mail, Tag, UserCheck, UserX, UserMinus,
  Briefcase, Layers, Activity, Plus, X, UserPlus, Sparkles, Pencil
} from 'lucide-react';
import { API_BASE_URL } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';

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

const DEFAULT_PERMISSIONS = {
  dashboard: { read: false, write: false, delete: false },
  inquiries: { read: false, write: false, delete: false },
  wbs: { read: false, write: false, delete: false },
  inventory: { read: false, write: false, delete: false },
  employees: { read: false, write: false, delete: false },
  employeeHub: { read: true, write: false, delete: false },
  reports: { read: false, write: false, delete: false },
  leaveApproval: { canApprove: false }
};

export default function EmployeeDirectory() {
  const { user } = useAuth();
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
  
  // Auth & Permissions State
  const [newEmpPassword, setNewEmpPassword] = useState('password123'); // Default generated password
  const [newEmpIsAdmin, setNewEmpIsAdmin] = useState(false);
  const [newEmpPermissions, setNewEmpPermissions] = useState(DEFAULT_PERMISSIONS);

  // Edit Employee Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editError, setEditError] = useState('');

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/employees`, {
        headers: {
          'Authorization': `Bearer ${getCookie('token')}`
        }
      });
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

  const handleStatusChange = async (empId: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/employees/${empId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getCookie('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchEmployees();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim() || !newEmpEmail.trim() || !newEmpPassword.trim()) return;

    try {
      // Generate a temporary EmpCode for the form submission
      // In production, the backend might handle generating this, but since we require it in the backend auth route:
      const lastEmp = employees.length > 0 ? employees[employees.length - 1] : null;
      let nextNum = 1; // Assuming manual generation since we replaced the POST /api/employees logic
      // Simplistic ID generation:
      const empCode = `EMP-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`;

      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getCookie('token')}`
        },
        body: JSON.stringify({
          empCode,
          name: newEmpName,
          email: newEmpEmail,
          password: newEmpPassword,
          department: newEmpDept,
          designation: newEmpDesignation,
          role: newEmpRole,
          status: newEmpStatus,
          isAdmin: newEmpIsAdmin,
          permissions: newEmpPermissions
        })
      });

      if (res.ok) {
        await fetchEmployees();
        setIsAddModalOpen(false);
        // Reset Form
        setNewEmpName('');
        setNewEmpEmail('');
        setNewEmpPassword('password123');
        setNewEmpIsAdmin(false);
        setNewEmpPermissions(DEFAULT_PERMISSIONS);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to register");
      }
    } catch (err) {
      console.error('Error adding employee:', err);
    }
  };

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    setEditError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/employees/${editingEmployee.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getCookie('token')}`
        },
        body: JSON.stringify({
          name: editingEmployee.name,
          email: editingEmployee.email,
          designation: editingEmployee.designation,
          department: editingEmployee.department,
          role: editingEmployee.role,
          status: editingEmployee.status
        })
      });
      if (res.ok) {
        await fetchEmployees();
        setIsEditModalOpen(false);
        setEditingEmployee(null);
      } else {
        const err = await res.json();
        setEditError(err.error || 'Failed to update employee');
      }
    } catch (err) {
      setEditError('Network error. Please try again.');
    }
  };

  const handlePermChange = (module: string, action: string, checked: boolean) => {
    setNewEmpPermissions(prev => ({
      ...prev,
      [module]: {
        ...(prev as any)[module],
        [action]: checked
      }
    }));
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

  const departments = ['All', ...Array.from(new Set(employees.map(e => e.department)))];

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

        <div>
          {user?.isAdmin && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
            >
              <UserPlus size={16} />
              <span>+ Add New Employee</span>
            </button>
          )}
        </div>
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map(emp => (
          <div key={emp.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4">
            
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
              {user?.isAdmin && (
                <button
                  type="button"
                  onClick={() => { setEditingEmployee({ ...emp }); setEditError(''); setIsEditModalOpen(true); }}
                  className="flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer"
                  title="Edit Employee"
                >
                  <Pencil size={13} />
                </button>
              )}
            </div>

          </div>
        ))}
      </div>

      {/* EDIT EMPLOYEE MODAL */}
      {isEditModalOpen && editingEmployee && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">

            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <Pencil size={18} className="text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Edit Employee — {editingEmployee.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => { setIsEditModalOpen(false); setEditingEmployee(null); }}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditEmployee} className="p-6 space-y-4">

              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
                  {editError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editingEmployee.name}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={editingEmployee.email}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Designation</label>
                <input
                  type="text"
                  required
                  value={editingEmployee.designation}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, designation: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Department</label>
                  <select
                    value={editingEmployee.department}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    {PREDEFINED_DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">RBAC Role</label>
                  <select
                    value={editingEmployee.role}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    {['Admin', 'Manager', 'HR', 'Engineer', 'Supervisor', 'Operator'].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                <select
                  value={editingEmployee.status}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setEditingEmployee(null); }}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 sticky top-0 z-10">
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

            <form onSubmit={handleAddEmployee} className="p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Initial Password
                  </label>
                  <input
                    type="text"
                    required
                    value={newEmpPassword}
                    onChange={(e) => setNewEmpPassword(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center mt-6 gap-2">
                  <input
                    type="checkbox"
                    id="isAdmin"
                    checked={newEmpIsAdmin}
                    onChange={(e) => setNewEmpIsAdmin(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isAdmin" className="text-sm font-bold text-slate-800 cursor-pointer">
                    System Administrator (Bypasses all permission checks)
                  </label>
                </div>
              </div>

              {/* Permissions Matrix */}
              {!newEmpIsAdmin && (
                <div className="border border-slate-200 rounded-xl overflow-hidden mt-6">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                    <h4 className="text-sm font-bold text-slate-800">Module Permissions</h4>
                    <p className="text-xs text-slate-500">Configure what this user can view and edit</p>
                  </div>
                  <div className="p-4 bg-white">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs uppercase tracking-wider">
                          <th className="pb-2">Module</th>
                          <th className="pb-2 text-center">Read</th>
                          <th className="pb-2 text-center">Write</th>
                          <th className="pb-2 text-center">Delete</th>
                        </tr>
                      </thead>
                      <tbody>
                        {['dashboard', 'inquiries', 'wbs', 'inventory', 'employees', 'employeeHub', 'reports'].map((module) => (
                          <tr key={module} className="border-b border-slate-50 last:border-0">
                            <td className="py-2 font-medium text-slate-800 capitalize">{module}</td>
                            <td className="py-2 text-center">
                              <input 
                                type="checkbox" 
                                checked={(newEmpPermissions as any)[module].read}
                                onChange={(e) => handlePermChange(module, 'read', e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded" 
                              />
                            </td>
                            <td className="py-2 text-center">
                              <input 
                                type="checkbox" 
                                checked={(newEmpPermissions as any)[module].write}
                                onChange={(e) => handlePermChange(module, 'write', e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded" 
                              />
                            </td>
                            <td className="py-2 text-center">
                              <input 
                                type="checkbox" 
                                checked={(newEmpPermissions as any)[module].delete}
                                onChange={(e) => handlePermChange(module, 'delete', e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded" 
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
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

// Helper for client-side cookies
function getCookie(name: string) {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}
