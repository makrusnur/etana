
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Card } from '../components/UI';
import { Users, FileText, Map, ArrowRight, Database, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FileRecord } from '../types';

const StatCard: React.FC<{ title: string; count: number; icon: React.ReactNode; color: string; to: string }> = ({ title, count, icon, color, to }) => (
  <Link to={to} className="block group">
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all relative overflow-hidden">
      <div className={`absolute top-0 right-0 p-4 opacity-10 ${color} scale-150 transform group-hover:scale-125 transition-transform`}>
        {icon}
      </div>
      <div className="relative z-10">
        <div className={`p-3 rounded-2xl w-fit ${color} bg-opacity-10 text-slate-800 mb-4`}>
          {React.cloneElement(icon as React.ReactElement<any>, { size: 24, className: 'text-slate-700' })}
        </div>
        <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{title}</h3>
        <p className="text-4xl font-black text-slate-900 mt-1">{count}</p>
        <div className="flex items-center text-blue-600 text-[10px] font-black uppercase tracking-widest mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
          Kelola Data <ArrowRight size={12} className="ml-1" />
        </div>
      </div>
    </div>
  </Link>
);

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({ identities: 0, lands: 0, files: 0 });
  const [recentFiles, setRecentFiles] = useState<FileRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

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
      } catch (err: any) {
        console.error("Dashboard failed to load:", err);
        setError(err?.message || String(err) || "Gagal memuat data statistik.");
      }
    };
    loadStats();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">HELLO, <span className="text-blue-600">ADMIN</span></h2>
          <p className="text-slate-500 font-medium">Monitoring sistem administrasi notaris & PPAT hari ini.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100 self-start">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Storage: Cloud Supabase</span>
        </div>
      </div>

      {error && (
        <div className="p-6 bg-red-50 border border-red-100 rounded-[2rem] flex items-center gap-4 text-red-600">
          <AlertCircle size={32} className="shrink-0" />
          <div>
            <p className="font-black text-xs uppercase tracking-widest mb-1">Koneksi Bermasalah</p>
            <p className="text-sm font-medium opacity-80">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Identitas" count={stats.identities} icon={<Users />} color="bg-blue-500" to="/identities" />
        <StatCard title="Objek Tanah" count={stats.lands} icon={<Map />} color="bg-emerald-500" to="/lands" />
        <StatCard title="Berkas Aktif" count={stats.files} icon={<FileText />} color="bg-amber-500" to="/files" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="Aktivitas Berkas Terbaru">
          {recentFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 opacity-20">
              <FileText size={48} className="mb-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Belum ada aktivitas.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {recentFiles.map(file => (
                <li key={file.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center group hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-600">
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400">{file.nomor_berkas}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] px-3 py-1 bg-white border border-slate-100 rounded-lg text-slate-500 font-black uppercase tracking-widest">{file.tanggal}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        
        <div className="space-y-6">
           <div className="p-8 bg-blue-600 rounded-[2.5rem] text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
              <h4 className="text-xl font-black tracking-tighter mb-2">Automated Documents</h4>
              <p className="text-sm text-blue-100 mb-6 leading-relaxed opacity-80 font-medium">Gunakan fitur ekspor berkas ke Microsoft Word dengan tag otomatis untuk efisiensi waktu kerja Anda.</p>
              <Link to="/templates" className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                Mulai Cetak Berkas <ArrowRight size={14}/>
              </Link>
           </div>
           
           <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
              <div className="absolute -left-10 -top-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
              <h4 className="text-xl font-black tracking-tighter mb-2">OCR Scanner Ready</h4>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed opacity-80 font-medium">Scan KTP klien Anda menggunakan teknologi AI Gemini terbaru untuk pengisian formulir instan.</p>
              <Link to="/identities" className="inline-flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                Buka Kamera <Database size={14}/>
              </Link>
           </div>
        </div>
      </div>
    </div>
  );
};
