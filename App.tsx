
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
      <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
        <Sidebar onLogout={handleLogout} />
        {/* Main content area with dynamic padding based on responsive state */}
        <main className="w-full lg:pl-[20rem] lg:pr-8 pt-20 lg:pt-8 pb-8 transition-all duration-500 ease-in-out">
          {/* Inner container to constrain width on ultra-wide screens */}
          <div className="max-w-7xl mx-auto px-4 lg:px-0">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/identities" element={<Identities />} />
              <Route path="/lands" element={<LandDataPage />} />
              <Route path="/files" element={<FilesPage />} />
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
