
import React, { useState,  } from 'react';
import { NavLink } from 'react-router-dom';
import { Users, FileText, Map, Home, Settings, LogOut, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';

interface SidebarProps {
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3.5 text-sm font-bold rounded-2xl transition-all duration-300 ${
      isActive
        ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/40 scale-[1.02]'
        : 'text-slate-500 hover:bg-white hover:text-blue-600 hover:shadow-lg'
    } ${isCollapsed ? 'justify-center px-2' : ''}`;

  return (
    <>
      {/* MOBILE TOP BAR */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-lg border-b border-slate-200 z-50 px-5 flex items-center justify-between">
        <h1 className="text-xl font-black text-slate-900 tracking-tighter">ETANA</h1>
        <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="p-2 bg-slate-100 rounded-xl">
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* MOBILE MENU OVERLAY */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] animate-in fade-in duration-300">
          <div className="absolute right-0 top-0 bottom-0 w-[80%] bg-white p-6 shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-black text-slate-900">MENU</h1>
              <button onClick={() => setIsMobileOpen(false)} className="p-2 bg-slate-50 rounded-full"><X /></button>
            </div>
            <nav className="space-y-2">
              <MobileNavLink to="/" icon={<Home size={22}/>} label="Dashboard" onClick={() => setIsMobileOpen(false)} />
              <MobileNavLink to="/identities" icon={<Users size={22}/>} label="Identitas" onClick={() => setIsMobileOpen(false)} />
              <MobileNavLink to="/lands" icon={<Map size={22}/>} label="Data Tanah" onClick={() => setIsMobileOpen(false)} />
              <MobileNavLink to="/files" icon={<FileText size={22}/>} label="Berkas & Relasi" onClick={() => setIsMobileOpen(false)} />
              <MobileNavLink to="/templates" icon={<Settings size={22}/>} label="Template & Export" onClick={() => setIsMobileOpen(false)} />
            </nav>
            <button onClick={onLogout} className="w-full mt-10 p-4 bg-red-50 text-red-600 rounded-2xl font-black flex items-center gap-3">
              <LogOut size={22} /> LOGOUT
            </button>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside 
        className={`hidden lg:flex flex-col fixed left-4 top-4 bottom-4 z-40 bg-white/70 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-[2.5rem] transition-all duration-500 ease-in-out ${
          isCollapsed ? 'w-24' : 'w-72'
        }`}
      >
        <div className={`p-8 border-b border-slate-100/50 flex items-center justify-between ${isCollapsed ? 'flex-col gap-4' : ''}`}>
          {!isCollapsed && (
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter">ETANA</h1>
              <p className="text-[9px] text-blue-500 font-black uppercase tracking-[0.3em] mt-1">Notary System</p>
            </div>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-white rounded-2xl shadow-sm transition-all"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
        
        <nav className="p-4 space-y-2 flex-1 mt-4">
          <NavItem to="/" icon={<Home size={22} />} label="Dashboard" collapsed={isCollapsed} navClass={navClass} />
          <NavItem to="/identities" icon={<Users size={22} />} label="Identitas" collapsed={isCollapsed} navClass={navClass} />
          <NavItem to="/lands" icon={<Map size={22} />} label="Data Tanah" collapsed={isCollapsed} navClass={navClass} />
          <NavItem to="/files" icon={<FileText size={22} />} label="Berkas & Relasi" collapsed={isCollapsed} navClass={navClass} />
          <NavItem to="/templates" icon={<Settings size={22} />} label="Template & Export" collapsed={isCollapsed} navClass={navClass} />
        </nav>
        
        <div className="p-4 mb-4">
          <button 
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-4 py-4 text-sm font-black text-red-500 hover:bg-red-50 rounded-2xl transition-all ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={22} />
            {!isCollapsed && <span>LOGOUT</span>}
          </button>
          {!isCollapsed && (
            <div className="text-[8px] text-slate-300 text-center mt-6 font-black uppercase tracking-[0.4em]">
              v1.0.0 
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

const NavItem = ({ to, icon, label, collapsed, navClass }: any) => (
  <NavLink to={to} className={navClass}>
    <span className="shrink-0">{icon}</span>
    {!collapsed && <span className="truncate">{label}</span>}
  </NavLink>
);

const MobileNavLink = ({ to, icon, label, onClick }: any) => (
  <NavLink 
    to={to} 
    onClick={onClick}
    className={({ isActive }) => `flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${
      isActive ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30' : 'text-slate-600 hover:bg-slate-50'
    }`}
  >
    {icon} {label}
  </NavLink>
);
