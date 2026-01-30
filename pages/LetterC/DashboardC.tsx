import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/db'; // Sesuaikan path config supabase Bapak
import { BookOpen, Users, Layers, Activity, ArrowUpRight, FileText, Landmark, Repeat, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// --- INTERFACES ---
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend: string;
  color: string;
  subtitle: string;
}

interface DashboardStats {
  totalKohir: number;
  totalPersil: number;
  pemilikAktif: number;
  totalMutasi: number;
  recentMutations: any[];
  loading: boolean;
}

export const DashboardC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalKohir: 0,
    totalPersil: 0,
    pemilikAktif: 0,
    totalMutasi: 0,
    recentMutations: [],
    loading: true
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. Hitung Total Kohir (Letter C)
      const { count: kohirCount } = await supabase.from('letter_c').select('*', { count: 'exact', head: true });
      
      // 2. Hitung Total Persil
      const { count: persilCount } = await supabase.from('letter_c_persil').select('*', { count: 'exact', head: true });
      
      // 3. Hitung Mutasi Bulan Ini
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { count: mutasiCount } = await supabase.from('mutasi_c')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth);

      // 4. Ambil 3 Mutasi Terakhir
      const { data: recent } = await supabase.from('mutasi_c')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      setStats({
        totalKohir: kohirCount || 0,
        totalPersil: persilCount || 0,
        pemilikAktif: kohirCount || 0, // Biasanya 1 kohir = 1 pemilik aktif
        totalMutasi: mutasiCount || 0,
        recentMutations: recent || [],
        loading: false
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  if (stats.loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p className="font-bold text-xs uppercase tracking-widest">Sinkronisasi Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black tracking-tighter text-slate-900">RINGKASAN BUKU LETTER C</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Kearsipan & Mutasi Pertanahan Desa</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full tracking-widest uppercase">Koneksi Aktif</span>
        </div>
      </div>

      {/* STAT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          icon={<BookOpen size={20} />} 
          label="Total Kohir" 
          value={stats.totalKohir.toLocaleString('id-ID')} 
          trend="Live"
          subtitle="Nomor Kohir Terdaftar"
          color="bg-slate-900" 
        />
        <StatCard 
          icon={<Layers size={20} />} 
          label="Total Persil" 
          value={stats.totalPersil.toLocaleString('id-ID')} 
          trend="Aktif"
          subtitle="Total Bidang Tanah"
          color="bg-indigo-600" 
        />
        <StatCard 
          icon={<Users size={20} />} 
          label="Pemilik Aktif" 
          value={stats.pemilikAktif.toLocaleString('id-ID')} 
          trend="Stabil"
          subtitle="Subjek Pajak Terdata"
          color="bg-emerald-600" 
        />
        <StatCard 
          icon={<Repeat size={20} />} 
          label="Mutasi C" 
          value={stats.totalMutasi} 
          trend="Bulan Ini"
          subtitle="Perubahan Data Terakhir"
          color="bg-rose-600" 
        />
      </div>
      
      {/* VISUALIZATION AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* GRAFIK KLAS TANAH (Placeholder for Real Analysis) */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden min-h-[400px]">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h3 className="font-black text-slate-800 tracking-tight">SEBARAN KLAS TANAH</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Berdasarkan Luas Meter Persegi</p>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl">
                  <Landmark className="text-amber-400" size={32} />
                </div>
                <p className="text-sm font-black text-slate-800 uppercase tracking-tighter italic">"Data Persil Tersinkronisasi"</p>
                <p className="text-[10px] text-slate-400 font-bold max-w-[200px] mx-auto mt-2 leading-relaxed uppercase">
                  Sistem siap mengolah data Luas dan Kelas Desa secara real-time.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* LOG MUTASI TERAKHIR (Data Asli dari mutasi_c) */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
          <Activity className="absolute right-[-20px] bottom-[-20px] text-white/5" size={180} />
          <h3 className="font-black text-white tracking-tight mb-6 uppercase">Mutasi Terbaru</h3>
          
          <div className="space-y-6 relative z-10">
            {stats.recentMutations.length > 0 ? stats.recentMutations.map((m) => (
              <div key={m.id} className="flex gap-4 items-start border-l-2 border-amber-500/30 pl-4 py-1">
                <div className="p-2 bg-white/10 rounded-xl text-amber-400">
                  <FileText size={14} />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-tight">C.{m.c_asal} → C.{m.c_tujuan}</p>
                  <p className="text-[10px] text-white/50">{m.jenis_mutasi} - {m.luas_mutasi} m²</p>
                  <p className="text-[9px] font-bold text-amber-500/80 mt-1 italic">
                    {new Date(m.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-xs text-slate-500 italic">Belum ada riwayat mutasi.</p>
            )}
          </div>

          <button 
            onClick={() => navigate('/letter-c/mutasi')} // Sesuaikan path-nya (misal: /mutasi atau /letter-c/mutasi)
            className="w-full mt-10 py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all cursor-pointer active:scale-95"
          >
            Buka Arsip Digital
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
        <span className="text-[9px] font-black uppercase">{trend}</span>
      </div>
    </div>
    
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
      </div>
      <p className="text-[9px] font-medium text-slate-400 mt-2 italic">{subtitle}</p>
    </div>
  </div>
);

export default DashboardC;