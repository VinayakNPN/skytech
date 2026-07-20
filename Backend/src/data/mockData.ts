export interface Task {
  id: string;
  name: string;
  completed: boolean;
  assignedDept: string;
}

export interface HistoryEntry {
  stage: string;
  date: string;
  status: string;
  user: string;
}

export interface Order {
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
  deptRemarks: Record<string, string>; // Maps department name to its current remark
  history: HistoryEntry[];
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  role: string;
  status: 'Active' | 'On Leave' | 'Suspended';
}

export interface MaterialRequest {
  id: string;
  orderId: string;
  itemName: string;
  quantity: number;
  requestedBy: string;
  requestedDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export const BUSINESS_STAGES = [
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

export const DEVELOPMENT_STAGES = [
  'Requirement',
  'Planning',
  'System Design',
  'Development',
  'Testing',
  'Deployment',
  'Training',
  'Support'
];

export const DEPARTMENTS = [
  'Design and Costing dept.',
  'Mechanical Dept.',
  'Assembly & Busbar Dept.',
  'Electrical Dept.',
  'Testing Dept.',
  'Store Dept.',
  'Support & Service Dept.'
];

export const DEFAULT_TASKS_BY_DEPT: Record<string, string[]> = {
  'Design and Costing dept.': [
    'Ga Drawing',
    'SLD',
    'Control Drawing',
    'All Drawing Approve',
    'BOQ',
    'Job Loaded',
    'Job file Send to Dept.'
  ],
  'Mechanical Dept.': [
    'Job File Received',
    'Sheet Cutting',
    'Banding',
    'Fabrication',
    'Painting',
    'Dispatch to Busbar Dept.'
  ],
  'Assembly & Busbar Dept.': [
    'Job File Received',
    'Pannel Assemble',
    'Busbar & Switchgear fitted',
    'Busbar tighting',
    'Accessories Fitted',
    'Dispatch to Electrical Dept.'
  ],
  'Electrical Dept.': [
    'Job File Received',
    'Power Wiring',
    'Control Wiring',
    'Accessories Wiring',
    'Dispatch to Testing Dept.'
  ],
  'Testing Dept.': [
    'Job File Received',
    'Short Material List',
    'Panel operation Test',
    'All Parameter Checked by Approve list',
    'Ready for Dispatch.'
  ],
  'Store Dept.': [
    'Job File Received',
    'Order Material Shorlisted',
    'Material Order',
    'Material Received',
    'Material Handover to Dept.'
  ],
  'Support & Service Dept.': [
    'Service Call Received',
    'Assigned Engineer',
    'Service call done',
    'Submit service report'
  ]
};

// Generates complete checklist for all departments
export function generateDefaultTasks(orderId: string): Task[] {
  const tasksList: Task[] = [];
  let taskIdCounter = 1;
  
  DEPARTMENTS.forEach(dept => {
    const taskNames = DEFAULT_TASKS_BY_DEPT[dept] || [];
    taskNames.forEach(name => {
      tasksList.push({
        id: `${orderId}-task-${taskIdCounter++}`,
        name,
        completed: false,
        assignedDept: dept
      });
    });
  });

  return tasksList;
}

export let mockOrders: Order[] = [
  {
    id: 'ORD-001',
    clientName: 'Reliance Industries Ltd',
    projectName: 'Majiwada Substation Phase 2',
    panels: ['33KV HT Switchgear Panel', '11KV VCB Panel'],
    priority: 'High',
    currentStage: 'Mechanical Dept.',
    progress: 40,
    startDate: '2026-07-01',
    deadline: '2026-08-15',
    remarks: [
      'Inquiry details received from client.',
      'Costing finalized and approved by accounts team.',
      'Approved drawings shared by Design department.'
    ],
    deptRemarks: {
      'Design and Costing dept.': 'Approved GA & SLD drawings shared.',
      'Mechanical Dept.': 'Fabrication completed, sheet pre-treatment started.',
      'Store Dept.': 'Long lead materials ordered.'
    },
    tasks: generateDefaultTasks('ORD-001'),
    history: [
      { stage: 'Inquiry', date: '2026-07-01', status: 'Completed', user: 'Vinayak (Admin)' },
      { stage: 'Design & Costing', date: '2026-07-05', status: 'Completed', user: 'Neha Sharma (Design Head)' },
      { stage: 'Quotation Offer', date: '2026-07-08', status: 'Completed', user: 'Rakesh Patel (Sales)' },
      { stage: 'Client Approval', date: '2026-07-12', status: 'Completed', user: 'Reliance Project Manager' },
      { stage: 'Mechanical Dept.', date: '2026-07-15', status: 'In Progress', user: 'Amit Kumar (Production Executive)' }
    ]
  },
  {
    id: 'ORD-002',
    clientName: 'Tata Power Company',
    projectName: 'Kalyan Grid Panel Upgrade',
    panels: ['LT Distribution Board (800A)', 'APFC Panel (400 KVAR)'],
    priority: 'Medium',
    currentStage: 'Electrical Dept.',
    progress: 60,
    startDate: '2026-06-25',
    deadline: '2026-07-30',
    remarks: [
      'BOM generated and items ordered.',
      'Mechanical fabrication completed. Pre-treatment done.',
      'Busbars installed. Electrical component wiring underway.'
    ],
    deptRemarks: {
      'Design and Costing dept.': 'All control drawings approved by client.',
      'Mechanical Dept.': 'Completed sheet cutting and bending.',
      'Assembly & Busbar Dept.': 'Copper busbars installed with heat-shrink sleeves.',
      'Store Dept.': 'All accessories received and issued to shopfloor.'
    },
    tasks: generateDefaultTasks('ORD-002'),
    history: [
      { stage: 'Inquiry', date: '2026-06-25', status: 'Completed', user: 'Vinayak (Admin)' },
      { stage: 'Design & Costing', date: '2026-06-27', status: 'Completed', user: 'Neha Sharma (Design Head)' },
      { stage: 'Quotation Offer', date: '2026-06-29', status: 'Completed', user: 'Rakesh Patel (Sales)' },
      { stage: 'Client Approval', date: '2026-07-02', status: 'Completed', user: 'Tata Power Procurement' },
      { stage: 'Mechanical Dept.', date: '2026-07-06', status: 'Completed', user: 'Amit Kumar (Production Executive)' },
      { stage: 'Assembly & Busbar Dept.', date: '2026-07-11', status: 'Completed', user: 'Sanjay Singh (Assembly Supervisor)' },
      { stage: 'Electrical Dept.', date: '2026-07-14', status: 'In Progress', user: 'Karan Dave (Electrical Engineer)' }
    ]
  },
  {
    id: 'ORD-003',
    clientName: 'Adani Electricity',
    projectName: 'Dahanu Thermal Plant Auxiliary Switchboard',
    panels: ['Motor Control Center (MCC) Panel'],
    priority: 'High',
    currentStage: 'Design & Costing',
    progress: 10,
    startDate: '2026-07-14',
    deadline: '2026-09-10',
    remarks: [
      'Inquiry details processed.',
      'Single Line Diagram (SLD) creation initiated by design team.'
    ],
    deptRemarks: {
      'Design and Costing dept.': 'Single Line Diagram (SLD) drafted, waiting for confirmation.'
    },
    tasks: generateDefaultTasks('ORD-003'),
    history: [
      { stage: 'Inquiry', date: '2026-07-14', status: 'Completed', user: 'Vinayak (Admin)' },
      { stage: 'Design & Costing', date: '2026-07-16', status: 'In Progress', user: 'Neha Sharma (Design Head)' }
    ]
  }
];

// Seed completion of some default tasks for initial visual richness
mockOrders[0].tasks.forEach(t => {
  if (t.assignedDept === 'Design and Costing dept.') t.completed = true;
  if (t.assignedDept === 'Mechanical Dept.' && (t.name === 'Job File Received' || t.name === 'Sheet Cutting')) t.completed = true;
  if (t.assignedDept === 'Store Dept.' && (t.name === 'Job File Received' || t.name === 'Order Material Shorlisted' || t.name === 'Material Order')) t.completed = true;
});
mockOrders[1].tasks.forEach(t => {
  if (t.assignedDept === 'Design and Costing dept.') t.completed = true;
  if (t.assignedDept === 'Mechanical Dept.') t.completed = true;
  if (t.assignedDept === 'Assembly & Busbar Dept.' && t.name !== 'Dispatch to Electrical Dept.') t.completed = true;
  if (t.assignedDept === 'Store Dept.') t.completed = true;
  if (t.assignedDept === 'Electrical Dept.' && (t.name === 'Job File Received' || t.name === 'Power Wiring')) t.completed = true;
});

export let mockEmployees: Employee[] = [
  { id: 'EMP-001', name: 'Vinayak', email: 'vinayak@skytechswitchgear.com', department: 'Management', designation: 'Director', role: 'Admin', status: 'Active' },
  { id: 'EMP-002', name: 'Neha Sharma', email: 'neha.sharma@skytechswitchgear.com', department: 'Design', designation: 'Design Head', role: 'Design Dept.', status: 'Active' },
  { id: 'EMP-003', name: 'Amit Kumar', email: 'amit.kumar@skytechswitchgear.com', department: 'Mechanical', designation: 'Production Supervisor', role: 'Mechanical Dept.', status: 'Active' },
  { id: 'EMP-004', name: 'Sanjay Singh', email: 'sanjay.singh@skytechswitchgear.com', department: 'Assembly & Busbar', designation: 'Assembly Head', role: 'Assembly Dept.', status: 'Active' },
  { id: 'EMP-005', name: 'Karan Dave', email: 'karan.dave@skytechswitchgear.com', department: 'Electrical', designation: 'Senior Electrical Engineer', role: 'Electrical Dept.', status: 'Active' },
  { id: 'EMP-006', name: 'Vijay Patil', email: 'vijay.patil@skytechswitchgear.com', department: 'Testing', designation: 'Testing Executive', role: 'Testing Dept.', status: 'Active' },
  { id: 'EMP-007', name: 'Rajesh Mehta', email: 'rajesh.mehta@skytechswitchgear.com', department: 'Store', designation: 'Inventory Officer', role: 'Store Dept.', status: 'Active' },
  { id: 'EMP-008', name: 'Simran Kaur', email: 'simran.kaur@skytechswitchgear.com', department: 'Accounts', designation: 'Chief Accountant', role: 'Accounts Dept.', status: 'Active' },
  { id: 'EMP-009', name: 'Sunil Gavaskar', email: 'sunil.g@skytechswitchgear.com', department: 'Service', designation: 'Service Engineer', role: 'Service Dept.', status: 'On Leave' },
  { id: 'EMP-010', name: 'Pankaj', email: 'pankaj@skytechswitchgear.com', department: 'Management', designation: 'Admin', role: 'Admin', status: 'Active' },
  { id: 'EMP-011', name: 'Rajesh Kumar', email: 'rajesh.k@skytechswitchgear.com', department: 'Service', designation: 'Site Engineer', role: 'Service Dept.', status: 'Active' },
  { id: 'EMP-012', name: 'Amit Mishra', email: 'amit.m@skytechswitchgear.com', department: 'Assembly & Busbar', designation: 'Electrician', role: 'Assembly Dept.', status: 'Active' },
  { id: 'EMP-013', name: 'Suresh Khanna', email: 'suresh.k@skytechswitchgear.com', department: 'Testing', designation: 'Technician', role: 'Testing Dept.', status: 'Active' },
  { id: 'EMP-014', name: 'Vijay Tiwari', email: 'vijay.t@skytechswitchgear.com', department: 'Mechanical', designation: 'Helper', role: 'Mechanical Dept.', status: 'Active' },
  { id: 'EMP-015', name: 'Priya Sharma', email: 'priya.s@skytechswitchgear.com', department: 'Admin', designation: 'Office Staff', role: 'Admin', status: 'On Leave' },
  { id: 'EMP-016', name: 'Rohan Verma', email: 'rohan.v@skytechswitchgear.com', department: 'Design', designation: 'CAD Draftsman', role: 'Design Dept.', status: 'Active' },
  { id: 'EMP-017', name: 'Abhishek Singh', email: 'abhishek.s@skytechswitchgear.com', department: 'Mechanical', designation: 'Fabricator', role: 'Mechanical Dept.', status: 'Active' },
  { id: 'EMP-018', name: 'Vikram Malhotra', email: 'vikram.m@skytechswitchgear.com', department: 'Assembly & Busbar', designation: 'Busbar Fitter', role: 'Assembly Dept.', status: 'Active' },
  { id: 'EMP-019', name: 'Manoj Joshi', email: 'manoj.j@skytechswitchgear.com', department: 'Electrical', designation: 'Wireman', role: 'Electrical Dept.', status: 'Active' },
  { id: 'EMP-020', name: 'Deepak Gupta', email: 'deepak.g@skytechswitchgear.com', department: 'Electrical', designation: 'Wireman', role: 'Electrical Dept.', status: 'Active' },
  { id: 'EMP-021', name: 'Sanjay Dutt', email: 'sanjay.d@skytechswitchgear.com', department: 'Testing', designation: 'Testing Assistant', role: 'Testing Dept.', status: 'Active' },
  { id: 'EMP-022', name: 'Sandeep Kumar', email: 'sandeep.k@skytechswitchgear.com', department: 'Store', designation: 'Store Assistant', role: 'Store Dept.', status: 'Active' },
  { id: 'EMP-023', name: 'Anita Desai', email: 'anita.d@skytechswitchgear.com', department: 'Accounts', designation: 'Accounts Assistant', role: 'Accounts Dept.', status: 'On Leave' },
  { id: 'EMP-024', name: 'Harpreet Singh', email: 'harpreet.s@skytechswitchgear.com', department: 'Service', designation: 'Service Technician', role: 'Service Dept.', status: 'Active' }
];

export let mockMaterialRequests: MaterialRequest[] = [
  { id: 'REQ-001', orderId: 'ORD-001', itemName: '630A 3P 36KA ACB (Siemens)', quantity: 2, requestedBy: 'Amit Kumar', requestedDate: '2026-07-15', status: 'Approved' },
  { id: 'REQ-002', orderId: 'ORD-002', itemName: 'Copper Busbar 50x10mm', quantity: 45, requestedBy: 'Sanjay Singh', requestedDate: '2026-07-16', status: 'Approved' },
  { id: 'REQ-003', orderId: 'ORD-002', itemName: 'Digital Multifunction Meter (Schneider)', quantity: 4, requestedBy: 'Karan Dave', requestedDate: '2026-07-17', status: 'Pending' },
  { id: 'REQ-004', orderId: 'ORD-003', itemName: '11KV Cable Termination Kit', quantity: 3, requestedBy: 'Neha Sharma', requestedDate: '2026-07-18', status: 'Pending' }
];

export interface SystemLog {
  timestamp: string;
  service: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export let systemLogs: SystemLog[] = [
  { timestamp: new Date().toISOString(), service: 'Next.js App', level: 'info', message: 'Client session established' },
  { timestamp: new Date(Date.now() - 5000).toISOString(), service: 'API Server', level: 'info', message: 'GET /api/dashboard/stats returned 200 OK (8ms)' },
  { timestamp: new Date(Date.now() - 15000).toISOString(), service: 'PostgreSQL DB', level: 'info', message: 'Fetched active order list (3 items, 2ms)' },
  { timestamp: new Date(Date.now() - 60000).toISOString(), service: 'Microsoft Graph', level: 'info', message: 'Synced mail inbox with Entra ID' }
];

export function logSystemEvent(service: string, message: string, level: 'info' | 'warn' | 'error' = 'info') {
  systemLogs.unshift({
    timestamp: new Date().toISOString(),
    service,
    level,
    message
  });
  if (systemLogs.length > 50) {
    systemLogs.pop();
  }
}

// Data Utility Methods
export const getOrders = () => mockOrders;

export const getOrderById = (id: string) => mockOrders.find(o => o.id === id);

export const createOrder = (orderData: Partial<Order>) => {
  const newId = `ORD-0${mockOrders.length + 1}`;
  const newOrder: Order = {
    id: newId,
    clientName: orderData.clientName || 'Unknown Client',
    projectName: orderData.projectName || 'New Project',
    panels: orderData.panels || [],
    priority: orderData.priority || 'Medium',
    currentStage: 'Inquiry',
    progress: 5,
    startDate: new Date().toISOString().split('T')[0],
    deadline: orderData.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    remarks: ['Order file opened in system.'],
    deptRemarks: {},
    tasks: generateDefaultTasks(newId),
    history: [
      { stage: 'Inquiry', date: new Date().toISOString().split('T')[0], status: 'In Progress', user: 'Vinayak (Admin)' }
    ]
  };
  mockOrders.push(newOrder);
  logSystemEvent('API Server', `Created new order ${newId} for ${newOrder.clientName}`, 'info');
  return newOrder;
};

export const updateOrderStage = (id: string, newStage: string, user: string) => {
  const order = mockOrders.find(o => o.id === id);
  if (!order) return null;

  const currentIdx = BUSINESS_STAGES.indexOf(order.currentStage);
  const nextIdx = BUSINESS_STAGES.indexOf(newStage);

  if (nextIdx >= 0) {
    order.currentStage = newStage;
    order.progress = Math.round((nextIdx / (BUSINESS_STAGES.length - 1)) * 100);
    order.history.push({
      stage: newStage,
      date: new Date().toISOString().split('T')[0],
      status: 'In Progress',
      user
    });
    order.remarks.push(`Workflow moved to ${newStage} by ${user}.`);
    logSystemEvent('API Server', `Order ${id} transitioned to stage ${newStage} by ${user}`, 'info');
  }
  return order;
};

export const updateOrderDeptRemark = (id: string, dept: string, remark: string, user: string) => {
  const order = mockOrders.find(o => o.id === id);
  if (!order) return null;
  order.deptRemarks[dept] = remark;
  order.remarks.push(`[${dept}] Remark updated: "${remark}" by ${user}`);
  logSystemEvent('API Server', `Order ${id} updated remark for ${dept}`, 'info');
  return order;
};

export const toggleTaskCompletion = (orderId: string, taskId: string) => {
  const order = mockOrders.find(o => o.id === orderId);
  if (!order) return null;
  const task = order.tasks.find(t => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
    logSystemEvent('API Server', `Order ${orderId} task "${task.name}" completion toggled to ${task.completed}`, 'info');
  }
  return order;
};

export const getEmployees = () => mockEmployees;

export const getMaterialRequests = () => mockMaterialRequests;

export const createMaterialRequest = (requestData: Partial<MaterialRequest>) => {
  const newRequest: MaterialRequest = {
    id: `REQ-0${mockMaterialRequests.length + 1}`,
    orderId: requestData.orderId || 'ORD-001',
    itemName: requestData.itemName || '',
    quantity: requestData.quantity || 1,
    requestedBy: requestData.requestedBy || 'System',
    requestedDate: new Date().toISOString().split('T')[0],
    status: 'Pending'
  };
  mockMaterialRequests.push(newRequest);
  logSystemEvent('API Server', `Material request ${newRequest.id} created for ${newRequest.itemName}`, 'info');
  return newRequest;
};

export const updateMaterialRequestStatus = (id: string, status: 'Approved' | 'Rejected') => {
  const req = mockMaterialRequests.find(r => r.id === id);
  if (req) {
    req.status = status;
    logSystemEvent('API Server', `Material request ${id} ${status.toLowerCase()}`, 'info');
  }
  return req;
};

// ==========================================
// Employee Management Sub-system Prototype
// ==========================================

export interface EmployeeAttendance {
  id: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  status: 'Present' | 'Late' | 'Absent' | 'On Leave';
}

export interface EmployeeTask {
  id: string;
  title: string;
  assignedTo: string; // Employee Name
  dueDate: string;
  status: 'Assigned' | 'In Progress' | 'Done' | 'Overdue';
}

export interface VisitReport {
  id: string;
  title: string;
  client: string;
  location: string;
  engineer: string;
  date: string;
  status: 'Scheduled' | 'Completed' | 'In Progress';
  notes: string;
}

export interface LeaveApplication {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  type: 'Casual' | 'Sick' | 'Earned';
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface RunningJobStatus {
  id: string;
  title: string;
  description: string;
  progress: number;
  status: 'Active' | 'In Progress' | 'Assigned' | 'Suspended';
}

export interface SalarySlip {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  basic: number;
  hra: number;
  allowance: number;
  deductions: number;
  netPay: number;
  status: 'Paid' | 'Pending';
}

// Seed datasets
export let mockEmployeeAttendance: EmployeeAttendance[] = [
  { id: 'ATT-001', employeeId: 'EMP-011', employeeName: 'Rajesh Kumar', designation: 'Site Engineer', date: '2026-07-19', clockIn: '9:02 AM', clockOut: null, status: 'Present' },
  { id: 'ATT-002', employeeId: 'EMP-012', employeeName: 'Amit Mishra', designation: 'Electrician', date: '2026-07-19', clockIn: '9:15 AM', clockOut: null, status: 'Present' },
  { id: 'ATT-003', employeeId: 'EMP-013', employeeName: 'Suresh Khanna', designation: 'Technician', date: '2026-07-19', clockIn: '9:48 AM', clockOut: null, status: 'Late' },
  { id: 'ATT-004', employeeId: 'EMP-014', employeeName: 'Vijay Tiwari', designation: 'Helper', date: '2026-07-19', clockIn: null, clockOut: null, status: 'Absent' },
  { id: 'ATT-005', employeeId: 'EMP-015', employeeName: 'Priya Sharma', designation: 'Office Staff', date: '2026-07-19', clockIn: null, clockOut: null, status: 'On Leave' },
  { id: 'ATT-006', employeeId: 'EMP-009', employeeName: 'Sunil Gavaskar', designation: 'Service Engineer', date: '2026-07-19', clockIn: null, clockOut: null, status: 'On Leave' },
  { id: 'ATT-007', employeeId: 'EMP-023', employeeName: 'Anita Desai', designation: 'Accounts Assistant', date: '2026-07-19', clockIn: null, clockOut: null, status: 'On Leave' },
  // 16 other present employees (17 present + 2 late = 19 present total):
  { id: 'ATT-008', employeeId: 'EMP-001', employeeName: 'Vinayak', designation: 'Director', date: '2026-07-19', clockIn: '8:50 AM', clockOut: null, status: 'Present' },
  { id: 'ATT-009', employeeId: 'EMP-002', employeeName: 'Neha Sharma', designation: 'Design Head', date: '2026-07-19', clockIn: '8:55 AM', clockOut: null, status: 'Present' },
  { id: 'ATT-010', employeeId: 'EMP-003', employeeName: 'Amit Kumar', designation: 'Production Supervisor', date: '2026-07-19', clockIn: '9:00 AM', clockOut: null, status: 'Present' },
  { id: 'ATT-011', employeeId: 'EMP-004', employeeName: 'Sanjay Singh', designation: 'Assembly Head', date: '2026-07-19', clockIn: '9:05 AM', clockOut: null, status: 'Present' },
  { id: 'ATT-012', employeeId: 'EMP-005', employeeName: 'Karan Dave', designation: 'Senior Electrical Engineer', date: '2026-07-19', clockIn: '9:08 AM', clockOut: null, status: 'Present' },
  { id: 'ATT-013', employeeId: 'EMP-006', employeeName: 'Vijay Patil', designation: 'Testing Executive', date: '2026-07-19', clockIn: '9:10 AM', clockOut: null, status: 'Present' },
  { id: 'ATT-014', employeeId: 'EMP-007', employeeName: 'Rajesh Mehta', designation: 'Inventory Officer', date: '2026-07-19', clockIn: '8:45 AM', clockOut: null, status: 'Present' },
  { id: 'ATT-015', employeeId: 'EMP-008', employeeName: 'Simran Kaur', designation: 'Chief Accountant', date: '2026-07-19', clockIn: '8:58 AM', clockOut: null, status: 'Present' },
  { id: 'ATT-016', employeeId: 'EMP-010', employeeName: 'Pankaj', designation: 'Admin', date: '2026-07-19', clockIn: '8:40 AM', clockOut: null, status: 'Present' },
  { id: 'ATT-017', employeeId: 'EMP-016', employeeName: 'Rohan Verma', designation: 'CAD Draftsman', date: '2026-07-19', clockIn: '9:12 AM', clockOut: null, status: 'Present' },
  { id: 'ATT-018', employeeId: 'EMP-017', employeeName: 'Abhishek Singh', designation: 'Fabricator', date: '2026-07-19', clockIn: '9:03 AM', clockOut: null, status: 'Present' },
  { id: 'ATT-019', employeeId: 'EMP-018', employeeName: 'Vikram Malhotra', designation: 'Busbar Fitter', date: '2026-07-19', clockIn: '9:14 AM', clockOut: null, status: 'Present' },
  { id: 'ATT-020', employeeId: 'EMP-019', employeeName: 'Manoj Joshi', designation: 'Wireman', date: '2026-07-19', clockIn: '9:18 AM', clockOut: null, status: 'Present' },
  { id: 'ATT-021', employeeId: 'EMP-020', employeeName: 'Deepak Gupta', designation: 'Wireman', date: '2026-07-19', clockIn: '9:25 AM', clockOut: null, status: 'Late' },
  { id: 'ATT-022', employeeId: 'EMP-021', employeeName: 'Sanjay Dutt', designation: 'Testing Assistant', date: '2026-07-19', clockIn: '9:01 AM', clockOut: null, status: 'Present' },
  { id: 'ATT-023', employeeId: 'EMP-022', employeeName: 'Sandeep Kumar', designation: 'Store Assistant', date: '2026-07-19', clockIn: '8:59 AM', clockOut: null, status: 'Present' },
  { id: 'ATT-024', employeeId: 'EMP-024', employeeName: 'Harpreet Singh', designation: 'Service Technician', date: '2026-07-19', clockIn: null, clockOut: null, status: 'Absent' }
];

export let mockEmployeeTasks: EmployeeTask[] = [
  { id: 'EMP-TSK-001', title: 'Panel wiring — Rudrapur', assignedTo: 'Rajesh Kumar', dueDate: '20 Jun', status: 'In Progress' },
  { id: 'EMP-TSK-002', title: 'HMI commissioning check', assignedTo: 'Amit Mishra', dueDate: '22 Jun', status: 'Assigned' },
  { id: 'EMP-TSK-003', title: 'Load testing — Kanpur site', assignedTo: 'Suresh Khanna', dueDate: '17 Jun', status: 'Done' },
  { id: 'EMP-TSK-004', title: 'Cable tray installation', assignedTo: 'Vijay Tiwari', dueDate: '16 Jun', status: 'Overdue' },
  // Additional tasks to total 11 Active Tasks (4 Assigned + 7 In Progress)
  { id: 'EMP-TSK-005', title: 'Busbar alignment check', assignedTo: 'Sanjay Singh', dueDate: '21 Jun', status: 'In Progress' },
  { id: 'EMP-TSK-006', title: 'Single line diagram revision', assignedTo: 'Rohan Verma', dueDate: '20 Jun', status: 'In Progress' },
  { id: 'EMP-TSK-007', title: 'Material dispatch inspection', assignedTo: 'Rajesh Mehta', dueDate: '23 Jun', status: 'Assigned' },
  { id: 'EMP-TSK-008', title: 'Control panel wiring layout', assignedTo: 'Karan Dave', dueDate: '21 Jun', status: 'In Progress' },
  { id: 'EMP-TSK-009', title: 'Gland plate drilling', assignedTo: 'Abhishek Singh', dueDate: '22 Jun', status: 'In Progress' },
  { id: 'EMP-TSK-010', title: 'MCC Panel testing', assignedTo: 'Vijay Patil', dueDate: '24 Jun', status: 'Assigned' },
  { id: 'EMP-TSK-011', title: 'Auxiliary wiring checks', assignedTo: 'Deepak Gupta', dueDate: '23 Jun', status: 'In Progress' },
  { id: 'EMP-TSK-012', title: 'AC DB Board inspection', assignedTo: 'Manoj Joshi', dueDate: '24 Jun', status: 'In Progress' },
  { id: 'EMP-TSK-013', title: 'Earth leakage test', assignedTo: 'Sanjay Dutt', dueDate: '25 Jun', status: 'Assigned' }
];

export let mockVisitReports: VisitReport[] = [
  { id: 'VIS-001', title: 'Commissioning Visit', client: 'Britannia Industries', location: 'Rudrapur', engineer: 'Rajesh Kumar', date: '2026-07-15', status: 'Completed', notes: 'Completed the panel wiring and busbar alignment. Pre-commissioning testing completed successfully.' },
  { id: 'VIS-002', title: 'Maintenance & Troubleshooting', client: 'Tata Power Substation', location: 'Kalyan', engineer: 'Sunil Gavaskar', date: '2026-07-16', status: 'Completed', notes: 'Replaced faulty protection relay and checked wiring insulation logs. System is stable.' },
  { id: 'VIS-003', title: 'Installation Supervision', client: 'OPF Mills', location: 'Kanpur', engineer: 'Suresh Khanna', date: '2026-07-18', status: 'In Progress', notes: 'Currently supervising VCB panel alignment and control cables laying.' },
  { id: 'VIS-004', title: 'Site Inspection survey', client: 'Kolkata Flour Mill', location: 'Kolkata', engineer: 'Harpreet Singh', date: '2026-07-22', status: 'Scheduled', notes: 'Scheduled for sensor fitting audit and cable tray layout measurement.' }
];

export let mockLeaveApplications: LeaveApplication[] = [
  { id: 'LV-001', employeeId: 'EMP-009', employeeName: 'Sunil Gavaskar', startDate: '2026-07-18', endDate: '2026-07-20', type: 'Casual', reason: 'Family function at hometown.', status: 'Approved' },
  { id: 'LV-002', employeeId: 'EMP-015', employeeName: 'Priya Sharma', startDate: '2026-07-19', endDate: '2026-07-22', type: 'Sick', reason: 'Severe viral fever, doctor advised rest.', status: 'Approved' },
  { id: 'LV-003', employeeId: 'EMP-023', employeeName: 'Anita Desai', startDate: '2026-07-19', endDate: '2026-07-19', type: 'Casual', reason: 'Personal work in the afternoon.', status: 'Approved' },
  { id: 'LV-004', employeeId: 'EMP-003', employeeName: 'Amit Kumar', startDate: '2026-07-24', endDate: '2026-07-26', type: 'Earned', reason: 'Daughter\'s school admission process.', status: 'Pending' },
  { id: 'LV-005', employeeId: 'EMP-012', employeeName: 'Amit Mishra', startDate: '2026-07-27', endDate: '2026-07-28', type: 'Sick', reason: 'Dental surgery extraction.', status: 'Pending' }
];

export let mockRunningJobs: RunningJobStatus[] = [
  { id: 'JOB-001', title: 'Britannia Rudrapur — Line 4', description: 'PLC/HMI Commissioning', progress: 85, status: 'Active' },
  { id: 'JOB-002', title: 'OPF Kanpur — HT Panel', description: '11KV VCB installation', progress: 50, status: 'In Progress' },
  { id: 'JOB-003', title: 'Flour Mill Kolkata — Sensors', description: 'Instrumentation survey', progress: 20, status: 'Assigned' },
  { id: 'JOB-004', title: 'NTPC Ramagundam — Aux', description: 'SCADA panel layout check', progress: 95, status: 'Active' },
  { id: 'JOB-005', title: 'Tata Power Kalyan — Busbar', description: '800A DB dressing', progress: 40, status: 'In Progress' },
  { id: 'JOB-006', title: 'Adani Electricity — Auxiliary', description: 'Control board wiring checks', progress: 10, status: 'Assigned' }
];

export let mockSalarySlips: SalarySlip[] = [
  { id: 'PAY-001', employeeId: 'EMP-011', employeeName: 'Rajesh Kumar', month: 'June 2026', basic: 32000, hra: 12000, allowance: 6000, deductions: 2500, netPay: 47500, status: 'Paid' },
  { id: 'PAY-002', employeeId: 'EMP-012', employeeName: 'Amit Mishra', month: 'June 2026', basic: 22000, hra: 8000, allowance: 4000, deductions: 1800, netPay: 32200, status: 'Paid' },
  { id: 'PAY-003', employeeId: 'EMP-013', employeeName: 'Suresh Khanna', month: 'June 2026', basic: 24000, hra: 9000, allowance: 4500, deductions: 2000, netPay: 35500, status: 'Paid' },
  { id: 'PAY-004', employeeId: 'EMP-014', employeeName: 'Vijay Tiwari', month: 'June 2026', basic: 16000, hra: 6000, allowance: 3000, deductions: 1200, netPay: 23800, status: 'Paid' }
];

// Helper methods for prototype operations
export const getEmployeeDashboardStats = () => {
  const total = mockEmployees.length;
  const present = mockEmployeeAttendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
  const leaves = mockEmployeeAttendance.filter(a => a.status === 'On Leave').length;
  const absent = mockEmployeeAttendance.filter(a => a.status === 'Absent').length;

  const activeTasks = mockEmployeeTasks.filter(t => t.status === 'Assigned' || t.status === 'In Progress');
  const pendingTasks = activeTasks.filter(t => t.status === 'Assigned').length;
  const inProgressTasks = activeTasks.filter(t => t.status === 'In Progress').length;

  const runningJobs = mockRunningJobs.length;
  const dueJobs = mockRunningJobs.filter(j => j.progress >= 80 && j.progress < 100).length; // simple logic for due jobs

  return {
    totalEmployees: total,
    presentToday: present,
    onLeave: leaves,
    absent: absent,
    tasksActive: activeTasks.length,
    pendingTasks,
    inProgressTasks,
    runningJobs,
    dueJobs
  };
};

export const clockEmployeeIn = (employeeId: string, timeStr: string) => {
  const emp = mockEmployees.find(e => e.id === employeeId);
  if (!emp) return null;
  const existing = mockEmployeeAttendance.find(a => a.employeeId === employeeId);
  
  // Set attendance
  const timeParts = timeStr.split(':');
  const hours = parseInt(timeParts[0]);
  let isLate = false;
  if (hours > 9 || (hours === 9 && parseInt(timeParts[1]) > 30)) {
    isLate = true;
  }
  const status = isLate ? 'Late' : 'Present';

  if (existing) {
    existing.clockIn = timeStr;
    existing.status = status;
  } else {
    mockEmployeeAttendance.push({
      id: `ATT-0${mockEmployeeAttendance.length + 1}`,
      employeeId: emp.id,
      employeeName: emp.name,
      designation: emp.designation,
      date: new Date().toISOString().split('T')[0],
      clockIn: timeStr,
      clockOut: null,
      status
    });
  }
  
  logSystemEvent('API Server', `Employee ${emp.name} clocked in at ${timeStr} (${status})`, 'info');
  return getEmployeeDashboardStats();
};

export const createEmployeeTask = (taskData: Partial<EmployeeTask>) => {
  const newTask: EmployeeTask = {
    id: `EMP-TSK-0${mockEmployeeTasks.length + 1}`,
    title: taskData.title || 'New Task',
    assignedTo: taskData.assignedTo || 'Unassigned',
    dueDate: taskData.dueDate || '25 Jun',
    status: 'Assigned'
  };
  mockEmployeeTasks.push(newTask);
  logSystemEvent('API Server', `Employee task created: "${newTask.title}" for ${newTask.assignedTo}`, 'info');
  return newTask;
};

export const updateEmployeeTaskStatus = (id: string, status: EmployeeTask['status']) => {
  const task = mockEmployeeTasks.find(t => t.id === id);
  if (task) {
    task.status = status;
    logSystemEvent('API Server', `Employee task ${id} status updated to ${status}`, 'info');
  }
  return task;
};

export const createVisitReport = (visitData: Partial<VisitReport>) => {
  const newVisit: VisitReport = {
    id: `VIS-0${mockVisitReports.length + 1}`,
    title: visitData.title || 'Site Inspection',
    client: visitData.client || 'Unknown Client',
    location: visitData.location || 'Unknown Location',
    engineer: visitData.engineer || 'Unknown Engineer',
    date: visitData.date || new Date().toISOString().split('T')[0],
    status: visitData.status || 'Scheduled',
    notes: visitData.notes || ''
  };
  mockVisitReports.push(newVisit);
  logSystemEvent('API Server', `Site visit report created for ${newVisit.client} in ${newVisit.location}`, 'info');
  return newVisit;
};

export const updateVisitReport = (id: string, visitData: Partial<VisitReport>) => {
  const idx = mockVisitReports.findIndex(v => v.id === id);
  if (idx !== -1) {
    mockVisitReports[idx] = {
      ...mockVisitReports[idx],
      ...visitData
    };
    logSystemEvent('API Server', `Site visit report ${id} updated`, 'info');
    return mockVisitReports[idx];
  }
  return null;
};

export const deleteVisitReport = (id: string) => {
  const idx = mockVisitReports.findIndex(v => v.id === id);
  if (idx !== -1) {
    const deleted = mockVisitReports.splice(idx, 1)[0];
    logSystemEvent('API Server', `Site visit report ${id} deleted`, 'info');
    return deleted;
  }
  return null;
};

export const applyForLeave = (leaveData: Partial<LeaveApplication>) => {
  const newLeave: LeaveApplication = {
    id: `LV-0${mockLeaveApplications.length + 1}`,
    employeeId: leaveData.employeeId || 'EMP-010',
    employeeName: leaveData.employeeName || 'Pankaj',
    startDate: leaveData.startDate || '',
    endDate: leaveData.endDate || '',
    type: leaveData.type || 'Casual',
    reason: leaveData.reason || '',
    status: 'Pending'
  };
  mockLeaveApplications.push(newLeave);
  logSystemEvent('API Server', `Leave application created for ${newLeave.employeeName} starting ${newLeave.startDate}`, 'info');
  return newLeave;
};

export const updateLeaveStatus = (id: string, status: LeaveApplication['status']) => {
  const leave = mockLeaveApplications.find(l => l.id === id);
  if (leave) {
    leave.status = status;
    logSystemEvent('API Server', `Leave request ${id} ${status.toLowerCase()}`, 'info');
    
    // If approved, update attendance status to 'On Leave'
    if (status === 'Approved') {
      const todayStr = new Date().toISOString().split('T')[0];
      const att = mockEmployeeAttendance.find(a => a.employeeId === leave.employeeId);
      if (att) {
        att.status = 'On Leave';
        att.clockIn = null;
        att.clockOut = null;
      }
    }
  }
  return leave;
};

export const updateRunningJobProgress = (id: string, progress: number, status?: RunningJobStatus['status']) => {
  const job = mockRunningJobs.find(j => j.id === id);
  if (job) {
    job.progress = progress;
    if (status) job.status = status;
    logSystemEvent('API Server', `Running job ${id} progress updated to ${progress}%`, 'info');
  }
  return job;
};

// --- INQUIRY MANAGEMENT DATA MODEL ---
export interface Inquiry {
  id: string;
  client: string;
  project: string;
  amount: string;
  contactPerson: string;
  email: string;
  phone: string;
  date: string;
  status: 'Inquiry Received' | 'Offer Sent' | 'Confirmed' | 'Unconfirmed';
  remarks: string;
  weeksAgo: number;
}

export const mockInquiries: Inquiry[] = [
  { id: 'INQ-101', client: 'Reliance Green Energy', project: '132kV Substation Panel', amount: '1850000', contactPerson: 'Rohan Sharma', email: 'rohan@reliancegreen.com', phone: '+91 98201 12345', date: '2026-07-18', status: 'Confirmed', remarks: 'Client PO confirmed, pushed to Mechanical Dept.', weeksAgo: 1 },
  { id: 'INQ-102', client: 'Tata Steel Infra', project: 'Control Desk & PCC Panel', amount: '1220000', contactPerson: 'Anish Verma', email: 'a.verma@tatasteel.com', phone: '+91 98310 54321', date: '2026-07-16', status: 'Offer Sent', remarks: 'Commercial proposal sent, awaiting approval.', weeksAgo: 1 },
  { id: 'INQ-103', client: 'Adani Solar Power', project: 'MCC Panel System', amount: '2400000', contactPerson: 'Priya Mehta', email: 'p.mehta@adanisolar.com', phone: '+91 98450 67890', date: '2026-07-14', status: 'Confirmed', remarks: 'Technical clearance approved by client.', weeksAgo: 1 },
  { id: 'INQ-104', client: 'L&T Construction', project: 'Distribution Board DB-04', amount: '840000', contactPerson: 'Vikram Joshi', email: 'v.joshi@lntconst.com', phone: '+91 98111 22334', date: '2026-07-12', status: 'Unconfirmed', remarks: 'Commercial renegotiation requested.', weeksAgo: 1 },
  { id: 'INQ-105', client: 'Torrent Power Pvt Ltd', project: 'APFC Panel 440V', amount: '1510000', contactPerson: 'Deepak Patel', email: 'd.patel@torrent.com', phone: '+91 98980 99887', date: '2026-07-09', status: 'Confirmed', remarks: 'Advance payment received.', weeksAgo: 2 },
  { id: 'INQ-106', client: 'JSW Energy Ltd', project: 'Busduct System 2000A', amount: '3100000', contactPerson: 'Sanjay Reddy', email: 's.reddy@jswenergy.com', phone: '+91 98777 44332', date: '2026-07-05', status: 'Offer Sent', remarks: 'Quotation submitted to procurement lead.', weeksAgo: 2 },
  { id: 'INQ-107', client: 'BHEL Engineering', project: 'Generator Control Panel', amount: '2280000', contactPerson: 'Karan Malhotra', email: 'karan@bhel.in', phone: '+91 98190 33221', date: '2026-06-28', status: 'Confirmed', remarks: 'Manufacturing clearance given.', weeksAgo: 3 },
  { id: 'INQ-108', client: 'GMR Airports Pvt Ltd', project: 'Main Switchboard MSB-1', amount: '1940000', contactPerson: 'Sunil Rao', email: 's.rao@gmr.com', phone: '+91 98222 11000', date: '2026-06-24', status: 'Unconfirmed', remarks: 'Project timeline deferred by client.', weeksAgo: 4 }
];

export const createInquiry = (data: Partial<Inquiry>) => {
  const newId = `INQ-${101 + mockInquiries.length}`;
  const newInquiry: Inquiry = {
    id: newId,
    client: data.client || 'New Client',
    project: data.project || 'New Project Order',
    amount: data.amount || '0',
    contactPerson: data.contactPerson || 'Contact Person',
    email: data.email || 'contact@client.com',
    phone: data.phone || '+91 90000 00000',
    date: data.date || new Date().toISOString().split('T')[0],
    status: data.status || 'Inquiry Received',
    remarks: data.remarks || 'Newly created inquiry record.',
    weeksAgo: 1
  };
  mockInquiries.unshift(newInquiry);
  logSystemEvent('API Server', `New client inquiry created: ${newInquiry.id} (${newInquiry.client})`, 'info');
  return newInquiry;
};

export const updateInquiry = (id: string, data: Partial<Inquiry>) => {
  const inquiry = mockInquiries.find(i => i.id === id);
  if (inquiry) {
    if (data.client) inquiry.client = data.client;
    if (data.project) inquiry.project = data.project;
    if (data.amount) inquiry.amount = data.amount;
    if (data.contactPerson) inquiry.contactPerson = data.contactPerson;
    if (data.email) inquiry.email = data.email;
    if (data.phone) inquiry.phone = data.phone;
    if (data.status) inquiry.status = data.status;
    if (data.remarks) inquiry.remarks = data.remarks;
    logSystemEvent('API Server', `Inquiry ${id} updated status to ${inquiry.status}`, 'info');
  }
  return inquiry;
};

export const deleteInquiry = (id: string) => {
  const index = mockInquiries.findIndex(i => i.id === id);
  if (index !== -1) {
    const deleted = mockInquiries.splice(index, 1)[0];
    logSystemEvent('API Server', `Inquiry ${id} deleted permanently`, 'info');
    return deleted;
  }
  return null;
};

export const getInquiryStats = () => {
  const total = mockInquiries.length;
  const offersSent = mockInquiries.filter(i => i.status === 'Offer Sent' || i.status === 'Confirmed').length;
  const confirmed = mockInquiries.filter(i => i.status === 'Confirmed').length;
  const unconfirmed = mockInquiries.filter(i => i.status === 'Unconfirmed' || i.status === 'Inquiry Received').length;
  const winRate = offersSent > 0 ? Math.round((confirmed / offersSent) * 100) : 0;

  return {
    totalInquiries: total,
    offersSent,
    confirmedOrders: confirmed,
    unconfirmed,
    winRate
  };
};
