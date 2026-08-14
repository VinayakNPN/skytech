'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  Bell, 
  Settings, 
  Menu,
  X,
  User,
  LogOut,
  Search,
  ChevronLeft,
  Workflow,
  Send,
  Package,
  Clock,
  CheckSquare,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { API_BASE_URL, getAuthHeaders } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { ToastProvider } from '@/components/Toast';
import AdminApprovalModal from '@/components/AdminApprovalModal';

export interface DashboardLayoutProps {
  children: React.ReactNode;
}

function DashboardLayoutInner({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab');

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'Online' | 'Offline' | 'Checking'>('Checking');
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState<{id: string; message: string; time: string; read: boolean}[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [approvalRequests, setApprovalRequests] = useState<any[]>([]);
  const [selectedApprovalRequest, setSelectedApprovalRequest] = useState<any | null>(null);
  const [approvalPanelOpen, setApprovalPanelOpen] = useState(false);
  const approvalRef = useRef<HTMLDivElement>(null);

  // Restore sidebar state from localStorage on mount (after hydration)
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('skytech_sidebar_open');
    if (saved !== null) {
      setSidebarOpen(saved === 'true');
    }
    // Load notifications from localStorage
    const storedNotifs = localStorage.getItem('skytech_notifications');
    if (storedNotifs) {
      try {
        const parsed = JSON.parse(storedNotifs);
        if (Array.isArray(parsed)) {
          // Filter out mock notification IDs to clean up old stored mocks
          const filtered = parsed.filter((n: any) => n.id !== 'N-1' && n.id !== 'N-2');
          setNotifications(filtered);
          localStorage.setItem('skytech_notifications', JSON.stringify(filtered));
        } else {
          throw new Error('invalid format');
        }
      } catch {
        setNotifications([]);
        localStorage.setItem('skytech_notifications', JSON.stringify([]));
      }
    } else {
      setNotifications([]);
      localStorage.setItem('skytech_notifications', JSON.stringify([]));
    }
    // Remove temporary pre-paint helper class from html element after React mounts
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('sidebar-collapsed');
    }
  }, []);

  // Listen for new notifications pushed from anywhere via custom event
  useEffect(() => {
    const handler = (e: any) => {
      const msg = e.detail?.message || e.detail || '';
      if (!msg) return;
      const newNotif = {
        id: `N-${Date.now()}`,
        message: String(msg),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false
      };
      setNotifications(prev => {
        const updated = [newNotif, ...prev].slice(0, 50);
        localStorage.setItem('skytech_notifications', JSON.stringify(updated));
        return updated;
      });
    };
    window.addEventListener('skytech:notification', handler);
    return () => window.removeEventListener('skytech:notification', handler);
  }, []);

  // Save sidebar state to localStorage when toggled
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('skytech_sidebar_open', String(sidebarOpen));
    }
  }, [sidebarOpen, mounted]);

  // User Profile States
  const { user: authUser, loading, can, logout } = useAuth();
  const isAdmin = authUser?.isAdmin || false;
  const [profileOpen, setProfileOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [showSignOutToast, setShowSignOutToast] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const user = authUser ? {
    name: authUser.name,
    role: authUser.role,
    email: authUser.email,
    initials: authUser.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
  } : {
    name: 'Guest User',
    role: 'Viewer',
    email: '',
    initials: '?'
  };

  const [tempUser, setTempUser] = useState(user);

  useEffect(() => {
    if (authUser) {
      setTempUser(user);
    }
  }, [authUser]);

  // Click outside to close profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const container = document.getElementById('profile-menu-container');
      if (container && !container.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationPanelOpen(false);
      }
      if (approvalRef.current && !approvalRef.current.contains(event.target as Node)) {
        setApprovalPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Check backend connection
    const checkConnection = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/health`);
        if (res.ok) {
          setBackendStatus('Online');
        } else {
          setBackendStatus('Offline');
        }
      } catch (err) {
        setBackendStatus('Offline');
      }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  // Admin Approval Checkpoint Polling & SSE
  const seenRequestsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isAdmin) return;

    // 1. Initial Fetch & Polling (Fallback)
    const fetchApprovalRequests = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/approval-requests`, {
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          setApprovalRequests(data);
          
          if (data && data.length > 0) {
            const newRequests = data.filter((req: any) => !seenRequestsRef.current.has(req.id));
            if (newRequests.length > 0) {
              newRequests.forEach((req: any) => {
                seenRequestsRef.current.add(req.id);
                window.dispatchEvent(new CustomEvent('skytech:notification', {
                  detail: { message: `🔐 New User Approval Required: ${req.name || req.email}` }
                }));
              });

              setSelectedApprovalRequest((prev: any) => {
                if (!prev) {
                  return newRequests[0];
                }
                return prev;
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch approval requests', err);
      }
    };

    fetchApprovalRequests();
    const interval = setInterval(fetchApprovalRequests, 15000); // Poll every 15s

    // 2. Real-time SSE Connection
    let evtSource: EventSource | null = null;
    const getToken = () => {
      if (typeof document === 'undefined') return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; token=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };
    
    const token = getToken();
    if (token) {
      evtSource = new EventSource(`${API_BASE_URL}/api/auth/admin/events?token=${token}`);
      
      evtSource.onmessage = (event) => {
        try {
          if (event.data === ': heartbeat') return;
          const data = JSON.parse(event.data);
          if (data.type === 'NEW_APPROVAL_REQUEST') {
            const req = data.request;
            
            setApprovalRequests(prev => {
              if (prev.find(r => r.id === req.id)) return prev;
              return [req, ...prev];
            });

            if (!seenRequestsRef.current.has(req.id)) {
              seenRequestsRef.current.add(req.id);
              
              window.dispatchEvent(new CustomEvent('skytech:notification', {
                detail: { message: `🔐 New User Approval Required: ${req.name || req.email}` }
              }));
              
              setSelectedApprovalRequest((prev: any) => {
                if (!prev) return req;
                return prev;
              });
            }
          }
        } catch (err) {
          console.error('SSE parse error', err);
        }
      };
    }

    return () => {
      clearInterval(interval);
      if (evtSource) {
        evtSource.close();
      }
    };
  }, [isAdmin]);

  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('skytech_selected_project_id');
      if (saved) setSelectedProjectId(saved);
    }

    const fetchProjects = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/inquiries`);
        if (res.ok) {
          const data = await res.json();
          const confirmed = data.filter((i: any) => i.status === 'Confirmed' && !i.holdStatus);
          setProjectsList(confirmed);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchProjects();

    const handleProjectEvent = (e: any) => {
      const saved = localStorage.getItem('skytech_selected_project_id');
      if (saved) setSelectedProjectId(saved);
    };
    window.addEventListener('projectChanged', handleProjectEvent);
    return () => window.removeEventListener('projectChanged', handleProjectEvent);
  }, []);

  // Bypass standard layout for login page
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Sidebar Nav Sections matching main dashboard design
  const navSections = [
    {
      title: 'PROGRAMME',
      items: [
        ...(can('dashboard', 'read') ? [{ id: 'dashboard', name: 'Dashboard', href: '/', icon: LayoutDashboard }] : []),
        ...(can('inquiries', 'read') ? [{ id: 'inquiries', name: 'Inquiry Management', href: '/inquiries', icon: Send }] : []),
        ...(can('wbs', 'read') ? [{ id: 'wbs', name: 'WBS', href: '/wbs', icon: Workflow }] : []),
        ...(can('inventory', 'read') ? [{ id: 'inventory', name: 'Inventory Management', href: '/inventory', icon: Package }] : []),
      ]
    },
    {
      title: 'MAIN',
      items: [
        ...(can('employeeHub', 'read') ? [{ id: 'attendance', name: 'Attendance', href: '/employee-management?tab=attendance', icon: Clock }] : []),
        ...(can('employeeHub', 'read') ? [{ id: 'visits', name: 'Visit Reports', href: '/employee-management?tab=visits', icon: MapPin }] : []),
      ]
    },
    {
      title: 'HR',
      items: [
        ...(can('employeeHub', 'read') ? [{ id: 'leave', name: 'Leave', href: '/employee-management?tab=leave', icon: Calendar }] : []),

        // COMMENTED OUT — Running Jobs shown on main Dashboard instead. Uncomment to restore as sidebar link.
        // ...(can('employeeHub', 'read') ? [{ id: 'jobs', name: 'Running Jobs', href: '/employee-management?tab=jobs', icon: TrendingUp }] : []),
      ]
    },
    {
      title: 'MANAGEMENT',
      items: [
        ...(can('employees', 'read') ? [{ id: 'employees', name: 'Employee Directory', href: '/employees', icon: Users }] : []),
      ]
    }
  ].filter(section => section.items.length > 0);

  const allNavItems = navSections.flatMap(s => s.items);

  const getPageTitle = () => {
    const active = allNavItems.find(item => {
      if (item.href.includes('?tab=')) {
        return pathname === '/employee-management' && currentTab === item.href.split('?tab=')[1];
      }
      return item.href === pathname;
    });
    return active ? active.name : 'Skytech Program Management System';
  };


  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('skytech_selected_project_id', id);
      window.dispatchEvent(new CustomEvent('projectChanged', { detail: id }));
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden">
      {/* Sidebar - Styled according to reference screenshot */}
      <aside 
        id="main-sidebar"
        suppressHydrationWarning
        className={`bg-[#0B1728] text-slate-200 w-60 flex-shrink-0 flex flex-col justify-between border-r border-slate-800/80 ${
          mounted ? 'transition-all duration-300' : 'transition-none'
        } ${
          sidebarOpen ? 'ml-0' : '-ml-60'
        }`}
      >
        <div className="flex-1 flex flex-col min-h-0">
          {/* Logo Brand Header */}
          <div className="h-16 flex items-center justify-between px-4 bg-[#07111E] border-b border-slate-800/80 flex-shrink-0">
            <Link href="/" className="flex items-center gap-2.5">
              <img src="/logo.png" alt="SkyTech Logo" className="h-8 w-auto object-contain shrink-0" />
              <div className="flex flex-col">
                <span className="font-extrabold text-sm tracking-widest text-white">SKYTECH</span>
                <span className="text-[9px] text-slate-400 tracking-wider">SYSTEMS SPMS</span>
              </div>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
              <X size={18} />
            </button>
          </div>



          {/* Quick Search Input (Matching Reference Design) */}
          <div className="px-3 pt-2 pb-2 flex-shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Quick search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-[#06101D] border border-slate-700/60 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Navigation Menu with Section Headers */}
          <nav className="flex-1 overflow-y-auto px-3 space-y-4 py-2 scrollbar-thin scrollbar-thumb-slate-800">
            {navSections.map((section) => {
              const filteredItems = section.items.filter(item => 
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
              );

              if (filteredItems.length === 0) return null;

              return (
                <div key={section.title} className="space-y-1">
                  {/* Category Section Header */}
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 block">
                    {section.title}
                  </span>

                  {/* Menu Items */}
                  {filteredItems.map((item) => {
                    let isActive = false;
                    if (item.href.includes('?tab=')) {
                      const targetTab = item.href.split('?tab=')[1];
                      isActive = pathname === '/employee-management' && currentTab === targetTab;
                    } else {
                      isActive = pathname === item.href;
                    }
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        id={`nav-${item.id}`}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 ${
                          isActive 
                            ? 'bg-[#1D89F5] text-white shadow-md shadow-blue-500/20 font-bold' 
                            : 'text-slate-300 hover:bg-[#132438] hover:text-white'
                        }`}
                      >
                        <Icon size={17} className={isActive ? 'text-white' : 'text-slate-400'} />
                        <span className="truncate">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer with Collapse Chevron */}
        <div className="p-3 border-t border-slate-800/80 bg-[#07111E]/70 flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#132438] rounded-lg transition-colors cursor-pointer"
            title="Toggle Sidebar"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <span>v1.0.0</span>
          </div>
        </div>
      </aside>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-xl font-bold text-[#0E3B68] tracking-tight truncate hidden md:block">
              SKYTECH PROGRAM MANAGEMENT SYSTEM
            </h1>
            <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 md:inline-block hidden">
              {getPageTitle()}
            </span>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-4">
            {/* Admin Approvals */}
            {isAdmin && (
              <div className="relative" ref={approvalRef}>
                <button
                  onClick={() => setApprovalPanelOpen(prev => !prev)}
                  className={`p-2 rounded-full transition-all duration-200 relative ${approvalRequests.length > 0 ? 'text-amber-500 hover:bg-amber-50' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
                  title="Pending User Approvals"
                >
                  <Users size={18} />
                  {approvalRequests.length > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold border border-white">
                      {approvalRequests.length}
                    </span>
                  )}
                </button>

                {/* Approvals Dropdown Panel */}
                {approvalPanelOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                      <span className="text-sm font-bold text-slate-800">Pending Approvals</span>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">
                        {approvalRequests.length} Request{approvalRequests.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                      {approvalRequests.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400 font-semibold">
                          No pending approvals
                        </div>
                      ) : (
                        approvalRequests.map(req => (
                          <div
                            key={req.id}
                            className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50"
                          >
                            {req.avatarUrl ? (
                              <img src={req.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-200 shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm shrink-0">
                                {req.name?.charAt(0) || '?'}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-700 text-xs truncate leading-none mb-0.5">{req.name}</p>
                              <p className="text-[10px] text-slate-400 truncate leading-none">{req.email}</p>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedApprovalRequest(req);
                                setApprovalPanelOpen(false);
                              }}
                              className="px-3 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[10px] font-bold text-amber-600 rounded-lg transition-colors cursor-pointer shrink-0"
                            >
                              Review
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notifications Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setNotificationPanelOpen(prev => !prev);
                  // Mark all as read when panel opens
                  setNotifications(prev => {
                    const updated = prev.map(n => ({ ...n, read: true }));
                    localStorage.setItem('skytech_notifications', JSON.stringify(updated));
                    return updated;
                  });
                }}
                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all duration-200 relative"
              >
                <Bell size={18} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold border border-white">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              {notificationPanelOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <span className="text-sm font-bold text-slate-800">Notifications</span>
                    {notifications.length > 0 && (
                      <button
                        onClick={() => {
                          setNotifications([]);
                          localStorage.removeItem('skytech_notifications');
                        }}
                        className="text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 font-semibold">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (n.message.toLowerCase().includes('note')) {
                              window.dispatchEvent(new CustomEvent('skytech:highlight_notes'));
                              setNotificationPanelOpen(false);
                            }
                          }}
                          className={`px-4 py-3 text-xs flex items-start gap-2 cursor-pointer hover:bg-slate-100 ${n.read ? 'bg-white' : 'bg-blue-50'}`}
                        >
                          <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${n.read ? 'bg-slate-300' : 'bg-blue-500'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-700 leading-snug">{n.message}</p>
                            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">{n.time}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-slate-200"></div>

            {/* Profile Dropdown & Avatar */}
            <div className="relative" id="profile-menu-container">
              <button 
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-9 h-9 rounded-full bg-[#0E3B68] hover:bg-[#164e88] flex items-center justify-center font-bold text-white shadow-md transition-all duration-200 ring-2 ring-transparent hover:ring-blue-400 focus:outline-none cursor-pointer"
                title="Profile Settings"
              >
                {user.initials}
              </button>

              {/* Profile Pop-up Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0E3B68] flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0">
                      {user.initials}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-slate-800 truncate">{user.name}</span>
                      <span className="text-[11px] font-medium text-slate-500 truncate">{user.role}</span>
                      <span className="text-[10px] text-slate-400 truncate">{user.email}</span>
                    </div>
                  </div>

                  {/* Actions Menu */}
                  <div className="py-2 px-2 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        setEditModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-blue-600 rounded-xl transition-colors text-left"
                    >
                      <User size={16} className="text-slate-500" />
                      <span>Edit Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left"
                    >
                      <LogOut size={16} className="text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Edit Profile Modal */}
        {editModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <User size={18} className="text-blue-600" />
                  <h3 className="text-base font-bold text-slate-800">Edit Profile</h3>
                </div>
                <button 
                  onClick={() => setEditModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 text-slate-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    value={tempUser.name}
                    onChange={(e) => setTempUser({ ...tempUser, name: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Role Title</label>
                  <input
                    type="text"
                    value={tempUser.role}
                    onChange={(e) => setTempUser({ ...tempUser, role: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    type="email"
                    value={tempUser.email}
                    onChange={(e) => setTempUser({ ...tempUser, email: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Avatar Initials</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={tempUser.initials}
                    onChange={(e) => setTempUser({ ...tempUser, initials: e.target.value.toUpperCase() })}
                    className="w-24 px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-bold uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 text-center"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Update user in backend here
                    setEditModalOpen(false);
                  }}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sign Out Toast */}
        {showSignOutToast && (
          <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-50 border border-slate-700 animate-in slide-in-from-bottom-4">
            <LogOut size={18} className="text-rose-400" />
            <span className="text-xs font-semibold">Signed out successfully. Session closed.</span>
          </div>
        )}

        {/* Admin Approval Modal */}
        {selectedApprovalRequest && (
          <AdminApprovalModal
            request={selectedApprovalRequest}
            onClose={() => setSelectedApprovalRequest(null)}
            onSuccess={() => {
              setSelectedApprovalRequest(null);
              setApprovalRequests(prev => prev.filter(r => r.id !== selectedApprovalRequest.id));
            }}
          />
        )}

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#F1F5F9]/50">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ToastProvider>
      <React.Suspense fallback={<div className="min-h-screen bg-[#F8FAFC]" />}>
        <DashboardLayoutInner>{children}</DashboardLayoutInner>
      </React.Suspense>
    </ToastProvider>
  );
}
