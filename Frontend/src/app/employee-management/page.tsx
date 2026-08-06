'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  FileText,
  Calendar,
  MapPin,
  TrendingUp,
  DollarSign,
  Clock,
  Plus,
  Check,
  Download,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  Briefcase,
  Play,
  CheckCircle,
  FileSpreadsheet,
  X,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ArrowLeft,
  Menu,
  Bell,
  LogOut,
  User
} from 'lucide-react';
import { API_BASE_URL } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Data types aligned with backend schema
interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  role: string;
  status: 'Active' | 'On Leave' | 'Suspended';
}

interface EmployeeAttendance {
  id: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  status: 'Present' | 'Late' | 'Absent' | 'On Leave';
}

interface EmployeeTask {
  id: string;
  title: string;
  assignedTo: string;
  dueDate: string;
  status: 'Assigned' | 'In Progress' | 'Done' | 'Overdue';
}

interface VisitReport {
  id: string;
  title: string;
  client: string;
  location: string;
  engineer: string;
  date: string;
  status: 'Scheduled' | 'Completed' | 'In Progress';
  notes: string;
}

interface LeaveApplication {
  id: string;
  employeeId: string;
  employeeName?: string; // Kept for local fallback compat
  employee?: { name: string, empCode: string, role: string }; // Populated by backend relation
  fromDate: string;
  toDate: string;
  leaveType: 'Full Day' | 'Half Day - AM' | 'Half Day - PM' | 'Casual' | 'Sick' | 'Earned';
  halfDayTime?: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  routedToRole?: string;
}

interface RunningJob {
  id: string;
  title: string;
  description: string;
  progress: number;
  status: 'Active' | 'In Progress' | 'Assigned' | 'Suspended';
}

interface SalarySlip {
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

interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  onLeave: number;
  absent: number;
  tasksActive: number;
  pendingTasks: number;
  inProgressTasks: number;
  runningJobs: number;
  dueJobs: number;
}

// Local mock data fallbacks (if backend is offline)
const fallbackEmployees: Employee[] = [
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
  { id: 'EMP-015', name: 'Priya Sharma', email: 'priya.s@skytechswitchgear.com', department: 'Admin', designation: 'Office Staff', role: 'Admin', status: 'On Leave' }
];

const fallbackAttendance: EmployeeAttendance[] = [
  { id: 'ATT-001', employeeId: 'EMP-011', employeeName: 'Rajesh Kumar', designation: 'Site Engineer', date: '2026-07-19', clockIn: '9:02 AM', clockOut: null, status: 'Present' },
  { id: 'ATT-002', employeeId: 'EMP-012', employeeName: 'Amit Mishra', designation: 'Electrician', date: '2026-07-19', clockIn: '9:15 AM', clockOut: null, status: 'Present' },
  { id: 'ATT-003', employeeId: 'EMP-013', employeeName: 'Suresh Khanna', designation: 'Technician', date: '2026-07-19', clockIn: '9:48 AM', clockOut: null, status: 'Late' },
  { id: 'ATT-004', employeeId: 'EMP-014', employeeName: 'Vijay Tiwari', designation: 'Helper', date: '2026-07-19', clockIn: null, clockOut: null, status: 'Absent' },
  { id: 'ATT-005', employeeId: 'EMP-015', employeeName: 'Priya Sharma', designation: 'Office Staff', date: '2026-07-19', clockIn: null, clockOut: null, status: 'On Leave' }
];

const fallbackTasks: EmployeeTask[] = [
  { id: 'EMP-TSK-001', title: 'Panel wiring — Rudrapur', assignedTo: 'Rajesh Kumar', dueDate: '20 Jun', status: 'In Progress' },
  { id: 'EMP-TSK-002', title: 'HMI commissioning check', assignedTo: 'Amit Mishra', dueDate: '22 Jun', status: 'Assigned' },
  { id: 'EMP-TSK-003', title: 'Load testing — Kanpur site', assignedTo: 'Suresh Khanna', dueDate: '17 Jun', status: 'Done' },
  { id: 'EMP-TSK-004', title: 'Cable tray installation', assignedTo: 'Vijay Tiwari', dueDate: '16 Jun', status: 'Overdue' }
];

const fallbackJobs: RunningJob[] = [
  { id: 'JOB-001', title: 'Britannia Rudrapur — Line 4', description: 'PLC/HMI Commissioning', progress: 85, status: 'Active' },
  { id: 'JOB-002', title: 'OPF Kanpur — HT Panel', description: '11KV VCB installation', progress: 50, status: 'In Progress' },
  { id: 'JOB-003', title: 'Flour Mill Kolkata — Sensors', description: 'Instrumentation survey', progress: 20, status: 'Assigned' }
];

const fallbackLeaves: LeaveApplication[] = [
  { id: 'LV-001', employeeId: 'EMP-009', employeeName: 'Sunil Gavaskar', fromDate: '2026-07-18', toDate: '2026-07-20', leaveType: 'Full Day', reason: 'Family function at hometown.', status: 'Approved' },
  { id: 'LV-002', employeeId: 'EMP-015', employeeName: 'Priya Sharma', fromDate: '2026-07-19', toDate: '2026-07-22', leaveType: 'Full Day', reason: 'Severe viral fever.', status: 'Approved' },
  { id: 'LV-004', employeeId: 'EMP-003', employeeName: 'Amit Kumar', fromDate: '2026-07-24', toDate: '2026-07-26', leaveType: 'Half Day - AM', halfDayTime: '09:00', reason: 'Daughter\'s school admission.', status: 'Pending', routedToRole: 'Admin' }
];

const fallbackSalary: SalarySlip[] = [
  { id: 'PAY-001', employeeId: 'EMP-011', employeeName: 'Rajesh Kumar', month: 'June 2026', basic: 32000, hra: 12000, allowance: 6000, deductions: 2500, netPay: 47500, status: 'Paid' },
  { id: 'PAY-002', employeeId: 'EMP-012', employeeName: 'Amit Mishra', month: 'June 2026', basic: 22000, hra: 8000, allowance: 4000, deductions: 1800, netPay: 32200, status: 'Paid' },
  { id: 'PAY-003', employeeId: 'EMP-013', employeeName: 'Suresh Khanna', month: 'June 2026', basic: 24000, hra: 9000, allowance: 4500, deductions: 2000, netPay: 35500, status: 'Paid' }
];

const fallbackVisits: VisitReport[] = [
  { id: 'VIS-001', title: 'Commissioning Visit', client: 'Britannia Industries', location: 'Rudrapur', engineer: 'Rajesh Kumar', date: '2026-07-15', status: 'Completed', notes: 'Completed the panel wiring and busbar alignment. Pre-commissioning testing completed successfully.' },
  { id: 'VIS-002', title: 'Maintenance & Troubleshooting', client: 'Tata Power Substation', location: 'Kalyan', engineer: 'Sunil Gavaskar', date: '2026-07-16', status: 'Completed', notes: 'Replaced faulty protection relay and checked wiring insulation logs. System is stable.' },
  { id: 'VIS-003', title: 'Installation Supervision', client: 'OPF Mills', location: 'Kanpur', engineer: 'Suresh Khanna', date: '2026-07-18', status: 'In Progress', notes: 'Currently supervising VCB panel alignment and control cables laying.' },
  { id: 'VIS-004', title: 'Site Inspection survey', client: 'Kolkata Flour Mill', location: 'Kolkata', engineer: 'Harpreet Singh', date: '2026-07-22', status: 'Scheduled', notes: 'Scheduled for sensor fitting audit and cable tray layout measurement.' }
];

function EmployeeManagementContent() {
  const { user: authUser, logout } = useAuth();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<'dashboard' | 'attendance' | 'visits' | 'leave' | 'salary'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(false);

  useEffect(() => {
    if (tabParam && ['dashboard', 'attendance', 'visits', 'leave', 'salary'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    } else if (!tabParam) {
      setActiveTab('dashboard');
    }
  }, [tabParam]);

  const displayUser = authUser || {
    name: 'Vinayak NPN',
    email: 'vinayak@skytech.com',
    role: 'Admin',
    department: 'Management'
  };

  const userInitials = (displayUser.name || 'Vinayak')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'VN';

  // Dynamically initialize to Today's date by default
  const today = new Date();
  const todayDay = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  // Dynamic Yesterday Date calculation (handles month/year boundaries automatically)
  const yesterday = new Date(todayYear, todayMonth, todayDay - 1);
  const yesterdayDay = yesterday.getDate();
  const yesterdayMonth = yesterday.getMonth();
  const yesterdayYear = yesterday.getFullYear();

  // Date State
  const [selectedDay, setSelectedDay] = useState(todayDay);
  const [selectedMonth, setSelectedMonth] = useState(todayMonth);
  const [selectedYear, setSelectedYear] = useState(todayYear);

  // Calendar View State
  const [viewMonth, setViewMonth] = useState(todayMonth);
  const [viewYear, setViewYear] = useState(todayYear);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const calendarRef = useRef<HTMLDivElement>(null);

  // Click outside listener for calendar popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startDayOffset = new Date(viewYear, viewMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const handleSelectDate = (d: number) => {
    setSelectedDay(d);
    setSelectedMonth(viewMonth);
    setSelectedYear(viewYear);
    setCalendarOpen(false);
  };

  const handleSetPreset = (d: number, m: number, y: number) => {
    setSelectedDay(d);
    setSelectedMonth(m);
    setSelectedYear(y);
    setViewMonth(m);
    setViewYear(y);
    setCalendarOpen(false);
  };

  const formattedDateObject = new Date(selectedYear, selectedMonth, selectedDay);
  const dayNameShort = formattedDateObject.toLocaleDateString('en-US', { weekday: 'short' });
  const monthNameShort = formattedDateObject.toLocaleDateString('en-US', { month: 'short' });
  const selectedDateFormatted = `${dayNameShort}, ${selectedDay} ${monthNameShort} ${selectedYear}`;
  const isToday = selectedDay === todayDay && selectedMonth === todayMonth && selectedYear === todayYear;

  // Core state arrays
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 24,
    presentToday: 19,
    onLeave: 3,
    absent: 2,
    tasksActive: 11,
    pendingTasks: 4,
    inProgressTasks: 7,
    runningJobs: 6,
    dueJobs: 2
  });
  const [employees, setEmployees] = useState<Employee[]>(fallbackEmployees);
  const [attendance, setAttendance] = useState<EmployeeAttendance[]>(fallbackAttendance);
  const [tasks, setTasks] = useState<EmployeeTask[]>(fallbackTasks);
  const [jobs, setJobs] = useState<RunningJob[]>(fallbackJobs);
  const [leaves, setLeaves] = useState<LeaveApplication[]>(fallbackLeaves);
  const [salarySlips, setSalarySlips] = useState<SalarySlip[]>(fallbackSalary);
  const [visits, setVisits] = useState<VisitReport[]>(fallbackVisits);

  // Edit & Delete Visit Modal States
  const [isEditVisitModalOpen, setIsEditVisitModalOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<VisitReport | null>(null);

  const [isDeleteVisitModalOpen, setIsDeleteVisitModalOpen] = useState(false);
  const [deletingVisit, setDeletingVisit] = useState<VisitReport | null>(null);

  // Interactive Form States
  const [taskForm, setTaskForm] = useState({ title: '', assignedTo: '', dueDate: '25 Jun' });
  const [visitForm, setVisitForm] = useState({ title: '', client: '', location: '', engineer: '', notes: '', date: '' });
  const [leaveForm, setLeaveForm] = useState({ employeeId: 'EMP-010', leaveType: 'Full Day' as 'Full Day' | 'Half Day - AM' | 'Half Day - PM', fromDate: '', toDate: '', halfDayTime: '', reason: '' });
  const [selectedPaySlip, setSelectedPaySlip] = useState<SalarySlip | null>(null);
  const [downloadingSlip, setDownloadingSlip] = useState(false);
  const [clockInTime, setClockInTime] = useState('09:00');
  const [clockedInEmployee, setClockedInEmployee] = useState('');

  // Fetch all prototype data from Backend, fallback to local mock data on failure
  const fetchAllData = async () => {
    try {
      const res = await fetch('${API_BASE_URL}/api/employee-management/dashboard');
      if (res.ok) {
        const dashboardData = await res.json();
        setStats(dashboardData.stats);
        setAttendance(dashboardData.todayAttendance);
        setTasks(dashboardData.activeTasks);
        setJobs(dashboardData.runningJobs);
        setBackendOnline(true);
      } else {
        setBackendOnline(false);
      }

      // Fetch other sub-routes in parallel
      const [empRes, tskRes, jobRes, lvRes, payRes, visRes] = await Promise.all([
        fetch('${API_BASE_URL}/api/employees').catch(() => null),
        fetch('${API_BASE_URL}/api/employee-management/tasks').catch(() => null),
        fetch('${API_BASE_URL}/api/employee-management/jobs').catch(() => null),
        fetch('${API_BASE_URL}/api/employee-management/leaves').catch(() => null),
        fetch('${API_BASE_URL}/api/employee-management/salary').catch(() => null),
        fetch('${API_BASE_URL}/api/employee-management/visits').catch(() => null)
      ]);

      if (empRes?.ok) setEmployees(await empRes.json());
      if (tskRes?.ok) setTasks(await tskRes.json());
      if (jobRes?.ok) setJobs(await jobRes.json());
      if (lvRes?.ok) setLeaves(await lvRes.json());
      if (payRes?.ok) setSalarySlips(await payRes.json());
      if (visRes?.ok) setVisits(await visRes.json());

    } catch (err) {
      console.warn('Backend API offline. Operating in High-Fidelity Local Prototype Mode.');
      setBackendOnline(false);
      
      // Seed dashboard details from fallback locally
      setStats({
        totalEmployees: 24,
        presentToday: 19,
        onLeave: 3,
        absent: 2,
        tasksActive: 11,
        pendingTasks: 4,
        inProgressTasks: 7,
        runningJobs: 6,
        dueJobs: 2
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Update backend stats locally helper (for offline prototype fidelity)
  const syncLocalStats = (updatedTasks = tasks, updatedLeaves = leaves, updatedAttendance = attendance, updatedJobs = jobs) => {
    const total = 24;
    const present = updatedAttendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
    const onLeave = updatedAttendance.filter(a => a.status === 'On Leave').length;
    const absent = total - present - onLeave;

    const activeTasks = updatedTasks.filter(t => t.status === 'Assigned' || t.status === 'In Progress');
    const pendingTasks = activeTasks.filter(t => t.status === 'Assigned').length;
    const inProgressTasks = activeTasks.filter(t => t.status === 'In Progress').length;

    const runningJobsCount = updatedJobs.length;
    const dueJobsCount = updatedJobs.filter(j => j.progress >= 80 && j.progress < 100).length;

    setStats({
      totalEmployees: total,
      presentToday: present || 19, // Keep 19 if present is 0 due to slice
      onLeave: onLeave || 3,
      absent: absent >= 0 ? absent : 2,
      tasksActive: activeTasks.length || 11,
      pendingTasks: pendingTasks || 4,
      inProgressTasks: inProgressTasks || 7,
      runningJobs: runningJobsCount || 6,
      dueJobs: dueJobsCount || 2
    });
  };

  // Clock In Action
  const handleClockIn = async (employeeId: string, time: string) => {
    const selectedEmp = employees.find(e => e.id === employeeId);
    if (!selectedEmp) return;

    if (backendOnline) {
      try {
        const res = await fetch('${API_BASE_URL}/api/employee-management/attendance/clock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId, time })
        });
        if (res.ok) fetchAllData();
      } catch (err) {
        console.error(err);
      }
    } else {
      // Local fallback
      const timeParts = time.split(':');
      const hours = parseInt(timeParts[0]);
      const status: 'Present' | 'Late' | 'Absent' | 'On Leave' = (hours > 9 || (hours === 9 && parseInt(timeParts[1]) > 30)) ? 'Late' : 'Present';
      
      const newLog: EmployeeAttendance = {
        id: `ATT-0${attendance.length + 1}`,
        employeeId: selectedEmp.id,
        employeeName: selectedEmp.name,
        designation: selectedEmp.designation,
        date: new Date().toISOString().split('T')[0],
        clockIn: `${hours % 12 || 12}:${timeParts[1]} ${hours >= 12 ? 'PM' : 'AM'}`,
        clockOut: null,
        status
      };

      const updated = attendance.some(a => a.employeeId === employeeId)
        ? attendance.map(a => a.employeeId === employeeId ? { ...a, clockIn: newLog.clockIn, status } : a)
        : [newLog, ...attendance];

      setAttendance(updated);
      syncLocalStats(tasks, leaves, updated, jobs);
      alert(`Simulated clock in for ${selectedEmp.name} successful!`);
    }
  };

  // Add Task Action
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title || !taskForm.assignedTo) return;

    if (backendOnline) {
      try {
        const res = await fetch('${API_BASE_URL}/api/employee-management/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskForm)
        });
        if (res.ok) {
          fetchAllData();
          setTaskForm({ title: '', assignedTo: '', dueDate: '25 Jun' });
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      const newTask: EmployeeTask = {
        id: `EMP-TSK-0${tasks.length + 1}`,
        title: taskForm.title,
        assignedTo: taskForm.assignedTo,
        dueDate: taskForm.dueDate,
        status: 'Assigned'
      };
      const updated = [newTask, ...tasks];
      setTasks(updated);
      syncLocalStats(updated, leaves, attendance, jobs);
      setTaskForm({ title: '', assignedTo: '', dueDate: '25 Jun' });
    }
  };

  // Toggle Task Status
  const handleToggleTaskStatus = async (taskId: string, currentStatus: EmployeeTask['status']) => {
    let nextStatus: EmployeeTask['status'] = 'In Progress';
    if (currentStatus === 'Assigned') nextStatus = 'In Progress';
    else if (currentStatus === 'In Progress') nextStatus = 'Done';
    else if (currentStatus === 'Done') nextStatus = 'Overdue';
    else if (currentStatus === 'Overdue') nextStatus = 'Assigned';

    if (backendOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/employee-management/tasks/${taskId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus })
        });
        if (res.ok) fetchAllData();
      } catch (err) {
        console.error(err);
      }
    } else {
      const updated = tasks.map(t => t.id === taskId ? { ...t, status: nextStatus } : t);
      setTasks(updated);
      syncLocalStats(updated, leaves, attendance, jobs);
    }
  };

  // Apply Leave Action
  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.fromDate || !leaveForm.toDate || !leaveForm.reason) return;

    const applicant = employees.find(emp => emp.id === leaveForm.employeeId) || fallbackEmployees[9]; // default Pankaj

    const leavePayload = {
      employeeId: applicant.id,
      leaveType: leaveForm.leaveType,
      fromDate: leaveForm.fromDate,
      toDate: leaveForm.toDate,
      halfDayTime: leaveForm.halfDayTime,
      reason: leaveForm.reason
    };

    if (backendOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/employee-management/leaves`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leavePayload)
        });
        if (res.ok) {
          fetchAllData();
          setLeaveForm({ employeeId: 'EMP-010', leaveType: 'Full Day', fromDate: '', toDate: '', halfDayTime: '', reason: '' });
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      const newLeave: LeaveApplication = {
        id: `LV-0${leaves.length + 1}`,
        employeeName: applicant.name, // fallback property
        ...leavePayload,
        status: 'Pending',
        routedToRole: 'Admin'
      };
      setLeaves([newLeave, ...leaves]);
      setLeaveForm({ employeeId: 'EMP-010', leaveType: 'Full Day', fromDate: '', toDate: '', halfDayTime: '', reason: '' });
      alert('Leave requested successfully! Switch to admin controls below to approve.');
    }
  };

  // HR Leave Approval Action
  const handleLeaveApproval = async (leaveId: string, status: 'Approved' | 'Rejected') => {
    if (backendOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/employee-management/leaves/${leaveId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });
        if (res.ok) fetchAllData();
      } catch (err) {
        console.error(err);
      }
    } else {
      const targetLeave = leaves.find(l => l.id === leaveId);
      const updatedLeaves = leaves.map(l => l.id === leaveId ? { ...l, status } : l);
      setLeaves(updatedLeaves);

      let updatedAttendance = attendance;
      if (status === 'Approved' && targetLeave) {
        // Find employee and update attendance status to 'On Leave'
        updatedAttendance = attendance.map(a => 
          a.employeeId === targetLeave.employeeId 
            ? { ...a, status: 'On Leave', clockIn: null, clockOut: null }
            : a
        );
        // If employee not in attendance grid yet, add them as 'On Leave'
        if (!updatedAttendance.some(a => a.employeeId === targetLeave.employeeId)) {
          const empDetails = employees.find(e => e.id === targetLeave.employeeId);
          updatedAttendance.push({
            id: `ATT-0${updatedAttendance.length + 1}`,
            employeeId: targetLeave.employeeId,
            employeeName: targetLeave.employee?.name || targetLeave.employeeName || 'Unknown',
            designation: empDetails?.designation || 'Staff',
            date: new Date().toISOString().split('T')[0],
            clockIn: null,
            clockOut: null,
            status: 'On Leave'
          });
        }
        setAttendance(updatedAttendance);
      }
      syncLocalStats(tasks, updatedLeaves, updatedAttendance, jobs);
    }
  };

  // Update Running Job Progress
  const handleJobProgressChange = async (jobId: string, progress: number) => {
    let status: RunningJob['status'] = 'Assigned';
    if (progress > 80) status = 'Active';
    else if (progress > 30) status = 'In Progress';
    else if (progress > 0) status = 'Assigned';
    else status = 'Suspended';

    if (backendOnline) {
      try {
        await fetch(`${API_BASE_URL}/api/employee-management/jobs/${jobId}/progress`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ progress, status })
        });
        // Quietly update local state first for instant response
        setJobs(jobs.map(j => j.id === jobId ? { ...j, progress, status } : j));
      } catch (err) {
        console.error(err);
      }
    } else {
      const updated = jobs.map(j => j.id === jobId ? { ...j, progress, status } : j);
      setJobs(updated);
      syncLocalStats(tasks, leaves, attendance, updated);
    }
  };

  // Submit Visit Report
  const handleSubmitVisitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitForm.title || !visitForm.client || !visitForm.location || !visitForm.engineer) return;

    if (backendOnline) {
      try {
        const res = await fetch('${API_BASE_URL}/api/employee-management/visits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(visitForm)
        });
        if (res.ok) {
          fetchAllData();
          setVisitForm({ title: '', client: '', location: '', engineer: '', notes: '', date: '' });
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      const newVisit: VisitReport = {
        id: `VIS-0${visits.length + 1}`,
        title: visitForm.title,
        client: visitForm.client,
        location: visitForm.location,
        engineer: visitForm.engineer,
        date: visitForm.date || new Date().toISOString().split('T')[0],
        status: 'Scheduled',
        notes: visitForm.notes
      };
      setVisits([newVisit, ...visits]);
      setVisitForm({ title: '', client: '', location: '', engineer: '', notes: '', date: '' });
    }
  };

  // Open Edit Visit Modal
  const openEditVisitModal = (vis: VisitReport) => {
    setEditingVisit({ ...vis });
    setIsEditVisitModalOpen(true);
  };

  // Save Edit Visit Handler
  const handleSaveEditVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVisit) return;

    if (backendOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/employee-management/visits/${editingVisit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingVisit)
        });
        if (res.ok) {
          const updated = await res.json();
          setVisits(prev => prev.map(v => v.id === updated.id ? updated : v));
        } else {
          setVisits(prev => prev.map(v => v.id === editingVisit.id ? editingVisit : v));
        }
      } catch (err) {
        setVisits(prev => prev.map(v => v.id === editingVisit.id ? editingVisit : v));
      }
    } else {
      setVisits(prev => prev.map(v => v.id === editingVisit.id ? editingVisit : v));
    }
    setIsEditVisitModalOpen(false);
    setEditingVisit(null);
  };

  // Open Delete Visit Modal
  const openDeleteVisitModal = (vis: VisitReport) => {
    setDeletingVisit(vis);
    setIsDeleteVisitModalOpen(true);
  };

  // Confirm Delete Visit Handler
  const handleConfirmDeleteVisit = async () => {
    if (!deletingVisit) return;

    if (backendOnline) {
      try {
        await fetch(`${API_BASE_URL}/api/employee-management/visits/${deletingVisit.id}`, {
          method: 'DELETE'
        });
        setVisits(prev => prev.filter(v => v.id !== deletingVisit.id));
      } catch (err) {
        setVisits(prev => prev.filter(v => v.id !== deletingVisit.id));
      }
    } else {
      setVisits(prev => prev.filter(v => v.id !== deletingVisit.id));
    }
    setIsDeleteVisitModalOpen(false);
    setDeletingVisit(null);
  };

  // Download slip animation
  const handleDownloadPayslip = (slip: SalarySlip) => {
    setSelectedPaySlip(slip);
    setDownloadingSlip(true);
    setTimeout(() => {
      setDownloadingSlip(false);
    }, 1500);
  };

  // Get status dot styles
  const getStatusDot = (status: EmployeeAttendance['status']) => {
    switch (status) {
      case 'Present': return 'bg-emerald-500';
      case 'Late': return 'bg-amber-500';
      case 'Absent': return 'bg-rose-500';
      case 'On Leave': return 'bg-slate-400';
    }
  };

  // Helpers for display avatars
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getAvatarBg = (name: string) => {
    const code = name.charCodeAt(0) + (name.charCodeAt(1) || 0);
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-emerald-100 text-emerald-800 border-emerald-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-orange-100 text-orange-800 border-orange-200',
      'bg-pink-100 text-pink-800 border-pink-200',
      'bg-teal-100 text-teal-800 border-teal-200'
    ];
    return colors[code % colors.length];
  };

  return (
    <div className="w-full min-w-0 p-4 md:p-8 bg-slate-50 font-sans antialiased text-slate-800">
      {loading ? (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-slate-500 tracking-wider">Syncing prototype database...</p>
        </div>
      ) : (
            <>
              {/* ========================================================================= */}
              {/* TAB 1: DASHBOARD VIEW                                                     */}
              {/* ========================================================================= */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Top Bar with Date Display & Calendar Popover */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h2>
                      {!isToday && (
                        <div className="flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-xl text-xs font-semibold mt-1">
                          <Clock size={13} className="text-amber-600" />
                          <span>Viewing Employee Hub Metrics for <strong>{selectedDateFormatted}</strong></span>
                          <button 
                            type="button"
                            onClick={() => handleSetPreset(todayDay, todayMonth, todayYear)}
                            className="ml-2 flex items-center gap-1 text-[10px] font-bold text-amber-700 hover:text-amber-900 bg-amber-200/50 hover:bg-amber-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                          >
                            <RotateCcw size={11} />
                            <span>Reset to Today</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Interactive Date Picker Button & Calendar Popover */}
                    <div className="relative" ref={calendarRef}>
                      <button 
                        type="button"
                        onClick={() => setCalendarOpen(!calendarOpen)}
                        className="flex items-center gap-2 bg-white px-4 py-2 border border-slate-200 hover:border-blue-400 rounded-xl shadow-xs hover:shadow-sm transition-all cursor-pointer text-xs font-semibold text-slate-700 focus:outline-none"
                      >
                        <Calendar size={15} className="text-blue-600" />
                        <span>{selectedDateFormatted}</span>
                        <ChevronDown size={14} className={`text-slate-400 ml-1 transition-transform duration-200 ${calendarOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Pop-up Calendar Dropdown */}
                      {calendarOpen && (
                        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                          {/* Calendar Header with Navigation */}
                          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                            <button 
                              type="button"
                              onClick={handlePrevMonth}
                              className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                            >
                              <ChevronLeft size={16} />
                            </button>
                            <span className="text-xs font-bold text-slate-800 tracking-wide">
                              {MONTH_NAMES[viewMonth]} {viewYear}
                            </span>
                            <button 
                              type="button"
                              onClick={handleNextMonth}
                              className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                            >
                              <ChevronRight size={16} />
                            </button>
                          </div>

                          {/* Quick Presets */}
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <button
                              type="button"
                              onClick={() => handleSetPreset(todayDay, todayMonth, todayYear)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                isToday
                                  ? 'bg-blue-600 text-white shadow-xs' 
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Today
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetPreset(yesterdayDay, yesterdayMonth, yesterdayYear)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                selectedDay === yesterdayDay && selectedMonth === yesterdayMonth && selectedYear === yesterdayYear
                                  ? 'bg-blue-600 text-white shadow-xs' 
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Yesterday
                            </button>
                          </div>

                          {/* Days of Week Header */}
                          <div className="grid grid-cols-7 gap-1 text-center mb-1">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                              <span key={day} className="text-[10px] font-bold text-slate-400 uppercase">
                                {day}
                              </span>
                            ))}
                          </div>

                          {/* Calendar Days Grid */}
                          <div className="grid grid-cols-7 gap-1 text-center">
                            {/* Empty slots for previous month offset */}
                            {Array.from({ length: startDayOffset }).map((_, i) => (
                              <div key={`empty-${i}`} className="h-7 w-7" />
                            ))}

                            {/* Day numbers */}
                            {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
                              const d = i + 1;
                              const isSelected = d === selectedDay && viewMonth === selectedMonth && viewYear === selectedYear;
                              const isTodayDate = d === todayDay && viewMonth === todayMonth && viewYear === todayYear;

                              return (
                                <button
                                  key={d}
                                  type="button"
                                  onClick={() => handleSelectDate(d)}
                                  className={`h-7 w-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                                    isSelected 
                                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 font-bold scale-105' 
                                      : isTodayDate
                                      ? 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 font-bold'
                                      : 'text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  {d}
                                </button>
                              );
                            })}
                          </div>

                          {/* Footer Info */}
                          <div className="mt-3 pt-2 border-t border-slate-100 text-center">
                            <span className="text-[10px] text-slate-400 font-medium">
                              Select any date to inspect workforce metrics
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4 Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Card 1: Total Employees */}
                    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center border border-sky-100">
                        <Users size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Employees</span>
                        <span className="text-3xl font-extrabold text-slate-800 mt-0.5">{stats.totalEmployees}</span>
                        <span className="text-[10px] text-slate-500 mt-1 font-semibold">Active this month</span>
                      </div>
                    </div>

                    {/* Card 2: Present Today */}
                    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
                        <Clock size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Present Today</span>
                        <span className="text-3xl font-extrabold text-slate-800 mt-0.5">{stats.presentToday}</span>
                        <span className="text-[10px] text-slate-500 mt-1 font-semibold">
                          {stats.onLeave} on leave • {stats.absent} absent
                        </span>
                      </div>
                    </div>

                    {/* Card 3: Tasks Active */}
                    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center border border-orange-100">
                        <CheckSquare size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tasks Active</span>
                        <span className="text-3xl font-extrabold text-slate-800 mt-0.5">{stats.tasksActive}</span>
                        <span className="text-[10px] text-slate-500 mt-1 font-semibold">
                          {stats.pendingTasks} pending • {stats.inProgressTasks} in progress
                        </span>
                      </div>
                    </div>

                    {/* Card 4: Running Jobs */}
                    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center border border-rose-100">
                        <TrendingUp size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Running Jobs</span>
                        <span className="text-3xl font-extrabold text-slate-800 mt-0.5">{stats.runningJobs}</span>
                        <span className="text-[10px] text-slate-500 mt-1 font-semibold">
                          {stats.dueJobs} due this week
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section Row 1: Attendance + Active Tasks */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Today's Attendance */}
                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                          <h3 className="font-bold text-slate-900 text-sm">Today's Attendance</h3>
                          <button
                            onClick={() => setActiveTab('attendance')}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            View all →
                          </button>
                        </div>

                        <div className="space-y-4">
                          {attendance.slice(0, 5).map((log) => (
                            <div key={log.id} className="flex items-center justify-between py-1">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border ${getAvatarBg(log.employeeName)}`}>
                                  {getInitials(log.employeeName)}
                                </div>
                                <div className="flex flex-col text-left">
                                  <span className="text-xs font-bold text-slate-800">{log.employeeName}</span>
                                  <span className="text-[10px] text-slate-400 font-semibold">{log.designation}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${getStatusDot(log.status)} shadow-sm`}></span>
                                <span className="text-xs font-semibold text-slate-600">
                                  {log.status === 'Absent' ? 'Absent' : log.status === 'On Leave' ? 'On Leave' : log.clockIn || '—'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: Active Tasks */}
                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                          <h3 className="font-bold text-slate-900 text-sm">Active Tasks</h3>
                          <button
                            onClick={() => window.location.href = '/wbs'}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            View WBS →
                          </button>
                        </div>

                        <div className="space-y-4">
                          {tasks.slice(0, 4).map((task) => (
                            <div key={task.id} className="flex items-center justify-between py-1">
                              <div className="flex flex-col text-left max-w-[70%]">
                                <span className="text-xs font-bold text-slate-800 truncate">{task.title}</span>
                                <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                  {task.assignedTo} • Due {task.dueDate}
                                </span>
                              </div>
                              <span
                                onClick={() => handleToggleTaskStatus(task.id, task.status)}
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-md border cursor-pointer hover:opacity-85 active:scale-95 transition-all select-none ${
                                  task.status === 'In Progress'
                                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                                    : task.status === 'Assigned'
                                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                                    : task.status === 'Done'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-rose-50 border-rose-200 text-rose-700'
                                }`}
                              >
                                {task.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section Row 2: Attendance Overview + Running Jobs Status */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Attendance Overview */}
                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                          <h3 className="font-bold text-slate-900 text-sm">Attendance Overview — June</h3>
                        </div>

                        <div className="space-y-6 mt-2">
                          {/* Present progress */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-slate-500">Present</span>
                              <span className="text-slate-800">79%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '79%' }}></div>
                            </div>
                          </div>

                          {/* Leave progress */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-slate-500">Leave</span>
                              <span className="text-slate-800">12%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-amber-600 h-full rounded-full" style={{ width: '12%' }}></div>
                            </div>
                          </div>

                          {/* Absent progress */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-slate-500">Absent</span>
                              <span className="text-slate-800">9%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-rose-500 h-full rounded-full" style={{ width: '9%' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Running Jobs - Status */}
                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                          <h3 className="font-bold text-slate-900 text-sm">Running Jobs — Status</h3>
                          <button
                            onClick={() => window.location.href = '/'}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            View Dashboard →
                          </button>
                        </div>

                        <div className="space-y-4">
                          {jobs.slice(0, 3).map((job) => (
                            <div key={job.id} className="flex items-center justify-between py-1">
                              <div className="flex flex-col text-left max-w-[70%]">
                                <span className="font-bold text-xs text-slate-800">{job.title}</span>
                                <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                  {job.description} • {job.progress}% done
                                </span>
                              </div>
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${
                                job.status === 'Active'
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                  : job.status === 'In Progress'
                                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                                  : 'bg-blue-50 border-blue-200 text-blue-700'
                              }`}>
                                {job.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section Row 3: Site Visit Reports Overview */}
                  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between text-left">
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                        <div className="flex items-center gap-2">
                          <MapPin size={18} className="text-blue-600" />
                          <h3 className="font-bold text-slate-900 text-sm">Site Visit Reports Overview</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('visits')}
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                        >
                          View all →
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {visits.slice(0, 4).map((vis) => (
                          <div key={vis.id} className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-3 hover:border-blue-300 transition-all">
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold bg-white text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                                  {vis.date}
                                </span>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                                  vis.status === 'Completed'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : vis.status === 'In Progress'
                                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                                    : 'bg-blue-50 border-blue-200 text-blue-700'
                                }`}>
                                  {vis.status}
                                </span>
                              </div>
                              <h4 className="font-bold text-xs text-slate-800 line-clamp-1">{vis.title}</h4>
                              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold truncate">
                                <Briefcase size={11} className="text-slate-400 shrink-0" />
                                <span className="truncate">{vis.client} ({vis.location})</span>
                              </div>
                            </div>
                            <div className="border-t border-slate-200/80 pt-2 flex items-center justify-between text-[10px] text-slate-400 font-bold">
                              <span>Engineer: {vis.engineer}</span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditVisitModal(vis)}
                                  className="text-slate-400 hover:text-blue-600 transition-colors p-0.5 cursor-pointer"
                                  title="Edit Visit Report"
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openDeleteVisitModal(vis)}
                                  className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
                                  title="Delete Visit Report"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 2: ATTENDANCE VIEW                                                    */}
              {/* ========================================================================= */}
              {activeTab === 'attendance' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <h2 className="text-xl font-bold text-slate-900">Attendance Log & Simulator</h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Clock In Simulator Panel */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-left">
                      <h3 className="font-bold text-sm text-slate-800 border-b pb-2">Simulate Clock In</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Select Employee</label>
                          <select
                            className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={clockedInEmployee}
                            onChange={(e) => setClockedInEmployee(e.target.value)}
                          >
                            <option value="">-- Choose Employee --</option>
                            {employees.map(e => (
                              <option key={e.id} value={e.id}>{e.name} ({e.designation})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Select Clock In Time</label>
                          <input
                            type="time"
                            className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={clockInTime}
                            onChange={(e) => setClockInTime(e.target.value)}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => clockedInEmployee && handleClockIn(clockedInEmployee, clockInTime)}
                          className="w-full bg-blue-600 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-900/10 mt-4"
                        >
                          <Clock size={14} />
                          Log Check In
                        </button>
                      </div>
                    </div>

                    {/* Right: Full Log Table */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2 text-left space-y-4">
                      <div className="flex items-center justify-between border-b pb-2">
                        <h3 className="font-bold text-sm text-slate-800">Daily Log Grid</h3>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                          Today: {new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 font-bold">
                              <th className="py-2.5">Employee</th>
                              <th className="py-2.5">Designation</th>
                              <th className="py-2.5">Check In</th>
                              <th className="py-2.5">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attendance.map((log) => (
                              <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                <td className="py-3 font-semibold text-slate-800 flex items-center gap-2">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[9px] border ${getAvatarBg(log.employeeName)}`}>
                                    {getInitials(log.employeeName)}
                                  </div>
                                  {log.employeeName}
                                </td>
                                <td className="py-3 text-slate-500 font-medium">{log.designation}</td>
                                <td className="py-3 font-bold text-slate-600">{log.clockIn || '—'}</td>
                                <td className="py-3">
                                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-bold text-[9px] border ${
                                    log.status === 'Present'
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                      : log.status === 'Late'
                                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                                      : log.status === 'Absent'
                                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                                      : 'bg-slate-50 border-slate-200 text-slate-500'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(log.status)}`}></span>
                                    {log.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 4: VISIT REPORTS VIEW                                                 */}
              {/* ========================================================================= */}
              {activeTab === 'visits' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <h2 className="text-xl font-bold text-slate-900">Site Visit Reports</h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Log Visit Form */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-left">
                      <h3 className="font-bold text-sm text-slate-800 border-b pb-2">Log Site Visit</h3>
                      <form onSubmit={handleSubmitVisitReport} className="space-y-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Visit Purpose / Title</label>
                          <input
                            type="text"
                            placeholder="e.g. VCB Commissioning"
                            className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={visitForm.title}
                            onChange={(e) => setVisitForm({ ...visitForm, title: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Client Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Britannia Ltd"
                            className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={visitForm.client}
                            onChange={(e) => setVisitForm({ ...visitForm, client: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Site Location</label>
                          <input
                            type="text"
                            placeholder="e.g. Rudrapur"
                            className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={visitForm.location}
                            onChange={(e) => setVisitForm({ ...visitForm, location: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Field Engineer</label>
                          <select
                            className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={visitForm.engineer}
                            onChange={(e) => setVisitForm({ ...visitForm, engineer: e.target.value })}
                          >
                            <option value="">-- Select Engineer --</option>
                            {employees.filter(e => e.department === 'Service').map(e => (
                              <option key={e.id} value={e.name}>{e.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Visit Date</label>
                          <input
                            type="date"
                            className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={visitForm.date}
                            onChange={(e) => setVisitForm({ ...visitForm, date: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Notes / Site Findings</label>
                          <textarea
                            placeholder="Provide site status notes..."
                            rows={3}
                            className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={visitForm.notes || ''}
                            onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })}
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-blue-600 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-900/10 mt-4"
                        >
                          <MapPin size={14} />
                          Log Visit
                        </button>
                      </form>
                    </div>

                    {/* Visit Reports Grid */}
                    <div className="lg:col-span-2 space-y-4 text-left">
                      {visits.length === 0 ? (
                        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400 font-bold text-xs">
                          No site visits logged yet. Use the form to log.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {visits.map((vis) => (
                            <div key={vis.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded border">
                                    {vis.date}
                                  </span>
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                                    vis.status === 'Completed'
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                      : vis.status === 'In Progress'
                                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                                      : 'bg-blue-50 border-blue-200 text-blue-700'
                                  }`}>
                                    {vis.status}
                                  </span>
                                </div>
                                <h3 className="font-bold text-sm text-slate-800">{vis.title}</h3>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                                  <Briefcase size={12} />
                                  <span>{vis.client} ({vis.location})</span>
                                </div>
                                <p className="text-[11px] text-slate-500 leading-relaxed font-semibold pt-1">
                                  {vis.notes}
                                </p>
                              </div>
                              <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[10px] text-slate-400 font-bold">
                                <span>Engineer: {vis.engineer}</span>
                                <div className="flex items-center gap-2">
                                  <span className="mr-1">ID: {vis.id}</span>
                                  <button
                                    type="button"
                                    onClick={() => openEditVisitModal(vis)}
                                    className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
                                    title="Edit Site Visit Report"
                                  >
                                    <Pencil size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openDeleteVisitModal(vis)}
                                    className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                                    title="Delete Site Visit Report"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 5: LEAVE VIEW                                                         */}
              {/* ========================================================================= */}
              {activeTab === 'leave' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <h2 className="text-xl font-bold text-slate-900">Leave Management System</h2>
                  </div>

                  {/* Leave Balances Header Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-left flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Casual Leave (CL)</span>
                        <h4 className="text-2xl font-extrabold text-slate-800 mt-1">4 / 8 days</h4>
                      </div>
                      <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">Used</span>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-left flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sick Leave (SL)</span>
                        <h4 className="text-2xl font-extrabold text-slate-800 mt-1">5 / 10 days</h4>
                      </div>
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">Used</span>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-left flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Paid / Earned Leave</span>
                        <h4 className="text-2xl font-extrabold text-slate-800 mt-1">12 / 15 days</h4>
                      </div>
                      <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">Remaining</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Apply Leave Form */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 text-left">
                      <h3 className="font-bold text-sm text-slate-800 border-b pb-2">Apply for Leave</h3>
                      <form onSubmit={handleApplyLeave} className="space-y-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Apply As</label>
                          <select
                            className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={leaveForm.employeeId}
                            onChange={(e) => setLeaveForm({ ...leaveForm, employeeId: e.target.value })}
                          >
                            {employees.map(e => (
                              <option key={e.id} value={e.id}>{e.name} ({e.designation})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Leave Type</label>
                          <select
                            className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={leaveForm.leaveType}
                            onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value as any })}
                          >
                            <option value="Full Day">Full Day</option>
                            <option value="Half Day - AM">Half Day - AM (Morning)</option>
                            <option value="Half Day - PM">Half Day - PM (Afternoon)</option>
                          </select>
                        </div>
                        {leaveForm.leaveType !== 'Full Day' && (
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Half Day Time (Optional)</label>
                            <input
                              type="time"
                              className="mt-1 block w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                              value={leaveForm.halfDayTime}
                              onChange={(e) => setLeaveForm({ ...leaveForm, halfDayTime: e.target.value })}
                            />
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">From Date</label>
                            <input
                              type="date"
                              className="mt-1 block w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                              value={leaveForm.fromDate}
                              onChange={(e) => setLeaveForm({ ...leaveForm, fromDate: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">To Date</label>
                            <input
                              type="date"
                              className="mt-1 block w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                              value={leaveForm.toDate}
                              onChange={(e) => setLeaveForm({ ...leaveForm, toDate: e.target.value })}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Reason for Leave</label>
                          <textarea
                            placeholder="Details about leave..."
                            rows={3}
                            className="mt-1 block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={leaveForm.reason || ''}
                            onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-blue-600 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-900/10 mt-4"
                        >
                          <Calendar size={14} />
                          Submit Request
                        </button>
                      </form>
                    </div>

                    {/* HR Approvals Panel */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2 text-left space-y-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between border-b pb-2 mb-4">
                          <h3 className="font-bold text-sm text-slate-800">Leave Applications & Approvals (Admin)</h3>
                          <span className="text-[10px] font-bold text-slate-400">Logged in: Pankaj</span>
                        </div>

                        <div className="space-y-4">
                          {leaves.map((lv) => (
                            <div key={lv.id} className="p-4 border border-slate-100 rounded-lg bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-slate-800">
                                    {lv.employee?.name || lv.employeeName || 'Unknown'} 
                                    {lv.employee?.empCode ? ` (${lv.employee.empCode})` : ''}
                                  </span>
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-slate-200/80 text-slate-600 rounded">
                                    {lv.leaveType}
                                  </span>
                                  {lv.routedToRole && lv.status === 'Pending' && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 border border-blue-200 bg-blue-50 text-blue-600 rounded">
                                      Routed to: {lv.routedToRole}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 font-bold">
                                  Dates: {new Date(lv.fromDate).toLocaleDateString()} to {new Date(lv.toDate).toLocaleDateString()}
                                  {lv.halfDayTime ? ` @ ${lv.halfDayTime}` : ''}
                                </div>
                                <p className="text-[11px] text-slate-600 font-medium pt-1 italic">
                                  "{lv.reason}"
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {lv.status === 'Pending' ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleLeaveApproval(lv.id, 'Approved')}
                                      className="px-2.5 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded hover:bg-emerald-700 transition-colors shadow-sm active:scale-95"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleLeaveApproval(lv.id, 'Rejected')}
                                      className="px-2.5 py-1 bg-rose-600 text-white font-bold text-[10px] rounded hover:bg-rose-700 transition-colors shadow-sm active:scale-95"
                                    >
                                      Reject
                                    </button>
                                  </>
                                ) : (
                                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded border ${
                                    lv.status === 'Approved'
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                      : 'bg-rose-50 border-rose-200 text-rose-700'
                                  }`}>
                                    {lv.status}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 6: SALARY / PAYROLL VIEW                                              */}
              {/* ========================================================================= */}
              {activeTab === 'salary' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <h2 className="text-xl font-bold text-slate-900">Payroll & Payslips</h2>
                    <div className="text-xs bg-white border px-3 py-1.5 rounded-lg shadow-sm font-semibold text-slate-600">
                      Period: June 2026
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Payslips Table */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2 text-left space-y-4">
                      <h3 className="font-bold text-sm text-slate-800 border-b pb-2">Payslip Directories</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 font-bold">
                              <th className="py-2.5">Employee Name</th>
                              <th className="py-2.5">Net Pay</th>
                              <th className="py-2.5">Status</th>
                              <th className="py-2.5 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {salarySlips.map((slip) => (
                              <tr key={slip.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                <td className="py-3 font-semibold text-slate-800">{slip.employeeName}</td>
                                <td className="py-3 font-bold text-slate-700">₹{slip.netPay.toLocaleString('en-IN')}</td>
                                <td className="py-3">
                                  <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold px-2 py-0.5 rounded text-[9px]">
                                    {slip.status}
                                  </span>
                                </td>
                                <td className="py-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadPayslip(slip)}
                                    className="inline-flex items-center gap-1 bg-blue-600 text-white font-bold text-[10px] px-2.5 py-1 rounded shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
                                  >
                                    <Download size={10} />
                                    Download
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Salary slips details */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-left flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="font-bold text-sm text-slate-800 border-b pb-2 mb-4">Earnings Breakdown</h3>
                        {selectedPaySlip ? (
                          <div className="space-y-4 font-semibold text-xs">
                            <div className="flex justify-between border-b pb-1 text-slate-400">
                              <span>Details For</span>
                              <span className="text-slate-800">{selectedPaySlip.employeeName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Basic Salary</span>
                              <span className="text-slate-800">₹{selectedPaySlip.basic.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">HRA Allowance</span>
                              <span className="text-slate-800">₹{selectedPaySlip.hra.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Special Allowances</span>
                              <span className="text-slate-800">₹{selectedPaySlip.allowance.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-rose-600">
                              <span>Deductions (PF + Taxes)</span>
                              <span>-₹{selectedPaySlip.deductions.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-sm border-t border-slate-200 pt-3 font-bold text-slate-800">
                              <span>Net Payable</span>
                              <span className="text-blue-600">₹{selectedPaySlip.netPay.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-400 font-bold text-xs text-center py-12">
                            Select download on any slip to load breakdown details.
                          </div>
                        )}
                      </div>
                      
                      {selectedPaySlip && (
                        <div className="pt-4 border-t border-slate-100 flex justify-center">
                          {downloadingSlip ? (
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 animate-pulse">
                              <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                              Compiling Payslip PDF...
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-lg w-full justify-center">
                              <CheckCircle2 size={16} />
                              Payslip Downloaded successfully!
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 7: RUNNING JOBS VIEW                                                  */}
              {/* ========================================================================= */}
              {/* Running Jobs tab disabled — shown on main Dashboard instead. Change false to activeTab === 'jobs' to re-enable */}
              {false && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <h2 className="text-xl font-bold text-slate-900">Running Jobs — Site Projects</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobs.map((job) => (
                      <div key={job.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 text-left">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400">{job.id}</span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                              job.status === 'Active'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : job.status === 'In Progress'
                                ? 'bg-amber-50 border-amber-200 text-amber-700'
                                : 'bg-blue-50 border-blue-200 text-blue-700'
                            }`}>
                              {job.status}
                            </span>
                          </div>
                          
                          <h3 className="font-extrabold text-sm text-slate-800">{job.title}</h3>
                          <p className="text-xs text-slate-500 font-semibold">{job.description}</p>
                        </div>

                        {/* Slider Controls */}
                        <div className="space-y-2 border-t pt-4 border-slate-100">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-400">Set Site Progress</span>
                            <span className="text-blue-600">{job.progress}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-0"
                            value={job.progress}
                            onChange={(e) => handleJobProgressChange(job.id, parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

      {/* EDIT VISIT REPORT MODAL */}
      {isEditVisitModalOpen && editingVisit && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 text-left">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <Pencil size={18} className="text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Edit Site Visit Report</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsEditVisitModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditVisit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Visit Purpose / Title</label>
                <input
                  type="text"
                  required
                  value={editingVisit.title}
                  onChange={(e) => setEditingVisit({ ...editingVisit, title: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Client Name</label>
                  <input
                    type="text"
                    required
                    value={editingVisit.client}
                    onChange={(e) => setEditingVisit({ ...editingVisit, client: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Site Location</label>
                  <input
                    type="text"
                    required
                    value={editingVisit.location}
                    onChange={(e) => setEditingVisit({ ...editingVisit, location: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Field Engineer</label>
                  <input
                    type="text"
                    required
                    value={editingVisit.engineer}
                    onChange={(e) => setEditingVisit({ ...editingVisit, engineer: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Visit Status</label>
                  <select
                    value={editingVisit.status}
                    onChange={(e) => setEditingVisit({ ...editingVisit, status: e.target.value as any })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Visit Date</label>
                <input
                  type="date"
                  required
                  value={editingVisit.date}
                  onChange={(e) => setEditingVisit({ ...editingVisit, date: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Notes / Site Findings</label>
                <textarea
                  rows={3}
                  value={editingVisit.notes || ''}
                  onChange={(e) => setEditingVisit({ ...editingVisit, notes: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditVisitModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE VISIT REPORT CONFIRMATION MODAL */}
      {isDeleteVisitModalOpen && deletingVisit && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 text-left p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Delete Report</h3>
                <span className="text-xs text-slate-400 font-bold uppercase">{deletingVisit.id}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete the site visit report for <strong className="text-slate-800">{deletingVisit.client} ({deletingVisit.location})</strong>? This record will be permanently removed.
            </p>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteVisitModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteVisit}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-500/20 transition-colors cursor-pointer"
              >
                Delete Report
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function EmployeeManagementPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-slate-500 tracking-wider">Loading Employee Hub...</p>
      </div>
    }>
      <EmployeeManagementContent />
    </Suspense>
  );
}
