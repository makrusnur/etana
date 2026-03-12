import { useState, useEffect } from 'react';
import { 
  MapPin, Loader2, Search, Layers, ChevronRight, Hash, Building2, Eye, EyeOff, Menu, X, ChevronDown
} from 'lucide-react';
import { supabase } from '../../services/db';
import { Kecamatan, Desa, LetterCPersil } from '../../types';

interface PersilWithOwner extends LetterCPersil {
  letter_c: {
    nomor_c: string;
    nama_pemilik: string;
    desa_id: string;
  } | null;
}

export const Persil = () => {
  // --- States ---
  const [loading, setLoading] = useState(false);
  const [kecamatans, setKecamatans] = useState<Kecamatan[]>([]);
  const [desas, setDesas] = useState<Desa[]>([]);
  const [persilList, setPersilList] = useState<PersilWithOwner[]>([]);
  const [selectedDesaId, setSelectedDesaId] = useState<string | null>(
    localStorage.getItem('last_selected_desa_id') || null
  );
  const [error, setError] = useState<string | null>(null);
  
  const [searchDesa, setSearchDesa] = useState(''); 
  const [searchTerm, setSearchTerm] = useState(''); 
  const [filterJenis, setFilterJenis] = useState('Semua');
  const [showVoid, setShowVoid] = useState(true);
  const [showDesaModal, setShowDesaModal] = useState(false);

  // --- 1. Fetch Data Wilayah ---
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const { data: kec } = await supabase.from('kecamatan').select('*').order('nama');
        const { data: des } = await supabase.from('desa').select('*').order('nama');
        if (kec) setKecamatans(kec);
        if (des) setDesas(des);
      } catch (err: any) {
        console.error("Error fetching regions:", err.message);
        setError("Gagal memuat data wilayah");
      }
    };
    fetchRegions();
  }, []);

  // --- 2. Fetch Data Persil dengan query OPTIMAL ---
  useEffect(() => {
    const fetchPersils = async () => {
      if (!selectedDesaId) {
        setPersilList([]);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Query OPTIMAL: langsung filter desa di query
        const { data, error } = await supabase
          .from('letter_c_persil')
          .select(`
            *,
            letter_c:letter_c_id!inner (
              nomor_c,
              nama_pemilik,
              desa_id
            )
          `)
          .eq('letter_c.desa_id', selectedDesaId)
          .order('nomor_persil'); // SORTING LANGSUNG

        if (error) throw error;

        if (data && data.length > 0) {
          // Normalisasi data
          const normalized = data.map((item: any) => ({
            ...item,
            letter_c: Array.isArray(item.letter_c) ? item.letter_c[0] : item.letter_c
          }));
          
          setPersilList(normalized);
        } else {
          setPersilList([]);
        }

      } catch (err: any) {
        console.error("Error fetching data:", err.message);
        setError(`Gagal memuat data: ${err.message}`);
        setPersilList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPersils();
  }, [selectedDesaId]);

  // --- 3. Filter Logic ---
  const filteredKecamatans = kecamatans
    .map(kec => ({
      ...kec,
      desas: desas.filter(d => 
        d.kecamatan_id === kec.id && 
        d.nama.toLowerCase().includes(searchDesa.toLowerCase())
      )
    }))
    .filter(kec => kec.desas.length > 0);

  // FILTER HANYA BERDASARKAN NO PERSIL
  const filteredPersils = persilList.filter(p => {
    const noPersil = String(p.nomor_persil || "").toLowerCase();
    const cari = searchTerm.toLowerCase();
    
    // Hanya filter berdasarkan nomor persil
    const matchesSearch = noPersil.includes(cari);
    
    const matchesFilter = filterJenis === 'Semua' || p.jenis_tanah === filterJenis;
    
    // Filter berdasarkan showVoid
    const matchesVoid = showVoid ? true : !p.is_void;
    
    return matchesSearch && matchesFilter && matchesVoid;
  });

  const selectedDesa = desas.find(d => d.id === selectedDesaId);

  // Mobile Modal Pilih Desa
  const DesaModal = () => (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-end lg:items-center justify-center" onClick={() => setShowDesaModal(false)}>
      <div className="bg-white w-full max-w-lg rounded-t-2xl lg:rounded-2xl max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0">
          <h3 className="font-bold text-lg">Pilih Desa</h3>
          <button onClick={() => setShowDesaModal(false)} className="p-2 hover:bg-zinc-100 rounded-full">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18}/>
            <input 
              className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm" 
              placeholder="Cari desa..."
              value={searchDesa}
              onChange={(e) => setSearchDesa(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        
        <div className="overflow-y-auto p-4 max-h-[60vh]">
          {filteredKecamatans.length === 0 ? (
            <div className="p-4 text-center text-zinc-400 text-sm">Tidak ada kecamatan</div>
          ) : (
            filteredKecamatans.map(k => (
              <div key={k.id} className="mb-6">
                <h4 className="text-xs font-bold text-zinc-500 mb-2 px-2">{k.nama}</h4>
                <div className="space-y-1">
                  {k.desas.map(d => (
                    <button
                      key={d.id}
                      onClick={() => {
                        setSelectedDesaId(d.id);
                        localStorage.setItem('last_selected_desa_id', d.id);
                        setShowDesaModal(false);
                        setSearchDesa('');
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center justify-between ${
                        selectedDesaId === d.id 
                          ? 'bg-zinc-900 text-white' 
                          : 'hover:bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <MapPin size={16} className={selectedDesaId === d.id ? 'text-white' : 'text-zinc-400'} />
                        {d.nama}
                      </span>
                      {selectedDesaId === d.id && (
                        <span className="text-xs bg-white text-zinc-900 px-2 py-1 rounded-full">Dipilih</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-screen lg:h-[calc(100vh-140px)] gap-4 lg:gap-8 p-2 lg:p-4 bg-[#F8F9FA] text-zinc-900 font-sans overflow-hidden">
      
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-3 bg-white border-b border-zinc-200 mb-2 rounded-xl shadow-sm">
        <button
          onClick={() => setShowDesaModal(true)}
          className="p-2 hover:bg-zinc-100 rounded-lg"
        >
          <Menu size={24} />
        </button>
        <div className="flex-1 mx-2 text-center">
          <h2 className="font-bold text-lg truncate">
            {selectedDesa ? selectedDesa.nama : "Pilih Desa"}
          </h2>
        </div>
      </div>

      {/* Mobile Modal Pilih Desa */}
      {showDesaModal && <DesaModal />}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block lg:w-80 flex-col shrink-0">
        <div className="mb-4 lg:mb-6 space-y-4 px-2">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Wilayah Kerja</h3>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16}/>
            <input 
              className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm outline-none focus:border-zinc-800 transition-all shadow-sm" 
              placeholder="Cari Desa..."
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
                  onClick={() => { 
                    setSelectedDesaId(d.id); 
                    localStorage.setItem('last_selected_desa_id', d.id);
                    setError(null);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-bold transition-all ${
                    selectedDesaId === d.id ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-500 hover:bg-white'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <MapPin size={14} className={selectedDesaId === d.id ? 'text-white' : 'text-zinc-300'}/> 
                    {d.nama}
                  </span>
                  {selectedDesaId === d.id && <ChevronRight size={14}/>}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 bg-white rounded-t-[2.5rem] lg:rounded-[2.5rem] border border-zinc-100 flex flex-col overflow-hidden shadow-sm">
        
        {/* Header */}
        <div className="p-4 lg:p-8 border-b border-zinc-50 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
          <div>
            <h2 className="text-2xl lg:text-3xl font-black tracking-tight">
              {selectedDesa ? selectedDesa.nama : "Data Persil"}
            </h2>
            <p className="text-sm text-zinc-400 font-medium mt-1">Arsip Rincian Tanah Desa</p>
            {error && <p className="text-xs text-red-500 mt-2 font-bold">{error}</p>}
          </div>
          
          <div className="flex flex-col lg:flex-row gap-2 w-full lg:w-auto">
            {/* Toggle Button */}
            <button
              onClick={() => setShowVoid(!showVoid)}
              className={`flex items-center justify-center gap-2 px-4 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${
                showVoid ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-100 text-zinc-400'
              }`}
            >
              {showVoid ? <Eye size={14} /> : <EyeOff size={14} />}
              {showVoid ? 'Sembunyikan Dicoret' : 'Tampilkan Dicoret'}
            </button>
            
            {/* Filter Jenis */}
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
        </div>

        {/* MOBILE: Tombol Ganti Desa */}
        {selectedDesaId && (
          <div className="lg:hidden p-3 border-b border-zinc-100">
            <button
              onClick={() => setShowDesaModal(true)}
              className="w-full flex items-center justify-between p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm"
            >
              <span className="flex items-center gap-2">
                <MapPin size={16} className="text-zinc-500" />
                <span className="font-medium">Ganti Desa</span>
              </span>
              <ChevronDown size={16} className="text-zinc-400" />
            </button>
          </div>
        )}

        {/* Search */}
        <div className="p-4 lg:p-8 flex-1 overflow-y-auto">
          <div className="relative mb-4 lg:mb-8">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400" size={20}/>
            <input 
              className="w-full pl-16 pr-6 py-4 lg:py-5 bg-zinc-50/50 border border-zinc-100 rounded-xl lg:rounded-[1.5rem] text-sm outline-none focus:bg-white focus:border-zinc-900 transition-all" 
              placeholder="Cari No. Persil..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-20">
              <Loader2 className="animate-spin text-zinc-300" size={40}/>
              <p className="text-xs font-black text-zinc-300 mt-4">Memuat Data...</p>
            </div>
          ) : !selectedDesaId ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
              <Layers size={80} strokeWidth={1}/>
              <p className="font-black uppercase tracking-[0.4em] text-[10px] mt-6">Pilih desa pada sidebar</p>
              <button 
                onClick={() => setShowDesaModal(true)}
                className="lg:hidden mt-4 bg-zinc-900 text-white px-6 py-3 rounded-xl text-sm font-black uppercase"
              >
                Pilih Desa
              </button>
            </div>
          ) : filteredPersils.length === 0 ? (
            <div className="text-center p-20">
              <p className="text-zinc-300 font-bold uppercase text-[10px] tracking-widest">
                {error ? 'Error memuat data' : 'Tidak ada data persil'}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3">
                {filteredPersils.map(p => {
                  const isVoid = p.is_void === true;
                  return (
                    <div key={p.id} className={`bg-white border border-zinc-100 rounded-xl p-4 shadow-sm ${isVoid ? 'opacity-50' : ''}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className={`font-black text-lg ${isVoid ? 'line-through text-zinc-400' : 'text-zinc-900'}`}>
                            {p.nomor_persil || '-'}
                          </span>
                          {isVoid && (
                            <span className="ml-2 text-[8px] font-black text-red-500 uppercase bg-red-50 px-1.5 py-0.5 rounded">
                              Dicoret
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isVoid ? 'bg-zinc-300' : 'bg-zinc-200'}`}>
                            <Hash size={12} className="text-zinc-500"/>
                          </div>
                          <span className={`font-black text-lg ${isVoid ? 'line-through text-zinc-400' : 'text-zinc-800'}`}>
                            {p.letter_c?.nomor_c ? `C.${p.letter_c.nomor_c}` : '-'}
                          </span>
                        </div>
                      </div>

                      <p className={`font-bold text-zinc-800 text-sm mb-2 ${isVoid ? 'line-through text-zinc-400' : ''}`}>
                        {p.letter_c?.nama_pemilik || "Tanpa Nama"}
                      </p>

                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase ${
                          isVoid ? 'bg-zinc-200 text-zinc-500' :
                          p.jenis_tanah === 'Sawah' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                        }`}>
                          {p.jenis_tanah || '-'}
                        </span>
                        <span className={`text-sm font-bold px-2 py-0.5 rounded-md ${
                          isVoid ? 'bg-zinc-200 text-zinc-500' : 'bg-zinc-100 text-zinc-500'
                        }`}>
                          {p.klas_desa || '-'}
                        </span>
                      </div>

                      <div className="flex justify-end items-center gap-2">
                        <span className={`font-black text-xl ${isVoid ? 'line-through text-zinc-400' : 'text-zinc-900'}`}>
                          {p.luas_meter ? p.luas_meter.toLocaleString('id-ID') : '0'}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-400">m²</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-[11px] font-black text-zinc-300 uppercase tracking-[0.2em]">
                      <th className="pb-4 px-6">No. Persil</th>
                      <th className="pb-4">No. Kohir</th>
                      <th className="pb-4">Nama Pemilik</th>
                      <th className="pb-4">Jenis & Klas</th>
                      <th className="pb-4 text-right px-6">Luas Tanah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPersils.map(p => {
                      const isVoid = p.is_void === true;
                      return (
                        <tr key={p.id} className={`group transition-all ${isVoid ? 'opacity-50' : ''}`}>
                          <td className={`py-6 px-6 bg-zinc-50/50 rounded-l-[1.5rem] font-black text-xl transition-all group-hover:bg-zinc-900 group-hover:text-white ${
                            isVoid ? 'line-through text-zinc-400' : 'text-zinc-900'
                          }`}>
                            {p.nomor_persil || '-'}
                            {isVoid && (
                              <span className="ml-2 text-[8px] font-black text-red-500 uppercase bg-red-50 px-1.5 py-0.5 rounded">
                                Dicoret
                              </span>
                            )}
                          </td>

                          <td className="py-6 bg-zinc-50/50 group-hover:bg-zinc-50 transition-colors">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                isVoid ? 'bg-zinc-300' : 'bg-zinc-200 group-hover:bg-zinc-300'
                              }`}>
                                <Hash size={12} className="text-zinc-500"/>
                              </div>
                              <span className={`font-black text-lg ${isVoid ? 'text-zinc-400 line-through' : 'text-zinc-800'}`}>
                                {p.letter_c?.nomor_c ? `C.${p.letter_c.nomor_c}` : '-'}
                              </span>
                            </div>
                          </td>

                          <td className="py-6 bg-zinc-50/50 group-hover:bg-zinc-50 transition-colors">
                            <div className={`font-black uppercase tracking-tight text-base leading-none ${
                              isVoid ? 'text-zinc-400 line-through' : 'text-zinc-800'
                            }`}>
                              {p.letter_c?.nama_pemilik || "Tanpa Nama"}
                            </div>
                          </td>

                          <td className="py-6 bg-zinc-50/50 group-hover:bg-zinc-50 transition-colors">
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase ${
                                isVoid ? 'bg-zinc-200 text-zinc-500' :
                                p.jenis_tanah === 'Sawah' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                              }`}>
                                {p.jenis_tanah || '-'}
                              </span>
                              <span className={`text-sm font-bold px-2 py-0.5 rounded-md ${
                                isVoid ? 'bg-zinc-200 text-zinc-500' : 'bg-zinc-100 text-zinc-500'
                              }`}>
                                {p.klas_desa || '-'}
                              </span>
                            </div>
                          </td>

                          <td className={`py-6 px-6 bg-zinc-50/50 rounded-r-[1.5rem] text-right group-hover:bg-zinc-50 transition-colors ${
                            isVoid ? 'line-through text-zinc-400' : ''
                          }`}>
                            <div className="flex items-center justify-end gap-2">
                              <span className="font-black text-xl text-zinc-900">
                                {p.luas_meter ? p.luas_meter.toLocaleString('id-ID') : '0'}
                              </span>
                              <span className="text-[10px] font-bold text-zinc-400">m²</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Info jumlah data */}
              <div className="mt-4 text-xs text-zinc-400 font-bold px-2 lg:px-6">
                Menampilkan {filteredPersils.length} dari {persilList.length} persil
                {!showVoid && persilList.filter(p => p.is_void).length > 0 && (
                  <span className="ml-2">
                    ( {persilList.filter(p => p.is_void).length} persil dicoret )
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};