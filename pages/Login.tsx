import React, { useState, useEffect } from 'react';
import { Button } from '../components/UI';
import { Lock, ShieldCheck, Database, Globe } from 'lucide-react';

export const Login: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  
  // Fitur Keamanan Tambahan
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  // Logika pembuka kunci otomatis jika salah 3x (tunggu 30 detik)
  useEffect(() => {
    if (attempts >= 3) {
      setIsLocked(true);
      const timer = setTimeout(() => {
        setIsLocked(false);
        setAttempts(0);
        setError(false);
      }, 30000); // 30 detik
      return () => clearTimeout(timer);
    }
  }, [attempts]);

  const handleAdminLogin = () => {
    if (isLocked) return;

    // Mengambil PIN dari .env.local (Pastikan di file .env.local ada VITE_ADMIN_PIN=...)
    const securePin = import.meta.env.VITE_ADMIN_PIN;

    if (pin === securePin) {
      localStorage.setItem('ethana_auth', 'admin');
      localStorage.setItem('auth_time', Date.now().toString()); // Untuk session tracking
      onLogin();
    } else {
      setError(true);
      setAttempts(prev => prev + 1);
      setPin(''); // Kosongkan input jika salah
      
      if (attempts + 1 < 3) {
        alert(`PIN Salah! Sisa percobaan: ${3 - (attempts + 1)}`);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdminLogin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-[120px] animate-pulse delay-700"></div>
      </div>

      <div className="w-full max-w-md p-8 relative z-10">
        <div className={`bg-white/10 backdrop-blur-xl border ${error ? 'border-red-500/50' : 'border-white/20'} rounded-[40px] p-10 shadow-2xl text-center transition-all duration-300`}>
          <div className="mb-8 flex flex-col items-center">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 rotate-3 hover:rotate-0 transition-transform duration-500">
               <ShieldCheck size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter">ETANA</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">system administrasi notaris</p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 ${error ? 'text-red-400' : 'text-slate-400'}`} size={18} />
              <input 
                disabled={isLocked}
                type="password" 
                placeholder={isLocked ? "TERKUNCI (30s)" : "Masukkan PIN Akses"} 
                className={`w-full bg-white/5 border rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-500 outline-none focus:ring-2 transition-all text-center tracking-[0.5em] font-black ${
                  error ? 'border-red-500 ring-2 ring-red-500/20' : 'border-white/10 focus:ring-blue-500'
                } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                value={pin}
                onChange={e => {
                  setPin(e.target.value);
                  setError(false);
                }}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>
            
            <Button 
              disabled={isLocked}
              onClick={handleAdminLogin} 
              className={`w-full h-14 font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all ${
                isLocked ? 'bg-slate-700 text-slate-400' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/10'
              }`}
            >
              {isLocked ? 'Sistem Terkunci' : 'Masuk Database'}
            </Button>
          </div>

          <div className="mt-10 flex justify-center gap-6">
             <div className="flex flex-col items-center gap-1">
                <Globe size={14} className="text-slate-500" />
                <span className="text-[8px] font-bold text-slate-600 uppercase">Cloud Sync</span>
             </div>
             <div className="flex flex-col items-center gap-1">
                <Database size={14} className="text-slate-500" />
                <span className="text-[8px] font-bold text-slate-600 uppercase">Supabase</span>
             </div>
          </div>
        </div>

        <p className="text-center text-slate-600 text-[10px] mt-8 font-medium uppercase tracking-widest">
          Build v2.5.0 • Powered by Etana Tech
        </p>
      </div>
    </div>
  );
};