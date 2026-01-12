import React, { useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { HashRouter, Routes, Route, Navigate, useLocation } = ReactRouterDOM;

import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Identities } from './pages/Identities';
import { LandDataPage } from './pages/LandData';
import { FilesPage } from './pages/Files';
import { TemplatesPage } from './pages/Templates';
import { Login } from './pages/Login';
import { MapMonitoring } from './pages/MapMonitoring';

// Komponen Wrapper untuk mendeteksi perubahan rute
const AppContent: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const location = useLocation();
  // Cek apakah sekarang sedang di halaman map monitoring
  const isMapPage = location.pathname === '/map-monitoring';

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <Sidebar onLogout={onLogout} />
      
      {/* Main Content: 
          - Jika isMapPage: padding-right dihapus, padding-top dihapus agar mentok.
      */}
      <main className={`w-full transition-all duration-500 ease-in-out ${
        isMapPage 
          ? 'lg:pl-[20rem] h-screen overflow-hidden' 
          : 'lg:pl-[20rem] lg:pr-8 pt-20 lg:pt-8 pb-8'
      }`}>
        
        {/* Container Inner: 
            - Jika isMapPage: max-w dan padding dibuang agar full frame.
        */}
        <div className={`h-full ${
          isMapPage 
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

  const handleLogin = () => setIsAuthenticated(true);
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