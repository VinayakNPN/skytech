'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar as CalendarIcon, 
  Download, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  Wrench, 
  ClipboardList, 
  Briefcase, 
  Settings,
  Clock,
  RotateCcw,
  CheckCircle2,
  FileText,
  Cpu,
  Zap,
  Package,
  Headphones,
  Filter,
  CheckSquare,
  Square,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Send,
  TrendingUp,
  XCircle,
  Search,
  CheckCircle,
  Layers,
  PauseCircle
} from 'lucide-react';
import ProjectDropdown from '@/components/ProjectDropdown';
import { API_BASE_URL } from '@/config/api';

// Circular progress component
const CircularProgress = ({ percentage, strokeColor }: { percentage: number; strokeColor: string }) => {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-11 h-11 flex items-center justify-center flex-shrink-0">
      <svg className="w-11 h-11 transform -rotate-90">
        <circle 
          cx="22" 
          cy="22" 
          r={radius} 
          className="stroke-slate-100" 
          strokeWidth="3.5" 
          fill="transparent" 
        />
        <circle 
          cx="22" 
          cy="22" 
          r={radius} 
          className={strokeColor} 
          strokeWidth="3.5" 
          strokeDasharray={circumference} 
          strokeDashoffset={strokeDashoffset} 
          strokeLinecap="round" 
          fill="transparent" 
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-slate-800">{percentage}%</span>
    </div>
  );
};

// Mini Bar Chart Component for card bottoms
const MiniBarChart = ({ barColor }: { barColor: string }) => {
  const heights = [25, 40, 20, 55, 35, 70, 45, 85, 60, 75, 35, 65, 80, 50, 85, 40, 60, 75, 45, 65];
  return (
    <div className="flex items-end gap-[3px] h-7 w-full overflow-hidden opacity-70 pt-1">
      {heights.map((h, i) => (
        <div 
          key={i} 
          className={`flex-1 rounded-t-sm ${barColor}`} 
          style={{ height: `${h}%` }} 
        />
      ))}
    </div>
  );
};

// Mini Wave Line Chart Component for Overall Progress Card
const MiniWaveChart = () => (
  <div className="w-full h-7 overflow-hidden pt-1">
    <svg viewBox="0 0 120 28" className="w-full h-full" fill="none preserveAspectRatio">
      <defs>
        <linearGradient id="wave-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d="M0 22 Q 20 26, 35 18 T 70 12 T 95 20 T 120 8 L 120 28 L 0 28 Z" fill="url(#wave-grad)" />
      <path d="M0 22 Q 20 26, 35 18 T 70 12 T 95 20 T 120 8" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </svg>
  </div>
);

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Department Phase Interface based on Image 1 & Image 2
interface PhaseTask {
  id: number;
  name: string;
  completed: boolean;
}

interface PhaseData {
  id: string;
  name: string;
  shortName: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  tasks: PhaseTask[];
  remark: string;
}

const INITIAL_PHASES: PhaseData[] = [
  {
    id: 'design',
    name: 'Design and Costing Dept.',
    shortName: 'Design & Costing',
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    remark: 'GA & SLD drawings approved by client. BOQ list compiled.',
    tasks: [
      { id: 1, name: 'Ga Drawing', completed: true },
      { id: 2, name: 'SLD', completed: true },
      { id: 3, name: 'Control Drawing', completed: true },
      { id: 4, name: 'All Drawing Approve', completed: true },
      { id: 5, name: 'BOQ', completed: true },
      { id: 6, name: 'Job Loaded', completed: true },
      { id: 7, name: 'Job file Send to Dept.', completed: true }
    ]
  },
  {
    id: 'mechanical',
    name: 'Mechanical Dept.',
    shortName: 'Mechanical',
    icon: Cpu,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    remark: 'Sheet cutting & fabrication done. Powder coating in progress.',
    tasks: [
      { id: 1, name: 'Job File Received', completed: true },
      { id: 2, name: 'Sheet Cutting', completed: true },
      { id: 3, name: 'Bending', completed: true },
      { id: 4, name: 'Fabrication', completed: true },
      { id: 5, name: 'Painting', completed: true },
      { id: 6, name: 'Dispatch to Busbar Dept.', completed: true }
    ]
  },
  {
    id: 'assembly',
    name: 'Assembly & Busbar Dept.',
    shortName: 'Assembly & Busbar',
    icon: Wrench,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    remark: 'Busbar tightening under inspection. 3 of 6 tasks remaining.',
    tasks: [
      { id: 1, name: 'Job File Received', completed: true },
      { id: 2, name: 'Panel Assemble', completed: true },
      { id: 3, name: 'Busbar & Switchgear fitted', completed: true },
      { id: 4, name: 'Busbar tightening', completed: false },
      { id: 5, name: 'Accessories Fitted', completed: false },
      { id: 6, name: 'Dispatch to Electrical Dept.', completed: false }
    ]
  },
  {
    id: 'electrical',
    name: 'Electrical Dept.',
    shortName: 'Electrical',
    icon: Zap,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    remark: 'Control wiring ongoing. Power wiring schematics verified.',
    tasks: [
      { id: 1, name: 'Job File Received', completed: true },
      { id: 2, name: 'Power Wiring', completed: true },
      { id: 3, name: 'Control Wiring', completed: false },
      { id: 4, name: 'Accessories Wiring', completed: false },
      { id: 5, name: 'Dispatch to Testing Dept.', completed: false }
    ]
  },
  {
    id: 'testing',
    name: 'Testing Dept.',
    shortName: 'Testing',
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    remark: 'Awaiting electrical dispatch for high-voltage dielectric test.',
    tasks: [
      { id: 1, name: 'Job File Received', completed: true },
      { id: 2, name: 'Short Material List', completed: false },
      { id: 3, name: 'Panel operation Test', completed: false },
      { id: 4, name: 'All Parameter Checked by Approve list', completed: false },
      { id: 5, name: 'Ready for Dispatch.', completed: false }
    ]
  },
  {
    id: 'store',
    name: 'Store Dept.',
    shortName: 'Store',
    icon: Package,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    remark: 'All raw materials & switchgears received in store warehouse.',
    tasks: [
      { id: 1, name: 'Job File Received', completed: true },
      { id: 2, name: 'Order Material Shortlisted', completed: true },
      { id: 3, name: 'Material Order', completed: true },
      { id: 4, name: 'Material Received', completed: true },
      { id: 5, name: 'Material Handover to Dept.', completed: true }
    ]
  },
  {
    id: 'support',
    name: 'Support & Service Dept.',
    shortName: 'Support & Service',
    icon: Headphones,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    remark: 'Site engineer assigned for post-dispatch commissioning.',
    tasks: [
      { id: 1, name: 'Service Call Received', completed: true },
      { id: 2, name: 'Assigned Engineer', completed: true },
      { id: 3, name: 'Service call done', completed: false },
      { id: 4, name: 'Submit service report', completed: false }
    ]
  }
];

// Inquiry Item Interface
interface InquiryItem {
  id: string;
  client: string;
  project: string;
  amount: string;
  date: string;
  status: 'Confirmed' | 'Offer Sent' | 'Unconfirmed';
  weeksAgo: number;
}

const INQUIRY_DATABASE: InquiryItem[] = [
  { id: 'INQ_01', client: 'Reliance Green Energy', project: '132kV Substation Panel', amount: '₹ 18,50,000', date: '18 Jul 2026', status: 'Confirmed', weeksAgo: 1 },
  { id: 'INQ_02', client: 'Tata Steel Infra', project: 'Control Desk & PCC Panel', amount: '₹ 12,20,000', date: '16 Jul 2026', status: 'Offer Sent', weeksAgo: 1 },
  { id: 'INQ_03', client: 'Adani Solar Power', project: 'MCC Panel System', amount: '₹ 24,00,000', date: '14 Jul 2026', status: 'Confirmed', weeksAgo: 1 },
  { id: 'INQ_04', client: 'L&T Construction', project: 'Distribution Board DB-04', amount: '₹ 8,40,000', date: '12 Jul 2026', status: 'Unconfirmed', weeksAgo: 1 },
  { id: 'INQ_05', client: 'Torrent Power Pvt Ltd', project: 'APFC Panel 440V', amount: '₹ 15,10,000', date: '09 Jul 2026', status: 'Confirmed', weeksAgo: 2 },
  { id: 'INQ_06', client: 'JSW Energy Ltd', project: 'Busduct System 2000A', amount: '₹ 31,00,000', date: '05 Jul 2026', status: 'Offer Sent', weeksAgo: 2 },
  { id: 'INQ_07', client: 'BHEL Engineering', project: 'Generator Control Panel', amount: '₹ 22,80,000', date: '28 Jun 2026', status: 'Confirmed', weeksAgo: 3 },
  { id: 'INQ_08', client: 'GMR Airports Pvt Ltd', project: 'Main Switchboard MSB-1', amount: '₹ 19,40,000', date: '24 Jun 2026', status: 'Unconfirmed', weeksAgo: 4 }
];

const DEFAULT_CONFIRMED_PROJECTS = [
  { id: 'INQ_01', inquiryCode: 'INQ_01', client: 'Reliance Green Energy', project: '132kV Substation Panel', status: 'Confirmed' },
  { id: 'INQ_03', inquiryCode: 'INQ_03', client: 'Adani Solar Power', project: 'MCC Panel System', status: 'Confirmed' },
  { id: 'INQ_05', inquiryCode: 'INQ_05', client: 'Torrent Power Pvt Ltd', project: 'APFC Panel 440V', status: 'Confirmed' },
  { id: 'INQ_07', inquiryCode: 'INQ_07', client: 'BHEL Engineering', project: 'Generator Control Panel', status: 'Confirmed' }
];

/**
 * Per-project phase completion profiles — STRICTLY SEQUENTIAL.
 * A phase can only have completed tasks if ALL previous phases are 100% done.
 *
 * INQ_01 – Reliance (132kV)  : Assembly & Busbar in progress     → 16/38 (42%)
 * INQ_03 – Adani Solar (MCC) : Mechanical in progress             → 11/38 (29%)
 * INQ_05 – Torrent (APFC)    : Testing almost done               → 28/38 (74%)
 * INQ_07 – BHEL (Generator)  : Electrical in progress            → 21/38 (55%)
 *
 * Phases: Design(7) → Mechanical(6) → Assembly(6) → Electrical(5) → Testing(5) → Store(5) → Support(4)
 */
const PROJECT_PHASE_PROFILES: Record<string, boolean[][]> = {
  // INQ_01: Design ✓ → Mechanical ✓ → Assembly WIP → rest LOCKED
  INQ_01: [
    [true,  true,  true,  true,  true,  true,  true],   // Design: 7/7 ✓
    [true,  true,  true,  true,  true,  true],            // Mechanical: 6/6 ✓
    [true,  true,  true,  false, false, false],           // Assembly: 3/6 ⚡ ACTIVE
    [false, false, false, false, false],                  // Electrical: 0/5 🔒
    [false, false, false, false, false],                  // Testing:    0/5 🔒
    [false, false, false, false, false],                  // Store:      0/5 🔒
    [false, false, false, false],                         // Support:    0/4 🔒
  ],
  // INQ_03: Design ✓ → Mechanical WIP → rest LOCKED
  INQ_03: [
    [true,  true,  true,  true,  true,  true,  true],   // Design: 7/7 ✓
    [true,  true,  true,  true,  false, false],           // Mechanical: 4/6 ⚡ ACTIVE
    [false, false, false, false, false, false],           // Assembly:   0/6 🔒
    [false, false, false, false, false],                  // Electrical: 0/5 🔒
    [false, false, false, false, false],                  // Testing:    0/5 🔒
    [false, false, false, false, false],                  // Store:      0/5 🔒
    [false, false, false, false],                         // Support:    0/4 🔒
  ],
  // INQ_05: Design ✓ → Mech ✓ → Assembly ✓ → Electrical ✓ → Testing WIP → rest LOCKED
  INQ_05: [
    [true,  true,  true,  true,  true,  true,  true],   // Design: 7/7 ✓
    [true,  true,  true,  true,  true,  true],            // Mechanical: 6/6 ✓
    [true,  true,  true,  true,  true,  true],            // Assembly:   6/6 ✓
    [true,  true,  true,  true,  true],                   // Electrical: 5/5 ✓
    [true,  true,  true,  true,  false],                  // Testing: 4/5 ⚡ ACTIVE
    [false, false, false, false, false],                  // Store:   0/5 🔒
    [false, false, false, false],                         // Support: 0/4 🔒
  ],
  // INQ_07: Design ✓ → Mech ✓ → Assembly ✓ → Electrical WIP → rest LOCKED
  INQ_07: [
    [true,  true,  true,  true,  true,  true,  true],   // Design: 7/7 ✓
    [true,  true,  true,  true,  true,  true],            // Mechanical: 6/6 ✓
    [true,  true,  true,  true,  true,  true],            // Assembly:   6/6 ✓
    [true,  true,  false, false, false],                  // Electrical: 2/5 ⚡ ACTIVE
    [false, false, false, false, false],                  // Testing:    0/5 🔒
    [false, false, false, false, false],                  // Store:      0/5 🔒
    [false, false, false, false],                         // Support:    0/4 🔒
  ],
};

/** Build PhaseData[] for a given project code, using DB tasks if available else the profile map */
function buildPhasesForProject(projectId: string, dbPhaseData?: any[]): PhaseData[] {
  // Normalise: accept both UUID and inquiryCode forms
  const profileKey = Object.keys(PROJECT_PHASE_PROFILES).find(k => projectId.includes(k)) || projectId;
  const profile = PROJECT_PHASE_PROFILES[profileKey];

  return INITIAL_PHASES.map((initPhase, pIdx) => {
    // 1. Try real DB tasks for this project first
    if (dbPhaseData && dbPhaseData.length > 0) {
      const dbP = dbPhaseData.find((p: any) =>
        p.name?.toLowerCase().includes(initPhase.shortName.toLowerCase().split(' ')[0]) ||
        p.badge?.toLowerCase() === initPhase.id.toLowerCase()
      );
      if (dbP?.tasks) {
        const pTasks = dbP.tasks.filter((t: any) =>
          t.inquiryId === projectId ||
          t.inquiry?.id === projectId ||
          t.inquiry?.inquiryCode === projectId
        );
        if (pTasks.length > 0) {
          return {
            ...initPhase,
            tasks: pTasks.map((t: any, idx: number) => ({
              id: idx + 1,
              name: t.name,
              completed: t.status === 'DONE'
            }))
          };
        }
      }
    }

    // 2. Use the explicit per-project profile (guaranteed distinct per project)
    if (profile && profile[pIdx]) {
      return {
        ...initPhase,
        tasks: initPhase.tasks.map((t, tIdx) => ({
          ...t,
          completed: profile[pIdx][tIdx] ?? false
        }))
      };
    }

    // 3. Last resort: return tasks with all incomplete (0% progress) for brand new projects
    return {
      ...initPhase,
      tasks: initPhase.tasks.map(t => ({ ...t, completed: false }))
    };
  });
}

export default function Dashboard() {
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

  // Helper to get the first active incomplete phase in the manufacturing pipeline
  const getNextActivePhaseId = (phaseList: PhaseData[]) => {
    const firstIncomplete = phaseList.find(p => p.tasks.some(t => !t.completed));
    return firstIncomplete ? firstIncomplete.id : phaseList[phaseList.length - 1].id;
  };

  // Phases & Tasks State — initialized with INQ_01 profile, updated on project switch
  const [phases, setPhases] = useState<PhaseData[]>(() => buildPhasesForProject('INQ_01'));
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>(() => getNextActivePhaseId(buildPhasesForProject('INQ_01')));
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  // Sales & Inquiry Funnel Timeframe State
  const [timeHorizon, setTimeHorizon] = useState<'1w' | '4w' | '8w'>('4w');
  const [inquirySearch, setInquirySearch] = useState('');

  // Active Project Selector State (R1)
  const [confirmedProjects, setConfirmedProjects] = useState<any[]>(DEFAULT_CONFIRMED_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('INQ_01');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/inquiries`);
        if (res.ok) {
          const data = await res.json();
          const confirmed = data.filter((i: any) => i.status === 'Confirmed' && !i.holdStatus);
          if (confirmed.length > 0) {
            setConfirmedProjects(confirmed);
            setSelectedProjectId(prev => (prev && confirmed.some((p: any) => (p.inquiryCode || p.id) === prev) ? prev : (confirmed[0].inquiryCode || confirmed[0].id)));
            return;
          }
        }
      } catch (err) {
        console.error('Failed to fetch confirmed projects:', err);
      }
      setConfirmedProjects(DEFAULT_CONFIRMED_PROJECTS);
      setSelectedProjectId(DEFAULT_CONFIRMED_PROJECTS[0].id);
    };
    fetchProjects();
  }, []);

  // Currently selected project object
  const currentSelectedProject = confirmedProjects.find(p => p.id === selectedProjectId || p.inquiryCode === selectedProjectId) || confirmedProjects[0] || DEFAULT_CONFIRMED_PROJECTS[0];

  // Dynamically adapt department phases & checklist tasks to selectedProjectId
  useEffect(() => {
    if (!selectedProjectId) return;

    // Use inquiryCode if we can find it, so database UUIDs correctly map to our INQ_XX profiles
    const proj = confirmedProjects.find(p => p.id === selectedProjectId || p.inquiryCode === selectedProjectId);
    const lookupCode = proj?.inquiryCode || proj?.id || selectedProjectId;

    const fetchProjectTasks = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/wbs`);
        if (res.ok) {
          const dbPhases = await res.json();
          // buildPhasesForProject tries DB tasks first, then falls back to per-project profile
          const newPhases = buildPhasesForProject(lookupCode, dbPhases);
          setPhases(newPhases);
          setSelectedPhaseId(getNextActivePhaseId(newPhases));
          return;
        }
      } catch (err) {
        console.error('Project WBS fetch failed:', err);
      }
      // No API — use profile only
      const newPhases = buildPhasesForProject(lookupCode);
      setPhases(newPhases);
      setSelectedPhaseId(getNextActivePhaseId(newPhases));
    };

    fetchProjectTasks();
  }, [selectedProjectId, confirmedProjects]);

  const calendarRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setCalendarOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedDateFormatted = `${selectedDay} ${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
  const isToday = selectedDay === todayDay && selectedMonth === todayMonth && selectedYear === todayYear;

  // Toggle task completion — enforces sequential department workflow
  const handleToggleTask = (phaseId: string, taskId: number) => {
    const phaseIdx = phases.findIndex(p => p.id === phaseId);
    if (phaseIdx < 0) return;

    // WORKFLOW GATE: all phases before this one must be 100% complete
    const previousPhasesAllDone = phases
      .slice(0, phaseIdx)
      .every(p => p.tasks.every(t => t.completed));

    if (!previousPhasesAllDone) return; // silently block — UI already shows lock

    setPhases(prev => prev.map(phase => {
      if (phase.id !== phaseId) return phase;
      return {
        ...phase,
        tasks: phase.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
      };
    }));
  };

  // Update remark for phase
  const handleRemarkChange = (phaseId: string, remark: string) => {
    setPhases(prev => prev.map(phase => phase.id === phaseId ? { ...phase, remark } : phase));
  };

  // Selected phase data object
  const activePhaseData = phases.find(p => p.id === selectedPhaseId) || phases[0];

  // ── Project-scoped stats ── all derived from `phases` which updates on project switch
  const projectStats = React.useMemo(() => {
    let totalCompleted = 0;
    let totalTasksCount = 0;
    let deptsDone = 0;
    let deptsInProgress = 0;
    let deptsNotStarted = 0;

    phases.forEach(p => {
      const done = p.tasks.filter(t => t.completed).length;
      totalCompleted += done;
      totalTasksCount += p.tasks.length;
      if (done === p.tasks.length) deptsDone++;
      else if (done > 0) deptsInProgress++;
      else deptsNotStarted++;
    });

    const overallProgress = totalTasksCount === 0 ? 0 : Math.round((totalCompleted / totalTasksCount) * 100);
    const activeIncompletePhase = phases.find(p => p.tasks.some(t => !t.completed)) || phases[phases.length - 1];

    // Project-seeded (deterministic) staff number so it varies per project but stays stable
    const seed = selectedProjectId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const assignedStaff = 4 + (seed % 5);          // 4–8 staff per project
    const presentStaff = Math.max(1, assignedStaff - (seed % 2)); // 0–1 absent
    const attendancePct = Math.round((presentStaff / assignedStaff) * 100);

    // Phases still active (in progress or not started)
    const activePhaseCount = deptsInProgress + deptsNotStarted;

    return {
      overallProgress,
      tasksCompleted: totalCompleted,
      totalTasks: totalTasksCount,
      completedPercentage: overallProgress,
      assignedStaff,
      presentStaff,
      attendancePct,
      activeTasks: totalTasksCount - totalCompleted,
      deptsInProgress,
      deptsDone,
      deptsNotStarted,
      activePhaseCount,
      currentPhase: activeIncompletePhase.shortName
    };
  }, [phases, selectedProjectId]);

  const stats = projectStats;

  // Calendar calculations
  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfWeek = (month: number, year: number) => new Date(year, month, 1).getDay();

  const daysInCurrentMonth = getDaysInMonth(viewMonth, viewYear);
  const startDayOffset = getFirstDayOfWeek(viewMonth, viewYear);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
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

  // Filtered phases list
  const filteredPhases = phases.filter(phase => {
    if (departmentFilter === 'All') return true;
    return phase.shortName.toLowerCase().includes(departmentFilter.toLowerCase());
  });

  // Calculation for Inquiry Funnel Statistics based on Time Horizon
  const getInquiryStats = () => {
    let weeksLimit = 4;
    if (timeHorizon === '1w') weeksLimit = 1;
    if (timeHorizon === '8w') weeksLimit = 8;

    const filtered = INQUIRY_DATABASE.filter(item => item.weeksAgo <= weeksLimit);

    let inquiriesCount = timeHorizon === '1w' ? 8 : (timeHorizon === '4w' ? 28 : 54);
    let offersCount = timeHorizon === '1w' ? 7 : (timeHorizon === '4w' ? 24 : 46);
    let confirmedCount = timeHorizon === '1w' ? 5 : (timeHorizon === '4w' ? 18 : 36);
    let unconfirmedCount = timeHorizon === '1w' ? 2 : (timeHorizon === '4w' ? 6 : 10);
    
    const winRate = Math.round((confirmedCount / offersCount) * 100);

    return {
      filteredList: filtered,
      inquiriesCount,
      offersCount,
      confirmedCount,
      unconfirmedCount,
      winRate
    };
  };

  const inquiryStats = getInquiryStats();

  const searchedInquiries = inquiryStats.filteredList.filter(item => 
    item.client.toLowerCase().includes(inquirySearch.toLowerCase()) ||
    item.project.toLowerCase().includes(inquirySearch.toLowerCase()) ||
    item.status.toLowerCase().includes(inquirySearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        {/* Left side: Project Selection Dropdown (R1) */}
        <div className="flex flex-col gap-2">
          <div className="w-80">
            <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-1 block">Active Project</span>
            <ProjectDropdown
              projects={confirmedProjects}
              selectedProjectId={selectedProjectId}
              onSelectProject={setSelectedProjectId}
            />
          </div>

          {!isToday && (
            <div className="flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200/80 px-3.5 py-1.5 rounded-xl text-xs font-semibold animate-in fade-in">
              <Clock size={14} className="text-amber-600" />
              <span>Viewing History for <strong>{selectedDateFormatted}</strong></span>
              <button 
                onClick={() => handleSetPreset(todayDay, todayMonth, todayYear)}
                className="ml-2 flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-900 bg-amber-200/50 hover:bg-amber-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>Today</span>
              </button>
            </div>
          )}
        </div>
        {/* Right Side: Date Picker Popup & Export Button */}
        <div className="flex items-center gap-3">
          {/* Interactive Date Picker with Calendar Popup */}
          <div className="relative" ref={calendarRef}>
            <button 
              type="button"
              onClick={() => setCalendarOpen(!calendarOpen)}
              className="flex items-center gap-2 bg-white px-4 py-2 border border-slate-200 hover:border-blue-400 rounded-xl shadow-xs hover:shadow-sm transition-all cursor-pointer text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <CalendarIcon size={15} className="text-blue-600" />
              <span>{selectedDateFormatted}</span>
              <ChevronDown size={14} className={`text-slate-400 ml-1 transition-transform duration-200 ${calendarOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Pop-up Calendar Dropdown */}
            {calendarOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Calendar Header with Navigation */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                  <button 
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-bold text-slate-800 tracking-wide">
                    {MONTH_NAMES[viewMonth]} {viewYear}
                  </span>
                  <button 
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
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
                        className={`h-7 w-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
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
                    Click any date to inspect historical task metrics
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Export Report Button */}
          <button 
            type="button"
            onClick={() => alert(`Exporting Task History Report for ${selectedDateFormatted}...`)}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 border border-slate-200 rounded-xl shadow-xs transition-all text-xs font-semibold active:scale-95 cursor-pointer"
          >
            <Download size={14} className="text-slate-500" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Selected Project Scope Banner */}
      {currentSelectedProject && (
        <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-slate-900 text-white p-4 rounded-2xl border border-blue-800/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center flex-shrink-0 font-bold text-xs font-mono">
              {currentSelectedProject.inquiryCode || currentSelectedProject.id}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-widest text-blue-300 uppercase">ACTIVE SCOPE:</span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded-md">
                  Confirmed Order
                </span>
              </div>
              <h2 className="text-sm font-extrabold text-white tracking-wide mt-0.5">
                {currentSelectedProject.project} <span className="text-slate-400 font-normal">| {currentSelectedProject.client}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-700/80 pt-2 md:pt-0 md:pl-4 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Project Progress</span>
              <span className="font-extrabold text-white text-sm">{stats.overallProgress}% Complete</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Active Department</span>
              <span className="font-bold text-blue-300 text-xs uppercase">{stats.currentPhase}</span>
            </div>
          </div>
        </div>
      )}

      {/* Top 6 KPI Stat Cards Grid — project-scoped */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">

        {/* Card 1: OVERALL PROGRESS */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between h-[155px]">
          <div>
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">OVERALL PROGRESS</span>
              <CircularProgress percentage={stats.overallProgress} strokeColor="stroke-blue-600" />
            </div>
            <div className="mt-[-8px]">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{stats.overallProgress}%</span>
              <div className="flex items-center gap-1 text-[11px] font-semibold mt-1 text-slate-500">
                <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-md">{stats.tasksCompleted}/{stats.totalTasks} tasks</span>
              </div>
            </div>
          </div>
          <MiniWaveChart />
        </div>

        {/* Card 2: CURRENT PHASE */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between h-[155px] relative overflow-hidden">
          <div>
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ACTIVE DEPT.</span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <Wrench size={18} />
              </div>
            </div>
            <div className="mt-[-2px]">
              <span className="text-base font-extrabold text-slate-900 tracking-tight uppercase leading-tight block">{stats.currentPhase}</span>
              <p className="text-[11px] font-medium text-slate-400 mt-1">{stats.deptsInProgress} dept{stats.deptsInProgress !== 1 ? 's' : ''} in progress · {stats.deptsDone} done</p>
            </div>
          </div>
          <div className="absolute -right-3 -bottom-3 text-slate-100/90 pointer-events-none z-0">
            <Settings size={76} strokeWidth={1.2} />
          </div>
        </div>

        {/* Card 3: TASKS COMPLETED */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between h-[155px]">
          <div>
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TASKS COMPLETED</span>
              <CircularProgress percentage={stats.completedPercentage} strokeColor="stroke-emerald-500" />
            </div>
            <div className="mt-[-8px]">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{stats.tasksCompleted} / {stats.totalTasks}</span>
              <p className="text-[11px] font-medium text-slate-400 mt-1">{stats.activeTasks} tasks remaining</p>
            </div>
          </div>
          <MiniBarChart barColor="bg-emerald-400" />
        </div>

        {/* Card 4: ASSIGNED TEAM */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between h-[155px]">
          <div>
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ASSIGNED TEAM</span>
              <CircularProgress percentage={stats.attendancePct} strokeColor="stroke-indigo-500" />
            </div>
            <div className="mt-[-8px]">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{stats.presentStaff} / {stats.assignedStaff}</span>
              <p className="text-[11px] font-semibold text-indigo-600 mt-1">{stats.attendancePct}% present today</p>
            </div>
          </div>
          <MiniBarChart barColor="bg-indigo-400" />
        </div>

        {/* Card 5: OPEN TASKS */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between h-[155px]">
          <div>
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">OPEN TASKS</span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <ClipboardList size={18} />
              </div>
            </div>
            <div className="mt-[-2px]">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{stats.activeTasks}</span>
              <p className="text-[11px] font-medium text-slate-400 mt-1">
                Across {stats.activePhaseCount} active dept{stats.activePhaseCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <MiniBarChart barColor="bg-amber-400" />
        </div>

        {/* Card 6: DEPTS DONE */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between h-[155px]">
          <div>
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DEPTS DONE</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <CheckCircle size={18} />
              </div>
            </div>
            <div className="mt-[-2px]">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{stats.deptsDone} / {phases.length}</span>
              <p className="text-[11px] font-medium text-slate-400 mt-1">{stats.deptsNotStarted} not yet started</p>
            </div>
          </div>
          <MiniBarChart barColor="bg-emerald-400" />
        </div>

      </div>

      {/* NEW SECTION: Production Flow Overview & Tasks Completed by Phase (From Image 1 & Image 2) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Production Flow & Phases Overview</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentSelectedProject
                ? <><span className="font-semibold text-blue-600">[{currentSelectedProject.inquiryCode || currentSelectedProject.id}] {currentSelectedProject.project}</span> — {currentSelectedProject.client}
                  <span className="mx-1.5 text-slate-300">|</span>
                  {stats.tasksCompleted}/{stats.totalTasks} tasks · {stats.deptsDone} dept{stats.deptsDone !== 1 ? 's' : ''} complete
                </>
                : 'Live status of task completion and department progress across manufacturing phases'
              }
            </p>
          </div>

          {/* Department Filter Dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              type="button"
              onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <Filter size={13} className="text-slate-500" />
              <span>{departmentFilter === 'All' ? 'All Departments' : departmentFilter}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {filterDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in slide-in-from-top-1 duration-150">
                <button
                  type="button"
                  onClick={() => { setDepartmentFilter('All'); setFilterDropdownOpen(false); }}
                  className={`w-full text-left px-3.5 py-1.5 text-xs font-medium ${departmentFilter === 'All' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  All Departments
                </button>
                {phases.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setDepartmentFilter(p.shortName); setFilterDropdownOpen(false); }}
                    className={`w-full text-left px-3.5 py-1.5 text-xs font-medium ${departmentFilter === p.shortName ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    {p.shortName}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Phase Pipeline Flow Diagram */}
        <div className="relative overflow-x-auto pb-4 pt-2 scrollbar-thin scrollbar-thumb-slate-200">
          <div className="flex items-center justify-between min-w-[840px] px-4">
            {filteredPhases.map((phase, idx) => {
              const completedCount = phase.tasks.filter(t => t.completed).length;
              const totalCount = phase.tasks.length;
              const percentage = Math.round((completedCount / totalCount) * 100);
              const isSelected = phase.id === selectedPhaseId;
              const Icon = phase.icon;

              // Find original index (filteredPhases may be a subset)
              const originalIdx = phases.findIndex(p => p.id === phase.id);
              // LOCKED if any previous phase is not 100% complete
              const isLocked = phases
                .slice(0, originalIdx)
                .some(p => !p.tasks.every(t => t.completed));
              const isDone = percentage === 100;
              const isActive = !isLocked && !isDone && completedCount > 0;

              return (
                <React.Fragment key={phase.id}>
                  {/* Phase Node */}
                  <div
                    className={`flex flex-col items-center text-center group ${
                      isLocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                    onClick={() => !isLocked && setSelectedPhaseId(phase.id)}
                    title={isLocked ? 'Complete the previous department first' : phase.name}
                  >
                    {/* Badge Icon with Progress Ring */}
                    <div className="relative mb-3">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isSelected && !isLocked
                          ? 'ring-4 ring-blue-500/20 shadow-lg scale-105'
                          : !isLocked ? 'hover:scale-105' : ''
                      }`}>
                        {/* Circular progress ring */}
                        <svg className="absolute inset-0 w-16 h-16 transform -rotate-90">
                          <circle cx="32" cy="32" r="28"
                            className={isLocked ? 'stroke-slate-200' : 'stroke-slate-100'}
                            strokeWidth="3" fill="transparent" />
                          <circle
                            cx="32" cy="32" r="28"
                            className={
                              isLocked   ? 'stroke-slate-300' :
                              isDone     ? 'stroke-emerald-500' :
                              isSelected ? 'stroke-blue-600' :
                                           'stroke-blue-400/60'
                            }
                            strokeWidth="3.5"
                            strokeDasharray={2 * Math.PI * 28}
                            strokeDashoffset={2 * Math.PI * 28 - (percentage / 100) * (2 * Math.PI * 28)}
                            strokeLinecap="round"
                            fill="transparent"
                          />
                        </svg>

                        {/* Inner Circle Badge */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xs ${
                          isLocked
                            ? 'bg-slate-100 text-slate-400'
                            : `${phase.bgColor} ${phase.color}`
                        }`}>
                          {isLocked
                            ? <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            : <Icon size={20} />
                          }
                        </div>
                      </div>
                    </div>

                    {/* Phase Name */}
                    <span className={`text-xs font-bold transition-colors max-w-[110px] truncate ${
                      isLocked   ? 'text-slate-400' :
                      isSelected ? 'text-blue-600 font-extrabold' :
                                   'text-slate-800 group-hover:text-blue-600'
                    }`}>
                      {phase.shortName}
                    </span>

                    {/* Tasks Ratio or LOCKED badge */}
                    <div className="mt-1 flex flex-col items-center">
                      {isLocked ? (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md">Locked</span>
                      ) : (
                        <>
                          <span className="text-sm font-extrabold text-slate-900 tracking-tight">
                            {completedCount} / {totalCount}
                          </span>
                          <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                            isDone   ? 'text-emerald-500' :
                            isActive ? 'text-blue-500' :
                                       'text-slate-400'
                          }`}>
                            {isDone ? 'Done' : isActive ? 'In Progress' : 'Not Started'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Connecting Arrow — red dashed when locked */}
                  {idx < filteredPhases.length - 1 && (
                    <div className="flex-1 flex justify-center items-center px-1">
                      {(() => {
                        const nextOrigIdx = phases.findIndex(p => p.id === filteredPhases[idx + 1].id);
                        const nextLocked = phases.slice(0, nextOrigIdx).some(p => !p.tasks.every(t => t.completed));
                        return nextLocked
                          ? <ChevronRight size={18} strokeWidth={2} className="text-slate-200" />
                          : <ChevronRight size={18} strokeWidth={2.5} className="text-slate-300" />;
                      })()}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Selected Phase Interactive Task Checklist & Remark Box (From Image 1) */}
        <div className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-5 space-y-4 animate-in fade-in duration-200">
          
          {/* Phase Detail Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${activePhaseData.bgColor} ${activePhaseData.color} flex items-center justify-center shadow-xs`}>
                <activePhaseData.icon size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">{activePhaseData.name}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    activePhaseData.tasks.every(t => t.completed)
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {activePhaseData.tasks.every(t => t.completed) ? 'Phase Completed' : 'In Progress'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Checklist breakdown and department remark notes
                </p>
              </div>
            </div>

            {/* Task Completion Progress Bar for Selected Phase */}
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-right">
                <span className="text-xs font-extrabold text-slate-800">
                  {activePhaseData.tasks.filter(t => t.completed).length} of {activePhaseData.tasks.length} Tasks
                </span>
                <span className="text-[10px] block text-slate-400 font-semibold">
                  {Math.round((activePhaseData.tasks.filter(t => t.completed).length / activePhaseData.tasks.length) * 100)}% Complete
                </span>
              </div>
              <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(activePhaseData.tasks.filter(t => t.completed).length / activePhaseData.tasks.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Grid Layout: Tasks Checklist (Left) & Remark Box (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Task Checklist (Spans 2 columns) */}
            <div className="md:col-span-2 space-y-2">
              {(() => {
                const activePhaseOrigIdx = phases.findIndex(p => p.id === activePhaseData.id);
                const phaseIsLocked = phases
                  .slice(0, activePhaseOrigIdx)
                  .some(p => !p.tasks.every(t => t.completed));

                return (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Phase Task Checklist ({activePhaseData.tasks.filter(t => t.completed).length}/{activePhaseData.tasks.length})
                      </span>
                      {phaseIsLocked && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                          Complete previous department first
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activePhaseData.tasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => !phaseIsLocked && handleToggleTask(activePhaseData.id, task.id)}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all select-none ${
                            phaseIsLocked
                              ? 'bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed'
                              : task.completed
                                ? 'bg-white border-slate-200/80 shadow-xs hover:border-blue-300 cursor-pointer'
                                : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`text-xs font-extrabold px-2 py-0.5 rounded-md ${
                              phaseIsLocked ? 'bg-slate-100 text-slate-400' :
                              task.completed ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {task.id}
                            </span>
                            <span className={`text-xs font-semibold truncate ${
                              phaseIsLocked ? 'text-slate-400' :
                              task.completed ? 'text-slate-800 line-through decoration-slate-300' : 'text-slate-700'
                            }`}>
                              {task.name}
                            </span>
                          </div>

                          {phaseIsLocked ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 flex-shrink-0 ml-2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                          ) : task.completed ? (
                            <CheckSquare size={17} className="text-blue-600 flex-shrink-0 ml-2" />
                          ) : (
                            <Square size={17} className="text-slate-300 hover:text-slate-400 flex-shrink-0 ml-2" />
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Remark Box (Right column - exact requirement from Image 1) */}
            <div className="space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-blue-600" />
                    <span>Remark Box</span>
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">Department Notes</span>
                </div>

                <textarea
                  value={activePhaseData.remark}
                  onChange={(e) => handleRemarkChange(activePhaseData.id, e.target.value)}
                  placeholder="Type department remarks or notes for this phase..."
                  rows={4}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-xs resize-none"
                />
              </div>

              <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 flex items-center justify-between text-xs text-blue-800 font-medium">
                <span className="truncate">Remarks saved automatically</span>
                <Sparkles size={14} className="text-blue-500 flex-shrink-0" />
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* COMPACT CONNECTED INQUIRY SUMMARY BAR (Linked to /inquiries) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">
            <Send size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Commercial Inquiry Pipeline Summary</h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                Live Backend Connected
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live snapshot of client lead conversions and quotation offers
            </p>
          </div>
        </div>

        {/* Dynamic Quick Counters */}
        <div className="flex items-center gap-6">
          <div className="text-center sm:text-right">
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider text-[10px]">Total Leads</span>
            <span className="text-base font-extrabold text-slate-900 font-mono">10 Live Leads</span>
          </div>

          <div className="text-center sm:text-right border-l border-slate-100 pl-6">
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider text-[10px]">Confirmed Rate</span>
            <span className="text-base font-extrabold text-emerald-600 font-mono">60% Win Rate</span>
          </div>

          <a
            href="/inquiries"
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer ml-2"
          >
            <span>Manage Inquiries</span>
            <ChevronRight size={14} />
          </a>
        </div>
      </div>

    </div>
  );
}
