import React, { useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { NavLink, useLocation, useNavigate } = ReactRouterDOM;
import { 
  Users, FileText, Map, Home, Settings, LogOut, ChevronLeft, ChevronRight, 
  Menu, X, Navigation, Landmark, Book, Repeat, LayoutDashboard, ArrowLeftCircle, Database, ChevronDown, ChevronUp
} from 'lucide-react';

interface SidebarProps {
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isPbbExpanded, setIsPbbExpanded] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const isLetterCMode = location.pathname.startsWith('/letter-c');
  const isPbbActive = location.pathname.startsWith('/pbb');

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-300 relative group ${
      isActive
        ? 'text-white bg-white/5'
        : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.02]'
    } ${isCollapsed ? 'justify-center' : ''}`;

  return (
    <>
      {/* MOBILE BAR */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-600"></div>
          <h1 className="text-sm font-bold tracking-widest uppercase text-slate-900">Etana</h1>
        </div>
        <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="p-2 text-slate-500">
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* MOBILE OVERLAY */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-[#0a0a0b] z-[60] flex flex-col p-8 animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-12">
            <h1 className="text-lg font-bold text-white tracking-widest uppercase">
              {isLetterCMode ? 'LETTER C' : 'ETANA'}
            </h1>
            <button onClick={() => setIsMobileOpen(false)} className="text-slate-500 hover:text-white">
              <X size={24}/>
            </button>
          </div>
          
          <nav className="space-y-2 overflow-y-auto">
            {isLetterCMode ? (
              <>
                <MobileNavLink to="/letter-c" icon={<LayoutDashboard size={20}/>} label="C-Dashboard" onClick={() => setIsMobileOpen(false)} />
                <MobileNavLink to="/letter-c/data" icon={<Book size={20}/>} label="Data Letter C" onClick={() => setIsMobileOpen(false)} />
                <MobileNavLink to="/letter-c/persil" icon={<Landmark size={20}/>} label="Persil" onClick={() => setIsMobileOpen(false)} />
                <MobileNavLink to="/letter-c/mutasi" icon={<Repeat size={20}/>} label="Mutasi" onClick={() => setIsMobileOpen(false)} />
                <div className="pt-4 mt-4 border-t border-white/10">
                  <MobileNavLink to="/" icon={<ArrowLeftCircle size={20}/>} label="Kembali Utama" onClick={() => { navigate('/'); setIsMobileOpen(false); }} />
                </div>
              </>
            ) : (
              <>
                <MobileNavLink to="/" icon={<Home size={20}/>} label="Dashboard" onClick={() => setIsMobileOpen(false)} />
                <MobileNavLink to="/identities" icon={<Users size={20}/>} label="Data Subjek" onClick={() => setIsMobileOpen(false)} />
                <MobileNavLink to="/lands" icon={<Map size={20}/>} label="Data Objek" onClick={() => setIsMobileOpen(false)} />
                
                {/* MENU PBB MOBILE - DISINKRONKAN */}
                <button
                  onClick={() => setIsPbbExpanded(!isPbbExpanded)}
                  className={`flex items-center gap-4 w-full p-4 text-left rounded-xl font-semibold transition-all ${isPbbActive ? 'text-blue-400 bg-white/5' : 'text-slate-500'}`}
                >
                  <Landmark size={20} />
                  <span className="flex-1">PBB / SPPT</span>
                  {isPbbExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                
                {isPbbExpanded && (
                  <div className="ml-4 space-y-1 bg-white/[0.02] rounded-xl p-2">
                    <MobileNavLink to="/pbb" icon={<Database size={18}/>} label="PBB Data Center" onClick={() => setIsMobileOpen(false)} />
                    <MobileNavLink to="/pbb/masterdata" icon={<Settings size={18}/>} label="Master Data" onClick={() => setIsMobileOpen(false)} />
                   </div>
                )}
                
                <MobileNavLink to="/map-monitoring" icon={<Navigation size={20}/>} label="Map Monitoring" onClick={() => setIsMobileOpen(false)} />
                <MobileNavLink to="/ptsl" icon={<Book size={20}/>} label="Ptsl Massal" onClick={() => setIsMobileOpen(false)} />
                <MobileNavLink to="/letter-c" icon={<Book size={20}/>} label="Buku C Desa" onClick={() => setIsMobileOpen(false)} />
              </>
            )}
          </nav>
          
          <button onClick={onLogout} className="mt-auto py-6 text-slate-500 text-xs font-bold border-t border-white/5 flex items-center gap-3 hover:text-red-400">
            <LogOut size={18}/> KELUAR SISTEM
          </button>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-40 bg-[#0a0a0b] transition-all duration-500 ease-in-out border-r border-white/[0.05] ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="h-24 flex items-center px-6">
          {!isCollapsed ? (
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <h1 className="text-sm font-black tracking-[0.3em] text-white uppercase">ETANA</h1>
              </div>
            </div>
          ) : (
            <div className="w-2 h-2 rounded-full bg-blue-500 mx-auto"></div>
          )}
        </div>
        
        <nav className="flex-1 space-y-1">
          {isLetterCMode ? (
            <>
              <div className="px-6 mb-4">
                {!isCollapsed && (
                  <button onClick={() => navigate('/')} className="flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-blue-400 transition-colors uppercase tracking-widest">
                    <ArrowLeftCircle size={14}/> Kembali Utama
                  </button>
                )}
              </div>
              <NavItem to="/letter-c" icon={<LayoutDashboard size={18} />} label="Dashboard C" collapsed={isCollapsed} navClass={navClass} />
              <NavItem to="/letter-c/data" icon={<Book size={18} />} label="Kohir" collapsed={isCollapsed} navClass={navClass} />
              <NavItem to="/letter-c/persil" icon={<Landmark size={18} />} label="Persil" collapsed={isCollapsed} navClass={navClass} />
              <NavItem to="/letter-c/mutasi" icon={<Repeat size={18} />} label="Mutasi" collapsed={isCollapsed} navClass={navClass} />
            </>
          ) : (
            <>
              <NavItem to="/" icon={<Home size={18} />} label="Dashboard" collapsed={isCollapsed} navClass={navClass} />
              <NavItem to="/identities" icon={<Users size={18} />} label="Data Subjek" collapsed={isCollapsed} navClass={navClass} />
              <NavItem to="/lands" icon={<Map size={18} />} label="Data Objek" collapsed={isCollapsed} navClass={navClass} />
              <NavItem to="/files" icon={<FileText size={18} />} label="Berkas" collapsed={isCollapsed} navClass={navClass} />
                
              {/* MENU PBB DESKTOP - DISINKRONKAN DENGAN PbbManager */}
              {!isCollapsed ? (
                <div className="group">
                  <button
                    onClick={() => setIsPbbExpanded(!isPbbExpanded)}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-medium transition-all duration-300 ${isPbbActive ? 'text-white bg-white/5' : 'text-slate-500 hover:text-slate-200'}`}
                  >
                    <Landmark size={18} className={isPbbActive ? 'text-blue-400' : 'text-inherit'} />
                    <span className="truncate tracking-tight font-medium">PBB / SPPT</span>
                    <div className="ml-auto">
                      {isPbbExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </button>
                  {isPbbExpanded && (
                  <div className="ml-6 mt-1 space-y-1 border-l border-white/5">
                    {/* Tombol 1: Data Center (index) */}
                    <SubNavItem 
                      to="/pbb" 
                      icon={<Database size={14} />} 
                      label="Data Center" 
                      isActive={location.pathname === '/pbb'} 
                    />

                    {/* Tombol 2: Master Data (mengarah ke path "masterdata") */}
                    <SubNavItem 
                      to="/pbb/masterdata" 
                      icon={<Settings size={14} />} 
                      label="Master Data" 
                      isActive={location.pathname === '/pbb/masterdata'} 
                    />

                    {/* Tombol 3: Master Wilayah (mengarah ke path "masterwilayah") */}
                    
                  </div>
                )}
                </div>
              ) : (
                <NavItem to="/pbb" icon={<Landmark size={18} />} label="PBB Center" collapsed={isCollapsed} navClass={navClass} />
              )}
              
              <NavItem to="/map-monitoring" icon={<Navigation size={18} />} label="Map Monitoring" collapsed={isCollapsed} navClass={navClass} />
              <NavItem to="/ptsl" icon={<FileText size={18} />} label="Ptsl Massal" collapsed={isCollapsed} navClass={navClass} />
              <div className="pt-4 mt-4 border-t border-white/5">
                <NavItem to="/letter-c" icon={<Book size={18} />} label="Buku C Desa" collapsed={isCollapsed} navClass={navClass} />
              </div>
            
            </>
              
          )}
        </nav>
        
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

// --- HELPER COMPONENTS ---

const NavItem = ({ to, icon, label, collapsed, navClass }: any) => {
  const isEnd = to === '/' || to === '/letter-c' || to === '/pbb';
  return (
    <NavLink to={to} end={isEnd} className={navClass}>
      {({ isActive }) => (
        <>
          {isActive && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-blue-500"></div>}
          <span className={`shrink-0 ${isActive ? 'text-blue-400' : 'text-inherit'}`}>{icon}</span>
          {!collapsed && <span className="truncate tracking-tight font-medium">{label}</span>}
        </>
      )}
    </NavLink>
  );
};

const SubNavItem = ({ to, icon, label, isActive }: any) => (
  <NavLink 
    to={to} 
    end
    className={({ isActive: active }) => 
      `flex items-center gap-3 px-4 py-2 text-[12px] font-medium transition-all ${
        active || isActive ? 'text-blue-400 bg-blue-500/5' : 'text-slate-500 hover:text-slate-300'
      }`
    }
  >
    <span className="shrink-0">{icon}</span>
    <span className="truncate">{label}</span>
  </NavLink>
);

const MobileNavLink = ({ to, icon, label, onClick }: any) => {
  const isEnd = to === '/' || to === '/letter-c' || to === '/pbb';
  return (
    <NavLink 
      to={to} 
      end={isEnd} 
      onClick={onClick} 
      className={({ isActive }) => `flex items-center gap-4 p-4 rounded-xl text-sm font-semibold transition-all ${isActive ? 'bg-white/5 text-white' : 'text-slate-500'}`}
    >
      {icon} {label}
    </NavLink>
  );
};