import React from 'react';

export const OrderTracker: React.FC = () => {
  return (
    <div className="glass rounded-2xl border border-gray-800 p-6">
      <h3 className="font-heading text-lg font-bold text-white mb-2">Order Tracking Details</h3>
      <p className="text-xs text-gray-400 mb-6">Select an order from the dashboard to track its department stages in depth.</p>
      
      {/* Visual Timeline of Stages */}
      <div className="relative pl-6 border-l-2 border-emerald-500/30 space-y-8">
        {[
          { title: 'Mechanical Dept Approval', desc: 'Fabrication drawings released, chassis frame construction complete.', time: 'Completed on Jul 04, 2026', done: true },
          { title: 'Busbar & Assembly Work', desc: 'Copper busbars sized and mounted onto supports.', time: 'Completed on Jul 07, 2026', done: true },
          { title: 'Electrical Wiring Stage', desc: 'Power and control wiring, terminal blocks, meter wiring.', time: 'In Progress - Assigned to Electrical Team', done: false, active: true },
          { title: 'Testing Department Inspection', desc: 'High voltage, insulation resistance, and functional sequence tests.', time: 'Pending previous step', done: false },
          { title: 'Final Dispatch Release', desc: 'Packing, shipping documentation, invoice clearance.', time: 'Pending previous step', done: false }
        ].map((step, idx) => (
          <div key={idx} className="relative">
            {/* Timeline node dot */}
            <span className={`absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full border-2 ${
              step.done 
                ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]' 
                : step.active
                ? 'bg-[#090d16] border-emerald-500 animate-pulse'
                : 'bg-[#090d16] border-gray-700'
            }`} />
            <div>
              <h4 className={`text-sm font-semibold ${step.done ? 'text-gray-200' : step.active ? 'text-emerald-400' : 'text-gray-500'}`}>
                {step.title}
              </h4>
              <p className="text-xs text-gray-400 mt-1">{step.desc}</p>
              <span className="text-[10px] text-gray-500 mt-2 block font-medium">{step.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
