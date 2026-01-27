import React from 'react'; // Tambahkan ini jika TS masih minta
import { BookOpen, Users, Layers, Activity } from 'lucide-react';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

// PASTIKAN ADA KATA 'export' DI SINI
export const DashboardC = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={<BookOpen />} label="Total Kohir" value="2.840" color="bg-blue-500" />
        <StatCard icon={<Layers />} label="Total Persil" value="12.420" color="bg-emerald-500" />
        <StatCard icon={<Users />} label="Pemilik Aktif" value="1.950" color="bg-orange-500" />
        <StatCard icon={<Activity />} label="Mutasi Bulan Ini" value="48" color="bg-purple-500" />
      </div>
      
      <div className="bg-white p-8 rounded-[2rem] border border-slate-200 min-h-[300px] flex items-center justify-center">
        <div className="text-center text-slate-400">
           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 italic font-black text-2xl text-slate-200">C</div>
           <p className="text-sm font-bold uppercase tracking-widest">Statistik Sebaran Klas Tanah</p>
           <p className="text-xs mt-1">Data grafik akan muncul saat database terhubung</p>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: StatCardProps) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center gap-4">
    <div className={`w-12 h-12 ${color} text-white rounded-2xl flex items-center justify-center shadow-lg shadow-current/20`}>{icon}</div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-xl font-black text-slate-800">{value}</p>
    </div>
  </div>
);