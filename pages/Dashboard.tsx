
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Card } from '../components/UI';
import { Users, FileText, Map, ArrowRight, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FileRecord } from '../types';

const StatCard: React.FC<{ title: string; count: number; icon: React.ReactNode; color: string; to: string }> = ({ title, count, icon, color, to }) => (
  <Link to={to} className="block group">
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden">
      <div className={`absolute top-0 right-0 p-4 opacity-10 ${color} scale-150 transform group-hover:scale-125 transition-transform`}>
        {icon}
      </div>
      <div className="relative z-10">
        <div className={`p-3 rounded-full w-fit ${color} bg-opacity-10 text-slate-800 mb-4`}>
          {React.cloneElement(icon as React.ReactElement<any>, { size: 24, className: 'text-slate-700' })}
        </div>
        <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
        <p className="text-3xl font-bold text-slate-800 mt-1">{count}</p>
        <div className="flex items-center text-blue-600 text-xs font-medium mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
          Kelola Data <ArrowRight size={12} className="ml-1" />
        </div>
      </div>
    </div>
  </Link>
);

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
        setRecentFiles(f.slice(-5).reverse());
      } catch (err) {
        console.error("Dashboard failed to load:", err);
      }
    };
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">ETANA Dashboard</h2>
          <p className="text-slate-500">Administrasi Notaris & PPAT </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100 text-[10px] font-bold">
          <Database size={12} /> STORAGE: INDEXEDDB
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Identitas" count={stats.identities} icon={<Users />} color="bg-blue-500" to="/identities" />
        <StatCard title="Data Tanah" count={stats.lands} icon={<Map />} color="bg-emerald-500" to="/lands" />
        <StatCard title="Berkas" count={stats.files} icon={<FileText />} color="bg-amber-500" to="/files" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Berkas Terbaru">
          {recentFiles.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">Belum ada data.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentFiles.map(file => (
                <li key={file.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{file.jenis_berkas} - {file.nomor_berkas}</p>
                    <p className="text-xs text-slate-500">{file.tanggal}</p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-slate-100 rounded text-slate-600">{file.keterangan || '-'}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
};
