import React from 'react';
import { BookOpen, Users, Layers, Activity, ArrowUpRight, FileText, Landmark, Repeat } from 'lucide-react';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: string;
  color: string;
  subtitle: string;
}

export const DashboardC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black tracking-tighter text-slate-900">RINGKASAN BUKU LETTER C</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Kearsipan & Mutasi Pertanahan Desa</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-3 py-1 rounded-full tracking-widest uppercase">Update Terkini</span>
        </div>
      </div>

      {/* STAT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          icon={<BookOpen size={20} />} 
          label="Total Kohir" 
          value="2.840" 
          trend="+12"
          subtitle="Nomor Kohir Terdaftar"
          color="bg-slate-900" 
        />
        <StatCard 
          icon={<Layers size={20} />} 
          label="Total Persil" 
          value="12.420" 
          trend="+5"
          subtitle="Total Bidang Tanah"
          color="bg-indigo-600" 
        />
        <StatCard 
          icon={<Users size={20} />} 
          label="Pemilik Aktif" 
          value="1.950" 
          trend="Stabil"
          subtitle="Subjek Pajak Lokal"
          color="bg-emerald-600" 
        />
        <StatCard 
          icon={<Repeat size={20} />} 
          label="Mutasi C" 
          value="48" 
          trend="+8%"
          subtitle="Perubahan Bulan Ini"
          color="bg-rose-600" 
        />
      </div>
      
      {/* VISUALIZATION AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* GRAFIK KLAS TANAH */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden min-h-[400px]">
          {/* Background Grid Pattern - FIXED TypeScript Error */}
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none" 
            style={{ 
              backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', 
              backgroundSize: '30px 30px' 
            }}
          >
          </div>

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h3 className="font-black text-slate-800 tracking-tight">SEBARAN KLAS TANAH</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Klasifikasi Berdasarkan Letter C</p>
              </div>
              <div className="flex gap-2">
                 <span className="flex items-center gap-1 text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">Darat (D)</span>
                 <span className="flex items-center gap-1 text-[9px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded">Sawah (S)</span>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
                  <Landmark className="text-amber-400" size={32} />
                </div>
                <p className="text-sm font-black text-slate-800 uppercase tracking-tighter">Mesin Analitik Klas Tanah</p>
                <p className="text-[10px] text-slate-400 font-bold max-w-[200px] mx-auto mt-2 leading-relaxed">
                  Menunggu koneksi database untuk kalkulasi otomatis persentase Klas S1, S2, D1, D2.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* LOG MUTASI TERAKHIR */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
          <Activity className="absolute right-[-20px] bottom-[-20px] text-white/5" size={180} />
          
          <h3 className="font-black text-white tracking-tight mb-6">MUTASI TERBARU</h3>
          
          <div className="space-y-6 relative z-10">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex gap-4 items-start border-l-2 border-white/10 pl-4 py-1">
                <div className="p-2 bg-white/10 rounded-xl text-amber-400">
                  <FileText size={14} />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-tight">Kohir #210 {item}</p>
                  <p className="text-[10px] text-white/50">Pecah Waris - Persil 42</p>
                  <p className="text-[9px] font-bold text-amber-500/80 mt-1 italic">2 jam yang lalu</p>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-10 py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all">
            Lihat Semua Riwayat
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, trend, color, subtitle }: StatCardProps) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 flex flex-col justify-between group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 cursor-default">
    <div className="flex justify-between items-start mb-4">
      <div className={`w-12 h-12 ${color} text-white rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-500`}>
        {icon}
      </div>
      <div className="flex items-center gap-1 text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">
        <ArrowUpRight size={10} strokeWidth={3} />
        <span className="text-[9px] font-black">{trend}</span>
      </div>
    </div>
    
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
        <span className="text-[9px] font-bold text-slate-300 uppercase pl-1">Unit</span>
      </div>
      <p className="text-[9px] font-medium text-slate-400 mt-2 italic">{subtitle}</p>
    </div>
  </div>
);

export default DashboardC;