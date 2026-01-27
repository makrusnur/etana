import { useState, useEffect } from 'react';
import { MapPin, Loader2, Search, Layers, ChevronRight, Hash, Building2 } from 'lucide-react';
import { supabase } from '../../services/db';
import { Kecamatan, Desa, LetterCPersil } from '../../types';

// Interface untuk menampung data join
interface PersilWithOwner extends LetterCPersil {
  letter_c: {
    nomor_c: string;
    nama_pemilik: string;
    desa_id: string;
  };
}

export const Persil = () => {
  const [loading, setLoading] = useState(false);
  const [kecamatans, setKecamatans] = useState<Kecamatan[]>([]);
  const [desas, setDesas] = useState<Desa[]>([]);
  const [persilList, setPersilList] = useState<PersilWithOwner[]>([]);
  const [selectedDesaId, setSelectedDesaId] = useState<string | null>(
    localStorage.getItem('last_selected_desa_id') || null
  );
  
  // State untuk Pencarian
  const [searchDesa, setSearchDesa] = useState(''); // Search di sidebar
  const [searchTerm, setSearchTerm] = useState(''); // Search di tabel
  const [filterJenis, setFilterJenis] = useState('Semua');

  useEffect(() => {
    const fetchData = async () => {
      const { data: kec } = await supabase.from('kecamatan').select('*').order('nama');
      const { data: des } = await supabase.from('desa').select('*').order('nama');
      if (kec) setKecamatans(kec);
      if (des) setDesas(des);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchPersils = async () => {
      if (!selectedDesaId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('letter_c_persil')
        .select(`*, letter_c!inner (nomor_c, nama_pemilik, desa_id)`)
        .eq('letter_c.desa_id', selectedDesaId)
        .order('nomor_persil');
      if (!error && data) setPersilList(data as any);
      setLoading(false);
    };
    fetchPersils();
  }, [selectedDesaId]);

  // Logika Grouping & Filter Sidebar
  const filteredKecamatans = kecamatans.map(kec => ({
    ...kec,
    // Ambil desa yang kecamatan_id-nya cocok DAN sesuai dengan search bar sidebar
    desas: desas.filter(d => 
      d.kecamatan_id === kec.id && 
      d.nama.toLowerCase().includes(searchDesa.toLowerCase())
    )
  })).filter(kec => kec.desas.length > 0); // Sembunyikan kecamatan jika tidak ada desa yang cocok

  // Logika Filter Tabel
  const filteredPersils = persilList.filter(p => {
    const matchesSearch = p.nomor_persil.includes(searchTerm) || 
                          p.letter_c?.nama_pemilik.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterJenis === 'Semua' || p.jenis_tanah === filterJenis;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex h-[calc(100vh-140px)] gap-8 p-4 bg-[#F8F9FA] text-zinc-900">
      
      {/* SIDEBAR WILAYAH (GROUPED) */}
      <div className="w-80 flex flex-col overflow-hidden bg-white/50 rounded-[2rem] border border-zinc-100 p-4">
        <div className="px-2 mb-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4">Pilih Wilayah</h3>
          
          {/* Search Bar Sidebar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14}/>
            <input 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs outline-none focus:border-zinc-900 transition-all shadow-sm" 
              placeholder="Cari Desa / Kecamatan..."
              value={searchDesa}
              onChange={(e) => setSearchDesa(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-6">
          {filteredKecamatans.map(k => (
            <div key={k.id} className="space-y-1">
              <div className="flex items-center gap-2 px-2 mb-2">
                <Building2 size={12} className="text-zinc-400"/>
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{k.nama}</span>
              </div>
              {k.desas.map(d => (
                <button 
                  key={d.id} 
                  onClick={() => { setSelectedDesaId(d.id); localStorage.setItem('last_selected_desa_id', d.id); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-bold transition-all ${
                    selectedDesaId === d.id ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-500 hover:bg-white'
                  }`}
                >
                  <span className="flex items-center gap-3"><MapPin size={14} className={selectedDesaId === d.id ? 'text-white' : 'text-zinc-300'}/> {d.nama}</span>
                  {selectedDesaId === d.id && <ChevronRight size={14}/>}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 bg-white rounded-[2.5rem] border border-zinc-100 flex flex-col overflow-hidden shadow-sm">
        <div className="p-8 border-b border-zinc-50 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-black tracking-tight">
              {selectedDesaId ? desas.find(d => d.id === selectedDesaId)?.nama : "Data Persil"}
            </h2>
            <p className="text-sm text-zinc-400 font-medium mt-1 uppercase tracking-wider">Arsip Rincian Tanah Desa</p>
          </div>
          <div className="flex gap-2 bg-zinc-100 p-1.5 rounded-2xl">
            {['Semua', 'Sawah', 'Tanah Kering'].map(j => (
              <button 
                key={j} 
                onClick={() => setFilterJenis(j)} 
                className={`px-5 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${
                  filterJenis === j ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                {j}
              </button>
            ))}
          </div>
        </div>

        <div className="p-8 flex-1 overflow-y-auto">
          {/* Search Bar Tabel */}
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20}/>
            <input 
              className="w-full pl-14 pr-6 py-5 bg-zinc-50/50 border border-zinc-100 rounded-[1.5rem] text-sm outline-none focus:bg-white focus:border-zinc-900 transition-all shadow-inner font-medium" 
              placeholder="Ketik Nomor Persil atau Nama Pemilik untuk mencari..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
              <Loader2 className="animate-spin text-zinc-300" size={40}/>
              <p className="text-xs font-black text-zinc-300 uppercase tracking-[0.3em]">Memuat Data...</p>
            </div>
          ) : !selectedDesaId ? (
             <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                <Layers size={80} strokeWidth={1}/>
                <p className="font-black uppercase tracking-[0.4em] text-[10px] mt-6 leading-relaxed">Pilih desa pada sidebar<br/>untuk melihat rincian persil</p>
             </div>
          ) : (
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[11px] font-black text-zinc-300 uppercase tracking-[0.2em]">
                  <th className="pb-4 px-6">No. Persil</th>
                  <th className="pb-4">Nama Pemilik / Kohir</th>
                  <th className="pb-4">Jenis & Klas</th>
                  <th className="pb-4 text-right px-6">Luas Tanah</th>
                </tr>
              </thead>
              <tbody>
                {filteredPersils.map(p => (
                  <tr key={p.id} className="group transition-all hover:translate-x-1">
                    <td className="py-6 px-6 bg-zinc-50/50 rounded-l-[1.5rem] font-black text-xl text-zinc-900 group-hover:bg-zinc-900 group-hover:text-white transition-all">
                      {p.nomor_persil}
                    </td>
                    <td className="py-6 bg-zinc-50/50 group-hover:bg-zinc-50">
                      <div className="font-black text-zinc-800 uppercase tracking-tight text-base leading-none mb-1">
                        {p.letter_c?.nama_pemilik}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-bold uppercase flex items-center gap-1">
                        <Hash size={10}/> Kohir C.{p.letter_c?.nomor_c}
                      </div>
                    </td>
                    <td className="py-6 bg-zinc-50/50 group-hover:bg-zinc-50">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase ${
                        p.jenis_tanah === 'Sawah' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                      }`}>
                        {p.jenis_tanah}
                      </span>
                      <span className="ml-2 text-sm font-bold text-zinc-400">{p.klas_desa}</span>
                    </td>
                    <td className="py-6 px-6 bg-zinc-50/50 rounded-r-[1.5rem] text-right group-hover:bg-zinc-50">
                      <span className="font-black text-xl text-zinc-900">{p.luas_meter?.toLocaleString('id-ID')}</span>
                      <span className="text-[10px] font-bold text-zinc-400 ml-1 uppercase">m²</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};