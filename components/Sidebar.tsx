
import React, { useState } from 'react';
// Fix: Use namespace import for react-router-dom to resolve missing exported member error
import * as ReactRouterDOM from 'react-router-dom';
const { NavLink } = ReactRouterDOM;
import { Users, FileText, Map, Home, Settings, LogOut, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';

interface SidebarProps {
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all ${
      isActive
        ? 'bg-slate-100 text-slate-900'
        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
    } ${isCollapsed ? 'justify-center' : ''}`;

  return (
    <>
      {/* MOBILE BAR */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 z-50 px-4 flex items-center justify-between">
        <h1 className="text-sm font-bold tracking-tight uppercase">Ethana <span className="text-slate-400">2.5</span></h1>
        <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="p-2">
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* MOBILE OVERLAY */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-white z-[60] flex flex-col p-6">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-lg font-bold">MENU</h1>
              <button onClick={() => setIsMobileOpen(false)}><X size={24}/></button>
            </div>
            <nav className="space-y-4">
              <MobileNavLink to="/" icon={<Home size={20}/>} label="Dashboard" onClick={() => setIsMobileOpen(false)} />
              <MobileNavLink to="/identities" icon={<Users size={20}/>} label="Identitas" onClick={() => setIsMobileOpen(false)} />
              <MobileNavLink to="/lands" icon={<Map size={20}/>} label="Data Tanah" onClick={() => setIsMobileOpen(false)} />
              <MobileNavLink to="/files" icon={<FileText size={20}/>} label="Berkas" onClick={() => setIsMobileOpen(false)} />
              <MobileNavLink to="/templates" icon={<Settings size={20}/>} label="Templates" onClick={() => setIsMobileOpen(false)} />
            </nav>
            <button onClick={onLogout} className="mt-auto p-4 text-red-500 font-bold border-t flex items-center gap-2">
              <LogOut size={20}/> LOGOUT
            </button>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside 
        className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-40 bg-white border-r border-slate-200 transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          {!isCollapsed && <h1 className="text-sm font-bold tracking-widest uppercase">Ethana Notary</h1>}
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 hover:bg-slate-100 rounded">
            {isCollapsed ? <ChevronRight size={16}/> : <ChevronLeft size={16}/>}
          </button>
        </div>
        
        <nav className="p-2 space-y-1 mt-4">
          <NavItem to="/" icon={<Home size={18} />} label="Dashboard" collapsed={isCollapsed} navClass={navClass} />
          <NavItem to="/identities" icon={<Users size={18} />} label="Identitas" collapsed={isCollapsed} navClass={navClass} />
          <NavItem to="/lands" icon={<Map size={18} />} label="Data Tanah" collapsed={isCollapsed} navClass={navClass} />
          <NavItem to="/files" icon={<FileText size={18} />} label="Berkas & Relasi" collapsed={isCollapsed} navClass={navClass} />
          <NavItem to="/templates" icon={<Settings size={18} />} label="Templates & Export" collapsed={isCollapsed} navClass={navClass} />
        </nav>
        
        <div className="mt-auto p-2">
          <button 
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-all ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={18} />
            {!isCollapsed && <span>Logout</span>}
          </button>
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
    className={({ isActive }) => `flex items-center gap-4 p-4 rounded-lg font-medium ${
      isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-500'
    }`}
  >
    {icon} {label}
  </NavLink>
);
