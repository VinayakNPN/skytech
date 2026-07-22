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
  ArrowUpRight
} from 'lucide-react';

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
  { id: 'INQ_08', client: 'GMR Airports Pvt Ltd', project: 'Main Switchboard MSB-1', amount: '₹ 19,40,000', date: '24 Jun 2026', status: 'Unconfirmed', weeksAgo: 4 },
  { id: 'INQ_09', client: 'NTPC Power Systems', project: 'Auxiliary Relay Panel', amount: '₹ 11,50,000', date: '18 Jun 2026', status: 'Confirmed', weeksAgo: 5 },
  { id: 'INQ_10', client: 'Siemens Energy India', project: 'HT Breaker Panel 11kV', amount: '₹ 29,00,000', date: '12 Jun 2026', status: 'Confirmed', weeksAgo: 6 }
];

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

  // Phases & Tasks State (Auto-selects first active incomplete phase)
  const [phases, setPhases] = useState<PhaseData[]>(INITIAL_PHASES);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>(() => getNextActivePhaseId(INITIAL_PHASES));
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  // Auto-advance active phase focus when all tasks in selected phase are completed
  useEffect(() => {
    const activePhaseObj = phases.find(p => p.id === selectedPhaseId);
    if (activePhaseObj && activePhaseObj.tasks.every(t => t.completed)) {
      const nextId = getNextActivePhaseId(phases);
      if (nextId !== selectedPhaseId) {
        setSelectedPhaseId(nextId);
      }
    }
  }, [phases, selectedPhaseId]);

  // Sales & Inquiry Funnel Timeframe State
  const [timeHorizon, setTimeHorizon] = useState<'1w' | '4w' | '8w'>('4w');
  const [inquirySearch, setInquirySearch] = useState('');

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

  // Toggle task completion
  const handleToggleTask = (phaseId: string, taskId: number) => {
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

  // Dynamic stats calculation based on date and phases
  const getStatsForDate = (day: number, month: number, year: number) => {
    const seed = (day * 7 + month * 13 + year) % 100;

    let totalCompleted = 0;
    let totalTasksCount = 0;
    phases.forEach(p => {
      totalCompleted += p.tasks.filter(t => t.completed).length;
      totalTasksCount += p.tasks.length;
    });

    const overallProgress = Math.round((totalCompleted / totalTasksCount) * 100);
    const activeIncompletePhase = phases.find(p => p.tasks.some(t => !t.completed)) || phases[phases.length - 1];

    return {
      overallProgress,
      tasksCompleted: totalCompleted,
      totalTasks: totalTasksCount,
      completedPercentage: overallProgress,
      staffPresent: Math.min(8, Math.max(5, 6 + (seed % 3))),
      totalStaff: 8,
      attendancePercentage: Math.round((7 / 8) * 100),
      activeTasks: totalTasksCount - totalCompleted,
      runningJobs: 4,
      currentPhase: activeIncompletePhase.shortName
    };
  };

  const stats = getStatsForDate(selectedDay, selectedMonth, selectedYear);

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
      <div className="flex items-center justify-between gap-3 pb-1">
        {/* Left side: History mode notification status */}
        <div>
          {!isToday && (
            <div className="flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200/80 px-3.5 py-1.5 rounded-xl text-xs font-semibold animate-in fade-in">
              <Clock size={14} className="text-amber-600" />
              <span>Viewing Task History for <strong>{selectedDateFormatted}</strong></span>
              <button 
                onClick={() => handleSetPreset(todayDay, todayMonth, todayYear)}
                className="ml-2 flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-900 bg-amber-200/50 hover:bg-amber-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>Reset to Today</span>
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

      {/* Top 6 KPI Stat Cards Grid */}
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
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
                <span>↑</span>
                <span>+8.3% vs last month</span>
              </div>
            </div>
          </div>
          <MiniWaveChart />
        </div>

        {/* Card 2: CURRENT PHASE */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between h-[155px] relative overflow-hidden">
          <div>
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CURRENT PHASE</span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <Wrench size={18} />
              </div>
            </div>
            <div className="mt-[-2px]">
              <span className="text-xl font-extrabold text-slate-900 tracking-tight uppercase">{stats.currentPhase}</span>
              <p className="text-[11px] font-medium text-slate-400 mt-1">Active department</p>
            </div>
          </div>
          {/* Subtle Gear Watermark in background */}
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
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
                <span>↑</span>
                <span>+3 tasks vs yesterday</span>
              </div>
            </div>
          </div>
          <MiniBarChart barColor="bg-emerald-400" />
        </div>

        {/* Card 4: STAFF ATTENDANCE */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between h-[155px]">
          <div>
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">STAFF ATTENDANCE</span>
              <CircularProgress percentage={stats.attendancePercentage} strokeColor="stroke-indigo-500" />
            </div>
            <div className="mt-[-8px]">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">7 / 8</span>
              <p className="text-[11px] font-semibold text-indigo-600 mt-1">87.5% present today</p>
            </div>
          </div>
          <MiniBarChart barColor="bg-indigo-400" />
        </div>

        {/* Card 5: ACTIVE TASKS */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between h-[155px]">
          <div>
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ACTIVE TASKS</span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <ClipboardList size={18} />
              </div>
            </div>
            <div className="mt-[-2px]">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{stats.activeTasks}</span>
              <p className="text-[11px] font-medium text-slate-400 mt-1">Open across all departments</p>
            </div>
          </div>
          <MiniBarChart barColor="bg-amber-400" />
        </div>

        {/* Card 6: RUNNING JOBS */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between h-[155px]">
          <div>
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">RUNNING JOBS</span>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center flex-shrink-0">
                <Briefcase size={18} />
              </div>
            </div>
            <div className="mt-[-2px]">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{stats.runningJobs}</span>
              <p className="text-[11px] font-medium text-slate-400 mt-1">Active manufacturing jobs</p>
            </div>
          </div>
          <MiniBarChart barColor="bg-rose-400" />
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
              Live status of task completion and department progress across manufacturing phases
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

        {/* Phase Pipeline Flow Diagram (Styled exactly like Image 2) */}
        <div className="relative overflow-x-auto pb-4 pt-2 scrollbar-thin scrollbar-thumb-slate-200">
          <div className="flex items-center justify-between min-w-[840px] px-4">
            {filteredPhases.map((phase, idx) => {
              const completedCount = phase.tasks.filter(t => t.completed).length;
              const totalCount = phase.tasks.length;
              const percentage = Math.round((completedCount / totalCount) * 100);
              const isSelected = phase.id === selectedPhaseId;
              const Icon = phase.icon;

              return (
                <React.Fragment key={phase.id}>
                  {/* Phase Node */}
                  <div className="flex flex-col items-center text-center group cursor-pointer" onClick={() => setSelectedPhaseId(phase.id)}>
                    {/* Badge Icon with Progress Ring */}
                    <div className="relative mb-3">
                      {/* Outer Ring for Active Selection */}
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isSelected 
                          ? 'ring-4 ring-blue-500/20 shadow-lg scale-105' 
                          : 'hover:scale-105'
                      }`}>
                        {/* Circular progress overlay ring around icon */}
                        <svg className="absolute inset-0 w-16 h-16 transform -rotate-90">
                          <circle cx="32" cy="32" r="28" className="stroke-slate-100" strokeWidth="3" fill="transparent" />
                          <circle 
                            cx="32" 
                            cy="32" 
                            r="28" 
                            className={percentage === 100 ? 'stroke-emerald-500' : isSelected ? 'stroke-blue-600' : 'stroke-blue-400/60'} 
                            strokeWidth="3.5" 
                            strokeDasharray={2 * Math.PI * 28} 
                            strokeDashoffset={2 * Math.PI * 28 - (percentage / 100) * (2 * Math.PI * 28)} 
                            strokeLinecap="round" 
                            fill="transparent" 
                          />
                        </svg>

                        {/* Inner Circle Badge */}
                        <div className={`w-12 h-12 rounded-full ${phase.bgColor} ${phase.color} flex items-center justify-center shadow-xs`}>
                          <Icon size={20} />
                        </div>
                      </div>
                    </div>

                    {/* Phase Name */}
                    <span className={`text-xs font-bold transition-colors max-w-[110px] truncate ${
                      isSelected ? 'text-blue-600 font-extrabold' : 'text-slate-800 group-hover:text-blue-600'
                    }`}>
                      {phase.shortName}
                    </span>

                    {/* Tasks Completed Ratio Display (e.g. 3 / 6 Tasks or 5 / 7 Tasks) */}
                    <div className="mt-1 flex flex-col items-center">
                      <span className="text-sm font-extrabold text-slate-900 tracking-tight">
                        {completedCount} / {totalCount}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        {percentage === 100 ? 'Done' : 'Tasks Completed'}
                      </span>
                    </div>
                  </div>

                  {/* Connecting Arrow between Phases */}
                  {idx < filteredPhases.length - 1 && (
                    <div className="flex-1 flex justify-center items-center px-1 text-slate-300">
                      <ChevronRight size={18} strokeWidth={2.5} className="text-slate-300" />
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
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Phase Task Checklist ({activePhaseData.tasks.filter(t => t.completed).length}/{activePhaseData.tasks.length})
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activePhaseData.tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(activePhaseData.id, task.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      task.completed
                        ? 'bg-white border-slate-200/80 shadow-xs hover:border-blue-300'
                        : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`text-xs font-extrabold px-2 py-0.5 rounded-md ${
                        task.completed ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {task.id}
                      </span>
                      <span className={`text-xs font-semibold truncate ${
                        task.completed ? 'text-slate-800 line-through decoration-slate-300' : 'text-slate-700'
                      }`}>
                        {task.name}
                      </span>
                    </div>

                    {task.completed ? (
                      <CheckSquare size={17} className="text-blue-600 flex-shrink-0 ml-2" />
                    ) : (
                      <Square size={17} className="text-slate-300 hover:text-slate-400 flex-shrink-0 ml-2" />
                    )}
                  </div>
                ))}
              </div>
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
