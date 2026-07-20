'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  CheckSquare, 
  Square,
  MessageSquare,
  History,
  Sparkles,
  ArrowRightLeft,
  Save,
  CheckCircle2,
  Workflow
} from 'lucide-react';

interface Task {
  id: string;
  name: string;
  completed: boolean;
  assignedDept: string;
}

interface HistoryEntry {
  stage: string;
  date: string;
  status: string;
  user: string;
}

interface Order {
  id: string;
  clientName: string;
  projectName: string;
  panels: string[];
  priority: 'High' | 'Medium' | 'Low';
  currentStage: string;
  progress: number;
  startDate: string;
  deadline: string;
  tasks: Task[];
  remarks: string[];
  deptRemarks: Record<string, string>;
  history: HistoryEntry[];
}

const BUSINESS_STAGES = [
  'Inquiry',
  'Design & Costing',
  'Quotation Offer',
  'Client Approval',
  'Mechanical Dept.',
  'Assembly & Busbar Dept.',
  'Electrical Dept.',
  'Testing Dept.',
  'Ready for Dispatch',
  'Accounts',
  'Support & Service'
];

const DEPARTMENTS = [
  { id: '1', name: 'Design and Costing dept.', milestone: 'Milestone 1: Design & Costing' },
  { id: '2', name: 'Mechanical Dept.', milestone: 'Milestone 2: Mechanical Fabrication' },
  { id: '3', name: 'Assembly & Busbar Dept.', milestone: 'Milestone 3: Assembly & Busbar' },
  { id: '4', name: 'Electrical Dept.', milestone: 'Milestone 4: Electrical Wiring' },
  { id: '5', name: 'Testing Dept.', milestone: 'Milestone 5: Quality & Testing' },
  { id: '6', name: 'Store Dept.', milestone: 'Milestone 6: Inventory & Material' },
  { id: '7', name: 'Support & Service Dept.', milestone: 'Milestone 7: Service & Commissioning' }
];

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [stageFilter, setStageFilter] = useState('All');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Remarks inputs state: key is `orderId-deptName`, value is typed remark
  const [remarksInput, setRemarksInput] = useState<Record<string, string>>({});
  const [savedFeedbacks, setSavedFeedbacks] = useState<Record<string, boolean>>({});

  // Form states for creating a new order
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [panelInput, setPanelInput] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [deadline, setDeadline] = useState('');

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Handle order creation
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !projectName) return;

    const panels = panelInput.split(',').map(p => p.trim()).filter(p => p.length > 0);

    try {
      const res = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          projectName,
          panels,
          priority,
          deadline
        })
      });

      if (res.ok) {
        setClientName('');
        setProjectName('');
        setPanelInput('');
        setPriority('Medium');
        setDeadline('');
        setShowCreateModal(false);
        fetchOrders();
      }
    } catch (err) {
      console.error('Error creating order:', err);
    }
  };

  // Toggle checklist item
  const handleToggleTask = async (orderId: string, taskId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/tasks/${taskId}/toggle`, {
        method: 'PUT'
      });
      if (res.ok) {
        fetchOrders();
      }
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  // Transition stage
  const handleStageChange = async (orderId: string, newStage: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: newStage,
          user: 'Vinayak (Admin)'
        })
      });
      if (res.ok) {
        fetchOrders();
      }
    } catch (err) {
      console.error('Error updating stage:', err);
    }
  };

  // Save department specific remark
  const handleSaveRemark = async (orderId: string, dept: string) => {
    const inputKey = `${orderId}-${dept}`;
    const value = remarksInput[inputKey] !== undefined 
      ? remarksInput[inputKey] 
      : (orders.find(o => o.id === orderId)?.deptRemarks?.[dept] || '');

    try {
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/remarks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dept,
          remark: value,
          user: 'Vinayak (Admin)'
        })
      });
      if (res.ok) {
        setSavedFeedbacks(prev => ({ ...prev, [inputKey]: true }));
        setTimeout(() => {
          setSavedFeedbacks(prev => ({ ...prev, [inputKey]: false }));
        }, 2000);
        fetchOrders();
      }
    } catch (err) {
      console.error('Error saving department remark:', err);
    }
  };

  const getPriorityBadgeClass = (p: 'High' | 'Medium' | 'Low') => {
    switch (p) {
      case 'High': return 'bg-rose-100 text-rose-700 border border-rose-200';
      case 'Medium': return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'Low': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.clientName.toLowerCase().includes(search.toLowerCase()) || 
      o.projectName.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase());
    const matchesPriority = priorityFilter === 'All' || o.priority === priorityFilter;
    const matchesStage = stageFilter === 'All' || o.currentStage === stageFilter;
    return matchesSearch && matchesPriority && matchesStage;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Loading panel orders directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title Header with Action Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Switchgear Panel Programs & Orders</h2>
          <p className="text-xs text-slate-500">Track milestones, checklists, and remarks for all production departments.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-[#0E3B68] hover:bg-[#154a7d] text-white font-semibold text-sm px-4.5 py-2.5 rounded-xl transition-all duration-200 shadow-md shadow-slate-900/10 cursor-pointer"
        >
          <Plus size={16} />
          Create New Program Order
        </button>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by client name, project name, or order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-slate-50/50"
          />
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 border border-slate-200 px-3.5 py-2 rounded-xl bg-slate-50/50 text-slate-600 text-xs">
            <Filter size={12} />
            <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-400">Priority:</span>
            <select 
              value={priorityFilter} 
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent focus:outline-none font-bold text-slate-700 cursor-pointer"
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-2 border border-slate-200 px-3.5 py-2 rounded-xl bg-slate-50/50 text-slate-600 text-xs">
            <Layers size={12} />
            <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-400">Stage:</span>
            <select 
              value={stageFilter} 
              onChange={(e) => setStageFilter(e.target.value)}
              className="bg-transparent focus:outline-none font-bold text-slate-700 cursor-pointer max-w-[150px]"
            >
              <option value="All">All Stages</option>
              {BUSINESS_STAGES.map(stage => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders List Container */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 py-16 flex flex-col items-center justify-center text-slate-400 gap-2 shadow-sm">
            <Layers size={36} strokeWidth={1.5} />
            <p className="text-sm font-semibold">No program orders matched your search criteria.</p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const isExpanded = expandedOrder === order.id;
            return (
              <div 
                key={order.id} 
                className={`bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all duration-300 ${
                  isExpanded ? 'ring-1 ring-blue-500 shadow-md' : 'hover:border-slate-300'
                }`}
              >
                {/* Collapsed Header View */}
                <div 
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  className="p-5 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-extrabold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {order.id}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getPriorityBadgeClass(order.priority)}`}>
                        {order.priority} Priority
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar size={12} />
                        Est: {order.deadline}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-800 leading-snug truncate">{order.projectName}</h3>
                    <p className="text-xs text-slate-500 font-semibold">{order.clientName}</p>
                  </div>

                  {/* Right side Stage progress & Actions */}
                  <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end flex-shrink-0">
                    <div className="space-y-2 w-48 text-right sm:block hidden">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                        <span className="text-slate-400 truncate">Stage: {order.currentStage}</span>
                        <span className="text-blue-600">{order.progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                        <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${order.progress}%` }}></div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700 bg-slate-100/70 border border-slate-200/50 px-3 py-1.5 rounded-xl">
                        {order.currentStage}
                      </span>
                      <button className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details Panel */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/50 p-6 space-y-6 animate-slide-down">
                    
                    {/* Top Action Panel (Specs + Handover stage) */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">
                      <div className="space-y-2">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Order Panels:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {order.panels.map(panel => (
                            <span key={panel} className="text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-xl">
                              {panel}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="space-y-1 w-full md:w-56">
                          <label className="text-xs text-slate-500 font-bold flex items-center gap-1.5 select-none">
                            <ArrowRightLeft size={13} className="text-blue-500" />
                            Advance Overall Stage:
                          </label>
                          <select
                            value={order.currentStage}
                            onChange={(e) => handleStageChange(order.id, e.target.value)}
                            className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 p-2 rounded-xl focus:outline-none focus:border-blue-500 cursor-pointer"
                          >
                            {BUSINESS_STAGES.map(stage => (
                              <option key={stage} value={stage}>{stage}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Milestones Sections Grid (7 separate columns representing columns of reference image) */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                        <Workflow className="text-[#0E3B68]" size={16} />
                        <h4 className="text-sm font-extrabold text-[#0E3B68] uppercase tracking-wider">Department Milestones & Subworks</h4>
                      </div>

                      {/* Desktop Grid Layout (4 cols in first row, 3 cols in second row) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {DEPARTMENTS.map(dept => {
                          const deptTasks = order.tasks.filter(t => t.assignedDept === dept.name);
                          const inputKey = `${order.id}-${dept.name}`;
                          const remarkVal = remarksInput[inputKey] !== undefined 
                            ? remarksInput[inputKey] 
                            : (order.deptRemarks?.[dept.name] || '');
                          const isSaved = savedFeedbacks[inputKey];

                          return (
                            <div 
                              key={dept.id} 
                              className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden hover:shadow-md transition-all duration-200"
                            >
                              {/* Section Title Header */}
                              <div className="bg-[#0B1E33] px-4 py-3 text-white flex items-center justify-between">
                                <span className="text-xs font-bold tracking-tight truncate">{dept.name}</span>
                                <span className="text-[9px] font-extrabold bg-blue-600/30 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded-full shrink-0">
                                  M{dept.id}
                                </span>
                              </div>

                              {/* Tasks Checklist */}
                              <div className="p-4 flex-1 space-y-2.5 max-h-52 overflow-y-auto border-b border-slate-100">
                                {deptTasks.length === 0 ? (
                                  <p className="text-[11px] text-slate-400 italic">No specific tasks defined.</p>
                                ) : (
                                  deptTasks.map(task => (
                                    <button
                                      key={task.id}
                                      onClick={() => handleToggleTask(order.id, task.id)}
                                      className="w-full flex items-start gap-2.5 text-left p-1.5 rounded hover:bg-slate-50 transition-all select-none"
                                    >
                                      <span className="text-blue-600 flex-shrink-0 mt-0.5">
                                        {task.completed ? <CheckSquare size={14} /> : <Square size={14} />}
                                      </span>
                                      <span className={`text-xs font-medium leading-tight ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                        {task.name}
                                      </span>
                                    </button>
                                  ))
                                )}
                              </div>

                              {/* Department specific Remark Box */}
                              <div className="p-3.5 bg-slate-50 space-y-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Remark box</span>
                                <div className="relative">
                                  <textarea
                                    value={remarkVal}
                                    onChange={(e) => setRemarksInput(prev => ({ ...prev, [inputKey]: e.target.value }))}
                                    placeholder="Enter status comment..."
                                    className="w-full h-16 p-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-slate-700 resize-none font-medium leading-tight"
                                  />
                                </div>
                                <div className="flex justify-between items-center">
                                  {isSaved ? (
                                    <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-1">
                                      <CheckCircle2 size={10} /> Saved
                                    </span>
                                  ) : (
                                    <span className="text-[9px] text-slate-400">Not saved yet</span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleSaveRemark(order.id, dept.name)}
                                    className="flex items-center gap-1 bg-[#0E3B68] hover:bg-[#154a7d] text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-sm cursor-pointer transition-colors"
                                  >
                                    <Save size={10} />
                                    Save
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Timeline Audit Logs Footer */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <History size={13} className="text-blue-500" />
                        Audit History Timeline
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-40 overflow-y-auto pr-1">
                        {order.history.map((h, idx) => (
                          <div key={idx} className="flex gap-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <div className="flex flex-col items-center">
                              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1"></div>
                            </div>
                            <div className="space-y-0.5">
                              <p className="font-extrabold text-slate-700">{h.stage}</p>
                              <p className="text-[10px] text-slate-400">{h.date} - by {h.user}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create Order Modal dialog overlay */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up">
            
            <div className="bg-gradient-to-r from-[#0E3B68] to-[#164a7d] p-5 text-white flex items-center gap-3">
              <Sparkles className="text-amber-300" size={18} />
              <div>
                <h3 className="font-bold text-base leading-tight">Create Switchgear Panel Order</h3>
                <p className="text-[10px] text-blue-200 font-medium">Record client parameters, priority weighting and scheduling deadlines.</p>
              </div>
            </div>

            <form onSubmit={handleCreateOrder} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Client / Customer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Reliance Industries, Tata Power"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Project Name / Site Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kalyan Grid Panel Upgrade"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Panels to Fabricate (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. 11KV VCB Panel, APFC Panel 400 KVAR"
                  value={panelInput}
                  onChange={(e) => setPanelInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Priority Weight</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 text-slate-700 bg-white cursor-pointer"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Completion Deadline</label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 text-slate-700"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-semibold bg-[#0E3B68] hover:bg-[#154a7d] text-white rounded-xl shadow-md cursor-pointer"
                >
                  Save Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
