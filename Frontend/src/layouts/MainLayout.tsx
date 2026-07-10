import React, { useState, useEffect } from 'react';
import { useAppState } from '../lib/store';
import { 
  LayoutDashboard, 
  Users, 
  FileSpreadsheet, 
  Layers, 
  Boxes, 
  ClipboardList, 
  Bell, 
  User, 
  Megaphone,
  X,
  Settings,
  LogOut
} from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const TAB_TO_HASH: Record<string, string> = {
  'Dashboard': '#dashboard',
  'Orders & Projects': '#orders',
  'Workflow Engine': '#workflow',
  'Inventory (Store)': '#inventory',
  'Employee Management': '#employees',
  'Audit Logs': '#audit-logs'
};

const HASH_TO_TAB: Record<string, string> = {
  '#dashboard': 'Dashboard',
  '#orders': 'Orders & Projects',
  '#workflow': 'Workflow Engine',
  '#inventory': 'Inventory (Store)',
  '#employees': 'Employee Management',
  '#audit-logs': 'Audit Logs'
};

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, setUser, activeTab, setActiveTab, announcement, setAnnouncement, clearAnnouncement } = useAppState();
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastDays, setBroadcastDays] = useState(7);

  // Click outside handlers
  useEffect(() => {
    const handleOutsideClick = () => {
      setProfileOpen(false);
      setBroadcastOpen(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Hash Routing Sync
  useEffect(() => {
    const handleHashChange = () => {
      const currentHash = window.location.hash || '#dashboard';
      const tabName = HASH_TO_TAB[currentHash];
      if (tabName && tabName !== activeTab) {
        setActiveTab(tabName);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab, setActiveTab]);

  // Update announcement timer
  useEffect(() => {
    if (!announcement) return;

    const updateTimer = () => {
      const diff = announcement.expiresAt - Date.now();
      if (diff <= 0) {
        clearAnnouncement();
        setTimeLeft('');
        return;
      }

      const daysVal = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      let timeStr = '';
      if (daysVal > 0) timeStr += `${daysVal}d `;
      if (hours > 0 || daysVal > 0) timeStr += `${hours}h `;
      timeStr += `${minutes}m`;
      setTimeLeft(timeStr);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [announcement, clearAnnouncement]);

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard },
    { label: 'Orders & Projects', icon: FileSpreadsheet },
    { label: 'Workflow Engine', icon: Layers },
    { label: 'Inventory (Store)', icon: Boxes },
    { label: 'Employee Management', icon: Users },
    { label: 'Audit Logs', icon: ClipboardList },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#EAE0CF] text-[#213448] font-sans relative">
      {/* 1. Continuous Message Display (Top announcement banner) */}
      {announcement && (
        <div className="bg-[#213448] border-b border-[#94B4C1]/20 text-[#EAE0CF] px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm shadow-md animate-fade-in z-50 shrink-0">
          <div className="flex items-center space-x-3 overflow-hidden flex-1 max-w-[96%] mx-auto w-full">
            <div className="flex items-center space-x-1.5 shrink-0 bg-[#EAE0CF]/15 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">
              <Megaphone className="w-3.5 h-3.5 text-[#EAE0CF]" />
              <span>Admin Notice</span>
            </div>
            <div className="font-medium truncate tracking-wide text-white">
              {announcement.message}
            </div>
          </div>
          <div className="flex items-center space-x-4 ml-4 shrink-0">
            {timeLeft && (
              <span className="text-[10px] font-mono bg-black/20 text-[#94B4C1] border border-[#94B4C1]/20 px-2 py-0.5 rounded uppercase tracking-wider">
                Expires in: {timeLeft}
              </span>
            )}
            <button 
              onClick={clearAnnouncement}
              className="text-white/60 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
              title="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Secondary Menu Bar (Header / Horizontal Navigation) */}
      <header className="bg-[#94B4C1] shadow-sm z-30 shrink-0 border-b border-[#213448]/10">
        <div className="max-w-[96%] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo / Brand Info */}
          <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center space-x-2.5 group cursor-pointer" onClick={() => { window.location.hash = '#dashboard'; }}>
              <div className="w-8 h-8 rounded-lg bg-[#213448] flex items-center justify-center font-bold text-white text-lg shadow-md transition-transform duration-300 group-hover:scale-110">
                S
              </div>
              <div>
                <h1 className="font-heading text-sm font-extrabold tracking-wider text-[#213448] group-hover:text-[#213448]/90 transition-colors">SKYTECH</h1>
                <p className="text-[8px] text-[#213448]/75 font-bold tracking-widest uppercase">SPMS Admin Panel</p>
              </div>
            </div>

            {/* Mobile session status info */}
            <div className="md:hidden flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#213448]/80">Online</span>
            </div>
          </div>

          {/* Sub section headings navigation */}
          <nav className="flex flex-wrap items-center justify-center gap-1 w-full md:w-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.label;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    window.location.hash = TAB_TO_HASH[item.label] || '#dashboard';
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 transform hover:scale-[1.03] active:scale-[0.96] cursor-pointer ${
                    isActive 
                      ? 'bg-[#213448] text-white shadow-md' 
                      : 'text-[#213448] hover:bg-[#213448]/10 hover:text-[#213448]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile & Notifications */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="relative text-[#213448] hover:bg-[#213448]/10 p-2 rounded-lg transition-all duration-200 hover:rotate-12 cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#213448] border border-[#94B4C1]" />
            </button>

            {/* Profile Dropdown Container */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-8 h-8 rounded-full bg-[#213448] flex items-center justify-center shrink-0 shadow-md hover:ring-2 hover:ring-[#213448]/35 transition-all cursor-pointer"
                title="User profile"
              >
                <User className="w-4 h-4 text-white" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-3.5 w-56 rounded-2xl bg-[#213448] border border-[#94B4C1]/30 p-4 shadow-xl z-50 animate-fade-in text-white space-y-4">
                  <div className="border-b border-[#94B4C1]/20 pb-3">
                    <p className="text-xs font-extrabold text-white truncate">{user?.name || 'Vinayak'}</p>
                    <span className="text-[9px] bg-[#94B4C1]/15 text-[#94B4C1] border border-[#94B4C1]/20 px-2 py-0.5 rounded font-extrabold uppercase tracking-wider block w-max mt-1.5">
                      {user?.role || 'ADMIN'}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <button className="w-full text-left text-[11px] text-slate-300 hover:text-white font-bold py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer flex items-center space-x-2">
                      <Settings className="w-3.5 h-3.5 text-[#94B4C1]" />
                      <span>Edit Options</span>
                    </button>
                  </div>
                  <div className="border-t border-[#94B4C1]/10 pt-3">
                    <button 
                      onClick={() => setUser(null)}
                      className="w-full py-2 px-2 bg-[#94B4C1] hover:bg-[#94B4C1]/90 text-[#213448] rounded-xl font-bold text-[10px] transition-all transform active:scale-95 text-center flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 3. Main Center Content Pane */}
      <main className="flex-1 max-w-[96%] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col justify-start">
        {/* Active view header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#213448]/60">SPMS Workspace</span>
            <h2 className="font-heading text-xl font-extrabold tracking-tight text-[#213448]">{activeTab}</h2>
          </div>

          <div className="md:flex hidden items-center space-x-2 text-[10px] bg-[#213448]/5 border border-[#213448]/10 text-[#213448] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>Active Session</span>
          </div>
        </div>

        {/* Dynamic page content */}
        <div className="flex-grow">
          {children}
        </div>
      </main>

      {/* 4. Global Floating Broadcast Center (Bottom-Right Mic Popup) */}
      <div className="fixed bottom-6 right-6 z-40" onClick={(e) => e.stopPropagation()}>
        {/* Toggle FAB */}
        <button
          onClick={() => setBroadcastOpen(!broadcastOpen)}
          className="w-12 h-12 rounded-full bg-[#213448] hover:bg-[#213448]/95 text-[#94B4C1] flex items-center justify-center shadow-lg transition-all duration-300 transform hover:scale-110 active:scale-95 cursor-pointer border border-[#94B4C1]/25 relative group"
          title="Broadcast Center"
        >
          <Megaphone className="w-5 h-5 transition-transform group-hover:rotate-12" />
          {announcement && (
            <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border border-[#213448] animate-pulse" />
          )}
        </button>

        {/* Pop up Broadcast Panel */}
        {broadcastOpen && (
          <div className="absolute bottom-15 right-0 w-80 bg-[#213448] border border-[#94B4C1]/30 rounded-2xl p-5 shadow-2xl z-50 animate-fade-in text-white space-y-4">
            <div className="flex items-center justify-between border-b border-[#94B4C1]/20 pb-3">
              <div className="flex items-center space-x-2">
                <Megaphone className="w-4 h-4 text-[#94B4C1]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Broadcast Center</h3>
              </div>
              <button 
                onClick={() => setBroadcastOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!broadcastMessage.trim()) return;
              setAnnouncement(broadcastMessage.trim(), broadcastDays);
              setBroadcastMessage('');
              setBroadcastOpen(false);
            }} className="space-y-4">
              <div>
                <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-350 mb-1.5">
                  Announcement Message
                </label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="e.g., All panels will undergo secondary HV checks today..."
                  rows={3}
                  className="w-full text-xs bg-[#182736]/90 border border-[#2e3f53] rounded-xl p-3 text-white focus:outline-none focus:border-[#94B4C1] placeholder-slate-500 transition-colors resize-none"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between text-[9px] font-extrabold uppercase tracking-wider text-slate-350 mb-1.5">
                  <span>Display Duration</span>
                  <span className="text-[#94B4C1]">{broadcastDays} Days</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={broadcastDays}
                  onChange={(e) => setBroadcastDays(Number(e.target.value))}
                  className="w-full h-1 bg-[#182736] rounded-lg appearance-none cursor-pointer accent-[#94B4C1]"
                />
                <div className="flex justify-between text-[8px] text-slate-455 font-mono mt-1">
                  <span>1d</span>
                  <span>7d</span>
                  <span>14d</span>
                  <span>30d</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#94B4C1] hover:bg-[#94B4C1]/90 text-[#213448] font-extrabold py-2 px-4 rounded-xl text-xs transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.97] flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer"
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>Publish Banner</span>
              </button>
            </form>

            {/* Current Broadcast Status */}
            {announcement && (
              <div className="border-t border-[#94B4C1]/15 pt-3.5 mt-2 space-y-2">
                <span className="text-[8px] font-extrabold text-[#94B4C1] uppercase tracking-wider block">Active Broadcast Info</span>
                <p className="text-[10px] text-slate-250 italic bg-[#182736]/40 p-2.5 rounded-lg border border-[#2e3f53]/30">
                  "{announcement.message}"
                </p>
                <button
                  type="button"
                  onClick={() => {
                    clearAnnouncement();
                    setBroadcastOpen(false);
                  }}
                  className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-[9px] font-bold py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Revoke Banner
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
