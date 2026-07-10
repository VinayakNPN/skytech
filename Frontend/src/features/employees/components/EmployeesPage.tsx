import React from 'react';
import { useAppState } from '../../../lib/store';

export const EmployeesPage: React.FC = () => {
  const { employees } = useAppState();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading text-md font-extrabold text-[#213448]">Employee Directory</h3>
        <p className="text-xs text-[#213448]/80">Current staffing levels and shop-floor attendance indicators</p>
      </div>

      {/* Grid listing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {employees.map((emp) => (
          <div key={emp.id} className="glass rounded-xl border border-[#2e3f53]/35 p-5 flex flex-col justify-between hover:border-[#94B4C1]/60 transition-colors group shadow-sm">
            
            {/* Top row */}
            <div className="space-y-3.5">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#213448] to-[#182736] border border-[#2e3f53]/60 flex items-center justify-center text-[#94B4C1] font-semibold text-sm shadow-inner">
                  {emp.name.split(' ').map(n => n[0]).join('')}
                </div>
                <span className={`inline-flex items-center space-x-1 text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                  emp.present 
                    ? 'bg-emerald-500/20 text-emerald-350 border-emerald-500/30' 
                    : 'bg-[#182736] text-slate-400 border-[#2e3f53]/55'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${emp.present ? 'bg-emerald-400 animate-pulse' : 'bg-slate-550'}`} />
                  <span>{emp.present ? 'Present' : 'Absent'}</span>
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-[#94B4C1] transition-colors">{emp.name}</h4>
                <p className="text-[10px] text-slate-350 mt-0.5">{emp.role}</p>
              </div>
            </div>

            {/* Bottom details */}
            <div className="mt-5 pt-3 border-t border-[#2e3f53]/45 flex justify-between items-center text-[10px]">
              <div>
                <span className="text-slate-450 font-bold uppercase tracking-wide text-[9px]">Dept</span>
                <p className="text-[#94B4C1] font-bold mt-0.5">{emp.department}</p>
              </div>
              <span className="text-[9px] font-mono text-slate-400">{emp.id}</span>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};
