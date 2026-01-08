
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Card } from '../components/UI';
import { Users, FileText, Map, ArrowRight, Activity, Clock, ShieldCheck, Zap, Globe } from 'lucide-react';
import * as ReactRouterDOM from 'react-router-dom';
const { Link } = ReactRouterDOM;
import { FileRecord } from '../types';

const StatCard: React.FC<{ 
  title: string; 
  count: number; 
  icon: React.ReactNode; 
  to: string;
  theme: 'blue' | 'emerald' | 'violet'
}> = ({ title, count, icon, to, theme }) => {
  const themes = {
    blue: "from-blue-50 to-white text-blue-600 border-blue-100 shadow-blue-500/5",
    emerald: "from-emerald-50 to-white text-emerald-600 border-emerald-100 shadow-emerald-500/5",
    violet: "from-violet-50 to-white text-violet-600 border-violet-100 shadow-violet-500/5"
  };

  const iconColors = {
    blue: "bg-blue-600 shadow-blue-500/30",
    emerald: "bg-emerald-600 shadow-emerald-500/30",
    violet: "bg-violet-600 shadow-violet-500/30"
  };

  return (
    <Link to={to} className="block group">
      <div className={`relative overflow-hidden rounded-3xl border bg-gradient-to-br ${themes[theme]} p-7 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1`}>
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-current opacity-[0.03] rounded-full group-hover:scale-150 transition-transform duration-700"></div>
        <div className="flex flex-row items-center justify-between space-y-0 pb-4">
          <h3 className="text-xs font-black tracking-[0.15em] text-slate-500 uppercase">{title}</h3>
          <div className={`p-2.5 rounded-xl text-white shadow-lg ${iconColors[theme]}`}>
            {icon}
          </div>
        </div>
        <div className="text-4xl font-black tracking-tighter text-slate-900 group-hover:scale-105 transition-transform origin-left">{count}</div>
        <p className="text-[10px] font-bold text-slate-400 mt-3 flex items-center uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
          Kelola Data <ArrowRight size={12} className="ml-1.5" />
        </p>
      </div>
    </Link>
  );
};

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({ identities: 0, lands: 0, files: 0 });
  const [recentFiles, setRecentFiles] = useState<FileRecord[]>([]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [i, l, f] = await Promise.all([
          db.identities.getAll(),
          db.lands.getAll(),
          db.files.getAll()
        ]);
        setStats({ identities: i.length, lands: l.length, files: f.length });
        setRecentFiles(f.slice(0, 5));
      } catch (err) {
        console.error("Dashboard load failed", err);
      }
    };
    loadStats();
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest">Administrator Panel</span>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest">v2.5.0</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">Halo, Admin</h2>
          <p className="text-slate-500 font-medium">Selamat datang kembali di sistem manajemen notaris terpadu.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
           <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Globe size={20}/></div>
           <div className="pr-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status Cloud</p>
              <p className="text-xs font-bold text-emerald-700">Online & Synchronized</p>
           </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <StatCard title="Klien Terdaftar" count={stats.identities} icon={<Users size={20}/>} to="/identities" theme="blue" />
        <StatCard title="Objek Tanah" count={stats.lands} icon={<Map size={20}/>} to="/lands" theme="emerald" />
        <StatCard title="Berkas Aktif" count={stats.files} icon={<FileText size={20}/>} to="/files" theme="violet" />
      </div>

      <div className="grid gap-8 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <Card className="h-full border-slate-200 overflow-hidden shadow-xl shadow-slate-200/40">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Activity size={20}/></div>
                  <div>
                    <h3 className="font-bold text-lg tracking-tight">Aktivitas Terakhir</h3>
                    <p className="text-xs text-slate-400 font-medium">Monitoring pergerakan berkas masuk.</p>
                  </div>
               </div>
               <Link to="/files" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Lihat Semua</Link>
            </div>

            <div className="space-y-4">
              {recentFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-transparent hover:border-blue-100 hover:bg-white transition-all group cursor-pointer relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                       <FileText size={18} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-slate-500 font-mono font-medium">{file.nomor_berkas}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-900">{file.tanggal}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{file.hari}</p>
                  </div>
                </div>
              ))}
              {recentFiles.length === 0 && (
                <div className="py-16 text-center">
                   <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock size={32} className="text-slate-300" />
                   </div>
                   <p className="text-sm text-slate-400 font-medium tracking-tight">Belum ada aktivitas baru hari ini.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0f172a] p-8 text-white shadow-2xl group border border-white/5">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-500 opacity-10 rounded-full blur-[80px] group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10">
              <div className="p-3 bg-white/10 w-fit rounded-2xl mb-6 border border-white/10 group-hover:rotate-12 transition-transform">
                <Zap size={28} className="text-blue-400" />
              </div>
              <h3 className="text-2xl font-black tracking-tight mb-2">Automasi Berkas</h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">
                Hasilkan akta dalam hitungan detik. Tarik data klien & tanah secara otomatis ke template Word Anda.
              </p>
              <Link to="/templates">
                <button className="w-full h-14 inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 text-sm font-black uppercase tracking-widest text-white hover:bg-blue-500 shadow-xl shadow-blue-600/20 transition-all active:scale-95">
                  Buka Engine Automasi
                </button>
              </Link>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-8 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-700">
               <ShieldCheck size={100} />
            </div>
            <div className="flex items-center gap-4 mb-6">
               <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><ShieldCheck size={20}/></div>
               <h3 className="font-bold text-lg tracking-tight">Enkripsi Data</h3>
            </div>
            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-4">
              Seluruh identitas klien dan data aset dilindungi dengan enkripsi tingkat tinggi pada infrastruktur cloud.
            </p>
            <div className="flex items-center gap-2">
               <div className="h-1 flex-1 bg-emerald-100 rounded-full overflow-hidden">
                  <div className="h-full w-full bg-emerald-500 rounded-full"></div>
               </div>
               <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Secure</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
