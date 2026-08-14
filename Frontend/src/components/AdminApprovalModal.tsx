'use client';

import React, { useState } from 'react';
import { X, Shield, Check, UserPlus } from 'lucide-react';
import { API_BASE_URL, getAuthHeaders } from '@/config/api';

interface ApprovalRequest {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  status: string;
}

interface AdminApprovalModalProps {
  request: ApprovalRequest;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminApprovalModal({ request, onClose, onSuccess }: AdminApprovalModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Default permissions
  const [permissions, setPermissions] = useState({
    dashboard: { read: true, write: false, delete: false },
    inquiries: { read: true, write: false, delete: false },
    wbs: { read: true, write: false, delete: false },
    inventory: { read: true, write: false, delete: false },
    employees: { read: true, write: false, delete: false },
    employeeHub: { read: true, write: true, delete: false },
    reports: { read: false, write: false, delete: false },
    leaveApproval: { canApprove: false }
  });
  
  const [role, setRole] = useState('Employee');
  const [department, setDepartment] = useState('Unassigned');
  const [designation, setDesignation] = useState('Staff');
  const [isAdmin, setIsAdmin] = useState(false);

  const handlePermChange = (module: string, action: string, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [module]: {
        ...(prev as any)[module],
        [action]: checked
      }
    }));
  };

  const handleApprove = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/approval-requests/${request.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          permissions,
          role,
          department,
          designation,
          isAdmin
        })
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to approve request');
      }
    } catch (err: any) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/approval-requests/${request.id}/reject`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders()
        }
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to reject request');
      }
    } catch (err: any) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const modules = ['dashboard', 'inquiries', 'wbs', 'inventory', 'employees', 'employeeHub', 'reports'];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden relative flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50 rounded-t-xl sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserPlus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">New User Approval</h2>
              <p className="text-sm text-slate-500">Review and assign permissions</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* User Info */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
            {request.avatarUrl ? (
              <img src={request.avatarUrl} alt="Avatar" className="w-12 h-12 rounded-full border border-slate-200" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-lg">
                {request.name?.charAt(0) || '?'}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-slate-800 text-base">{request.name}</h3>
              <p className="text-slate-500 text-sm">{request.email}</p>
            </div>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Role & Dept */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Role</label>
              <select 
                value={role} onChange={(e) => setRole(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="Employee">Employee</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Engineer">Engineer</option>
                <option value="Program Manager">Program Manager</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
              <select 
                value={department} onChange={(e) => setDepartment(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="Unassigned">Unassigned</option>
                <option value="Management">Management</option>
                <option value="Design & Costing">Design & Costing</option>
                <option value="Store Dept.">Store Dept.</option>
                <option value="Mechanical Dept.">Mechanical Dept.</option>
                <option value="Assembly & Busbar Dept.">Assembly & Busbar Dept.</option>
                <option value="Electrical Dept.">Electrical Dept.</option>
                <option value="Testing Dept.">Testing Dept.</option>
                <option value="Support & Service Dept.">Support & Service Dept.</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Designation</label>
              <input 
                type="text" value={designation} onChange={(e) => setDesignation(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
             <input type="checkbox" id="isAdminCheck" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} className="rounded text-blue-600 w-4 h-4"/>
             <label htmlFor="isAdminCheck" className="text-sm font-semibold text-amber-800 cursor-pointer">
               Grant Full System Admin Privileges
             </label>
          </div>

          {/* Permissions Matrix */}
          {!isAdmin && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-700">Module Permissions</h3>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold border-b border-slate-200">Module</th>
                      <th className="px-4 py-3 font-semibold border-b border-slate-200 text-center">Read</th>
                      <th className="px-4 py-3 font-semibold border-b border-slate-200 text-center">Write</th>
                      <th className="px-4 py-3 font-semibold border-b border-slate-200 text-center">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {modules.map(mod => (
                      <tr key={mod} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2 capitalize font-medium text-slate-700">{mod.replace(/([A-Z])/g, ' $1').trim()}</td>
                        <td className="px-4 py-2 text-center">
                          <input type="checkbox" checked={(permissions as any)[mod].read} onChange={(e) => handlePermChange(mod, 'read', e.target.checked)} className="rounded text-blue-600 border-slate-300 w-4 h-4" />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <input type="checkbox" checked={(permissions as any)[mod].write} onChange={(e) => handlePermChange(mod, 'write', e.target.checked)} className="rounded text-blue-600 border-slate-300 w-4 h-4" />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <input type="checkbox" checked={(permissions as any)[mod].delete} onChange={(e) => handlePermChange(mod, 'delete', e.target.checked)} className="rounded text-blue-600 border-slate-300 w-4 h-4" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="leaveApprove" 
                  checked={permissions.leaveApproval.canApprove} 
                  onChange={(e) => setPermissions(p => ({ ...p, leaveApproval: { canApprove: e.target.checked }}))}
                  className="rounded text-blue-600 border-slate-300 w-4 h-4"
                />
                <label htmlFor="leaveApprove" className="text-sm font-medium text-slate-700">Can Approve Leaves (HR/Manager)</label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end gap-3 sticky bottom-0">
          <button 
            type="button"
            onClick={handleReject} 
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 focus:ring-4 focus:ring-red-100 transition-colors disabled:opacity-50"
          >
            Reject Access
          </button>
          <button 
            type="button"
            onClick={handleApprove}
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <span className="animate-pulse">Processing...</span> : <><Check className="w-4 h-4" /> Approve User</>}
          </button>
        </div>
      </div>
    </div>
  );
}
