"use client";

import { useState, useEffect } from "react";
import { X, Users, Search, Plus, Trash2, Crown, Building2, ShieldCheck, UserCheck } from "lucide-react";
import { API_BASE_URL } from "@/config/api";

interface Employee {
  id: string;
  name: string;
  department: string;
  designation: string;
  empCode: string;
}

interface TeamMember {
  id: string;
  role: string;
  department?: string | null;
  employee: Employee;
}

interface AssignTeamModalProps {
  inquiryId: string;
  onClose: () => void;
}

const DEPARTMENTS = [
  "Design & Costing",
  "Store",
  "Mechanical",
  "Assembly & Busbar",
  "Electrical",
  "Testing & Quality",
  "Accounts & Dispatch",
  "Support & Service"
];

export function AssignTeamModal({ inquiryId, onClose }: AssignTeamModalProps) {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [assignType, setAssignType] = useState<"Leadership" | "Department">("Department");
  const [selectedDept, setSelectedDept] = useState<string>(DEPARTMENTS[0]);
  const [selectedRole, setSelectedRole] = useState<string>("Member");
  const [leadershipRole, setLeadershipRole] = useState<string>("Program Manager");

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

  const addMember = async (employeeId: string) => {
    try {
      const isLeadership = assignType === "Leadership";
      const payloadRole = isLeadership ? leadershipRole : selectedRole;
      const payloadDept = isLeadership ? null : selectedDept;

      const res = await fetch(`${API_BASE_URL}/api/projects/${inquiryId}/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          role: payloadRole,
          department: payloadDept
        })
      });
      if (res.ok) {
        const newMember = await res.json();
        setTeam([...team, newMember]);
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to add member");
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

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(search.toLowerCase()) || 
    emp.empCode.toLowerCase().includes(search.toLowerCase()) ||
    emp.department.toLowerCase().includes(search.toLowerCase())
  );

  const leadershipMembers = team.filter(m => m.role === "Program Manager" || m.role === "Project Lead" || !m.department);
  const departmentMembers = team.filter(m => m.department);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Users size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Assign Project Team & Roles</h2>
              <p className="text-[11px] text-slate-400">Manage project leadership and department-level assignments</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Column: Current Team Roster */}
          <div className="w-full md:w-1/2 border-r border-slate-200 flex flex-col bg-slate-50/50">
            <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck size={14} className="text-blue-600" />
              <span>Assigned Team Roster</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {team.length === 0 && (
                <div className="text-xs text-slate-400 text-center py-8 font-medium">
                  No team members assigned yet.
                </div>
              )}

              {/* 👑 Section 1: Project Leadership */}
              {leadershipMembers.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5 px-1">
                    <Crown size={13} className="text-amber-500" />
                    <span>Project Leadership (Full Access)</span>
                  </div>
                  <div className="space-y-2">
                    {leadershipMembers.map(member => (
                      <div key={member.id} className="flex justify-between items-center p-3 bg-amber-50/60 rounded-xl border border-amber-200/70 shadow-2xs">
                        <div>
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <span>{member.employee.name}</span>
                            <span className="text-[10px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full font-extrabold">
                              {member.role}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {member.employee.designation} ({member.employee.empCode})
                          </div>
                        </div>
                        <button onClick={() => removeMember(member.id)} className="p-1.5 text-rose-400 hover:bg-rose-100 hover:text-rose-600 rounded-lg transition-colors cursor-pointer" title="Remove">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 🏢 Section 2: Department-specific Assignments */}
              {departmentMembers.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1.5 px-1">
                    <Building2 size={13} className="text-blue-500" />
                    <span>Department Team Members</span>
                  </div>
                  <div className="space-y-2">
                    {departmentMembers.map(member => (
                      <div key={member.id} className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <div>
                          <div className="text-xs font-bold text-slate-800">{member.employee.name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                              {member.department}
                            </span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                              {member.role}
                            </span>
                          </div>
                        </div>
                        <button onClick={() => removeMember(member.id)} className="p-1.5 text-rose-400 hover:bg-rose-100 hover:text-rose-600 rounded-lg transition-colors cursor-pointer" title="Remove">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Assignment Controls & Employee List */}
          <div className="w-full md:w-1/2 flex flex-col bg-white">
            
            {/* Top Selector: Assignment Mode */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 space-y-3">
              <div className="flex bg-slate-200 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAssignType("Department")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    assignType === "Department" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  🏢 Department Assignment
                </button>
                <button
                  type="button"
                  onClick={() => setAssignType("Leadership")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    assignType === "Leadership" ? "bg-white text-amber-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  👑 Program Manager / Lead
                </button>
              </div>

              {/* Dynamic Config Controls based on Assignment Mode */}
              {assignType === "Department" ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Target Department</label>
                    <select
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {DEPARTMENTS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Department Role</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="Member">Member</option>
                      <option value="Department Lead">Department Lead</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Leadership Designation</label>
                  <select
                    value={leadershipRole}
                    onChange={(e) => setLeadershipRole(e.target.value)}
                    className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="Program Manager">Program Manager (Project Wide)</option>
                    <option value="Project Lead">Project Lead (Project Wide)</option>
                  </select>
                  <p className="text-[10px] text-amber-700 font-medium mt-1">
                    * Bypasses department restriction; can view all department tasks in Employee Hub.
                  </p>
                </div>
              )}
            </div>

            {/* Search Box */}
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, code or department..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Roster Selection List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loading && <div className="text-xs text-center text-slate-400 py-4 font-medium">Loading employee roster...</div>}
              {filteredEmployees.map(emp => (
                <div key={emp.id} className="flex justify-between items-center p-2.5 bg-slate-50/70 rounded-xl border border-slate-200/80 hover:border-blue-300 transition-colors">
                  <div>
                    <div className="text-xs font-bold text-slate-800">{emp.name} ({emp.empCode})</div>
                    <div className="text-[10px] text-slate-500 font-medium">{emp.designation} • {emp.department}</div>
                  </div>
                  <button 
                    onClick={() => addMember(emp.id)} 
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer ${
                      assignType === "Leadership" 
                        ? "bg-amber-100 text-amber-900 hover:bg-amber-200" 
                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
                    }`}
                  >
                    <Plus size={13} /> Assign
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

