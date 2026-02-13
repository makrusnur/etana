import React, { useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { HashRouter, Routes, Route, Navigate, useLocation } = ReactRouterDOM;

// --- LAYOUT COMPONENTS ---
import { Sidebar } from './components/Sidebar';

// --- PAGES ---
import { Dashboard } from './pages/Dashboard';
import { Identities } from './pages/Identities';
import { LandDataPage } from './pages/LandData';
import { FilesPage } from './pages/Files';
import { TemplatesPage } from './pages/Templates';
import { Login } from './pages/Login';
import { MapMonitoring } from './pages/MapMonitoring';
import { PtslHalaman } from './pages/PtslMassal';
import { LetterCMain } from './pages/LetterC';
import { MutasiC } from './pages/LetterC/MutasiC';

// --- MODUL PBB (Satu Pintu ke PbbManager) ---
import { PbbManager } from './pages/PbbModul/PbbManager'; 

const AppContent: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const location = useLocation();
  
  // Deteksi halaman yang butuh layout luas (Screen Full)
  const isMapPage = location.pathname === '/map-monitoring';
  const isPbbPage = location.pathname.startsWith('/pbb');
  const isLetterCPage = location.pathname.startsWith('/letter-c');
  
  const isFullLayout = isMapPage || isPbbPage || isLetterCPage;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Sidebar tetap di kiri */}
      <Sidebar onLogout={onLogout} />
      
      {/* Main Content Area */}
      <main className={`w-full transition-all duration-500 ease-in-out ${
        isFullLayout 
          ? 'lg:pl-64 h-screen overflow-hidden' // Full screen tanpa scroll luar
          : 'lg:pl-64 lg:pr-8 pt-20 lg:pt-8 pb-8'
      }`}>
        
        <div className={`h-full ${
          isFullLayout 
            ? 'w-full px-0 max-w-none' 
            : 'max-w-7xl mx-auto px-4 lg:px-0'
        }`}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/identities" element={<Identities />} />
            <Route path="/lands" element={<LandDataPage />} />
            <Route path="/files" element={<FilesPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/map-monitoring" element={<MapMonitoring />} />
            <Route path="/ptsl" element={<PtslHalaman />} />
            
            {/* RUTE MODUL PBB BARU */}
            <Route path="/pbb/*" element={<PbbManager />} />
            
            {/* RUTE MODUL LETTER C */}
            <Route path="/letter-c/mutasi" element={<MutasiC />} />
            <Route path="/letter-c/*" element={<LetterCMain/>} />
            
            {/* REDIRECT JIKA RUTE TIDAK ADA */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    localStorage.getItem('ethana_auth') !== null
  );

  const handleLogin = () => {
    localStorage.setItem('ethana_auth', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('ethana_auth');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <HashRouter>
      <AppContent onLogout={handleLogout} />
    </HashRouter>
  );
};

export default App;