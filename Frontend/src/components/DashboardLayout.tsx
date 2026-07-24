'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Package
} from 'lucide-react';
import { API_BASE_URL } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'Online' | 'Offline' | 'Checking'>('Checking');
  const [notificationCount, setNotificationCount] = useState(3);
  const [searchQuery, setSearchQuery] = useState('');

  // Restore sidebar state from localStorage on mount (after hydration)
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('skytech_sidebar_open');
    if (saved !== null) {
      setSidebarOpen(saved === 'true');
    }
    // Remove temporary pre-paint helper class from html element after React mounts
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('sidebar-collapsed');
    }
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

  // Bypass standard layout for employee management sub-application or login page
  if (pathname?.startsWith('/employee-management') || pathname === '/login') {
    return <>{children}</>;
  }

  // Sidebar Nav Sections matching reference style
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
      title: 'MANAGEMENT',
      items: [
        ...(can('employees', 'read') ? [{ id: 'employees', name: 'Employee Directory', href: '/employees', icon: Users }] : []),
        ...(can('employeeHub', 'read') ? [{ id: 'employee-management', name: 'Employee Hub (Prototype)', href: '/employee-management', icon: Users }] : []),
      ]
    }
  ].filter(section => section.items.length > 0);

  const allNavItems = navSections.flatMap(s => s.items);

  const getPageTitle = () => {
    const active = allNavItems.find(item => item.href === pathname);
    return active ? active.name : 'Skytech Program Management System';
  };

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
          setProjectsList(data);
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
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
                S
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm tracking-widest text-white">SKYTECH</span>
                <span className="text-[9px] text-slate-400 tracking-wider">SYSTEMS SPMS</span>
              </div>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
              <X size={18} />
            </button>
          </div>

          {/* ACTIVE PROGRAMME Dropdown Select Box (Reference Image 2) */}
          <div className="px-3 pt-3 pb-1 flex-shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 block mb-1.5">
              ACTIVE PROGRAMME
            </span>
            <div className="relative">
              <select
                value={selectedProjectId}
                onChange={(e) => handleSelectProject(e.target.value)}
                className="w-full bg-[#06101D] border border-slate-700/60 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer appearance-none pr-8"
              >
                <option value="ALL">Select Project...</option>
                {projectsList.map((p) => (
                  <option key={p.id} value={p.inquiryCode || p.id} className="bg-[#0B1728] text-white">
                    {p.inquiryCode || p.id} - {p.client}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-2.5 pointer-events-none text-slate-400">
                <ChevronLeft size={14} className="-rotate-90" />
              </div>
            </div>
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
                    const isActive = pathname === item.href;
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
            {/* Quick Alerts */}
            <div className="relative">
              <button 
                onClick={() => setNotificationCount(0)}
                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all duration-200 relative"
              >
                <Bell size={18} />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold border border-white">
                    {notificationCount}
                  </span>
                )}
              </button>
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

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#F1F5F9]/50">
          {children}
        </main>
      </div>
    </div>
  );
}
