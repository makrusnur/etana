import React, { useState, useEffect } from 'react';
import { 
  Search, MapPin, ChevronRight, Landmark,  
  ArrowLeft, Printer, Trash2, Edit3, Plus 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import { LandData } from '../types';

export const PbbPage: React.FC = () => {
  const navigate = useNavigate();
  const [allLands, setAllLands] = useState<LandData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  
  // State untuk melacak desa mana yang sedang dilihat detailnya
  const [selectedLocation, setSelectedLocation] = useState<{kec: string, desa: string} | null>(null);

  useEffect(() => { 
    fetchData(); 
  }, []);

  const fetchData = async () => {
    try {
      const data = await db.lands.getAll();
      setAllLands(data || []);
    } catch (error) { 
      console.error("Gagal memuat data:", error); 
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data SPPT ini?")) {
      try {
        await db.lands.delete(id);
        fetchData(); // Refresh data setelah hapus
      } catch (error) {
        alert("Gagal menghapus data");
      }
    }
  };

  const kecamatanList = Array.from(
    new Set(allLands.map(l => (l.kecamatan || "TANPA KECAMATAN").toUpperCase()))
  ).sort();

  const detailData = selectedLocation 
    ? allLands.filter(l => 
        (l.kecamatan || "").toUpperCase() === selectedLocation.kec && 
        (l.desa || "").toUpperCase() === selectedLocation.desa
      )
    : [];

  if (loading) return <div className="p-10 text-center font-bold text-slate-400 animate-pulse uppercase tracking-widest">Memproses Basis Data...</div>;

  // --- TAMPILAN 1: DETAIL DESA (TABEL) ---
  if (selectedLocation) {
    return (
      <div className="p-4 lg:p-8 bg-[#f8fafc] min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => setSelectedLocation(null)}
            className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:gap-3 transition-all uppercase"
          >
            <ArrowLeft size={18} /> Kembali
          </button>
          
          <button 
            onClick={() => navigate('/lands')}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={16} /> TAMBAH SPPT BARU
          </button>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black mb-1 uppercase tracking-[0.2em]">
            <MapPin size={12} /> {selectedLocation.kec}
          </div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">DESA {selectedLocation.desa}</h1>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wide mt-1">Total: {detailData.length} Objek Pajak Terdata</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-widest">
                <tr>
                  <th className="p-4">NOMOR OBJEK PAJAK (NOP)</th>
                  <th className="p-4">NAMA WAJIB PAJAK</th>
                  <th className="p-4 text-center">LUAS (M²)</th>
                  <th className="p-4 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {detailData.map((land) => (
                  <tr key={land.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-4 font-mono font-bold text-blue-600 text-sm">
                      {land.nop || <span className="text-slate-300 italic">Kosong</span>}
                    </td>
                    <td className="p-4 font-bold text-slate-700 uppercase">{land.atas_nama_nop || '-'}</td>
                    <td className="p-4 text-center font-black text-slate-600">
                      {Number(land.luas_seluruhnya || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          title="Cetak SPPT"
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Printer size={16} />
                        </button>
                        <button 
                          onClick={() => navigate(`/lands?edit=${land.id}`)}
                          title="Edit Data"
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(land.id)}
                          title="Hapus Data"
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // --- TAMPILAN 2: HALAMAN UTAMA (GRID WILAYAH) ---
  return (
    <div className="p-4 lg:p-8 bg-[#f8fafc] min-h-screen">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Dashboard PBB / SPPT</h1>
          <p className="text-slate-500 text-sm font-medium">Monitoring Pajak Bumi dan Bangunan per Wilayah</p>
        </div>
        <button 
          onClick={() => navigate('/lands')}
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-2xl font-bold text-xs hover:bg-slate-50 transition-all shadow-sm"
        >
          <Plus size={18} className="text-blue-600" /> TAMBAH DATA
        </button>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-4 text-slate-300" size={18} />
        <input 
          type="text" 
          placeholder="Cari desa atau kecamatan secara spesifik..." 
          className="w-full bg-white border-none shadow-sm ring-1 ring-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-10">
        {kecamatanList
          .filter(kec => kec.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  allLands.some(l => l.kecamatan?.toUpperCase() === kec && l.desa?.toLowerCase().includes(searchTerm.toLowerCase())))
          .map(kec => {
            const desas = Array.from(new Set(allLands.filter(l => (l.kecamatan || "").toUpperCase() === kec).map(l => (l.desa || "TANPA DESA").toUpperCase()))).sort();
            
            return (
              <div key={kec} className="animate-in fade-in duration-500">
                <div className="flex items-center gap-3 mb-5 ml-1">
                  <div className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-100 text-blue-600"><Landmark size={20}/></div>
                  <h2 className="font-black text-slate-800 uppercase tracking-tighter text-xl">{kec}</h2>
                  <div className="h-[1px] flex-1 bg-slate-200 ml-4 opacity-50"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  {desas.map(desa => {
                    const count = allLands.filter(l => (l.kecamatan || "").toUpperCase() === kec && (l.desa || "").toUpperCase() === desa).length;
                    return (
                      <button 
                        key={desa}
                        onClick={() => setSelectedLocation({kec, desa})}
                        className="group relative p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1 transition-all text-left overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Landmark size={80} />
                        </div>
                        <div className="flex justify-between items-start mb-6">
                           <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                              <MapPin size={20} />
                           </div>
                           <div className="p-1 bg-slate-50 rounded-lg">
                              <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                           </div>
                        </div>
                        <h3 className="font-black text-slate-700 uppercase text-base mb-1 group-hover:text-blue-600 transition-colors tracking-tight">{desa}</h3>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">{count} BIDANG</span>
                           <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                           <span className="text-[10px] font-bold text-blue-500 uppercase">Lihat Detail</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
        })}
      </div>
    </div>
  );
};