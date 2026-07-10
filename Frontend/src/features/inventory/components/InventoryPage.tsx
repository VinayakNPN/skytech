import React from 'react';
import { 
  Boxes, 
  AlertOctagon, 
  Hourglass, 
  Sparkles
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  // Mock inventories
  const stocks = [
    { id: 'STK-001', name: 'Copper Busbar 10mm (Flat)', category: 'Busbars', qty: '45 kg', threshold: '100 kg', status: 'CRITICAL' },
    { id: 'STK-002', name: 'Siemens 3RT Contactor 22kW', category: 'Switchgear', qty: '14 units', threshold: '10 units', status: 'OK' },
    { id: 'STK-003', name: 'L&T MCCB 250A 3-Pole', category: 'Breakers', qty: '3 units', threshold: '8 units', status: 'WARNING' },
    { id: 'STK-004', name: 'Control Cabling 1.5 sqmm Red', category: 'Wires', qty: '12 rolls', threshold: '5 rolls', status: 'OK' },
    { id: 'STK-005', name: 'Auxiliary Contact Blocks', category: 'Accessories', qty: '8 units', threshold: '20 units', status: 'CRITICAL' },
  ];

  const materialRequests = [
    { id: 'REQ-889', orderId: 'ORD-2026-002', requester: 'Rajesh Kumar (Mech)', item: 'Copper Busbar 10mm', qty: '15 kg', status: 'PENDING', date: 'Jul 10, 2026' },
    { id: 'REQ-887', orderId: 'ORD-2026-001', requester: 'Sunil Dutt (Elec)', item: 'Control Cabling 1.5 sqmm', qty: '2 rolls', status: 'ALLOCATED', date: 'Jul 09, 2026' },
    { id: 'REQ-886', orderId: 'ORD-2026-001', requester: 'Sunil Dutt (Elec)', item: 'Siemens 3RT Contactor 22kW', qty: '3 units', status: 'ALLOCATED', date: 'Jul 08, 2026' },
  ];

  return (
    <div className="space-y-8">
      {/* Top row - alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Low Stock Alarms', value: '3 Items', desc: 'Urgent procurement required', color: 'from-rose-500/10 to-transparent border-rose-500/20 text-rose-300', icon: AlertOctagon },
          { label: 'Pending Store Allocations', value: '1 Request', desc: 'Awaiting supervisor sign-off', color: 'from-[#94B4C1]/10 to-transparent border-[#94B4C1]/20 text-[#94B4C1]', icon: Hourglass },
          { label: 'Total Stocked Categories', value: '12 Classes', desc: 'Electrical and mechanical sections', color: 'from-[#94B4C1]/10 to-transparent border-[#94B4C1]/20 text-[#94B4C1]', icon: Boxes }
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className={`glass bg-gradient-to-br ${card.color} border rounded-xl p-5 relative overflow-hidden transition-all duration-300 hover:translate-y-[-1px]`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-350">{card.label}</p>
                  <h3 className="text-xl font-heading font-bold text-white mt-1.5">{card.value}</h3>
                  <p className="text-[10px] text-slate-400 mt-1">{card.desc}</p>
                </div>
                <div className="p-2 rounded-lg bg-[#182736] border border-[#2e3f53]">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Stock Inventory list */}
        <div className="lg:col-span-2 glass rounded-2xl border border-[#2e3f53]/35 p-6 space-y-6">
          <div>
            <h3 className="font-heading text-md font-bold text-white">Stock Status</h3>
            <p className="text-xs text-slate-350">Current levels of high-usage electrical panels switchgear assets</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#2e3f53] text-slate-300 font-bold uppercase tracking-wider">
                  <th className="pb-3 px-2">Item Code</th>
                  <th className="pb-3 px-2">Item Description</th>
                  <th className="pb-3 px-2">Category</th>
                  <th className="pb-3 px-2 text-right">In Stock</th>
                  <th className="pb-3 px-2 text-right">Threshold</th>
                  <th className="pb-3 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2e3f53] text-slate-200">
                {stocks.map((stock) => (
                  <tr key={stock.id} className="hover:bg-[#182736]/40 transition-colors">
                    <td className="py-3.5 px-2 font-mono font-bold text-[#94B4C1]">{stock.id}</td>
                    <td className="py-3.5 px-2 font-semibold text-white">{stock.name}</td>
                    <td className="py-3.5 px-2 text-slate-350">{stock.category}</td>
                    <td className="py-3.5 px-2 text-right font-mono font-semibold">{stock.qty}</td>
                    <td className="py-3.5 px-2 text-right font-mono text-slate-400">{stock.threshold}</td>
                    <td className="py-3.5 px-2 text-center">
                      <span className={`inline-flex items-center text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wide ${
                        stock.status === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-350 border border-rose-500/35'
                          : stock.status === 'WARNING'
                          ? 'bg-amber-500/20 text-amber-355 border border-amber-500/35'
                          : 'bg-emerald-500/20 text-emerald-350 border border-emerald-500/35'
                      }`}>
                        {stock.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Material Requests */}
        <div className="glass rounded-2xl border border-[#2e3f53]/35 p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-heading text-md font-bold text-white">Allocation Requests</h3>
              <p className="text-xs text-slate-350">Departmental material indents</p>
            </div>
            <Sparkles className="w-4 h-4 text-[#94B4C1]" />
          </div>

          <div className="space-y-4">
            {materialRequests.map((req) => (
              <div key={req.id} className="p-4 rounded-xl bg-[#182736]/50 border border-[#2e3f53]/55 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#94B4C1]">{req.id}</span>
                    <p className="text-[10px] text-slate-300 font-semibold">{req.requester}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                    req.status === 'PENDING'
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-500/35'
                      : 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/35'
                  }`}>
                    {req.status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="font-medium text-white">{req.item}</span>
                  <span className="font-mono font-bold text-slate-200">{req.qty}</span>
                </div>
                <div className="flex justify-between items-center text-[9px] text-slate-400 pt-1 border-t border-[#2e3f53]/40">
                  <span>Order: {req.orderId}</span>
                  <span>{req.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
