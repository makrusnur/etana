
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, FileText, Map, Home, Settings, LogOut } from 'lucide-react';

interface SidebarProps {
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen fixed left-0 top-0 overflow-y-auto z-10 flex flex-col">
      <div className="p-6 border-b border-slate-100">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">ETANA</h1>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Sistem Administrasi Notaris</p>
      </div>
      
      <nav className="p-4 space-y-1 flex-1">
        <NavLink to="/" className={navClass}>
          <Home size={20} />
          Dashboard
        </NavLink>
        <NavLink to="/identities" className={navClass}>
          <Users size={20} />
          Identitas
        </NavLink>
        <NavLink to="/lands" className={navClass}>
          <Map size={20} />
          Data Tanah
        </NavLink>
        <NavLink to="/files" className={navClass}>
          <FileText size={20} />
          Berkas & Relasi
        </NavLink>
        <NavLink to="/templates" className={navClass}>
          <Settings size={20} />
          Template & Export
        </NavLink>
      </nav>
      
      <div className="p-4 border-t border-slate-100">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          Logout
        </button>
        <div className="text-[10px] text-slate-400 text-center mt-3 font-bold uppercase">
          v2.5.0 (Supabase Sync)
        </div>
      </div>
    </aside>
  );
};
