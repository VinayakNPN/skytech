import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'HR' | 'DESIGN' | 'MECHANICAL' | 'ASSEMBLY' | 'ELECTRICAL' | 'TESTING' | 'STORE' | 'ACCOUNTS' | 'SERVICE';
}

export interface Order {
  id: string;
  customerName: string;
  productName: string;
  quantity: number;
  status: 'PLANNING' | 'PRODUCTION' | 'COMPLETED' | 'CANCELLED';
  currentStage: 'DESIGN' | 'MECHANICAL' | 'ASSEMBLY' | 'ELECTRICAL' | 'TESTING' | 'STORE' | 'ACCOUNTS' | 'SERVICE';
  progress: number;
  targetDate: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface Employee {
  id: string;
  name: string;
  department: string;
  role: string;
  present: boolean;
  activeTaskId?: string;
}

export interface Issue {
  id: string;
  orderId: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'RESOLVED';
  reportedAt: string;
}

export interface Announcement {
  message: string;
  expiresAt: number; // Timestamp
  createdAt: number;
}

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedOrderId: string | null;
  setSelectedOrderId: (orderId: string | null) => void;
  announcement: Announcement | null;
  setAnnouncement: (message: string, durationDays: number) => void;
  clearAnnouncement: () => void;
  
  // Mock Data lists that can be edited locally
  orders: Order[];
  employees: Employee[];
  issues: Issue[];
  
  // Actions
  addOrder: (order: Order) => void;
  addIssue: (issue: Issue) => void;
  updateOrderStage: (id: string, stage: Order['currentStage'], progress: number) => void;
}

// Helper to load/save announcements to localStorage for persistence
const getStoredAnnouncement = (): Announcement | null => {
  try {
    const data = localStorage.getItem('spms_announcement');
    if (!data) return null;
    const announcement = JSON.parse(data) as Announcement;
    if (Date.now() > announcement.expiresAt) {
      localStorage.removeItem('spms_announcement');
      return null;
    }
    return announcement;
  } catch {
    return null;
  }
};

export const useAppState = create<AppState>((set) => ({
  user: {
    id: '1',
    name: 'Vinayak',
    email: 'vinayak@skytechswitchgear.com',
    role: 'ADMIN',
  },
  setUser: (user) => set({ user }),
  activeTab: 'Dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),
  selectedOrderId: null,
  setSelectedOrderId: (orderId) => set({ selectedOrderId: orderId }),
  
  announcement: getStoredAnnouncement(),
  
  setAnnouncement: (message, durationDays) => {
    const expiresAt = Date.now() + durationDays * 24 * 60 * 60 * 1000;
    const newAnnouncement = { message, expiresAt, createdAt: Date.now() };
    localStorage.setItem('spms_announcement', JSON.stringify(newAnnouncement));
    set({ announcement: newAnnouncement });
  },
  
  clearAnnouncement: () => {
    localStorage.removeItem('spms_announcement');
    set({ announcement: null });
  },

  orders: [
    { id: 'ORD-2026-001', customerName: 'Larsen & Toubro Ltd', productName: '1600A Main LT Panel', quantity: 2, status: 'PRODUCTION', currentStage: 'ELECTRICAL', progress: 75, targetDate: '2026-07-15', priority: 'HIGH' },
    { id: 'ORD-2026-002', customerName: 'Tata Power DDL', productName: '11KV VCB Panel', quantity: 1, status: 'PRODUCTION', currentStage: 'ASSEMBLY', progress: 45, targetDate: '2026-07-22', priority: 'CRITICAL' },
    { id: 'ORD-2026-003', customerName: 'Siemens India Pvt Ltd', productName: 'APFC Capacitor Panel', quantity: 4, status: 'PLANNING', currentStage: 'DESIGN', progress: 15, targetDate: '2026-08-05', priority: 'MEDIUM' },
    { id: 'ORD-2026-004', customerName: 'Reliance Industries', productName: 'Double Busbar MCC Panel', quantity: 1, status: 'PRODUCTION', currentStage: 'MECHANICAL', progress: 30, targetDate: '2026-07-28', priority: 'HIGH' },
    { id: 'ORD-2026-005', customerName: 'Adani Energy Solutions', productName: 'Feeder Pillar Box LT', quantity: 12, status: 'COMPLETED', currentStage: 'SERVICE', progress: 100, targetDate: '2026-07-02', priority: 'LOW' }
  ],

  employees: [
    { id: 'EMP-001', name: 'Amit Sharma', department: 'Design', role: 'Senior Costing Engineer', present: true },
    { id: 'EMP-002', name: 'Rajesh Kumar', department: 'Mechanical', role: 'Fabrication Lead', present: true },
    { id: 'EMP-003', name: 'Sanjay Verma', department: 'Assembly', role: 'Busbar Specialist', present: true },
    { id: 'EMP-004', name: 'Sunil Dutt', department: 'Electrical', role: 'Wiring Technician', present: true },
    { id: 'EMP-005', name: 'Manoj Tiwari', department: 'Testing', role: 'Quality Assurance Inspector', present: false },
    { id: 'EMP-006', name: 'Vikram Singh', department: 'Store', role: 'Store Manager', present: true },
    { id: 'EMP-007', name: 'Rakesh Yadav', department: 'Accounts', role: 'Billing Administrator', present: true },
    { id: 'EMP-008', name: 'Pradeep Joshi', department: 'Electrical', role: 'Wiring Technician', present: true },
  ],

  issues: [
    { id: 'ISS-001', orderId: 'ORD-2026-002', description: 'Delay in copper busbar procurement from store', severity: 'CRITICAL', status: 'OPEN', reportedAt: '2026-07-09' },
    { id: 'ISS-002', orderId: 'ORD-2026-004', description: 'CAD Drawing correction required for busbar alignment', severity: 'MEDIUM', status: 'OPEN', reportedAt: '2026-07-10' },
  ],

  addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
  addIssue: (issue) => set((state) => ({ issues: [issue, ...state.issues] })),
  updateOrderStage: (id, stage, progress) => set((state) => ({
    orders: state.orders.map((o) => o.id === id ? { ...o, currentStage: stage, progress } : o)
  }))
}));
