"use client";

import { useState, useEffect } from "react";
import { X, Users, Search, Plus, Trash2 } from "lucide-react";
import { API_BASE_URL } from "@/config/api";

interface Employee {
  id: string;
  name: string;
  department: string;
  designation: string;
}

interface TeamMember {
  id: string;
  role: string;
  employee: Employee;
}

interface AssignTeamModalProps {
  inquiryId: string;
  onClose: () => void;
}

export function AssignTeamModal({ inquiryId, onClose }: AssignTeamModalProps) {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeam();
    fetchEmployees();
  }, [inquiryId]);

  const fetchTeam = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${inquiryId}/team`);
      if (res.ok) setTeam(await res.json());
    } catch (e) {
      console.error(e);
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

  const addMember = async (employeeId: string, role: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/${inquiryId}/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, role })
      });
      if (res.ok) {
        const newMember = await res.json();
        setTeam([...team, newMember]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const removeMember = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/projects/team/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setTeam(team.filter(t => t.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const unassignedEmployees = employees.filter(emp => !team.find(t => t.employee.id === emp.id));
  const filteredEmployees = unassignedEmployees.filter(emp => emp.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800 font-bold">
            <Users size={18} className="text-blue-600" />
            <h2>Assign Project Team</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Current Team */}
          <div className="w-full md:w-1/2 border-r border-slate-100 flex flex-col">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Assigned Members
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {team.length === 0 && (
                <div className="text-sm text-slate-400 text-center py-4">No team assigned yet.</div>
              )}
              {team.map(member => (
                <div key={member.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{member.employee.name}</div>
                    <div className="text-xs text-slate-500">{member.employee.designation} • {member.role}</div>
                  </div>
                  <button onClick={() => removeMember(member.id)} className="p-1.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Employee Roster */}
          <div className="w-full md:w-1/2 flex flex-col bg-slate-50/50">
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loading && <div className="text-sm text-center text-slate-400 py-4">Loading...</div>}
              {filteredEmployees.map(emp => (
                <div key={emp.id} className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-blue-200 transition-colors">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{emp.name}</div>
                    <div className="text-[11px] text-slate-500">{emp.designation}</div>
                  </div>
                  <button onClick={() => addMember(emp.id, 'Member')} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1 text-xs font-semibold">
                    <Plus size={14} /> Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
