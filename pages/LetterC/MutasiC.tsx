import { useState, useEffect, useMemo } from 'react';
import {
  MapPin, Loader2, X, ArrowRightLeft,
  Search, UserPlus, CheckCircle2, AlertTriangle,
  FileText, Eye, Save, AlertCircle, Info, LandPlot
} from 'lucide-react';
import { supabase } from '../../services/db';
import { Kecamatan, Desa, Mutasi, LetterC, LetterCPersil } from '../../types';

export const MutasiC = () => {
  const [loading, setLoading] = useState(true);
  const [kecamatans, setKecamatans] = useState<Kecamatan[]>([]);
  const [desas, setDesas] = useState<Desa[]>([]);
  const [mutasiList, setMutasiList] = useState<Mutasi[]>([]);
  const [selectedDesaId, setSelectedDesaId] = useState<string | null>(
    localStorage.getItem('last_selected_desa_id') || null
  );
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'mutasi' | 'summary'>('mutasi');

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: kec, error: errKec } = await supabase.from('kecamatan').select('*').order('nama');
      if (errKec) console.error("Gagal ambil kecamatan:", errKec.message);
      const { data: des, error: errDes } = await supabase.from('desa').select('*').order('nama');
      if (errDes) console.error("Gagal ambil desa:", errDes.message);
      if (kec) setKecamatans(kec);
      if (des) setDesas(des);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMutasi = async () => {
    if (!selectedDesaId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('mutasi_c')
        .select('*')
        .eq('desa_id', selectedDesaId)
        .order('created_at', { ascending: false });
      if (data) setMutasiList(data);
    } catch (error) {
      console.error('Error fetching mutasi:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { fetchMutasi(); }, [selectedDesaId]);

  const filteredKecamatans = kecamatans.map(kec => ({
    ...kec,
    desas: desas.filter(d =>
      d.kecamatan_id === kec.id && d.nama.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(kec => kec.desas.length > 0);

  const summaryData = useMemo(() => {
    if (!selectedDesaId || mutasiList.length === 0) return null;
    const totalMutasi = mutasiList.length;
    const totalLuas = mutasiList.reduce((sum, m) => sum + (m.luas_mutasi || 0), 0);
    const jenisStats = mutasiList.reduce((acc, m) => {
      acc[m.jenis_mutasi] = (acc[m.jenis_mutasi] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const recentMutasi = mutasiList.slice(0, 5);
    return { totalMutasi, totalLuas, jenisStats, recentMutasi };
  }, [selectedDesaId, mutasiList]);

  return (
    <div className="flex h-[calc(100vh-140px)] gap-8 p-4 bg-gradient-to-br from-zinc-50 to-zinc-100 text-zinc-900">
      {/* SIDEBAR DESA */}
      <div className="w-80 flex flex-col overflow-hidden px-2">
        <div className="mb-8 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
            <MapPin size={14}/> Daftar Wilayah
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16}/>
            <input
              className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm outline-none focus:border-zinc-800 transition-all shadow-sm hover:shadow-md"
              placeholder="Cari Desa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar">
          {filteredKecamatans.map(k => (
            <div key={k.id}>
              <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest block mb-3 px-2 flex items-center gap-2">
                <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
                {k.nama}
              </span>
              {k.desas.map(d => (
                <button
                  key={d.id}
                  onClick={() => {
                    setSelectedDesaId(d.id.toString());
                    localStorage.setItem('last_selected_desa_id', d.id.toString());
                    setActiveTab('mutasi');
                  }}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-[13px] font-bold mb-1 transition-all duration-300 ${
                    selectedDesaId === d.id.toString()
                      ? 'bg-gradient-to-r from-zinc-900 to-zinc-800 text-white shadow-xl shadow-zinc-200'
                      : 'text-zinc-500 hover:bg-white hover:text-zinc-900 hover:shadow-md'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <MapPin size={14} className={selectedDesaId === d.id.toString() ? 'text-white' : 'text-zinc-400'}/>
                    {d.nama}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* JURNAL MUTASI / REKAPAN ARSIP */}
      <div className="flex-1 bg-white rounded-[2.5rem] border border-zinc-100 flex flex-col overflow-hidden shadow-xl">
        <div className="p-8 flex justify-between items-end border-b border-zinc-50">
          <div>
            <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-700 bg-clip-text text-transparent">
              {selectedDesaId ? `Arsip Mutasi ${desas.find(d => d.id.toString() === selectedDesaId)?.nama}` : "Jurnal Mutasi"}
            </h2>
            <p className="text-sm text-zinc-400 font-medium mt-1">Rekap Histori Perpindahan Hak Atas Tanah</p>
          </div>
          {selectedDesaId && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-zinc-900 to-zinc-800 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:from-zinc-800 hover:to-zinc-700 transition-all flex items-center gap-3 active:scale-95 shadow-lg shadow-zinc-200 hover:shadow-xl"
              >
                <ArrowRightLeft size={18}/> Catat Mutasi
              </button>
              {summaryData && (
                <button
                  onClick={() => setActiveTab(activeTab === 'mutasi' ? 'summary' : 'mutasi')}
                  className="bg-white border border-zinc-200 text-zinc-900 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-50 transition-all flex items-center gap-3 active:scale-95 hover:border-zinc-300"
                >
                  <FileText size={18}/> {activeTab === 'mutasi' ? 'Lihat Rekap' : 'Kembali ke Mutasi'}
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {!selectedDesaId ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20">
              <div className="bg-gradient-to-r from-zinc-300 to-zinc-200 p-8 rounded-full mb-6">
                <ArrowRightLeft size={120} strokeWidth={0.5}/>
              </div>
              <p className="font-black uppercase tracking-[0.5em] text-[10px] mt-4">Pilih Desa Untuk Melihat Riwayat</p>
            </div>
          ) : loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-zinc-900"></div>
            </div>
          ) : activeTab === 'mutasi' ? (
            <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-zinc-50">
                  <tr className="text-[10px] font-black text-zinc-300 uppercase tracking-widest border-b border-zinc-100">
                    <th className="pb-6 px-4 text-left">Tanggal</th>
                    <th className="pb-6 text-left">Asal (C)</th>
                    <th className="pb-6 text-center">Persil</th>
                    <th className="pb-6 text-center">Aksi</th>
                    <th className="pb-6 text-left">Tujuan (C)</th>
                    <th className="pb-6 text-right px-4">Luas Mutasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {mutasiList.map(m => (
                    <tr key={m.id} className="group hover:bg-zinc-50 transition-all duration-300">
                      <td className="py-8 px-4 font-bold text-zinc-400 text-xs">
                        {new Date(m.tanggal_mutasi).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}
                      </td>
                      <td className="py-8">
                        <span className="block text-zinc-900 font-black text-lg leading-none">C.{m.c_asal}</span>
                        <span className="text-[11px] text-zinc-400 uppercase mt-1 block font-bold">{m.nama_pihak_asal}</span>
                      </td>
                      <td className="py-8 text-center">
                        <span className="block text-zinc-700 font-bold text-sm">P.{m.persil || '-'}</span>
                        <span className="text-[10px] text-zinc-400 mt-1 block">{m.jenis_tanah || '-'}</span>
                      </td>
                      <td className="py-8 text-center">
                        <div className="px-3 py-1 bg-zinc-100 rounded-full text-[9px] font-black uppercase text-zinc-500 inline-block">
                          {m.jenis_mutasi}
                        </div>
                      </td>
                      <td className="py-8">
                        <span className="block text-zinc-900 font-black text-lg leading-none">C.{m.c_tujuan}</span>
                        <span className="text-[11px] text-zinc-400 uppercase mt-1 block font-bold">{m.nama_pihak_tujuan}</span>
                      </td>
                      <td className="py-8 text-right px-4 font-black text-xl text-zinc-900">
                        {(m.luas_mutasi || 0).toLocaleString('id-ID')} <span className="text-[10px] text-zinc-400 ml-1">m²</span>
                      </td>
                    </tr>
                  ))}
                  {mutasiList.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-zinc-300 uppercase font-black text-[10px] tracking-widest italic">Belum ada catatan mutasi</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : summaryData ? (
            <SummaryPanel summaryData={summaryData} desaName={desas.find(d => d.id.toString() === selectedDesaId)?.nama || ''} />
          ) : null}
        </div>
      </div>

      {showModal && selectedDesaId && (
        <FormMutasi
          selectedDesaId={selectedDesaId}
          onClose={() => setShowModal(false)}
          onSuccess={() => { fetchMutasi(); setShowModal(false); }}
        />
      )}
    </div>
  );
};

// --- SUMMARY PANEL ---
const SummaryPanel = ({ summaryData, desaName }: { summaryData: any, desaName: string }) => {
  const stats = [
    { label: 'Total Mutasi', value: summaryData.totalMutasi, color: 'from-blue-500 to-blue-600' },
    { label: 'Total Luas', value: `${summaryData.totalLuas.toLocaleString('id-ID')} m²`, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Rata-rata', value: `${(summaryData.totalLuas / summaryData.totalMutasi).toLocaleString('id-ID', { maximumFractionDigits: 2 })} m²`, color: 'from-purple-500 to-purple-600' }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black mb-2">Rekap Mutasi {desaName}</h3>
            <p className="text-zinc-300 font-medium">Statistik lengkap mutasi hak atas tanah</p>
          </div>
          <Info size={24} className="opacity-50"/>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className={`bg-gradient-to-r ${stat.color} rounded-2xl p-6 text-white shadow-lg`}>
            <div className="text-zinc-200 text-xs font-black uppercase tracking-widest mb-2">{stat.label}</div>
            <div className="text-4xl font-black">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Jenis Mutasi Distribution */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm">
        <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
          <AlertCircle size={14}/> Distribusi Jenis Mutasi
        </h4>
        <div className="space-y-4">
          {Object.entries(summaryData.jenisStats).map(([jenis, count]) => (
            <div key={jenis} className="flex items-center justify-between">
              <span className="text-sm font-bold text-zinc-900">{jenis}</span>
              <div className="flex items-center gap-4">
                <div className="w-40 h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${(count as number / summaryData.totalMutasi) * 100}%` }}
                  ></div>
                </div>
                <span className="text-2xl font-black text-zinc-900">{String(count)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Mutations */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm">
        <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4">Mutasi Terbaru</h4>
        <div className="space-y-4">
          {summaryData.recentMutasi.map((m: Mutasi) => (
            <div key={m.id} className="border-b border-zinc-100 pb-4 last:border-0 group">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs font-bold text-zinc-400">
                    {new Date(m.tanggal_mutasi).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}
                  </div>
                  <div className="text-sm font-black text-zinc-900 mt-1">{m.jenis_mutasi}</div>
                </div>
                <div className="text-xl font-black text-zinc-900">
                  {(m.luas_mutasi || 0).toLocaleString('id-ID')} m²
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 text-[10px] text-zinc-500">
                <span className="font-bold">C.{m.c_asal} → C.{m.c_tujuan}</span>
                <span className="bg-zinc-100 px-2 py-1 rounded text-[9px] font-bold">P.{m.persil || '-'}</span>
              </div>
              <div className="text-[9px] text-zinc-400 mt-1">
                {m.nama_pihak_asal} → {m.nama_pihak_tujuan}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- MODAL FORM MUTASI DENGAN PEMILIHAN PERSIL ---
interface LetterCWithPersil extends LetterC {
  letter_c_persil?: LetterCPersil[];
}

const FormMutasi = ({ selectedDesaId, onClose, onSuccess }: { selectedDesaId: string, onClose: () => void, onSuccess: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [searchAsal, setSearchAsal] = useState('');
  const [searchTujuan, setSearchTujuan] = useState('');
  const [resultsAsal, setResultsAsal] = useState<LetterCWithPersil[]>([]);
  const [resultsTujuan, setResultsTujuan] = useState<LetterC[]>([]);
  const [isNewOwner, setIsNewOwner] = useState(false);
  const [persilOptions, setPersilOptions] = useState<LetterCPersil[]>([]);
  const [selectedPersil, setSelectedPersil] = useState<LetterCPersil | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const [form, setForm] = useState({
    c_asal: '', nama_pihak_asal: '',
    c_tujuan: '', nama_pihak_tujuan: '', alamat_pihak_tujuan: '',
    persil: '', // ✅ Field baru untuk nomor persil
    jenis_tanah: '', klas_desa: '', // ✅ Field baru untuk identitas tanah
    luas_mutasi: '', jenis_mutasi: 'Jual Beli',
    tanggal_mutasi: new Date().toISOString().split('T')[0], keterangan: ''
  });

  // Pencarian Pihak Asal (Real-time)
  useEffect(() => {
    const search = async () => {
      if (searchAsal.length < 1) { 
        setResultsAsal([]); 
        setPersilOptions([]);
        setSelectedPersil(null);
        return; 
      }
      const { data } = await supabase
        .from('letter_c')
        .select('*, letter_c_persil(*)')
        .eq('desa_id', selectedDesaId)
        .ilike('nomor_c', `%${searchAsal}%`)
        .limit(5);
      setResultsAsal(data || []);
    };
    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [searchAsal, selectedDesaId]);

  // Pencarian Pihak Tujuan (Real-time)
  useEffect(() => {
    const search = async () => {
      if (searchTujuan.length < 1) { 
        setResultsTujuan([]); 
        setIsNewOwner(false); 
        return; 
      }
      const { data } = await supabase
        .from('letter_c')
        .select('*')
        .eq('desa_id', selectedDesaId)
        .ilike('nomor_c', `%${searchTujuan}%`)
        .limit(5);
      setResultsTujuan(data || []);
      if (!data || data.length === 0) {
        setIsNewOwner(true);
        setForm(prev => ({ ...prev, c_tujuan: searchTujuan }));
      } else {
        setIsNewOwner(false);
      }
    };
    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [searchTujuan, selectedDesaId]);

  const selectAsal = async (item: LetterCWithPersil) => {
    const persils = item.letter_c_persil || [];
    
    setForm(prev => ({
      ...prev,
      c_asal: item.nomor_c,
      nama_pihak_asal: item.nama_pemilik,
      persil: '', // Reset saat ganti Kohir
      jenis_tanah: '',
      klas_desa: '',
      luas_mutasi: ''
    }));
    
    setPersilOptions(persils);
    setSelectedPersil(null);
    setSearchAsal(item.nomor_c);
    setResultsAsal([]);
  };

  const selectPersil = (persil: LetterCPersil) => {
    setSelectedPersil(persil);
    setForm(prev => ({
      ...prev,
      persil: persil.nomor_persil || '',
      jenis_tanah: persil.jenis_tanah || '',
      klas_desa: persil.klas_desa || '',
      luas_mutasi: persil.luas_meter ? persil.luas_meter.toString() : '' // Auto-fill dengan stok penuh
    }));
  };

  const selectTujuan = (item: LetterC) => {
    setForm(prev => ({
      ...prev,
      c_tujuan: item.nomor_c,
      nama_pihak_tujuan: item.nama_pemilik,
      alamat_pihak_tujuan: item.alamat_pemilik || ''
    }));
    setSearchTujuan(item.nomor_c);
    setResultsTujuan([]);
    setIsNewOwner(false);
  };

  const validateForm = () => {
    const luasDimutasi = parseFloat(form.luas_mutasi);
    const errors: string[] = [];
    
    if (!form.c_asal) errors.push("❌ Nomor Kohir Asal harus dipilih");
    if (!selectedPersil) errors.push("❌ Persil harus dipilih");
    if (!form.persil) errors.push("❌ Nomor Persil harus diisi");
    if (!form.c_tujuan) errors.push("❌ Nomor Kohir Tujuan harus diisi");
    if (!form.nama_pihak_tujuan) errors.push("❌ Nama Pihak Tujuan harus diisi");
    if (!luasDimutasi || isNaN(luasDimutasi)) errors.push("❌ Luas mutasi harus diisi dengan angka valid");
    if (selectedPersil && luasDimutasi > (selectedPersil.luas_meter || 0)) {
      errors.push(`❌ Luas mutasi (${luasDimutasi.toLocaleString('id-ID')}) melebihi stok persil (${(selectedPersil.luas_meter || 0).toLocaleString('id-ID')})`);
    }
    if (luasDimutasi <= 0) errors.push("❌ Luas mutasi harus lebih dari 0");
    
    return errors;
  };

  const handlePreview = () => {
    const errors = validateForm();
    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }
    setPreviewMode(true);
  };

  // ✅ FUNGSI SIMPAN DENGAN PEMILIHAN PERSIL
  const handleSave = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }
    if (!previewMode) {
      alert("Silakan preview terlebih dahulu sebelum menyimpan");
      return;
    }

    setLoading(true);
    try {
      const luasDimutasi = parseFloat(form.luas_mutasi);
      const stokTersedia = selectedPersil?.luas_meter || 0;
      const luasBaruPersil = stokTersedia - luasDimutasi;

      // ==========================================
      // VALIDASI STOK PERSIL
      // ==========================================
      if (luasBaruPersil < 0) {
        throw new Error(`❌ Luas mutasi melebihi stok tersedia (${stokTersedia.toLocaleString('id-ID')} m²)`);
      }

      // ==========================================
      // UPDATE LUAS PERSIL ASAL (HANYA PERSIL YANG DIPILIH)
      // ==========================================
      const { error: errUpdateAsal } = await supabase
        .from('letter_c_persil')
        .update({ 
          luas_meter: Math.round(luasBaruPersil)
        })
        .eq('id', selectedPersil!.id);

      if (errUpdateAsal) throw errUpdateAsal;

      // ==========================================
      // PROSES PIHAK TUJUAN
      // ==========================================
      let idTujuan: string;

      if (isNewOwner) {
        // BUAT KOHIR BARU
        const { data: newC, error: errNewC } = await supabase
          .from('letter_c')
          .insert([{
            desa_id: selectedDesaId,
            nomor_c: form.c_tujuan.trim(),
            nama_pemilik: form.nama_pihak_tujuan.trim(),
            alamat_pemilik: form.alamat_pihak_tujuan.trim() || ''
          }])
          .select('id')
          .single();

        if (errNewC || !newC) throw errNewC;
        idTujuan = newC.id;

        // BUAT PERSIL BARU UNTUK KOHIR BARU
        const { error: errNewPersil } = await supabase
          .from('letter_c_persil')
          .insert([{
            letter_c_id: idTujuan,
            nomor_persil: form.persil.trim(),
            jenis_tanah: form.jenis_tanah.trim(),
            klas_desa: form.klas_desa.trim(),
            luas_meter: Math.round(luasDimutasi),
            asal_usul: `Mutasi dari C.${form.c_asal} P.${form.persil}`
          }]);

        if (errNewPersil) throw errNewPersil;
      } else {
        // UPDATE KOHIR EXISTING
        const { data: targetC, error: errTargetC } = await supabase
          .from('letter_c')
          .select('id')
          .eq('nomor_c', form.c_tujuan)
          .single();

        if (errTargetC || !targetC) throw new Error("Kohir tujuan tidak ditemukan");
        idTujuan = targetC.id;

        // CEK APAKAH PERSIL SUDAH ADA DI KOHIR TUJUAN
        const { data: persilTujuan } = await supabase
          .from('letter_c_persil')
          .select('id, luas_meter, asal_usul')
          .eq('letter_c_id', idTujuan)
          .eq('nomor_persil', form.persil.trim())
          .maybeSingle();

        if (persilTujuan) {
          // UPDATE LUAS PERSIL EXISTING
          const { error: errUpdateTujuan } = await supabase
            .from('letter_c_persil')
            .update({ 
              luas_meter: persilTujuan.luas_meter + Math.round(luasDimutasi),
              asal_usul: `${persilTujuan.asal_usul || ''} | Tambahan (${form.jenis_mutasi}) dari C.${form.c_asal}`
            })
            .eq('id', persilTujuan.id);

          if (errUpdateTujuan) throw errUpdateTujuan;
        } else {
          // BUAT PERSIL BARU
          const { error: errNewPersil } = await supabase
            .from('letter_c_persil')
            .insert([{
              letter_c_id: idTujuan,
              nomor_persil: form.persil.trim(),
              jenis_tanah: form.jenis_tanah.trim(),
              klas_desa: form.klas_desa.trim(),
              luas_meter: Math.round(luasDimutasi),
              asal_usul: `Mutasi dari C.${form.c_asal} P.${form.persil}`
            }]);

          if (errNewPersil) throw errNewPersil;
        }
      }

      // ==========================================
      // SIMPAN KE JURNAL MUTASI
      // ==========================================
      const { error: errMutasi } = await supabase
        .from('mutasi_c')
        .insert([{
          desa_id: selectedDesaId,
          c_asal: form.c_asal.trim(),
          c_tujuan: form.c_tujuan.trim(),
          nama_pihak_asal: form.nama_pihak_asal.trim(),
          nama_pihak_tujuan: form.nama_pihak_tujuan.trim(),
          alamat_pihak: form.alamat_pihak_tujuan.trim() || '',
          persil: form.persil.trim(), // ✅ Simpan nomor persil
          jenis_tanah: form.jenis_tanah.trim(), // ✅ Simpan jenis tanah
          luas_mutasi: Math.round(luasDimutasi),
          jenis_mutasi: form.jenis_mutasi,
          tanggal_mutasi: form.tanggal_mutasi,
          keteranngan: form.keterangan.trim() || ''
        }]);

      if (errMutasi) throw errMutasi;

      // ==========================================
      // SUKSES!
      // ==========================================
      alert(`✅ MUTASI BERHASIL DISIMPAN!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 DETAIL PERUBAHAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dari : ${form.nama_pihak_asal}
       Kohir C.${form.c_asal}
       Persil P.${form.persil}
       
Ke   : ${form.nama_pihak_tujuan}
       Kohir C.${form.c_tujuan}
       
Tanah: ${form.jenis_tanah} (${form.klas_desa})
Luas : ${luasDimutasi.toLocaleString('id-ID')} m²
Jenis: ${form.jenis_mutasi}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Stok Persil Asal: ${luasBaruPersil.toLocaleString('id-ID')} m²
✅ Data Kohir Tujuan: Terupdate
✅ Jurnal Mutasi: Tersimpan`);

      onSuccess();

    } catch (e: any) {
      console.error('❌ Error saving mutasi:', e);
      
      // ROLLBACK: Kembalikan luas persil asal
      if (selectedPersil) {
        await supabase
          .from('letter_c_persil')
          .update({ luas_meter: selectedPersil.luas_meter })
          .eq('id', selectedPersil.id);
      }
      
      let msg = e.message || 'Gagal menyimpan mutasi';
      if (msg.includes('duplicate')) msg = 'Nomor Kohir tujuan sudah terdaftar!';
      if (msg.includes('constraint')) msg = 'Data tidak lengkap atau tidak valid';
      
      alert(`❌ GAGAL MENYIMPAN\n\n${msg}\n\nSilakan perbaiki dan coba lagi.`);
    } finally {
      setLoading(false);
      setPreviewMode(false);
    }
  };

  const luasDimutasi = parseFloat(form.luas_mutasi);
  const isValid = !validateForm().length;
  const showWarning = luasDimutasi > 0 && selectedPersil && luasDimutasi > (selectedPersil.luas_meter || 0);
  const errors = validateForm();

  return (
    <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden border border-zinc-100">
        <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-zinc-50 to-zinc-100">
          <div className="flex items-center gap-3">
            <ArrowRightLeft size={24} className="text-zinc-900"/>
            <h4 className="text-sm font-black text-zinc-900">Formulir Mutasi Hak Tanah</h4>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
            <X size={20}/>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div className="grid grid-cols-2 gap-10">
            {/* LEFT COLUMN - INPUT FORM */}
            <div className="space-y-8">
              {/* PIHAK PERTAMA */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block ml-1 flex items-center gap-2">
                  <UserPlus size={12}/> Pihak Pertama (Pemberi)
                </label>
                <div className="relative">
                  <input
                    className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:bg-white focus:ring-2 ring-zinc-200 font-bold transition-all"
                    placeholder="Ketik Nomor Kohir..."
                    value={searchAsal}
                    onChange={(e) => setSearchAsal(e.target.value)}
                    disabled={previewMode}
                  />
                  {resultsAsal.length > 0 && !previewMode && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-zinc-100 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
                      {resultsAsal.map(r => (
                        <button
                          key={r.id}
                          onClick={() => selectAsal(r)}
                          className="w-full text-left px-6 py-4 hover:bg-zinc-50 flex justify-between items-center border-b border-zinc-50 last:border-0 transition-all"
                        >
                          <div>
                            <div className="font-black text-sm">C.{r.nomor_c}</div>
                            <div className="text-[10px] text-zinc-400 uppercase font-bold">{r.nama_pemilik}</div>
                          </div>
                          <div className="text-[10px] font-black bg-zinc-100 px-2 py-1 rounded-md">
                            {(r.letter_c_persil?.length || 0)} persil
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {form.nama_pihak_asal && (
                  <div className="p-4 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl text-white flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={18}/>
                      <span className="text-sm font-black">{form.nama_pihak_asal}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* PEMILIHAN PERSIL - FITUR BARU! */}
              <div className="space-y-4 pt-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block ml-1 flex items-center gap-2">
                  <LandPlot size={12}/> Pilih Persil yang Akan Dimutasi
                </label>
                
                {persilOptions.length === 0 && form.c_asal && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm font-bold text-center">
                    Kohir ini belum memiliki data persil. Silakan tambahkan data persil terlebih dahulu.
                  </div>
                )}

                {persilOptions.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                    {persilOptions.map((persil, idx) => (
                      <button
                        key={persil.id || idx}
                        onClick={() => selectPersil(persil)}
                        disabled={previewMode}
                        className={`w-full text-left p-4 border-2 rounded-xl transition-all ${
                          selectedPersil?.id === persil.id
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-zinc-200 hover:border-blue-300 hover:bg-zinc-50'
                        } ${previewMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-black text-zinc-900">P.{persil.nomor_persil || '-'}</span>
                              {selectedPersil?.id === persil.id && (
                                <CheckCircle2 size={16} className="text-blue-500"/>
                              )}
                            </div>
                            <div className="text-[10px] text-zinc-500 uppercase font-bold">
                              {persil.jenis_tanah} • {persil.klas_desa}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-black text-zinc-900">
                              {(persil.luas_meter || 0).toLocaleString('id-ID')}
                            </div>
                            <div className="text-[10px] text-zinc-400">m² tersedia</div>
                          </div>
                        </div>
                        {persil.asal_usul && (
                          <div className="mt-2 pt-2 border-t border-zinc-100 text-[9px] text-zinc-400">
                            Asal: {persil.asal_usul}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {selectedPersil && (
                  <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl text-white">
                    <div className="text-[9px] font-black uppercase tracking-widest mb-2">Persil Terpilih</div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="opacity-80 text-[10px]">Nomor Persil:</span>
                        <div className="font-black">P.{form.persil}</div>
                      </div>
                      <div>
                        <span className="opacity-80 text-[10px]">Jenis Tanah:</span>
                        <div className="font-black">{form.jenis_tanah}</div>
                      </div>
                      <div>
                        <span className="opacity-80 text-[10px]">Klasifikasi:</span>
                        <div className="font-black">{form.klas_desa}</div>
                      </div>
                      <div>
                        <span className="opacity-80 text-[10px]">Stok Tersedia:</span>
                        <div className="font-black">{(selectedPersil.luas_meter || 0).toLocaleString('id-ID')} m²</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* PIHAK KEDUA */}
              <div className="space-y-4 pt-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block ml-1 flex items-center gap-2">
                  <UserPlus size={12}/> Pihak Kedua (Penerima)
                </label>
                <div className="relative">
                  <input
                    className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:bg-white focus:ring-2 ring-zinc-200 font-bold transition-all"
                    placeholder="Ketik Nomor Kohir..."
                    value={searchTujuan}
                    onChange={(e) => setSearchTujuan(e.target.value)}
                    disabled={previewMode || !selectedPersil}
                  />
                  {resultsTujuan.length > 0 && !previewMode && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-zinc-100 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
                      {resultsTujuan.map(r => (
                        <button
                          key={r.id}
                          onClick={() => selectTujuan(r)}
                          className="w-full text-left px-6 py-4 hover:bg-zinc-50 flex justify-between items-center border-b border-zinc-50 last:border-0 transition-all"
                        >
                          <div>
                            <div className="font-black text-sm">C.{r.nomor_c}</div>
                            <div className="text-[10px] text-zinc-400 uppercase font-bold">{r.nama_pemilik}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className={`space-y-3 transition-all duration-500 ${isNewOwner || form.c_tujuan ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
                  {isNewOwner && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-2 text-amber-700 font-bold text-[10px] uppercase">
                      <UserPlus size={14}/> Kohir Baru Akan Dibuat
                    </div>
                  )}
                  <input
                    className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-zinc-200"
                    placeholder="Nama Lengkap Pihak Kedua"
                    value={form.nama_pihak_tujuan}
                    onChange={e => setForm({...form, nama_pihak_tujuan: e.target.value})}
                    disabled={previewMode || !selectedPersil}
                  />
                  <input
                    className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-zinc-200"
                    placeholder="Alamat Pihak Kedua"
                    value={form.alamat_pihak_tujuan}
                    onChange={e => setForm({...form, alamat_pihak_tujuan: e.target.value})}
                    disabled={previewMode || !selectedPersil}
                  />
                </div>
              </div>

              {/* DETAIL TANAH */}
              <div className="space-y-4 pt-6 border-t border-zinc-100">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block ml-1">Detail Mutasi</label>
                <select
                  className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-zinc-200"
                  value={form.jenis_mutasi}
                  onChange={e => setForm({...form, jenis_mutasi: e.target.value})}
                  disabled={previewMode || !selectedPersil}
                >
                  <option>Jual Beli</option>
                  <option>Hibah</option>
                  <option>Waris</option>
                  <option>Tukar Menukar</option>
                </select>
                <div className="relative">
                  <input
                    type="number"
                    className={`w-full px-6 py-5 bg-gradient-to-r from-zinc-900 to-zinc-800 text-white rounded-2xl font-black text-2xl placeholder:text-zinc-400 outline-none ${
                      showWarning ? 'ring-2 ring-red-500' : ''
                    }`}
                    placeholder="Luas Dimutasi (m²)"
                    value={form.luas_mutasi}
                    onChange={e => setForm({...form, luas_mutasi: e.target.value})}
                    disabled={previewMode || !selectedPersil}
                  />
                  {showWarning && (
                    <div className="absolute -bottom-6 left-1 flex items-center gap-2 text-red-500 text-[10px] font-black uppercase">
                      <AlertTriangle size={12}/> Melebihi stok persil yang tersedia!
                    </div>
                  )}
                  {!showWarning && selectedPersil && (
                    <div className="absolute -bottom-6 left-1 flex items-center gap-2 text-green-500 text-[10px] font-black uppercase">
                      <CheckCircle2 size={12}/> Stok mencukupi
                    </div>
                  )}
                </div>
              </div>

              {/* DATA PENDUKUNG */}
              <div className="space-y-4 pt-6 border-t border-zinc-100">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block ml-1">Data Pendukung</label>
                <input
                  type="date"
                  className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-zinc-200"
                  value={form.tanggal_mutasi}
                  onChange={e => setForm({...form, tanggal_mutasi: e.target.value})}
                  disabled={previewMode}
                />
                <textarea
                  className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm focus:ring-2 focus:ring-zinc-200 resize-none"
                  placeholder="Catatan tambahan..."
                  rows={2}
                  value={form.keterangan}
                  onChange={e => setForm({...form, keterangan: e.target.value})}
                  disabled={previewMode}
                />
              </div>
            </div>

            {/* RIGHT COLUMN - PREVIEW & VALIDATION */}
            <div className="space-y-8">
              {/* Preview Card */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                <h4 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Eye size={16}/> Preview Mutasi
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="opacity-80">Dari:</span>
                    <span className="font-bold">{form.nama_pihak_asal || 'Belum dipilih'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-80">Kohir Asal:</span>
                    <span className="font-bold">C.{form.c_asal || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-80">Persil:</span>
                    <span className="font-bold">P.{form.persil || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-80">Ke:</span>
                    <span className="font-bold">{form.nama_pihak_tujuan || 'Belum diisi'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-80">Kohir Tujuan:</span>
                    <span className="font-bold">C.{form.c_tujuan || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-80">Jenis Tanah:</span>
                    <span className="font-bold">{form.jenis_tanah || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-80">Klasifikasi:</span>
                    <span className="font-bold">{form.klas_desa || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-80">Jenis Mutasi:</span>
                    <span className="font-bold">{form.jenis_mutasi}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-80">Luas Mutasi:</span>
                    <span className="font-black text-2xl">
                      {form.luas_mutasi ? `${parseFloat(form.luas_mutasi).toLocaleString('id-ID')} m²` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-80">Tanggal:</span>
                    <span className="font-bold">
                      {form.tanggal_mutasi ? new Date(form.tanggal_mutasi).toLocaleDateString('id-ID') : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Validation Card */}
              <div className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
                  <AlertCircle size={14}/> Validasi Form
                </h4>
                <div className="space-y-2">
                  {errors.map((error, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-red-500 text-sm">
                      <X size={14} className="mt-0.5 flex-shrink-0"/>
                      <span>{error}</span>
                    </div>
                  ))}
                  {isValid && errors.length === 0 && (
                    <div className="flex items-center gap-2 text-green-500 text-sm">
                      <CheckCircle2 size={14}/> Semua data valid dan siap disimpan
                    </div>
                  )}
                </div>
              </div>

              {/* Preview Mode Confirmation */}
              {previewMode && (
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
                  <h4 className="text-sm font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                    <CheckCircle2 size={18}/> Konfirmasi Validasi
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16}/> Kohir asal valid
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16}/> Persil terpilih: P.{form.persil}
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16}/> Stok persil mencukupi
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16}/> Data tujuan siap diproses
                    </div>
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/20">
                      <span className="font-black text-lg">Total Luas Setelah Mutasi:</span>
                    </div>
                    <div className="pl-8 space-y-1">
                      <div className="flex justify-between">
                        <span>Persil Asal:</span>
                        <span className="font-bold">{(selectedPersil?.luas_meter || 0 - (luasDimutasi || 0)).toLocaleString('id-ID')} m²</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Identitas Tanah:</span>
                        <span className="font-bold">{form.jenis_tanah} ({form.klas_desa})</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Keterangan Tambahan */}
              {form.keterangan && (
                <div className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">Keterangan Tambahan</h4>
                  <p className="text-sm text-zinc-600 whitespace-pre-wrap">{form.keterangan}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 bg-gradient-to-r from-zinc-50 to-zinc-100 border-t flex justify-between items-center gap-4">
          <div className="flex items-center gap-3 text-[10px] text-zinc-400">
            <AlertTriangle size={14}/>
            <span>Setelah disimpan, data Letter C & Persil akan otomatis terupdate</span>
          </div>
          <div className="flex gap-4">
            {previewMode ? (
              <>
                <button
                  onClick={() => setPreviewMode(false)}
                  className="px-8 py-4 text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors flex items-center gap-2 border border-zinc-200 rounded-2xl hover:border-zinc-300"
                >
                  <Eye size={16}/> Edit Kembali
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading || !isValid}
                  className="px-12 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl flex items-center gap-3 hover:from-green-600 hover:to-green-700 disabled:opacity-30 active:scale-95 transition-all"
                >
                  {loading ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
                  {loading ? 'Menyimpan...' : 'Konfirmasi & Simpan'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-8 py-4 text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors border border-zinc-200 rounded-2xl hover:border-zinc-300"
                >
                  Batal
                </button>
                <button
                  onClick={handlePreview}
                  disabled={loading || !isValid || !selectedPersil}
                  className="px-12 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl flex items-center gap-3 hover:from-blue-600 hover:to-blue-700 disabled:opacity-30 active:scale-95 transition-all"
                >
                  <Eye size={16}/> Preview & Validasi
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};