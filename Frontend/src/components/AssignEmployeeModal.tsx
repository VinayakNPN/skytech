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

export function AssignEmployeeModal({ taskId, taskName, projectId, currentAssignments = [], onClose, onUpdate }: AssignEmployeeModalProps) {
  const [assignments, setAssignments] = useState<TaskAssignment[]>(currentAssignments);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projectTeamMemberIds, setProjectTeamMemberIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
    if (projectId) {
      fetchProjectTeam();
    }
  }, [projectId]);

  const fetchProjectTeam = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${projectId}/team`);
      if (res.ok) {
        const teamData = await res.json();
        if (Array.isArray(teamData)) {
          const ids = new Set<string>(teamData.map((m: any) => m.employeeId || m.employee?.id).filter(Boolean));
          setProjectTeamMemberIds(ids);
        }
      }
    } catch (e) {
      console.error('Failed to fetch project team roster:', e);
    }
  };

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

  const addAssignment = async (employeeId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/wbs/tasks/${taskId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId })
      });
      if (res.ok) {
        const newAssignment = await res.json();
        setAssignments([...assignments, newAssignment]);
        onUpdate();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const removeAssignment = async (employeeId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/wbs/tasks/${taskId}/assign/${employeeId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setAssignments(assignments.filter(a => a.employee.id !== employeeId));
        onUpdate();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const unassignedEmployees = employees.filter(emp => !assignments.find(a => a.employee.id === emp.id));
  const filteredEmployees = unassignedEmployees
    .filter(emp => 
      emp.name.toLowerCase().includes(search.toLowerCase()) || 
      emp.empCode.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const aInTeam = projectTeamMemberIds.has(a.id) ? 1 : 0;
      const bInTeam = projectTeamMemberIds.has(b.id) ? 1 : 0;
      return bInTeam - aInTeam;
    });

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800 font-bold">
            <Users size={18} className="text-blue-600" />
            <div>
              <h2 className="text-base leading-tight">Assign Staff to Task</h2>
              <p className="text-xs text-slate-500 font-normal">{taskName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Assigned Staff */}
          <div className="w-full md:w-1/2 border-r border-slate-100 flex flex-col">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Assigned Staff ({assignments.length})
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {assignments.length === 0 && (
                <div className="text-sm text-slate-400 text-center py-4">No staff assigned yet.</div>
              )}
              {assignments.map(a => (
                <div key={a.id || a.employee.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{a.employee.name}</div>
                    <div className="text-xs text-slate-500">{a.employee.empCode} • {a.employee.department}</div>
                  </div>
                  <button onClick={() => removeAssignment(a.employee.id)} className="p-1.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Employee Directory */}
          <div className="w-full md:w-1/2 flex flex-col bg-slate-50/50">
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or code..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loading && <div className="text-sm text-center text-slate-400 py-4">Loading...</div>}
              {filteredEmployees.map(emp => {
                const isProjectRoster = projectTeamMemberIds.has(emp.id);
                return (
                  <div key={emp.id} className={`flex justify-between items-center p-3 rounded-xl border transition-colors ${
                    isProjectRoster ? 'bg-emerald-50/30 border-emerald-200 hover:border-emerald-300' : 'bg-white border-slate-100 hover:border-blue-200'
                  }`}>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-semibold text-slate-800">{emp.name}</span>
                        {isProjectRoster && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                            Project Roster
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">{emp.empCode} • {emp.designation}</div>
                    </div>
                    <button onClick={() => addAssignment(emp.id)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1 text-xs font-semibold cursor-pointer">
                      <Plus size={14} /> Assign
                    </button>
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
