
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Identities } from './pages/Identities';
import { LandDataPage } from './pages/LandData';
import { FilesPage } from './pages/Files';
import { TemplatesPage } from './pages/Templates';
import { Login } from './pages/Login';

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
      <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
        <Sidebar onLogout={handleLogout} />
        <main className="ml-64 flex-1 p-8 overflow-y-auto h-screen">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/identities" element={<Identities />} />
            <Route path="/lands" element={<LandDataPage />} />
            <Route path="/files" element={<FilesPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
