import React, { useState, useEffect } from 'react';
import { supabase } from '../services/db';
import { FileRecord, Relation, Identity, LandData, RelationRole, HubunganPersetujuan, Persetujuan } from '../types';
import { Button, Input, Card, DateInput } from '../components/UI';
import LandMap from '../components/LandMap';
import {
  Plus, Trash2, Search, FileText, Edit2, Calendar, Save, X, Clock,
  ShieldAlert, MapPin, CheckCircle, ChevronDown, ChevronUp, AlertCircle, 
  Info, HeartHandshake, Users
} from 'lucide-react';
import { formatDateIndo, formatNOP, getDayNameIndo, toTitleCase,  generateUUID, spellDateIndo, formatDateStrip, terbilang  } from '../utils';

export const FilesPage: React.FC = () => {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [activeFile, setActiveFile] = useState<FileRecord | null>(null);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [allIdentities, setAllIdentities] = useState<Identity[]>([]);
  const [allLands, setAllLands] = useState<LandData[]>([]);
  
  const [fileSearch, setFileSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchWP, setSearchWP] = useState('');
  const [searchLand, setSearchLand] = useState('');
  const [searchPersetujuan, setSearchPersetujuan] = useState('');
  
  
  // STATE UNTUK PETA
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{lat: number, lng: number}>({
    lat: -7.6448,
    lng: 112.9061
  });
  const [hasSelectedLocation, setHasSelectedLocation] = useState(false);
  
  // STATE BARU: TANAH DI LEVEL DOKUMEN
  const [selectedLandIds, setSelectedLandIds] = useState<string[]>([]);
  const [isDocumentLocked, setIsDocumentLocked] = useState(false);
  const [showRelations, setShowRelations] = useState(true);
  const [persetujuans, setPersetujuans] = useState<Persetujuan[]>([]);
  const [showModalTambahPersetujuan, setShowModalTambahPersetujuan] = useState(false);
  const [selectedIdentitasId, setSelectedIdentitasId] = useState<string>('');
  const [identitasList, setIdentitasList] = useState<any[]>([]); 
  const [selectedHubungan, setSelectedHubungan] = useState<HubunganPersetujuan>('ISTRI');
  // STATE UNTUK FORM PERSETUJUAN
  const [newPersetujuan, setNewPersetujuan] = useState({
    identityId: '',
    pihak1Id: '',
    hubungan: 'ISTRI' as HubunganPersetujuan,
    keterangan: ''
  });

  const initialFileState: Partial<FileRecord> = { 
    tanggal: new Date().toISOString().split('T')[0],
    hari: getDayNameIndo(new Date().toISOString().split('T')[0]),
    menurut_keterangan: 'STANDAR',
    nomor_berkas: '',
    nomor_register: '',
    tanggal_register: '',
    keterangan: '',
    jenis_perolehan: '',
    tahun_perolehan: '',
    nama_almarhum: '',
    register_waris_desa: '',
    register_waris_kecamatan: '',
    tanggal_waris: '',
    ejaan_tanggal_waris: '',
    keterangan_persetujuan: '',
    alamat_persetujuan: '',
    cakupan_tanah: 'sebidang tanah',
    pihak_penanggung: '',
    jumlah_saksi: '',
    kategori: 'PPAT_NOTARIS'
  };

  const [formFile, setFormFile] = useState<Partial<FileRecord>>(initialFileState);
  const [newRel, setNewRel] = useState({ identityId: '', role: 'PIHAK_1' as RelationRole });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [filesRes, identitiesRes, landsRes] = await Promise.all([
        supabase.from('files').select('*').eq('kategori', 'PPAT_NOTARIS').order('created_at', { ascending: false }),
        supabase.from('identities').select('*'),
        supabase.from('lands').select('*')
      ]);
      
      if (filesRes.error) throw filesRes.error;
      if (identitiesRes.error) throw identitiesRes.error;
      if (landsRes.error) throw landsRes.error;
      
      setFiles(filesRes.data as FileRecord[]);
      setAllIdentities(identitiesRes.data as Identity[]);
      setAllLands(landsRes.data as LandData[]);
    } catch (err) {
      console.error("Gagal sinkron:", err);
      setFiles([]);
      setAllIdentities([]);
      setAllLands([]);
    } finally {
      setIsLoading(false);
    }
  };
  

  const handleSelect = async (f: FileRecord) => {
    setActiveFile(f);
    try {
      const relationsRes = await supabase
        .from('relations')
        .select('*')
        .eq('berkas_id', f.id)
        .order('created_at', { ascending: true });
      
      if (relationsRes.error) throw relationsRes.error;
      
      const persetujuansRes = await supabase
        .from('persetujuans')
        .select('*')
        .eq('berkas_id', f.id)
        .order('created_at', { ascending: true });
      
      if (persetujuansRes.error) throw persetujuansRes.error;
      
      const fileRelations = relationsRes.data as Relation[];
      const filePersetujuans = persetujuansRes.data as Persetujuan[];
      
      setRelations(fileRelations);
      setPersetujuans(filePersetujuans);
      
      // Load tanah yang terhubung dengan berkas ini
      const landIds = fileRelations
        .filter((r: Relation) => r.data_tanah_id)
        .map((r: Relation) => r.data_tanah_id!) || [];
      setSelectedLandIds([...new Set(landIds)]);
      
      // Set koordinat dari tanah pertama (jika ada)
      const firstLandRel = fileRelations.find((r: Relation) => r.data_tanah_id);
      if (firstLandRel) {
        const landData = allLands.find(l => l.id === firstLandRel.data_tanah_id);
        if (landData && landData.latitude) {
          setSelectedCoords({ lat: landData.latitude, lng: landData.longitude });
          setHasSelectedLocation(true);
        }
      }
    } catch (err) {
      console.error("Gagal load data berkas:", err);
      setRelations([]);
      setPersetujuans([]);
      setSelectedLandIds([]);
    }
    setNewRel({ identityId: '', role: 'PIHAK_1' });
    setNewPersetujuan({ identityId: '', pihak1Id: '', hubungan: 'ISTRI', keterangan: '' });
    setIsDocumentLocked(relations.length > 0);
  };

  const handleSaveFile = async () => {
    if (!formFile.nomor_berkas?.trim() || !formFile.jenis_perolehan?.trim()) {
      return alert('Nomor Berkas dan Jenis Perolehan wajib diisi!');
    }

    if (!hasSelectedLocation) {
      return alert('Silahkan tentukan lokasi objek tanah pada peta terlebih dahulu!');
    }
    
    try {
      const fileId = editingId || generateUUID();
      
      const payload: FileRecord = {
        ...initialFileState,
        ...formFile,
        id: fileId,
        kategori: 'PPAT_NOTARIS',
        nomor_berkas: formFile.nomor_berkas!.toUpperCase(),
        nomor_register: formFile.nomor_register?.toUpperCase() || '',
        tanggal_register: formFile.tanggal_register,
        keterangan_persetujuan: formFile.keterangan_persetujuan?.toUpperCase() || '',
        cakupan_tanah: formFile.cakupan_tanah,
        pihak_penanggung: formFile.pihak_penanggung?.toUpperCase()|| '',
        jumlah_saksi: formFile.jumlah_saksi?.toUpperCase() || '',
        latitude: selectedCoords.lat,
        longitude: selectedCoords.lng,
        tanggal: formFile.tanggal,
        tanggal_waris: formFile.tanggal_waris,
        hari: formFile.hari || getDayNameIndo(formFile.tanggal || ''),
        jenis_perolehan: formFile.jenis_perolehan!.toUpperCase(),
        created_at: formFile.created_at || new Date().toISOString(),
        ejaan_tanggal_waris: formFile.tanggal_waris ? spellDateIndo(formFile.tanggal_waris) : ""
      } as FileRecord;

      if (editingId) {
        const { error } = await supabase.from('files').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('files').insert([payload]);
        if (error) throw error;
      }

      setIsCreating(false);
      setEditingId(null);
      setFormFile(initialFileState);
      setHasSelectedLocation(false);
      setSelectedLandIds([]);
      await refreshData();
      setActiveFile(payload);
      alert("Berkas berhasil disimpan!");

    } catch (err: any) {
      console.error(err);
      alert("Gagal menyimpan data: " + (err.message || "Terjadi kesalahan"));
    }
  };

  const handleEditFile = (e: React.MouseEvent, f: FileRecord) => {
    e.stopPropagation();
    setFormFile(f);
    setEditingId(f.id);
    setIsCreating(true);
  };

  const handleDeleteFile = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Hapus berkas ini secara permanen?')) {
      const { error } = await supabase.from('files').delete().eq('id', id);
      if (error) {
        console.error(error);
        alert('Gagal menghapus berkas');
        return;
      }
      if (activeFile?.id === id) setActiveFile(null);
      await refreshData();
    }
  };

    const handleAddRel = async () => {
    if (!activeFile || !newRel.identityId || selectedLandIds.length === 0) return;

    try {
      const newRelations = selectedLandIds.map(landId => ({
        id: generateUUID(),
        berkas_id: activeFile.id,
        identitas_id: newRel.identityId,
        peran: newRel.role,
        data_tanah_id: landId,
        created_at: new Date().toISOString()
      }));

      for (const rel of newRelations) {
        const { error } = await supabase.from('relations').insert([rel]);
        if (error) throw error;
      }

      // PERBAIKAN DI SINI:
      // Gunakan { data: namaVariabel } untuk memberikan alias pada 'data'
      const { data: updatedRels, error: relsError } = await supabase
        .from('relations')
        .select('*')
        .eq('berkas_id', activeFile.id);
      
      if (relsError) throw relsError;
      
      // Pastikan data tidak null sebelum di-set
      setRelations((updatedRels || []) as Relation[]);
      setNewRel({ identityId: '', role: 'PIHAK_1' });
      setIsDocumentLocked(true);

    } catch (err: any) {
      console.error("Gagal menambah relasi:", err);
      alert("Gagal menambah relasi: " + (err.message || "Terjadi kesalahan"));
    }
  };

  const deleteRel = async (id: string) => {
    if (!confirm('Hapus relasi ini?')) return;
    
    try {
      const { error } = await supabase.from('relations').delete().eq('id', id);
      if (error) throw error;
      
      if (activeFile) {
        // PERBAIKAN: Tambahkan kata kunci 'data:' sebelum 'updatedRels'
        const { data: updatedRels, error: relsError } = await supabase
          .from('relations')
          .select('*')
          .eq('berkas_id', activeFile.id);
        
        if (relsError) throw relsError;
        
        // Gunakan updatedRels || [] untuk menghindari error jika data null
        const finalRels = (updatedRels || []) as Relation[];
        setRelations(finalRels);
        
        if (finalRels.length === 0) {
          setIsDocumentLocked(false);
        }
      }
    } catch (err) {
      console.error("Gagal menghapus relasi:", err);
      alert("Gagal menghapus relasi");
    }
  };

  // ✅ Fungsi untuk cek apakah sudah ada PIHAK_1
  const getPihak1List = (): Relation[] => {
    return relations.filter(r => r.peran === 'PIHAK_1');
  };

  // ✅ Cek apakah sudah bisa tambah persetujuan (minimal 1 PIHAK_1)
  const canAddPersetujuan = (): boolean => {
    return getPihak1List().length > 0;
  };

  // ✅ Fungsi untuk menambah persetujuan
 const handleAddPersetujuan = async () => {
    if (!activeFile || !newPersetujuan.identityId || !newPersetujuan.pihak1Id) {
      alert('Pilih PIHAK_1 dan Subjek Persetujuan terlebih dahulu!');
      return;
    }

    try {
      const persetujuan: Persetujuan = {
        id: generateUUID(),
        berkas_id: activeFile.id,
        identitas_id: newPersetujuan.identityId,
        pihak_1_id: newPersetujuan.pihak1Id,
        hubungan: newPersetujuan.hubungan,
        keterangan: newPersetujuan.keterangan || undefined,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('persetujuans').insert([persetujuan]);
      if (error) throw error;
      
      // PERBAIKAN DI SINI:
      // Tambahkan 'data:' sebelum 'updatedPersetujuans'
      const { data: updatedPersetujuans, error: persetError } = await supabase
        .from('persetujuans')
        .select('*')
        .eq('berkas_id', activeFile.id);
      
      if (persetError) throw persetError;
      
      // Gunakan updatedPersetujuans || [] agar lebih aman
      setPersetujuans((updatedPersetujuans || []) as Persetujuan[]);
      
      // Reset form
      setNewPersetujuan({ identityId: '', pihak1Id: '', hubungan: 'ISTRI', keterangan: '' });
      setSearchPersetujuan('');
      
      alert("Persetujuan berhasil ditambahkan!");

    } catch (err: any) {
      console.error("Gagal menambah persetujuan:", err);
      alert("Gagal menambah persetujuan: " + (err.message || "Terjadi kesalahan"));
    }
  };

  // ✅ Fungsi untuk hapus persetujuan
  const deletePersetujuan = async (id: string) => {
    if (!confirm('Hapus persetujuan ini?')) return;
    
    try {
      const { error } = await supabase.from('persetujuans').delete().eq('id', id);
      if (error) throw error;
      
      if (activeFile) {
        // PERBAIKAN: Gunakan destructuring alias { data: namaVariabel }
        const { data: updatedPersetujuans, error: persetError } = await supabase
          .from('persetujuans')
          .select('*')
          .eq('berkas_id', activeFile.id);
        
        if (persetError) throw persetError;
        
        // Gunakan (data || []) untuk keamanan tipe data
        setPersetujuans((updatedPersetujuans || []) as Persetujuan[]);
      }
    } catch (err) {
      console.error("Gagal menghapus persetujuan:", err);
      alert("Gagal menghapus persetujuan");
    }
  };

  // ✅ Helper untuk mendapatkan label hubungan
  const getHubunganLabel = (hubungan: HubunganPersetujuan): string => {
    const labels: Record<HubunganPersetujuan, string> = {
      'ISTRI': 'Istri',
      'SUAMI': 'Suami',
      'ANAK': 'Anak',
      'ORANG_TUA': 'Orang Tua',
      'SAUDARA': 'Saudara',
      'WALI': 'Wali',
      'LAINNYA': 'Lainnya'
    };
    return labels[hubungan];
  };

  const filteredFiles = files.filter(f => {
    const isKategoriCocok = f.kategori === 'PPAT_NOTARIS' || !f.kategori;
    const isSearchCocok = f.nomor_berkas.toLowerCase().includes(fileSearch.toLowerCase()) || 
                         f.jenis_perolehan.toLowerCase().includes(fileSearch.toLowerCase());
    return isKategoriCocok && isSearchCocok; 
  });
  // Helper: Get unique tanah dari relasi
  const getUniqueLandsFromRelations = () => {
    const landIds = relations.map(r => r.data_tanah_id).filter(Boolean) as string[];
    return [...new Set(landIds)];
  };

  const susunIdentitasPersetujuan = (dataPersetujuan: Persetujuan, dataIdentitas: any) => {
  const { nama, tempat_lahir, tanggal_lahir, pekerjaan, alamat, nik } = dataIdentitas;
  const { hubungan } = dataPersetujuan;

  // 1. Format Tanggal & Pekerjaan
  const tglIndo = formatDateIndo(tanggal_lahir);
  const ejaanTgl = spellDateIndo(tanggal_lahir);
  
  // 2. LOGIC ALAMAT (Ini Intinya!)
  let frasaAlamat = "";
  if (hubungan === 'ISTRI' || hubungan === 'SUAMI') {
    // Jika Pasangan, pakai kalimat baku "Sama dengan suaminya/istrinya"
    const kaitan = hubungan === 'ISTRI' ? 'suaminya' : 'istrinya';
    frasaAlamat = `bertempat tinggal sama dengan ${kaitan} tersebut diatas`;
  } else {
    // Jika Anak, Orang Tua, dll, panggil alamat lengkapnya
    frasaAlamat = `bertempat tinggal di ${alamat}`;
  }

  // 3. Gabungkan jadi satu Paragraf Akta
  return `--${nama.toUpperCase()}, Warga Negara Indonesia, lahir di ${toTitleCase(tempat_lahir)}, pada tanggal ${tglIndo} (${ejaanTgl}), ${toTitleCase(pekerjaan)}, ${frasaAlamat}, pemegang Kartu Tanda Penduduk NIK : ${nik}.`;
}
 
  return (
    <div className="h-[calc(100vh-2rem)] flex gap-6 overflow-hidden bg-slate-50">
      {/* SIDEBAR - BERKAS LIST */}
      <div className="w-1/3 flex flex-col gap-4 border-r border-slate-200 pr-4 pl-1 overflow-y-auto custom-scrollbar">
        {/* Header Sidebar */}
        <div className="flex justify-between items-center sticky top-0 bg-white py-4 z-10 border-b border-slate-200 mb-2 px-1">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-800">
              Manajemen Berkas
            </h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
              PPAT Administration
            </p>
          </div>
          <Button 
            onClick={() => { 
              setIsCreating(true); 
              setEditingId(null); 
              setFormFile(initialFileState); 
              setHasSelectedLocation(false);
              setSelectedLandIds([]);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus size={18} />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative px-1">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Search size={16} />
          </div>
          <input 
            placeholder="Cari No. Berkas / Perolehan..." 
            className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-md text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white" 
            value={fileSearch} 
            onChange={e => setFileSearch(e.target.value)} 
          />
        </div>

        {/* List Berkas */}
        <div className="space-y-3 mt-2 px-1 pb-10">
          {isLoading ? (
            <div className="text-center p-10 flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Loading...</span>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center p-8 text-slate-400 text-sm font-bold">
              Tidak ada berkas ditemukan
            </div>
          ) : (
            filteredFiles.map(f => (
              <div 
                key={f.id} 
                onClick={() => handleSelect(f)} 
                className={`group relative p-4 border cursor-pointer transition-all ${
                  activeFile?.id === f.id 
                    ? 'border-blue-600 bg-blue-50' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Active indicator */}
                {activeFile?.id === f.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"></div>
                )}

                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-2">
                    <div className="font-bold text-slate-800 text-sm break-words line-clamp-2">
                      {f.nomor_berkas}
                    </div>
                    <div className="text-[10px] uppercase font-bold text-blue-700 mt-1">
                      {f.jenis_perolehan}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1.5">
                      <Calendar size={12} className="text-slate-400" /> 
                      {formatDateIndo(f.tanggal)}
                    </div>
                  </div>
                  
                  {/* Action buttons - fade in on hover */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => handleEditFile(e, f)} 
                      className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                      title="Edit"
                    >
                      <Edit2 size={14}/>
                    </button>
                    <button 
                      onClick={(e) => handleDeleteFile(e, f.id)} 
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Hapus"
                    >
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MAIN CONTENT - DETAIL BERKAS & RELASI */}
      <div className="w-2/3 overflow-y-auto pr-2 custom-scrollbar">
        {activeFile ? (
          <div className="space-y-6">
            {/* Header Berkas */}
            <div className="bg-blue-600 p-5 border text-white">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <FileText size={28} />
                  <h3 className="text-2xl font-bold">
                    {activeFile.jenis_perolehan}
                  </h3>
                </div>
                <p className="text-blue-100 font-bold text-sm">
                  Nomor Berkas: {activeFile.nomor_berkas}
                  {activeFile.nomor_register && ` / Reg: ${activeFile.nomor_register}`}
                </p>
              </div>
            </div>

            {/* Tanggal Berkas Card */}
            <div className="bg-white p-5 border rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded">
                    <Calendar size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      Hari & Tanggal Berkas
                    </span>
                    <div className="text-base font-bold text-slate-800 mt-1">
                      {activeFile.hari}, <span className="text-blue-600">{formatDateIndo(activeFile.tanggal)}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowRelations(!showRelations)}
                  className="flex items-center gap-2 text-slate-600 hover:text-blue-600"
                >
                  {showRelations ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  <span className="text-sm font-bold">Struktur Relasi</span>
                </button>
              </div>
            </div>

            {/* Info Waris (jika ada) */}
            {activeFile.jenis_perolehan.toUpperCase().includes('WARIS') && (
              <div className="p-5 bg-amber-50 border border-amber-200 rounded-md">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 rounded text-amber-700">
                    <Clock size={20} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                    <div>
                      <span className="text-[10px] font-bold text-amber-700 uppercase">Reg. Waris Desa</span>
                      <p className="text-sm font-bold text-amber-900 mt-1">{activeFile.register_waris_desa || '-'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-amber-700 uppercase">Reg. Waris Kec.</span>
                      <p className="text-sm font-bold text-amber-900 mt-1">{activeFile.register_waris_kecamatan || '-'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-amber-700 uppercase">Tertanggal Waris</span>
                      <p className="text-sm font-bold text-amber-900 mt-1">{activeFile.tanggal_waris ? formatDateIndo(activeFile.tanggal_waris) : '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STRUKTUR RELASI CARD - DENGAN TANAH DI LEVEL DOKUMEN */}
            {showRelations && (
              <Card title="Penyusunan Struktur Relasi Pihak">
                <div className="space-y-5">
                  {/* === PILIH TANAH UNTUK DOKUMEN INI (HANYA SEKALI) === */}
                  <div className="bg-slate-50 p-5 border rounded-md">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                          {selectedLandIds.length > 0 ? 'Objek Tanah dalam Berkas Ini' : 'Pilih Objek Tanah'}
                        </label>
                        <p className="text-[10px] text-slate-500">
                          {isDocumentLocked 
                            ? 'Tanah sudah terkunci untuk berkas ini' 
                            : 'Pilih minimal 1 objek tanah'}
                        </p>
                      </div>
                      {selectedLandIds.length > 0 && !isDocumentLocked && (
                        <button
                          onClick={() => setIsDocumentLocked(true)}
                          className="text-[10px] font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded hover:bg-amber-200 flex items-center gap-1"
                        >
                          <LockIcon size={12} />
                          KUNCI TANAH
                        </button>
                      )}
                    </div>

                    {/* Search Tanah */}
                    {!isDocumentLocked && (
                      <div className="relative mb-4">
                        <input 
                          type="text"
                          placeholder="Cari NOP atau nama pemilik tanah..."
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-md bg-white text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                          value={searchLand}
                          onChange={(e) => {
                            const val = e.target.value;
                            const isNumber = /^\d/.test(val.replace(/[.\-]/g, ''));
                            if (isNumber) {
                              setSearchLand(formatNOP(val));
                            } else {
                              setSearchLand(val);
                            }
                          }}
                        />
                        {searchLand && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {allLands
                              .filter(l => 
                                l.nop?.includes(searchLand) || 
                                l.atas_nama_nop?.toLowerCase().includes(searchLand.toLowerCase())
                              )
                              .map(l => (
                                <div 
                                  key={l.id}
                                  className={`p-2.5 cursor-pointer border-b border-slate-100 last:border-none ${
                                    selectedLandIds.includes(l.id) ? 'bg-green-50' : 'hover:bg-blue-50'
                                  }`}
                                  onClick={() => {
                                    if (!selectedLandIds.includes(l.id)) {
                                      setSelectedLandIds([...selectedLandIds, l.id]);
                                    }
                                    setSearchLand('');
                                  }}
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="text-[11px] font-bold text-slate-800">{l.nop || 'NO NOP'}</p>
                                      <p className="text-[10px] text-slate-500">{l.atas_nama_nop} • {l.desa}</p>
                                    </div>
                                    {selectedLandIds.includes(l.id) && (
                                      <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Badges Tanah yang Sudah Dipilih */}
                    {selectedLandIds.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {selectedLandIds.map(id => {
                            const land = allLands.find(l => l.id === id);
                            return (
                              <div 
                                key={id} 
                                className="flex items-center gap-2 bg-blue-50 text-blue-800 px-3 py-1.5 rounded border border-blue-200 text-[10px] font-bold"
                              >
                                <span>{land?.nop || 'NO NOP'}</span>
                                {!isDocumentLocked && (
                                  <button 
                                    onClick={() => setSelectedLandIds(prev => prev.filter(lid => lid !== id))}
                                    className="text-red-600 hover:bg-red-100 rounded -mr-1 p-0.5"
                                  >
                                    <X size={12} />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Info Jumlah Tanah */}
                        <div className="mt-2 p-3 bg-slate-100 rounded border border-dashed border-slate-300">
                          <p className="text-[10px] text-slate-600 font-bold">
                            <Info size={14} className="inline mr-1" />
                            {selectedLandIds.length} objek tanah akan terhubung dengan semua pihak yang ditambahkan
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Warning jika belum ada tanah */}
                    {selectedLandIds.length === 0 && !isDocumentLocked && (
                      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded">
                        <div className="flex items-start gap-2.5">
                          <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[11px] font-bold text-amber-800">
                              Pilih minimal 1 objek tanah terlebih dahulu
                            </p>
                            <p className="text-[10px] text-amber-700 mt-1">
                              Dalam 1 berkas, semua pihak akan terhubung dengan seluruh tanah yang dipilih di atas
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* === FORM TAMBAH PIHAK (HANYA TAMPIL JIKA ADA TANAH) === */}
                  {selectedLandIds.length > 0 && (
                    <div className="bg-white p-5 border rounded-md">
                      <div className="grid grid-cols-2 gap-4 mb-5">
                        {/* SEARCH WAJIB PAJAK / SUBJEK */}
                        <div className="col-span-1 relative">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                            Cari Subjek (Nama/NIK)
                          </label>
                          <div className="relative">
                            <input 
                              type="text"
                              placeholder="Ketik Nama/NIK..."
                              className="w-full px-4 py-2.5 border border-slate-300 rounded-md bg-white text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                              value={searchWP}
                              onChange={(e) => setSearchWP(e.target.value)}
                            />
                            {searchWP && !newRel.identityId && (
                              <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                {allIdentities
                                  .filter(i => 
                                    i.nama.toLowerCase().includes(searchWP.toLowerCase()) || 
                                    i.nik.includes(searchWP)
                                  )
                                  .map(i => (
                                    <div 
                                      key={i.id}
                                      className="p-2.5 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-none"
                                      onClick={() => {
                                        setNewRel({...newRel, identityId: i.id});
                                        setSearchWP(i.nama.toUpperCase());
                                      }}
                                    >
                                      <p className="text-[11px] font-bold text-slate-800">{i.nama.toUpperCase()}</p>
                                      <p className="text-[10px] text-slate-500 font-mono">{i.nik}</p>
                                    </div>
                                  ))}
                              </div>
                            )}
                            {newRel.identityId && (
                              <button 
                                onClick={() => {setNewRel({...newRel, identityId: ''}); setSearchWP('');}}
                                className="absolute right-3 top-2.5 text-red-600 hover:bg-red-50 rounded p-0.5"
                              >
                                <X size={14}/>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* PILIH PERAN */}
                        <div className="col-span-1">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                            Peran
                          </label>
                          <select 
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-md bg-white text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none h-[42px]" 
                            value={newRel.role} 
                            onChange={e => setNewRel({...newRel, role: e.target.value as RelationRole})}
                          >
                            <option value="PIHAK_1">PIHAK 1</option>
                            <option value="PIHAK_2">PIHAK 2</option>
                            <option value="SAKSI">SAKSI</option>
                          </select>
                        </div>
                      </div>

                      <Button 
                        className="w-full h-11 font-bold bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => {
                          handleAddRel();
                          setSearchWP('');
                        }}
                        disabled={!newRel.identityId || !newRel.role}
                      >
                        TAMBAHKAN PIHAK
                        {selectedLandIds.length > 1 && ` (terhubung ke ${selectedLandIds.length} tanah)`}
                      </Button>
                    </div>
                  )}

                  {/* ✅ SECTION KHUSUS: TAMBAH PERSETUJUAN (Muncul setelah ada PIHAK_1) */}
                  {canAddPersetujuan() && (
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <HeartHandshake size={18} className="text-amber-600" />
                        <h4 className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">
                          Tambah Persetujuan untuk PIHAK 1
                        </h4>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        {/* Pilih PIHAK_1 yang akan disetujui */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                            Pilih PIHAK 1
                          </label>
                          <select 
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-md bg-white text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none h-[42px]" 
                            value={newPersetujuan.pihak1Id} 
                            onChange={e => setNewPersetujuan({...newPersetujuan, pihak1Id: e.target.value})}
                          >
                            <option value="">-- Pilih PIHAK 1 --</option>
                            {getPihak1List().map(p1 => {
                              const identity = allIdentities.find(i => i.id === p1.identitas_id);
                              return (
                                <option key={p1.id} value={p1.id}>
                                  {identity?.nama} (NIK: {identity?.nik})
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        {/* Pilih Subjek untuk Persetujuan */}
                        <div className="relative">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                            Cari Subjek Persetujuan (NIK/Nama)
                          </label>
                          <input 
                            type="text"
                            placeholder="Ketik Nama/NIK..."
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-md bg-white text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                            value={searchPersetujuan}
                            onChange={(e) => setSearchPersetujuan(e.target.value)}
                            disabled={!newPersetujuan.pihak1Id}
                          />
                          {searchPersetujuan && newPersetujuan.pihak1Id && !newPersetujuan.identityId && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                              {allIdentities
                                .filter(i => 
                                  i.nama.toLowerCase().includes(searchPersetujuan.toLowerCase()) || 
                                  i.nik.includes(searchPersetujuan)
                                )
                                .map(i => (
                                  <div 
                                    key={i.id}
                                    className="p-2.5 hover:bg-amber-50 cursor-pointer border-b border-slate-100 last:border-none"
                                    onClick={() => {
                                      setNewPersetujuan({...newPersetujuan, identityId: i.id});
                                      setSearchPersetujuan(i.nama.toUpperCase());
                                    }}
                                  >
                                    <p className="text-[11px] font-bold text-slate-800">{i.nama.toUpperCase()}</p>
                                    <p className="text-[10px] text-slate-500 font-mono">{i.nik}</p>
                                  </div>
                                ))}
                            </div>
                          )}
                          {newPersetujuan.identityId && (
                            <button 
                              onClick={() => {
                                setNewPersetujuan({...newPersetujuan, identityId: ''});
                                setSearchPersetujuan('');
                              }}
                              className="absolute right-3 top-2.5 text-red-600 hover:bg-red-50 rounded p-0.5"
                            >
                              <X size={14}/>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                            Hubungan dengan PIHAK 1
                          </label>
                          <select 
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-md bg-white text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none h-[42px]" 
                            value={newPersetujuan.hubungan} 
                            onChange={e => setNewPersetujuan({...newPersetujuan, hubungan: e.target.value as HubunganPersetujuan})}
                            disabled={!newPersetujuan.identityId}
                          >
                            <option value="ISTRI">Istri</option>
                            <option value="SUAMI">Suami</option>
                            <option value="ANAK">Anak</option>
                            <option value="ORANG_TUA">Orang Tua</option>
                            <option value="SAUDARA">Saudara</option>
                            <option value="WALI">Wali</option>
                            <option value="LAINNYA">Lainnya</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                            Keterangan (Opsional)
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: sebagai istri sah..."
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-md bg-white text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                            value={newPersetujuan.keterangan}
                            onChange={e => setNewPersetujuan({...newPersetujuan, keterangan: e.target.value})}
                            disabled={!newPersetujuan.identityId}
                          />
                        </div>
                      </div>

                      <Button 
                        className="w-full h-11 font-bold bg-amber-600 hover:bg-amber-700 text-white mt-4"
                        onClick={handleAddPersetujuan}
                        disabled={!newPersetujuan.identityId || !newPersetujuan.pihak1Id}
                      >
                        TAMBAHKAN PERSETUJUAN
                      </Button>
                    </div>
                  )}

                  {/* === DAFTAR PIHAK YANG SUDAH DITAMBAHKAN === */}
                  {(relations.length > 0 || persetujuans.length > 0) && (
                    <div className="mt-6 pt-5 border-t border-slate-200">
                      {/* Daftar Pihak Biasa (PIHAK_1, PIHAK_2, SAKSI) */}
                      {relations.length > 0 && (
                        <>
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[10px] font-bold text-slate-600 uppercase">
                                Pihak yang Terhubung
                              </span>
                              <span className="text-[10px] font-bold text-blue-600">
                                {relations.length} pihak
                              </span>
                            </div>
                            
                            {/* Preview Tanah yang Terhubung */}
                            <div className="flex flex-wrap gap-2 mb-3">
                              {getUniqueLandsFromRelations().map(id => {
                                const land = allLands.find(l => l.id === id);
                                return (
                                  <span 
                                    key={id} 
                                    className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2.5 py-1 rounded"
                                  >
                                    {land?.nop}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                          
                          <div className="space-y-2.5 mb-6">
                            {relations.map(r => (
                              <div 
                                key={r.id} 
                                className="flex justify-between p-3 bg-white border rounded items-center hover:bg-slate-50 transition-colors"
                              >
                                <div className="flex flex-col">
                                  <span className="font-bold text-sm text-slate-800">
                                    {toTitleCase(allIdentities.find(i => i.id === r.identitas_id)?.nama || '')}
                                  </span>
                                  <span className="text-[10px] text-slate-500 mt-0.5">
                                    NIK: {allIdentities.find(i => i.id === r.identitas_id)?.nik}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2.5">
                                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded uppercase ${
                                    r.peran === 'PIHAK_1' ? 'bg-amber-100 text-amber-800' :
                                    r.peran === 'PIHAK_2' ? 'bg-green-100 text-green-800' :
                                    r.peran === 'SAKSI' ? 'bg-purple-100 text-purple-800' :
                                    'bg-cyan-100 text-cyan-800'
                                  }`}>
                                    {r.peran.replace('_', ' ')}
                                  </span>
                                  <button 
                                    onClick={() => deleteRel(r.id)} 
                                    className="text-red-600 hover:bg-red-50 rounded p-1.5"
                                    title="Hapus"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {/* ✅ Daftar Persetujuan (Section Terpisah) */}
                      {persetujuans.length > 0 && (
                        <>
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <HeartHandshake size={16} className="text-amber-600" />
                                <span className="text-[10px] font-bold text-amber-700 uppercase">
                                  Daftar Persetujuan
                                </span>
                              </div>
                              <span className="text-[10px] font-bold text-amber-600">
                                {persetujuans.length} persetujuan
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 italic">
                              Persetujuan dari pihak yang memiliki hubungan dengan PIHAK 1
                            </p>
                          </div>
                          
                          <div className="space-y-2.5">
                            {persetujuans.map(p => {
                              const identity = allIdentities.find(i => i.id === p.identitas_id);
                              const pihak1 = relations.find(r => r.id === p.pihak_1_id);
                              const pihak1Identity = pihak1 ? allIdentities.find(i => i.id === pihak1.identitas_id) : null;
                              
                              return (
                                <div 
                                  key={p.id} 
                                  className="flex justify-between p-3 bg-amber-50 border border-amber-200 rounded items-center hover:bg-amber-100 transition-colors"
                                >
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-sm text-amber-900">
                                        {toTitleCase(identity?.nama || '')}
                                      </span>
                                      <span className="text-[10px] font-bold bg-amber-200 text-amber-800 px-2 py-0.5 rounded">
                                        {getHubunganLabel(p.hubungan)}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-slate-600 mt-0.5">
                                      NIK: {identity?.nik}
                                    </span>
                                    <span className="text-[10px] text-blue-700 font-bold mt-0.5">
                                      ↳ Menyetujui: {pihak1Identity?.nama || 'PIHAK 1'}
                                    </span>
                                    {p.keterangan && (
                                      <span className="text-[10px] text-slate-500 italic mt-0.5">
                                        "{p.keterangan}"
                                      </span>
                                    )}
                                  </div>
                                  <button 
                                    onClick={() => deletePersetujuan(p.id)} 
                                    className="text-red-600 hover:bg-red-50 rounded p-1.5"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-30 py-20">
            <div className="bg-blue-100 p-5 rounded mb-5">
              <FileText size={70} className="text-blue-600" strokeWidth={1.5}/>
            </div>
            <p className="mt-4 font-bold uppercase tracking-[0.3em] text-base text-slate-600 text-center">
              Pilih atau Buat Berkas
            </p>
            <p className="text-sm text-slate-500 mt-2 font-bold">
              Klik tombol + untuk membuat berkas baru
            </p>
          </div>
        )}
      </div>

      {/* OVERLAY FORM PEMBUATAN/EDIT BERKAS */}
  {isCreating && (
  <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4">
    <Card 
      className="w-full max-w-3xl relative border-0 shadow-xl bg-white overflow-hidden flex flex-col my-auto rounded-2xl" 
      title={editingId ? "Edit Berkas" : "Buat Berkas Baru"}
    >
      {/* Tombol Close */}
      <button 
        onClick={() => setIsCreating(false)} 
        className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all z-10"
      >
        <X size={20} />
      </button>

      <div className="p-8 space-y-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
        
        {/* SECTION 1: IDENTITAS NOMOR */}
        <div className="grid grid-cols-2 gap-6">
          <Input 
            label="Nomor Berkas" 
            placeholder="Misal: 123/2024" 
            value={formFile.nomor_berkas} 
            onChange={e => setFormFile({...formFile, nomor_berkas: e.target.value})} 
          />
          <Input 
            label="Nomor Register" 
            placeholder="REG-XXX" 
            value={formFile.nomor_register} 
            onChange={e => setFormFile({...formFile, nomor_register: e.target.value})} 
          />
        </div>

        {/* SECTION 2: TANGGAL & REGISTER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* TANGGAL REGISTER */}
          <div className="space-y-1.5">
            <DateInput 
              label="Tanggal Register" 
              value={formFile.tanggal_register} 
              onChange={val => setFormFile({
                ...formFile, 
                tanggal_register: val, 
                ejaan_tanggal_register: spellDateIndo(val || "")
              })} 
            />
            <p className="text-[10px] text-slate-400 font-medium px-1 italic">
               Ejaan: {formFile.ejaan_tanggal_register || '-'}
            </p>
          </div>

          {/* TANGGAL BERKAS DENGAN HARI DI ATAS TAHUN */}
          <div className="space-y-1.5 relative">
             <div className="flex justify-between items-end mb-1">
                <label className="text-[12px] font-medium text-slate-700">Tanggal Berkas</label>
                {/* Tampilan Hari di atas kolom input */}
                <div className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                  Hari: {formFile.hari || '-'}
                </div>
             </div>
             <DateInput 
                value={formFile.tanggal} 
                onChange={val => setFormFile({
                  ...formFile, 
                  tanggal: val, 
                  hari: getDayNameIndo(val || ""),
                  ejaan_tanggal: spellDateIndo(val || "")
                })} 
              />
            <p className="text-[10px] text-slate-400 font-medium px-1 italic">
               Ejaan: {formFile.ejaan_tanggal || '-'}
            </p>
          </div>
        </div>

        {/* SECTION 3: KATEGORI KETERANGAN (MINIMALIST TABS) */}
        <div className="space-y-4 pt-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kategori Keterangan</label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'STANDAR', label: 'Biasa', icon: <FileText size={14}/> },
              { id: 'PERSETUJUAN', label: 'Persetujuan', icon: <HeartHandshake size={14}/> },
              { id: 'AKTA_KUASA', label: 'Akta Kuasa', icon: <ShieldAlert size={14}/> },
              { id: 'AHLI_WARIS', label: 'Ahli Waris', icon: <Users size={14}/> }
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFormFile({ ...formFile, menurut_keterangan: opt.id as any })}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[11px] font-semibold transition-all ${
                  formFile.menurut_keterangan === opt.id 
                    ? 'border-slate-800 bg-slate-800 text-white shadow-md' 
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-400'
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>

          <div className="mt-4 p-5 rounded-xl border border-slate-100 bg-slate-50/30 min-h-[100px]">
            {/* AHLI WARIS */}
            {formFile.menurut_keterangan === 'AHLI_WARIS' && (
              <div className="grid grid-cols-2 gap-5 animate-in fade-in duration-500">
                <div className="col-span-2">
                  <Input label="Nama Almarhum" placeholder="Nama lengkap..." value={formFile.nama_almarhum} onChange={e => setFormFile({...formFile, nama_almarhum: e.target.value})} />
                </div>
                <Input label="Desa SKW" value={formFile.desa_waris} onChange={e => setFormFile({...formFile, desa_waris: e.target.value})} />
                <Input label="Kecamatan SKW" value={formFile.kecamatan_waris} onChange={e => setFormFile({...formFile, kecamatan_waris: e.target.value})} />
                <Input label="Reg. Desa" value={formFile.register_waris_desa} onChange={e => setFormFile({...formFile, register_waris_desa: e.target.value})} />
                <Input label="Reg. Kecamatan" value={formFile.register_waris_kecamatan} onChange={e => setFormFile({...formFile, register_waris_kecamatan: e.target.value})} />
                <div className="col-span-2 space-y-1.5">
                  <DateInput label="Tanggal SKW" value={formFile.tanggal_waris} onChange={val => setFormFile({...formFile, tanggal_waris: val, ejaan_tanggal_waris: spellDateIndo(val || "")})} />
                  <p className="text-[10px] text-slate-400 italic">Ejaan: {formFile.ejaan_tanggal_waris || '-'}</p>
                </div>
              </div>
            )}

            {/* PERSETUJUAN */}
{formFile.menurut_keterangan === 'PERSETUJUAN' && (
  <div className="space-y-4 animate-in fade-in duration-500">
    <div className="flex items-center justify-between px-1">
       <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Daftar Pemberi Persetujuan</label>
       <span className="text-[10px] text-slate-400 italic">Total: {persetujuans.length}</span>
    </div>
    
          <div className="space-y-3">
            {/* Mapping data persetujuan */}
            {persetujuans.length > 0 ? (
              persetujuans.map((p: Persetujuan) => (
                <div key={p.id} className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-slate-300 transition-all">
                  <div className="flex flex-col gap-1">
                    {/* Di sini p.identitas_id biasanya perlu di-join untuk dapat nama, 
                        sementara kita asumsikan p punya properti nama atau identitas */}
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                      {/* Kalau data join identitas ada */}
                      {(p as any).identitas?.nama || "Pihak Terhubung"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                        p.hubungan === 'ISTRI' || p.hubungan === 'SUAMI' 
                        ? 'bg-rose-50 text-rose-600' 
                        : 'bg-blue-50 text-blue-600'
                      }`}>
                        {p.hubungan}
                      </span>
                      <span className="text-[10px] text-slate-400 italic">
                        {p.hubungan === 'ISTRI' || p.hubungan === 'SUAMI' 
                          ? '— Alamat Otomatis (Sama)' 
                          : '— Alamat Memanggil Identitas'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                <p className="text-[11px] text-slate-400">Belum ada pihak persetujuan yang dihubungkan.</p>
              </div>
            )}

            {/* Tombol untuk buka modal tambah persetujuan */}
            <button 
              type="button"
              onClick={() => setShowModalTambahPersetujuan(true)}
              className="w-full py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={14} />
              HUBUNGKAN IDENTITAS PERSETUJUAN
            </button>
          </div>
        </div>
      )}

            {/* AKTA KUASA */}
            {formFile.menurut_keterangan === 'AKTA_KUASA' && (
              <div className="grid grid-cols-2 gap-5 animate-in fade-in duration-500">
                <Input label="No. Akta Kuasa" value={formFile.nomor_akta_kuasa} onChange={e => setFormFile({...formFile, nomor_akta_kuasa: e.target.value})} />
                <DateInput label="Tanggal Akta" value={formFile.tanggal_akta_kuasa} onChange={val => setFormFile({...formFile, tanggal_akta_kuasa: val})} />
                <div className="col-span-2">
                  <Input label="Nama Notaris & Kedudukan" placeholder="Misal: Budi, S.H., M.Kn. di Jakarta" value={formFile.nama_notaris_kuasa} onChange={e => setFormFile({...formFile, nama_notaris_kuasa: e.target.value})} />
                </div>
              </div>
            )}

            {/* STANDAR */}
            {formFile.menurut_keterangan === 'STANDAR' && (
              <div className="py-8 text-center text-slate-400 text-xs">
                Informasi keterangan akan menggunakan format standar akta.
              </div>
            )}
          </div>
        </div>

        {/* SECTION 4: INFO PEROLEHAN & SAKSI */}
        <div className="grid grid-cols-2 gap-8 border-t border-slate-100 pt-8">
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-slate-700">Jenis Perolehan</label>
              <input 
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm h-[42px] focus:border-slate-400 outline-none transition-all"
                placeholder="Misal: Jual Beli"
                value={formFile.jenis_perolehan}
                onChange={e => setFormFile({...formFile, jenis_perolehan: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-slate-700">Cakupan Tanah</label>
              <select 
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm h-[42px] focus:border-slate-400 outline-none transition-all"
                value={formFile.cakupan_tanah}
                onChange={e => setFormFile({...formFile, cakupan_tanah: e.target.value})}
              >
                <option value="Sebidang tanah">Sebidang tanah</option>
                <option value="Sebagian atas sebidang tanah">Sebagian atas sebidang tanah</option>
              </select>
            </div>
          </div>

          <div className="space-y-5">
            <Input 
              label="Tahun Perolehan" 
              type="number" 
              value={formFile.tahun_perolehan} 
              onChange={e => setFormFile({...formFile, tahun_perolehan: e.target.value})} 
            />
            <Input 
              label="Ejaan Jumlah Saksi" 
              placeholder="Misal: Dua" 
              value={formFile.jumlah_saksi} 
              onChange={e => setFormFile({...formFile, jumlah_saksi: e.target.value})} 
            />
          </div>
        </div>

        {/* SECTION 5: LOKASI */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-4">
            <div className={`w-2 h-2 rounded-full ${hasSelectedLocation ? 'bg-emerald-500' : 'bg-slate-300 animate-pulse'}`} />
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Koordinat Objek</p>
              <p className="text-sm font-medium text-slate-700">
                {hasSelectedLocation ? `${selectedCoords.lat.toFixed(6)}, ${selectedCoords.lng.toFixed(6)}` : 'Belum ditentukan'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setShowMapPicker(true)}
            className="text-[11px] font-bold text-slate-600 hover:text-slate-900 underline decoration-slate-300 underline-offset-4"
          >
            {hasSelectedLocation ? "Ubah Lokasi" : "Tentukan Lokasi"}
          </button>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white">
          <button 
            onClick={() => setIsCreating(false)} 
            className="px-6 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
          >
            Batal
          </button>
          <button 
            onClick={handleSaveFile} 
            className="px-8 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-slate-200"
          >
            Simpan Berkas
          </button>
        </div>
      </div>
    </Card>
  </div>
)}

      {/* MODAL POPUP UNTUK LANDMAP PICKER */}
      {showMapPicker && (
        <div className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-lg overflow-hidden shadow-2xl flex flex-col h-[85vh] border">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded">
                  <MapPin size={20}/>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Tentukan Titik Objek</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Klik pada area tanah untuk menetapkan koordinat
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowMapPicker(false)} 
                className="p-2 hover:bg-slate-200 rounded transition-colors text-slate-500 hover:text-red-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 bg-slate-100 relative">
              <LandMap 
                latitude={selectedCoords.lat}
                longitude={selectedCoords.lng}
                onChange={(lat, lng) => {
                  setSelectedCoords({ lat, lng });
                  setHasSelectedLocation(true);
                }}
              />
              
              {/* Floating Info */}
              <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm p-4 rounded shadow-lg border max-w-xs">
                <p className="text-[10px] font-bold text-blue-600 uppercase mb-2 flex items-center gap-1.5">
                  <MapPin size={12} />
                  Koordinat Terdeteksi
                </p>
                <div className="space-y-1">
                  <p className="text-sm font-mono font-bold text-slate-800 flex justify-between">
                    <span className="text-slate-500">LAT:</span> 
                    <span className="text-blue-600">{selectedCoords.lat.toFixed(8)}</span>
                  </p>
                  <p className="text-sm font-mono font-bold text-slate-800 flex justify-between">
                    <span className="text-slate-500">LNG:</span> 
                    <span className="text-blue-600">{selectedCoords.lng.toFixed(8)}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 bg-slate-50 border-t flex justify-between items-center">
              <p className="text-xs text-slate-500 italic flex items-center gap-1.5">
                <Info size={12} className="text-blue-600" />
                * Pastikan titik berada tepat di atas objek tanah yang dimaksud
              </p>
              <div className="flex gap-3">
                <Button 
                  variant="secondary" 
                  onClick={() => setShowMapPicker(false)} 
                  className="px-6 py-2"
                >
                  Batal
                </Button>
                <Button 
                  disabled={!hasSelectedLocation}
                  onClick={() => setShowMapPicker(false)} 
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Konfirmasi Lokasi
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showModalTambahPersetujuan && (
  <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-5">
      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Hubungkan Identitas</h3>
      
      <div className="space-y-4">
        {/* Dropdown Pilih Identitas */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Pilih Orang</label>
          <select 
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
            value={selectedIdentitasId}
            onChange={(e) => setSelectedIdentitasId(e.target.value)}
          >
            <option value="">-- Pilih dari Database Identitas --</option>
            {identitasList.map((idnt: any) => ( // Tambahkan : any di sini
              <option key={idnt.id} value={idnt.id}>{idnt.nama}</option>
            ))}
          </select>
        </div>

        {/* Pilih Hubungan */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Hubungan</label>
          <select 
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
            value={selectedHubungan}
            onChange={(e) => setSelectedHubungan(e.target.value as HubunganPersetujuan)}
          >
            <option value="ISTRI">ISTRI (Alamat Sama)</option>
            <option value="SUAMI">SUAMI (Alamat Sama)</option>
            <option value="ANAK">ANAK (Alamat Sesuai KTP)</option>
            <option value="LAINNYA">LAINNYA</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button 
          onClick={() => setShowModalTambahPersetujuan(false)}
          className="flex-1 py-3 text-xs font-bold text-slate-400 hover:text-slate-600"
        >
          BATAL
        </button>
        <button 
          className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold"
          onClick={() => {
            // Nanti di sini panggil fungsi handleTambahPersetujuan
            setShowModalTambahPersetujuan(false);
          }}
        >
          TAMBAHKAN
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

// Helper Icons (inline untuk simplicity)
const LockIcon = ({ size = 16, className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);