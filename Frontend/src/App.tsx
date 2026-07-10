import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { MainLayout } from './layouts/MainLayout';
import { useAppState, type Order } from './lib/store';
import { DashboardOverview } from './features/dashboard/components/DashboardOverview';
import { OrdersPage } from './features/orders/components/OrdersPage';
import { InventoryPage } from './features/inventory/components/InventoryPage';
import { EmployeesPage } from './features/employees/components/EmployeesPage';
import { Shield, ArrowRight } from 'lucide-react';

const STAGES: { key: Order['currentStage']; label: string; desc: string; next: Order['currentStage'] | null; progress: number }[] = [
  { key: 'DESIGN', label: 'Design & CAD', desc: 'CAD drawings & COSTING approvals', next: 'MECHANICAL', progress: 30 },
  { key: 'MECHANICAL', label: 'Mechanical', desc: 'Fabrication & size audit', next: 'ASSEMBLY', progress: 45 },
  { key: 'ASSEMBLY', label: 'Assembly & Busbar', desc: 'Copper sizing & fitting', next: 'ELECTRICAL', progress: 75 },
  { key: 'ELECTRICAL', label: 'Electrical Wiring', desc: 'Wiring & auxiliary circuits', next: 'TESTING', progress: 90 },
  { key: 'TESTING', label: 'Quality Testing', desc: 'Insulation & safety runs', next: 'STORE', progress: 95 },
  { key: 'STORE', label: 'Store & Dispatch', desc: 'Final audit & pack out', next: null, progress: 100 },
];

function WorkflowEngineView() {
  const { orders, updateOrderStage } = useAppState();

  const handleNextStage = (orderId: string, current: string) => {
    const stageInfo = STAGES.find(s => s.key === current);
    if (!stageInfo || !stageInfo.next) return;
    updateOrderStage(orderId, stageInfo.next, stageInfo.progress);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="font-heading text-md font-extrabold text-[#213448]">Workflow Handover Board</h3>
        <p className="text-xs text-[#213448]/80">Monitor active panel construction stages and authorize departmental handovers</p>
      </div>

      {/* Horizontal Scrollable Stages Container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 pb-4">
        {STAGES.map((stage) => {
          const stageOrders = orders.filter(o => o.currentStage === stage.key && o.status !== 'COMPLETED');
          return (
            <div key={stage.key} className="glass rounded-xl border border-[#2e3f53]/30 p-4 flex flex-col h-[520px] shrink-0">
              {/* Stage Header */}
              <div className="border-b border-[#2e3f53]/45 pb-3 mb-3">
                <span className="text-[9px] bg-[#94B4C1]/15 text-[#94B4C1] border border-[#94B4C1]/20 px-2 py-0.5 rounded font-extrabold tracking-wider uppercase block w-max">
                  {stage.key}
                </span>
                <h4 className="text-xs font-bold text-white mt-1.5 leading-tight">{stage.label}</h4>
                <p className="text-[9px] text-slate-400 mt-0.5 leading-snug">{stage.desc}</p>
              </div>

              {/* Card List Area */}
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                {stageOrders.length > 0 ? (
                  stageOrders.map((order) => (
                    <div key={order.id} className="p-3 rounded-lg bg-[#182736]/65 border border-[#2e3f53]/55 flex flex-col justify-between space-y-3 hover:bg-[#182736]/90 transition-all duration-200 group">
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] font-mono font-bold text-[#94B4C1]">{order.id}</span>
                          <span className={`text-[7px] font-extrabold px-1 py-0.2 rounded border uppercase tracking-wider ${
                            order.priority === 'CRITICAL' || order.priority === 'HIGH'
                              ? 'bg-rose-500/25 text-rose-300 border-rose-500/35'
                              : 'bg-slate-700 text-slate-350 border-slate-650'
                          }`}>
                            {order.priority}
                          </span>
                        </div>
                        <h5 className="text-[11px] font-extrabold text-white mt-1.5 truncate">{order.customerName}</h5>
                        <p className="text-[9px] text-slate-400 truncate mt-0.5">{order.productName}</p>
                      </div>

                      {/* Progress widget */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[8px] text-slate-400">
                          <span>Progress</span>
                          <span className="font-mono text-white font-bold">{order.progress}%</span>
                        </div>
                        <div className="w-full bg-[#182736] h-1 rounded-full overflow-hidden">
                          <div className="h-full bg-[#94B4C1]" style={{ width: `${order.progress}%` }} />
                        </div>
                      </div>

                      {/* Transition button */}
                      {stage.next ? (
                        <button
                          onClick={() => handleNextStage(order.id, order.currentStage)}
                          className="w-full py-1.5 px-2 bg-[#94B4C1] hover:bg-[#94B4C1]/90 text-[#213448] rounded font-bold text-[9px] transition-all transform active:scale-95 flex items-center justify-center space-x-1 cursor-pointer shadow-sm hover:scale-[1.02]"
                        >
                          <span>Handover</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      ) : (
                        <div className="text-[8px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 text-center py-1 rounded">
                          Ready for Release
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="h-32 rounded-lg border border-dashed border-[#2e3f53]/30 flex flex-col items-center justify-center text-slate-500 text-[10px] p-2 text-center select-none">
                    <span>No active jobs</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AuditLogsView() {
  return (
    <div className="glass rounded-2xl border border-[#2e3f53]/35 p-6 space-y-6">
      <div>
        <h3 className="font-heading text-md font-bold text-white">System Audit Logs</h3>
        <p className="text-xs text-slate-350">Chronological history of security, manufacturing, and data operations</p>
      </div>

      <div className="space-y-3.5">
        {[
          { action: 'Announcement Published', details: 'Global alert banner published: "Testing lab audited. All panels will undergo secondary HV checks today..." for 7 days.', user: 'Vinayak (ADMIN)', time: 'Just now' },
          { action: 'Production Order Created', details: 'New build order ORD-2026-004 registered for Reliance Industries.', user: 'Vinayak (ADMIN)', time: '2 hours ago' },
          { action: 'Material Allocation Approved', details: 'REQ-887 for 2 rolls of Control Cabling allocated to Sunil Dutt.', user: 'Vikram Singh (STORE)', time: '1 day ago' },
          { action: 'Task Status Updated', details: 'Task "Chassis welding size audit" for ORD-2026-002 moved to COMPLETED.', user: 'Rajesh Kumar (MECHANICAL)', time: '2 days ago' },
        ].map((log, idx) => (
          <div key={idx} className="p-4 rounded-lg bg-[#182736]/50 border border-[#2e3f53]/55 flex items-center justify-between text-xs hover:bg-[#182736]/80 transition-colors">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-[#94B4C1] uppercase tracking-wide text-[10px]">{log.action}</span>
                <span className="text-[10px] text-slate-400 font-medium">by {log.user}</span>
              </div>
              <p className="text-slate-200 font-medium">{log.details}</p>
            </div>
            <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-4">{log.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const { activeTab } = useAppState();

  const renderContent = () => {
    switch (activeTab) {
      case 'Dashboard':
        return <DashboardOverview />;
      case 'Orders & Projects':
        return <OrdersPage />;
      case 'Workflow Engine':
        return <WorkflowEngineView />;
      case 'Inventory (Store)':
        return <InventoryPage />;
      case 'Employee Management':
        return <EmployeesPage />;
      case 'Audit Logs':
        return <AuditLogsView />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Shield className="w-10 h-10 text-[#1a233d] animate-pulse mb-3" />
            <p className="text-sm">This section is currently under development.</p>
          </div>
        );
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <MainLayout>
        {renderContent()}
      </MainLayout>
    </QueryClientProvider>
  );
}

export default App;
