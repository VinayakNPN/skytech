import React, { useState } from 'react';
import { useAppState, type Order } from '../../../lib/store';
import { 
  FileText, 
  Plus, 
  Search, 
  Calendar,
  FolderOpen,
  CheckCircle2,
  Lock
} from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const { orders, addOrder } = useAppState();
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New order form fields
  const [customer, setCustomer] = useState('');
  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [targetDate, setTargetDate] = useState('2026-07-25');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  const handleAddOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.trim() || !product.trim()) return;

    const newOrder: Order = {
      id: `ORD-2026-0${orders.length + 1}`,
      customerName: customer.trim(),
      productName: product.trim(),
      quantity,
      status: 'PLANNING',
      currentStage: 'DESIGN',
      progress: 5,
      targetDate,
      priority
    };

    addOrder(newOrder);
    setSelectedOrderId(newOrder.id);
    setShowAddModal(false);
    
    // reset form
    setCustomer('');
    setProduct('');
    setQuantity(1);
    setPriority('MEDIUM');
  };

  const filteredOrders = orders.filter(o => 
    o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col md:flex-row gap-8 h-[calc(100vh-12rem)] relative">
      
      {/* 1. Left panel: Orders list & search */}
      <div className="w-full md:w-80 flex flex-col shrink-0 space-y-4 h-full">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-md font-extrabold text-[#213448] tracking-wide">Order Index</h3>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-[#213448] hover:bg-[#213448]/90 text-white font-extrabold p-2.5 rounded-lg text-xs transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.97] flex items-center space-x-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Order</span>
          </button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search orders, clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/80 border border-[#94B4C1]/40 rounded-lg pl-9 pr-4 py-2 text-xs text-[#213448] placeholder-slate-450 focus:outline-none focus:border-[#213448] focus:bg-white focus:ring-2 focus:ring-[#213448]/10 transition-all duration-200"
          />
        </div>

        {/* Scrollable Order List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {filteredOrders.map((order) => {
            const isSelected = order.id === selectedOrderId;
            return (
              <button
                key={order.id}
                onClick={() => setSelectedOrderId(order.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 transform hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${
                  isSelected
                    ? 'bg-[#213448] border-[#94B4C1]/40 text-white shadow-md'
                    : 'bg-[#213448]/5 border-[#213448]/10 text-[#213448] hover:bg-[#213448]/10 hover:shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-[#94B4C1]' : 'text-[#213448]/85'}`}>{order.id}</span>
                  <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                    order.priority === 'CRITICAL' || order.priority === 'HIGH'
                      ? isSelected 
                        ? 'bg-rose-500/25 text-rose-300 border-rose-500/40' 
                        : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                      : isSelected 
                        ? 'bg-slate-700 text-slate-300 border-slate-600' 
                        : 'bg-slate-200 text-slate-600 border-slate-350'
                  }`}>
                    {order.priority}
                  </span>
                </div>
                <h4 className={`text-xs font-bold mt-1.5 truncate ${isSelected ? 'text-white' : 'text-[#213448]'}`}>{order.customerName}</h4>
                <p className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-slate-350' : 'text-[#213448]/75'}`}>{order.productName}</p>
                
                {/* Progress bar */}
                <div className="flex items-center justify-between mt-3 text-[9px]">
                  <div className={`w-2/3 h-1 rounded-full overflow-hidden ${isSelected ? 'bg-[#182736]' : 'bg-[#213448]/10'}`}>
                    <div className="h-full bg-[#94B4C1]" style={{ width: `${order.progress}%` }} />
                  </div>
                  <span className={isSelected ? 'text-slate-400 font-bold' : 'text-[#213448]/75 font-bold'}>{order.progress}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Right panel: Order workflow details */}
      <div className="flex-1 glass border border-[#2e3f53]/30 rounded-2xl p-6 overflow-y-auto custom-scrollbar h-full">
        {selectedOrder ? (
          <div className="space-y-6">
            
            {/* Header info */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-[#2e3f53]/40 pb-5 gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-[#94B4C1]/15 text-[#94B4C1] px-2 py-0.5 rounded-full border border-[#94B4C1]/30 font-mono font-bold">
                    {selectedOrder.id}
                  </span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold uppercase tracking-wider">
                    {selectedOrder.status}
                  </span>
                </div>
                <h2 className="font-heading text-lg font-bold text-white mt-2">{selectedOrder.customerName}</h2>
                <p className="text-xs text-slate-300">{selectedOrder.productName} (Qty: {selectedOrder.quantity})</p>
              </div>
              <div className="flex flex-row items-center gap-4 sm:text-right shrink-0">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Delivery</p>
                  <p className="text-xs text-white font-medium flex items-center space-x-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-[#94B4C1]" />
                    <span>{selectedOrder.targetDate}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Overall production progress visualizer */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-2 font-medium">
                <span>Production Completion</span>
                <span className="text-[#94B4C1] font-bold">{selectedOrder.progress}%</span>
              </div>
              <div className="w-full bg-[#182736] h-2.5 rounded-full overflow-hidden border border-[#2e3f53]/40">
                <div className="h-full bg-gradient-to-r from-[#94B4C1]/75 to-[#94B4C1] rounded-full transition-all duration-300" style={{ width: `${selectedOrder.progress}%` }} />
              </div>
            </div>

            {/* Department Workflow Checklists */}
            <div className="space-y-4">
              <h3 className="font-heading text-xs font-bold text-slate-200 uppercase tracking-wider">
                Manufacturing Workflow Stages
              </h3>
              
              <div className="space-y-3">
                {[
                  { name: 'Mechanical drawings & CAD verification', stage: 'DESIGN', status: 'Approved' },
                  { name: 'Chassis enclosure frame welding & size audit', stage: 'MECHANICAL', status: 'Completed' },
                  { name: 'Copper busbars sizing & panel installation', stage: 'ASSEMBLY', status: 'Completed' },
                  { name: 'Power cabling & auxiliary wiring integration', stage: 'ELECTRICAL', status: 'In Progress' },
                  { name: 'Testing laboratory insulation & function sequences', stage: 'TESTING', status: 'Locked' },
                  { name: 'Finished panel packing & transport release', stage: 'STORE', status: 'Locked' }
                ].map((task, idx) => {
                  const isCurrent = selectedOrder.currentStage === task.stage;
                  const isCompleted = selectedOrder.progress > (idx + 1) * 16;
                  
                  return (
                    <div 
                      key={idx} 
                      className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${
                        isCurrent 
                          ? 'bg-[#94B4C1]/10 border-[#94B4C1] shadow-sm text-white' 
                          : isCompleted
                          ? 'bg-[#182736]/40 border-emerald-500/20 text-slate-300'
                          : 'bg-[#182736]/70 border-[#2e3f53]/40 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center space-x-3.5">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : isCurrent
                            ? 'bg-[#94B4C1]/20 text-[#94B4C1] border border-[#94B4C1]'
                            : 'bg-[#182736] text-slate-500 border border-[#2e3f53]/55'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <p className={`text-xs font-semibold ${isCurrent ? 'text-white font-bold' : ''}`}>{task.name}</p>
                          <span className="text-[9px] uppercase tracking-wider font-bold opacity-60">{task.stage} DEPARTMENT</span>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center space-x-2">
                        {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        {isCurrent && <span className="text-[10px] bg-[#94B4C1]/15 text-[#94B4C1] px-2 py-0.5 rounded font-bold border border-[#94B4C1]/30">Active</span>}
                        {!isCompleted && !isCurrent && <Lock className="w-3.5 h-3.5 opacity-40" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Document Attachments */}
            <div className="glass rounded-xl border border-[#2e3f53]/35 p-5">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center space-x-2">
                <FolderOpen className="w-4 h-4 text-[#94B4C1]" />
                <span>Drawing & CAD Files</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { name: 'Enclosure_mechanical_v1.cad', size: '14.2 MB', ext: 'CAD' },
                  { name: 'Wiring_terminal_diagram_v3.pdf', size: '4.8 MB', ext: 'PDF' }
                ].map((file, idx) => (
                  <div key={idx} className="p-3 bg-[#182736] border border-[#2e3f53]/50 rounded-lg flex items-center justify-between text-xs hover:border-[#94B4C1] transition-colors cursor-pointer">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-[#94B4C1]" />
                      <div>
                        <p className="font-semibold text-white truncate max-w-[150px]">{file.name}</p>
                        <span className="text-[9px] text-slate-400 font-mono">{file.size}</span>
                      </div>
                    </div>
                    <span className="text-[9px] bg-[#182736] text-slate-300 px-1.5 py-0.5 rounded border border-[#2e3f53]/60 font-mono font-bold uppercase">
                      {file.ext}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <FolderOpen className="w-12 h-12 mb-3 text-slate-500 animate-pulse" />
            <p className="text-sm">Select an active production order to review checklist progress</p>
          </div>
        )}
      </div>

      {/* Add Order Modal (Overlay) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-heavy w-full max-w-md rounded-2xl border border-[#2e3f53]/60 p-6 space-y-6">
            <div>
              <h3 className="font-heading text-lg font-bold text-white">Create Production Order</h3>
              <p className="text-xs text-slate-300">Initialize a new electrical panel build job</p>
            </div>

            <form onSubmit={handleAddOrder} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Customer / Client Name
                </label>
                <input
                  type="text"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="e.g. Siemens India Pvt Ltd"
                  className="w-full text-xs bg-[#182736] border border-[#2e3f53] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#94B4C1] placeholder-slate-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Panel System / Product Name
                </label>
                <input
                  type="text"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="e.g. 11KV VCB Panel Box"
                  className="w-full text-xs bg-[#182736] border border-[#2e3f53] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#94B4C1] placeholder-slate-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full text-xs bg-[#182736] border border-[#2e3f53] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#94B4C1]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full text-xs bg-[#182736] border border-[#2e3f53] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#94B4C1]"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Target Delivery Date
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full text-xs bg-[#182736] border border-[#2e3f53] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#94B4C1]"
                />
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-[#2e3f53] hover:bg-slate-700 text-slate-200 font-bold py-2 rounded-lg text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#94B4C1] hover:bg-[#94B4C1]/90 text-[#213448] font-extrabold py-2 rounded-lg text-xs transition-colors shadow-sm"
                >
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
