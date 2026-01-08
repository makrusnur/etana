
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Card } from '../components/UI';
import { Users, FileText, Map, ArrowRight, Activity, Clock } from 'lucide-react';
// Fix: Use namespace import for react-router-dom to resolve missing exported member error
import * as ReactRouterDOM from 'react-router-dom';
const { Link } = ReactRouterDOM;
import { FileRecord } from '../types';

const StatCard: React.FC<{ title: string; count: number; icon: React.ReactNode; to: string }> = ({ title, count, icon, to }) => (
  <Link to={to}>
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm hover:border-slate-300 transition-all">
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium tracking-tight text-slate-500 uppercase">{title}</h3>
        <div className="text-slate-400">{icon}</div>
      </div>
      <div className="text-2xl font-bold">{count}</div>
      <p className="text-xs text-slate-400 mt-1 flex items-center">
        Lihat detail <ArrowRight size={10} className="ml-1" />
      </p>
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
        setRecentFiles(f.slice(0, 5));
      } catch (err) {
        console.error("Dashboard load failed", err);
      }
    };
    loadStats();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard Utama</h2>
        <p className="text-sm text-slate-500">Ringkasan operasional administrasi PPAT Ethana.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Klien" count={stats.identities} icon={<Users size={16}/>} to="/identities" />
        <StatCard title="Objek Tanah" count={stats.lands} icon={<Map size={16}/>} to="/lands" />
        <StatCard title="Berkas Akta" count={stats.files} icon={<FileText size={16}/>} to="/files" />
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card title="Aktivitas Terakhir" description="Daftar berkas yang baru saja ditambahkan ke sistem." className="lg:col-span-4">
          <div className="space-y-4">
            {recentFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0 group">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 font-mono">{file.nomor_berkas}</p>
                </div>
                <div className="flex flex-col items-end">
                  <p className="text-xs font-medium">{file.tanggal}</p>
                  <p className="text-[10px] text-slate-400 uppercase">{file.hari}</p>
                </div>
              </div>
            ))}
            {recentFiles.length === 0 && <p className="text-sm text-slate-400 text-center py-10">Belum ada aktivitas baru.</p>}
          </div>
        </Card>

        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-lg bg-slate-900 p-6 text-slate-50 shadow-sm border border-slate-800">
            <Activity size={24} className="mb-4 text-slate-400" />
            <h3 className="font-semibold text-lg">Otomasi Akta</h3>
            <p className="text-sm text-slate-400 mt-2 mb-4 leading-relaxed">
              Konversi data langsung menjadi dokumen Word dengan sekali klik. Pastikan template sudah dikonfigurasi.
            </p>
            <Link to="/templates">
              <button className="w-full h-9 inline-flex items-center justify-center rounded-md bg-slate-50 px-4 text-xs font-bold text-slate-900 hover:bg-slate-200 transition-colors">
                BUKA TEMPLATE ENGINE
              </button>
            </Link>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <Clock size={24} className="mb-4 text-slate-400" />
            <h3 className="font-semibold text-lg">Penyimpanan Cloud</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Seluruh data terenkripsi dan tersinkronisasi secara real-time melalui infrastruktur Supabase.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
