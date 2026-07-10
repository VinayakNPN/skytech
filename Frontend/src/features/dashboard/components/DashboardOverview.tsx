import React from 'react';
import { useAppState } from '../../../lib/store';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  ArrowRight,
  CalendarDays
} from 'lucide-react';

export const DashboardOverview: React.FC = () => {
  const { 
    orders, 
    employees, 
    issues,
    setActiveTab
  } = useAppState();

  // Derive metrics
  const activeOrdersCount = orders.filter(o => o.status === 'PRODUCTION' || o.status === 'PLANNING').length;
  const employeesPresentCount = employees.filter(e => e.present).length;
  const totalEmployeesCount = employees.length;
  const openTasksCount = orders.reduce((sum, o) => sum + (o.progress < 100 ? 3 : 0), 0); // Simulated task count

  // Calculate average active project progress
  const activeOrdersList = orders.filter(o => o.status !== 'COMPLETED');
  const avgProgress = activeOrdersList.length > 0
    ? Math.round(activeOrdersList.reduce((sum, o) => sum + o.progress, 0) / activeOrdersList.length)
    : 0;

  // Determine current active manufacturing phase (highest priority)
  const leadOrder = orders.find(o => o.priority === 'CRITICAL') || orders.find(o => o.priority === 'HIGH') || orders[0];
  const currentPhase = leadOrder ? leadOrder.currentStage : 'DESIGN';

  // Calculate completed tasks
  const tasksCompletedCount = orders.reduce((sum, o) => {
    if (o.status === 'COMPLETED') return sum + 6;
    if (o.currentStage === 'STORE') return sum + 5;
    if (o.currentStage === 'TESTING') return sum + 4;
    if (o.currentStage === 'ELECTRICAL') return sum + 3;
    if (o.currentStage === 'ASSEMBLY') return sum + 2;
    if (o.currentStage === 'MECHANICAL') return sum + 1;
    return sum;
  }, 0);
  const totalTasksCount = orders.length * 6;
  const tasksPercentage = totalTasksCount > 0 ? Math.round((tasksCompletedCount / totalTasksCount) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 6-Metrics Analytics Grid (As per reference layout sketch) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Metric 1: Progress in % (SVG Circular Progress) */}
        <div className="glass bg-gradient-to-br from-[#94B4C1]/10 to-transparent border border-[#94B4C1]/20 rounded-xl p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-350 transition-colors group-hover:text-white">Progress in %</span>
              <h3 className="text-2xl font-heading font-extrabold text-white tracking-tight">{avgProgress}%</h3>
              <p className="text-[10px] text-slate-400">Average completion of active shopfloor panels</p>
            </div>
            <div className="relative w-16 h-16 shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="32" cy="32" r="26" stroke="#182736" strokeWidth="4.5" fill="transparent" />
                <circle cx="32" cy="32" r="26" stroke="#94B4C1" strokeWidth="4.5" fill="transparent" 
                        strokeDasharray={2 * Math.PI * 26} 
                        strokeDashoffset={2 * Math.PI * 26 * (1 - avgProgress / 100)} 
                        strokeLinecap="round"
                        className="transition-all duration-500" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-[#94B4C1] font-bold">
                {avgProgress}%
              </div>
            </div>
          </div>
        </div>

        {/* Metric 2: Current Phase */}
        <div className="glass bg-gradient-to-br from-[#94B4C1]/10 to-transparent border border-[#94B4C1]/20 rounded-xl p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-350 transition-colors group-hover:text-white">Current Phase</span>
              <h3 className="text-xl font-heading font-extrabold text-white tracking-tight uppercase">{currentPhase}</h3>
              <p className="text-[10px] text-slate-400">Active department for critical projects</p>
            </div>
            <div className="p-3.5 rounded-lg bg-[#182736]/90 border border-[#2e3f53] text-[#94B4C1] group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Metric 3: Tasks Completed */}
        <div className="glass bg-gradient-to-br from-[#94B4C1]/10 to-transparent border border-[#94B4C1]/20 rounded-xl p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-350 transition-colors group-hover:text-white">Tasks Completed</span>
              <h3 className="text-2xl font-heading font-extrabold text-white tracking-tight">{tasksCompletedCount}/{totalTasksCount}</h3>
              <p className="text-[10px] text-slate-400">Total manufacturing milestones finalized</p>
            </div>
            <div className="relative w-16 h-16 shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="32" cy="32" r="26" stroke="#182736" strokeWidth="4.5" fill="transparent" />
                <circle cx="32" cy="32" r="26" stroke="#4ade80" strokeWidth="4.5" fill="transparent" 
                        strokeDasharray={2 * Math.PI * 26} 
                        strokeDashoffset={2 * Math.PI * 26 * (1 - tasksPercentage / 100)} 
                        strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-emerald-400 font-bold">
                {tasksPercentage}%
              </div>
            </div>
          </div>
        </div>

        {/* Metric 4: Total Employee & Present (SVG Attendance Ring) */}
        <div className="glass bg-gradient-to-br from-[#94B4C1]/10 to-transparent border border-[#94B4C1]/20 rounded-xl p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-350 transition-colors group-hover:text-white">Staff Attendance</span>
              <h3 className="text-2xl font-heading font-extrabold text-white tracking-tight">{employeesPresentCount}/{totalEmployeesCount}</h3>
              <p className="text-[10px] text-slate-400">Total team staff present on shopfloor</p>
            </div>
            <div className="relative w-16 h-16 shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="32" cy="32" r="26" stroke="#f43f5e" strokeWidth="4.5" fill="transparent" />
                <circle cx="32" cy="32" r="26" stroke="#94B4C1" strokeWidth="4.5" fill="transparent" 
                        strokeDasharray={2 * Math.PI * 26} 
                        strokeDashoffset={2 * Math.PI * 26 * (1 - employeesPresentCount / totalEmployeesCount)} 
                        strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white">
                {employeesPresentCount}p
              </div>
            </div>
          </div>
        </div>

        {/* Metric 5: No. of Active Tasks */}
        <div className="glass bg-gradient-to-br from-[#94B4C1]/10 to-transparent border border-[#94B4C1]/20 rounded-xl p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-350 transition-colors group-hover:text-white">No. of Active Tasks</span>
              <h3 className="text-2xl font-heading font-extrabold text-white tracking-tight">{openTasksCount}</h3>
              <p className="text-[10px] text-slate-400">Total open jobs currently in departments</p>
            </div>
            <div className="p-3.5 rounded-lg bg-[#182736]/90 border border-[#2e3f53] text-[#94B4C1] group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Metric 6: No. of Running Jobs */}
        <div className="glass bg-gradient-to-br from-[#94B4C1]/10 to-transparent border border-[#94B4C1]/20 rounded-xl p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-350 transition-colors group-hover:text-white">No. of Running Jobs</span>
              <h3 className="text-2xl font-heading font-extrabold text-white tracking-tight">{activeOrdersCount}</h3>
              <p className="text-[10px] text-slate-400">Active industrial switchgear panel builds</p>
            </div>
            <div className="p-3.5 rounded-lg bg-[#182736]/90 border border-[#2e3f53] text-[#94B4C1] group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

      </div>

      {/* Main Bottom Section: Split Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Active Blockers & Production Flow (Occupies 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Blocked Issues Board */}
          <div className="glass rounded-xl border border-[#2e3f53]/35 p-6 hover:shadow-md transition-shadow duration-300">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="font-heading text-md font-bold text-white tracking-wide">Active Blockers & Issues</h3>
                <p className="text-[11px] text-slate-350">Issues requiring immediate management intervention</p>
              </div>
              <span className="text-[9px] bg-rose-500/15 text-rose-300 px-2.5 py-1 rounded-full font-extrabold border border-rose-500/30 uppercase tracking-wider animate-pulse">
                Action Required
              </span>
            </div>

            <div className="space-y-3">
              {issues.map((issue) => (
                <div key={issue.id} className="p-4 rounded-xl bg-[#182736]/40 border border-[#2e3f53]/45 flex items-center justify-between transition-all duration-200 hover:bg-[#182736]/80 hover:scale-[1.01] hover:shadow-sm">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-[#94B4C1]">{issue.orderId}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase tracking-wide border ${
                        issue.severity === 'CRITICAL' 
                          ? 'bg-rose-500/20 text-rose-350 border-rose-500/40' 
                          : 'bg-amber-500/20 text-amber-350 border-amber-500/40'
                      }`}>
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 font-medium">{issue.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-slate-400 font-mono">{issue.reportedAt}</p>
                    <button className="text-[10px] text-[#94B4C1] hover:text-white font-extrabold mt-1.5 transition-colors cursor-pointer hover:underline">
                      Resolve Case
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Running Orders Widget */}
          <div className="glass rounded-xl border border-[#2e3f53]/35 p-6 hover:shadow-md transition-shadow duration-300">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="font-heading text-md font-bold text-white tracking-wide">Production Flow</h3>
                <p className="text-[11px] text-slate-350">Status overview of active panels</p>
              </div>
              <button 
                onClick={() => setActiveTab('Orders & Projects')}
                className="text-xs text-[#94B4C1] hover:text-white font-extrabold flex items-center space-x-1 transition-all transform hover:scale-[1.02] cursor-pointer"
              >
                <span>Full Orders Board</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#2e3f53]/60 text-slate-300 font-bold uppercase tracking-wider">
                    <th className="pb-3 px-2.5">Order ID</th>
                    <th className="pb-3 px-2.5">Customer</th>
                    <th className="pb-3 px-2.5">Stage</th>
                    <th className="pb-3 px-2.5">Progress</th>
                    <th className="pb-3 px-2.5">Target Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2e3f53]/40 text-slate-200">
                  {orders.slice(0, 3).map((order) => (
                    <tr key={order.id} className="hover:bg-[#182736]/40 transition-colors">
                      <td className="py-3 px-2.5 font-mono font-bold text-[#94B4C1]">{order.id}</td>
                      <td className="py-3 px-2.5 font-semibold text-white truncate max-w-[120px]">{order.customerName}</td>
                      <td className="py-3 px-2.5">
                        <span className="bg-[#182736]/80 border border-[#2e3f53]/60 px-2 py-0.5 rounded text-[9px] font-bold text-slate-200">
                          {order.currentStage}
                        </span>
                      </td>
                      <td className="py-3 px-2.5">
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-[#182736] h-1.5 rounded-full overflow-hidden border border-[#2e3f53]/30">
                            <div className="h-full bg-[#94B4C1] rounded-full transition-all duration-300" style={{ width: `${order.progress}%` }} />
                          </div>
                          <span className="font-mono text-[10px] text-slate-400 font-bold">{order.progress}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-2.5 text-slate-350 font-medium">{order.targetDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Side: Shift Supervisors & Details */}
        <div className="space-y-6">
          
          {/* Operations Contacts Checklist */}
          <div className="glass rounded-xl border border-[#2e3f53]/30 p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-350 mb-4 flex items-center space-x-1.5 border-b border-[#2e3f53]/40 pb-2.5">
              <CalendarDays className="w-4 h-4 text-[#94B4C1]" />
              <span>Shift Supervisors</span>
            </h4>
            <div className="space-y-3.5">
              {[
                { name: 'Amit Sharma', dept: 'Design Dept', status: 'Online' },
                { name: 'Rajesh Kumar', dept: 'Mechanical', status: 'On Floor' },
                { name: 'Sunil Dutt', dept: 'Electrical', status: 'Online' }
              ].map((contact, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs p-1">
                  <div>
                    <p className="font-semibold text-white">{contact.name}</p>
                    <span className="text-[10px] text-slate-400">{contact.dept}</span>
                  </div>
                  <span className="text-[9px] bg-[#94B4C1]/15 text-[#94B4C1] border border-[#94B4C1]/30 px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                    {contact.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
