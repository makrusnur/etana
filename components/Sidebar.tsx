// src/components/Sidebar.tsx
import React, { useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { NavLink, useLocation, useNavigate } = ReactRouterDOM;
import { 
  Users, FileText, Map, Home, Settings, LogOut, ChevronLeft, ChevronRight, 
  Menu, X, Navigation, Landmark, Book, Repeat, LayoutDashboard, ArrowLeftCircle, 
  Database, ChevronDown, ChevronUp, Printer, BookAIcon, Files, FolderOpen, 
  Layers, ClipboardList, Upload, MapPin, Box, Globe
} from 'lucide-react';

interface SidebarProps {
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // State untuk kelompok menu
  const [expandedGroups, setExpandedGroups] = useState({
    suratBerkas: true,
    bukuCDesa: true,
    pbb: true,
    lainnya: true
  });

  const location = useLocation();
  const navigate = useNavigate();

  const isLetterCMode = location.pathname.startsWith('/letter-c');
  const isPbbActive = location.pathname.startsWith('/pbb');

  const toggleGroup = (group: keyof typeof expandedGroups) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-300 relative group ${
      isActive
        ? 'text-white bg-white/5'
        : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.02]'
    } ${isCollapsed ? 'justify-center' : ''}`;

  // ========== KOMPONEN MENU GROUP (DESKTOP) ==========
  const MenuGroupDesktop = ({ 
    title, 
    icon, 
    expanded, 
    onToggle, 
    children, 
    collapsed 
  }: { 
    title: string; 
    icon: React.ReactNode; 
    expanded: boolean; 
    onToggle: () => void; 
    children: React.ReactNode; 
    collapsed: boolean;
  }) => {
    if (collapsed) {
      return (
        <div className="relative group">
          <div className="flex justify-center py-3 text-slate-500">
            {icon}
          </div>
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
            {title}
          </div>
        </div>
      );
    }

    return (
      <div className="mb-1">
        <button
          onClick={onToggle}
          className="flex items-center justify-between w-full px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="shrink-0">{icon}</span>
            <span>{title}</span>
          </div>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {expanded && (
          <div className="ml-2 space-y-1">
            {children}
          </div>
        )}
      </div>
    );
  };

  // Menu item biasa
  const MenuItem = ({ to, icon, label, isEnd = false }: { to: string; icon: React.ReactNode; label: string; isEnd?: boolean }) => (
    <NavLink to={to} end={isEnd} className={navClass}>
      {({ isActive }) => (
        <>
          {isActive && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-blue-500"></div>}
          <span className={`shrink-0 ${isActive ? 'text-blue-400' : 'text-inherit'}`}>{icon}</span>
          {!isCollapsed && <span className="truncate tracking-tight font-medium">{label}</span>}
        </>
      )}
    </NavLink>
  );

  // Submenu item (untuk menu dalam grup)
  const SubMenuItem = ({ to, icon, label, isEnd = false }: { to: string; icon: React.ReactNode; label: string; isEnd?: boolean }) => {
    const isActive = location.pathname === to;
    return (
      <NavLink to={to} end={isEnd} className={({ isActive: active }) => 
        `flex items-center gap-3 px-4 py-2 text-[12px] font-medium transition-all ml-6 ${
          active || isActive ? 'text-blue-400 bg-blue-500/5' : 'text-slate-500 hover:text-slate-300'
        }`
      }>
        <span className="shrink-0">{icon}</span>
        <span className="truncate">{label}</span>
      </NavLink>
    );
  };

  // ========== KOMPONEN MOBILE ==========
  const MobileMenuItem = ({ to, icon, label, onClick, isEnd = false }: any) => (
    <NavLink 
      to={to} 
      end={isEnd} 
      onClick={onClick} 
      className={({ isActive }) => `flex items-center gap-4 p-4 rounded-xl text-sm font-semibold transition-all ${isActive ? 'bg-white/5 text-white' : 'text-slate-500'}`}
    >
      {icon} {label}
    </NavLink>
  );

  const MobileMenuGroup = ({ title, icon, expanded, onToggle, children }: any) => (
    <div className="mb-1">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full p-4 text-left rounded-xl font-semibold text-slate-500"
      >
        <div className="flex items-center gap-4">
          {icon}
          <span>{title}</span>
        </div>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {expanded && (
        <div className="ml-4 space-y-1 bg-white/[0.02] rounded-xl p-2">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* ========== MOBILE BAR ========== */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-600"></div>
          <h1 className="text-sm font-bold tracking-widest uppercase text-slate-900">Etana</h1>
        </div>
        <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="p-2 text-slate-500">
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* ========== MOBILE MENU ========== */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-[#0a0a0b] z-[60] flex flex-col p-8 animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-lg font-bold text-white tracking-widest uppercase">ETANA</h1>
            <button onClick={() => setIsMobileOpen(false)} className="text-slate-500 hover:text-white">
              <X size={24}/>
            </button>
          </div>
          
          <nav className="space-y-2 overflow-y-auto flex-1">
            {/* DASHBOARD - SELALU DI ATAS */}
            <MobileMenuItem 
              to="/" 
              icon={<Home size={20} />} 
              label="Dashboard" 
              onClick={() => setIsMobileOpen(false)}
              isEnd={true}
            />

            {/* KELOMPOK SURAT / BERKAS */}
            <MobileMenuGroup 
              title="SURAT / BERKAS" 
              icon={<FolderOpen size={20} />}
              expanded={expandedGroups.suratBerkas}
              onToggle={() => toggleGroup('suratBerkas')}
            >
              <MobileMenuItem to="/identities" icon={<Users size={18}/>} label="Data Subjek" onClick={() => setIsMobileOpen(false)} />
              <MobileMenuItem to="/lands" icon={<Map size={18}/>} label="Data Objek" onClick={() => setIsMobileOpen(false)} />
              <MobileMenuItem to="/files" icon={<FileText size={18}/>} label="Berkas" onClick={() => setIsMobileOpen(false)} />
              <MobileMenuItem to="/templates" icon={<Printer size={18}/>} label="Automation" onClick={() => setIsMobileOpen(false)} />
            </MobileMenuGroup>

            {/* KELOMPOK BUKU C DESA - DENGAN PETA PERSIL */}
            <MobileMenuGroup 
              title="BUKU C DESA" 
              icon={<Book size={20} />}
              expanded={expandedGroups.bukuCDesa}
              onToggle={() => toggleGroup('bukuCDesa')}
            >
              <MobileMenuItem to="/letter-c" icon={<LayoutDashboard size={18}/>} label="Dashboard C" onClick={() => setIsMobileOpen(false)} />
              <MobileMenuItem to="/letter-c/data" icon={<Book size={18}/>} label="Kohir" onClick={() => setIsMobileOpen(false)} />
              <MobileMenuItem to="/letter-c/persil" icon={<Landmark size={18}/>} label="Persil" onClick={() => setIsMobileOpen(false)} />
              <MobileMenuItem to="/letter-c/mutasi" icon={<Repeat size={18}/>} label="Mutasi" onClick={() => setIsMobileOpen(false)} />
              {/* MENU PETA PERSIL - DITAMBAHKAN DI BUKU C DESA */}
              <MobileMenuItem to="/peta-persil" icon={<Map size={18}/>} label="Peta Persil & Kohir" onClick={() => setIsMobileOpen(false)} />
            </MobileMenuGroup>

            {/* KELOMPOK PBB / SPPT */}
            <MobileMenuGroup 
              title="PBB / SPPT" 
              icon={<Landmark size={20} />}
              expanded={expandedGroups.pbb}
              onToggle={() => toggleGroup('pbb')}
            >
              <MobileMenuItem to="/pbb" icon={<Database size={18}/>} label="PBB Data Center" onClick={() => setIsMobileOpen(false)} />
              <MobileMenuItem to="/pbb/masterdata" icon={<Settings size={18}/>} label="Master Data" onClick={() => setIsMobileOpen(false)} />
            </MobileMenuGroup>

            {/* KELOMPOK LAINNYA */}
            <MobileMenuGroup 
              title="LAINNYA" 
              icon={<Layers size={20} />}
              expanded={expandedGroups.lainnya}
              onToggle={() => toggleGroup('lainnya')}
            >
              <MobileMenuItem to="/map-monitoring" icon={<Navigation size={18}/>} label="Map Monitoring" onClick={() => setIsMobileOpen(false)} />
              <MobileMenuItem to="/ptsl" icon={<FileText size={18}/>} label="PTSL Massal" onClick={() => setIsMobileOpen(false)} />
            </MobileMenuGroup>
          </nav>
          
          <button onClick={onLogout} className="mt-auto py-6 text-slate-500 text-xs font-bold border-t border-white/5 flex items-center gap-3 hover:text-red-400">
            <LogOut size={18}/> KELUAR SISTEM
          </button>
        </div>
      )}

      {/* ========== DESKTOP SIDEBAR ========== */}
      <aside className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-40 bg-[#0a0a0b] transition-all duration-500 ease-in-out border-r border-white/[0.05] ${isCollapsed ? 'w-20' : 'w-64'}`}>
        {/* Logo */}
        <div className="h-20 flex items-center px-6 border-b border-white/[0.05]">
          {!isCollapsed ? (
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <h1 className="text-sm font-black tracking-[0.3em] text-white uppercase">ETANA</h1>
              </div>
              <p className="text-[8px] text-slate-500 mt-1 tracking-wider">Land Administration System</p>
            </div>
          ) : (
            <div className="w-2 h-2 rounded-full bg-blue-500 mx-auto"></div>
          )}
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 space-y-2">
          {/* Dashboard Utama */}
          <MenuItem to="/" icon={<Home size={18} />} label="Dashboard" isEnd={true} />

          {/* KELOMPOK 1: SURAT / BERKAS */}
          <MenuGroupDesktop
            title="SURAT / BERKAS"
            icon={<FolderOpen size={16} />}
            expanded={expandedGroups.suratBerkas}
            onToggle={() => toggleGroup('suratBerkas')}
            collapsed={isCollapsed}
          >
            <SubMenuItem to="/identities" icon={<Users size={14} />} label="Data Subjek" />
            <SubMenuItem to="/lands" icon={<Map size={14} />} label="Data Objek" />
            <SubMenuItem to="/files" icon={<FileText size={14} />} label="Berkas" />
            <SubMenuItem to="/templates" icon={<Printer size={14} />} label="Automation" />
          </MenuGroupDesktop>

          {/* KELOMPOK 2: BUKU C DESA - DENGAN PETA PERSIL */}
          <MenuGroupDesktop
            title="BUKU C DESA"
            icon={<Book size={16} />}
            expanded={expandedGroups.bukuCDesa}
            onToggle={() => toggleGroup('bukuCDesa')}
            collapsed={isCollapsed}
          >
            <SubMenuItem to="/letter-c" icon={<LayoutDashboard size={14} />} label="Dashboard C" isEnd={true} />
            <SubMenuItem to="/letter-c/data" icon={<Book size={14} />} label="Kohir" />
            <SubMenuItem to="/letter-c/persil" icon={<Landmark size={14} />} label="Persil" />
            <SubMenuItem to="/letter-c/mutasi" icon={<Repeat size={14} />} label="Mutasi" />
            {/* MENU PETA PERSIL - DITAMBAHKAN DI BUKU C DESA */}
            <SubMenuItem to="/letter-c/peta-persil" icon={<Map size={14} />} label="Peta Persil & Kohir" />
          </MenuGroupDesktop>

          {/* KELOMPOK 3: PBB / SPPT */}
          <MenuGroupDesktop
            title="PBB / SPPT"
            icon={<Landmark size={16} />}
            expanded={expandedGroups.pbb}
            onToggle={() => toggleGroup('pbb')}
            collapsed={isCollapsed}
          >
            <SubMenuItem to="/pbb" icon={<Database size={14} />} label="Data Center" isEnd={true} />
            <SubMenuItem to="/pbb/masterdata" icon={<Settings size={14} />} label="Master Data" />
          </MenuGroupDesktop>

          {/* KELOMPOK 4: LAINNYA */}
          <MenuGroupDesktop
            title="LAINNYA"
            icon={<Layers size={16} />}
            expanded={expandedGroups.lainnya}
            onToggle={() => toggleGroup('lainnya')}
            collapsed={isCollapsed}
          >
            <SubMenuItem to="/map-monitoring" icon={<Navigation size={14} />} label="Map Monitoring" />
            <SubMenuItem to="/ptsl" icon={<FileText size={14} />} label="PTSL Massal" />
          </MenuGroupDesktop>
        </nav>
        
        {/* Footer Sidebar */}
        <div className="p-4 border-t border-white/[0.03]">
          <button onClick={onLogout} className={`w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold text-slate-500 hover:text-red-400 transition-all ${isCollapsed ? 'justify-center' : ''}`}>
            <LogOut size={16} />
            {!isCollapsed && <span className="uppercase tracking-widest">Logout</span>}
          </button>
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="mt-2 w-full flex items-center justify-center p-2 text-slate-600 hover:text-slate-300">
            {isCollapsed ? <ChevronRight size={16}/> : <ChevronLeft size={16}/>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;