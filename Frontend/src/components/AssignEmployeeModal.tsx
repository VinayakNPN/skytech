"use client";

import { useState, useEffect } from "react";
import { X, Users, Search, Plus, Trash2 } from "lucide-react";
import { API_BASE_URL } from "@/config/api";

interface Employee {
  id: string;
  name: string;
  department: string;
  designation: string;
  empCode: string;
}

interface TaskAssignment {
  id: string;
  role?: string;
  employee: Employee;
}

interface AssignEmployeeModalProps {
  taskId: string;
  taskName: string;
  projectId?: string;
  currentAssignments?: TaskAssignment[];
  onClose: () => void;
  onUpdate: () => void;
}

const AVAILABLE_ROLES = [
  "Project Lead",
  "Sales Manager",
  "Design Lead",
  "Costing Specialist",
  "QC Inspector",
  "Testing Engineer",
  "Field Technician",
  "Accounts Lead",
  "Client Coordinator"
];

export function AssignEmployeeModal({ taskId, taskName, projectId, currentAssignments = [], onClose, onUpdate }: AssignEmployeeModalProps) {
  const [assignments, setAssignments] = useState<TaskAssignment[]>(() => {
    if (currentAssignments && currentAssignments.length > 0) return currentAssignments;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`skytech_task_assignments_${taskId}`);
      if (stored) {
        try { return JSON.parse(stored); } catch {}
      }
    }
    return [];
  });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/employees`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const addAssignment = async (emp: Employee) => {
    const role = selectedRoles[emp.id] || emp.designation || "Task Staff";
    const newAssignment: TaskAssignment = {
      id: `ASG-${Date.now()}`,
      role,
      employee: emp
    };

    const updated = [...assignments.filter(a => a.employee.id !== emp.id), newAssignment];
    setAssignments(updated);

    if (typeof window !== "undefined") {
      localStorage.setItem(`skytech_task_assignments_${taskId}`, JSON.stringify(updated));
      if (projectId) {
        const existingRoster = localStorage.getItem(`skytech_project_team_${projectId}`);
        let roster: any[] = existingRoster ? JSON.parse(existingRoster) : [];
        if (!roster.some(m => m.id === emp.id || m.employeeId === emp.id)) {
          roster.push({
            id: emp.id,
            name: emp.name,
            email: `${emp.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@skytech.com`,
            role,
            department: emp.department || "Engineering",
            empCode: emp.empCode
          });
          localStorage.setItem(`skytech_project_team_${projectId}`, JSON.stringify(roster));
        }
      }
    }

    try {
      await fetch(`${API_BASE_URL}/api/wbs/tasks/${taskId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: emp.id, role })
      });
    } catch (e) {}

    onUpdate();
  };

  const removeAssignment = async (employeeId: string) => {
    const updated = assignments.filter(a => a.employee.id !== employeeId);
    setAssignments(updated);

    if (typeof window !== "undefined") {
      localStorage.setItem(`skytech_task_assignments_${taskId}`, JSON.stringify(updated));
    }

    try {
      await fetch(`${API_BASE_URL}/api/wbs/tasks/${taskId}/assign/${employeeId}`, {
        method: "DELETE"
      });
    } catch (e) {}

    onUpdate();
  };

  const unassignedEmployees = employees.filter(emp => !assignments.find(a => a.employee.id === emp.id));
  const filteredEmployees = unassignedEmployees.filter(emp =>
    emp.name.toLowerCase().includes(search.toLowerCase()) ||
    emp.empCode.toLowerCase().includes(search.toLowerCase()) ||
    emp.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800 font-bold">
            <Users size={18} className="text-blue-600" />
            <div>
              <h2 className="text-base leading-tight">Assign Employee & Select Position</h2>
              <p className="text-xs text-slate-500 font-normal">{taskName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Assigned Staff List */}
          <div className="w-full md:w-1/2 border-r border-slate-100 flex flex-col">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-600 uppercase tracking-wider">
              Assigned Staff ({assignments.length})
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {assignments.length === 0 && (
                <div className="text-xs text-slate-400 text-center py-6">No staff assigned yet. Select from directory on the right.</div>
              )}
              {assignments.map(a => (
                <div key={a.id || a.employee.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div>
                    <div className="text-xs font-extrabold text-slate-900">{a.employee.name}</div>
                    <div className="text-[10px] text-blue-600 font-bold mt-0.5">{a.role || a.employee.designation}</div>
                    <div className="text-[9px] text-slate-400">{a.employee.empCode} • {a.employee.department}</div>
                  </div>
                  <button onClick={() => removeAssignment(a.employee.id)} className="p-1.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg cursor-pointer" title="Remove Assignment">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Directory & Position Selector */}
          <div className="w-full md:w-1/2 flex flex-col bg-slate-50/50">
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, dept or code..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {loading && <div className="text-xs text-center text-slate-400 py-4">Loading directory...</div>}
              {filteredEmployees.map(emp => {
                const currentRole = selectedRoles[emp.id] || emp.designation || "Task Staff";
                return (
                  <div key={emp.id} className="p-3 rounded-xl border bg-white border-slate-200/80 hover:border-blue-300 space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">{emp.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{emp.empCode} • {emp.department}</span>
                      </div>
                      <button
                        onClick={() => addAssignment(emp)}
                        className="px-3 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={13} /> Assign
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Position:</span>
                      <select
                        value={currentRole}
                        onChange={e => setSelectedRoles({ ...selectedRoles, [emp.id]: e.target.value })}
                        className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 flex-1 focus:outline-none"
                      >
                        {AVAILABLE_ROLES.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
