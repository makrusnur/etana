import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { FileRecord, Relation, Identity, LandData, RelationRole } from '../types';
import { Button, Input, Card, DateInput } from '../components/UI';
import LandMap from '../components/LandMap';
import { 
  Plus, Trash2, Search, FileText, Edit2, Calendar, Save, X, Clock, 
  ShieldAlert, MapPin, CheckCircle, ChevronDown, ChevronUp, AlertCircle, Info
} from 'lucide-react';
import { formatDateIndo, getDayNameIndo, toTitleCase, spellDateIndo, generateUUID } from '../utils';

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
  const [searchWP, setSearchWP] = useState(''); // Untuk cari Subjek
  const [searchLand, setSearchLand] = useState(''); // Untuk cari Tanah

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

  const initialFileState: Partial<FileRecord> = { 
    tanggal: new Date().toISOString().split('T')[0],
    hari: getDayNameIndo(new Date().toISOString().split('T')[0]),
    nomor_berkas: '',
    nomor_register: '',
    tanggal_register: '',
    keterangan: '',
    jenis_perolehan: '',
    tahun_perolehan: '',
    register_waris_desa: '',
    register_waris_kecamatan: '',
    tanggal_waris: '',
    ejaan_tanggal_waris: '',
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
      const [f, i, l] = await Promise.all([
        db.files.getAll(), 
        db.identities.getAll(), 
        db.lands.getAll()
      ]);
      setFiles(f || []);
      setAllIdentities(i || []);
      setAllLands(l || []);
    } catch (err) {
      console.error("Gagal sinkron:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = async (f: FileRecord) => {
    setActiveFile(f);
    try {
      const fileRelations = await db.relations.getByFileId(f.id);
      setRelations(fileRelations || []);
      
      // Load tanah yang terhubung dengan berkas ini
      const landIds = fileRelations?.filter(r => r.data_tanah_id).map(r => r.data_tanah_id!) || [];
      setSelectedLandIds([...new Set(landIds)]); // Unique tanah IDs
      
      // Set koordinat dari tanah pertama (jika ada)
      const firstLandRel = fileRelations?.find(r => r.data_tanah_id);
      if (firstLandRel) {
        const landData = allLands.find(l => l.id === firstLandRel.data_tanah_id);
        if (landData && landData.latitude) {
          setSelectedCoords({ lat: landData.latitude, lng: landData.longitude });
          setHasSelectedLocation(true);
        }
      }
    } catch (err) {
      setRelations([]);
      setSelectedLandIds([]);
    }
    setNewRel({ identityId: '', role: 'PIHAK_1' });
    setIsDocumentLocked(relations?.length > 0); // Lock jika sudah ada relasi
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
        latitude: selectedCoords.lat,
        longitude: selectedCoords.lng,
        tanggal: formFile.tanggal || undefined,
        tanggal_waris: formFile.tanggal_waris || undefined,
        hari: formFile.hari || getDayNameIndo(formFile.tanggal || ''),
        jenis_perolehan: formFile.jenis_perolehan!.toUpperCase(),
        created_at: formFile.created_at || new Date().toISOString()
      } as FileRecord;

      // 1. Simpan Berkas
      if (editingId) {
        await db.files.update(editingId, payload);
      } else {
        await db.files.add(payload);
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
      await db.files.delete(id);
      if (activeFile?.id === id) setActiveFile(null);
      await refreshData();
    }
  };

  const handleAddRel = async () => {
    if (!activeFile || !newRel.identityId || selectedLandIds.length === 0) return;

    try {
      // Buat relasi untuk SETIAP tanah yang dipilih
      const newRelations = selectedLandIds.map(landId => ({
        id: generateUUID(),
        berkas_id: activeFile.id,
        identitas_id: newRel.identityId,
        peran: newRel.role,
        data_tanah_id: landId
      }));

      // Simpan semua relasi
      for (const rel of newRelations) {
        await db.relations.add(rel);
      }

      const updatedRels = await db.relations.getByFileId(activeFile.id);
      setRelations(updatedRels);
      setNewRel({ identityId: '', role: 'PIHAK_1' });
      setIsDocumentLocked(true); // Lock setelah ada relasi

    } catch (err: any) {
      console.error("Gagal menambah relasi:", err);
      alert("Database menolak format ID. Harap ubah tipe data kolom di Supabase menjadi TEXT.");
    }
  };

  const deleteRel = async (id: string) => {
    await db.relations.delete(id);
    if (activeFile) {
      const updatedRels = await db.relations.getByFileId(activeFile.id);
      setRelations(updatedRels);
      
      // Unlock dokumen jika tidak ada relasi lagi
      if (updatedRels.length === 0) {
        setIsDocumentLocked(false);
      }
    }
  };

  const filteredFiles = files.filter(f => {
    const isKategoriCocok = f.kategori === 'PPAT_NOTARIS' || !f.kategori;
    const isSearchCocok = f.nomor_berkas.toLowerCase().includes(fileSearch.toLowerCase()) || 
                         f.jenis_perolehan.toLowerCase().includes(fileSearch.toLowerCase());
    return isKategoriCocok && isSearchCocok; 
  });

  const isWaris = formFile.jenis_perolehan?.toUpperCase().includes('WARIS');

  // Helper: Get unique tanah dari relasi
  const getUniqueLandsFromRelations = () => {
    const landIds = relations.map(r => r.data_tanah_id).filter(Boolean) as string[];
    return [...new Set(landIds)];
  };

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
                          onChange={(e) => setSearchLand(e.target.value)}
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
                            onChange={e => setNewRel({...newRel, role: e.target.value as any})}
                          >
                            <option value="PIHAK_1">PIHAK 1 </option>
                            <option value="PIHAK_2">PIHAK 2 </option>
                            <option value="SAKSI">SAKSI</option>
                            <option value="PERSETUJUAN_PIHAK_1">PERSETUJUAN PIHAK 1</option>
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

                  {/* === DAFTAR PIHAK YANG SUDAH DITAMBAHKAN === */}
                  {relations.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-slate-200">
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
                      
                      <div className="space-y-2.5">
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
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-3xl relative my-auto border-0 shadow-2xl" title={editingId ? "Edit Berkas" : "Buat Berkas Baru"}>
            <button 
              onClick={() => setIsCreating(false)} 
              className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
            >
              <X size={22} />
            </button>
            <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
              
              {/* Section: Nomor & Identitas Berkas */}
              <div className="border-b pb-4 mb-4">
                <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-3">Identitas Berkas</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Input 
                      label="Nomor Berkas" 
                      placeholder="Contoh: 123/2024" 
                      value={formFile.nomor_berkas} 
                      onChange={e => setFormFile({...formFile, nomor_berkas: e.target.value})} 
                    />
                  </div>
                  <Input 
                    label="Nomor Register" 
                    placeholder="Contoh: REG-XXX" 
                    value={formFile.nomor_register} 
                    onChange={e => setFormFile({...formFile, nomor_register: e.target.value})} 
                  />
                  <DateInput 
                    label="Tanggal Register" 
                    value={formFile.tanggal_register} 
                    onChange={val => setFormFile({...formFile, tanggal_register: val})} 
                  />
                </div>
              </div>

              {/* Section: Tanggal */}
              <div className="border-b pb-4 mb-4">
                <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-3">Tanggal</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <DateInput 
                      label="Tanggal Berkas" 
                      value={formFile.tanggal} 
                      onChange={val => setFormFile({...formFile, tanggal: val, hari: getDayNameIndo(val)})} 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">Hari</label>
                    <div className="h-[40px] flex items-center justify-center bg-blue-600 text-white rounded text-sm font-bold uppercase">
                      {formFile.hari || '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Perolehan */}
              <div className="border-b pb-4 mb-4">
                <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-3">Informasi Perolehan</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                      Jenis Perolehan
                    </label>
                    <input 
                      list="perolehan-options"
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md text-sm font-bold focus:border-blue-600 focus:ring-2 focus:ring-blue-500 outline-none uppercase h-[40px]"
                      placeholder="Pilih/Ketik..."
                      value={formFile.jenis_perolehan}
                      onChange={e => setFormFile({...formFile, jenis_perolehan: e.target.value})}
                    />
                    <datalist id="perolehan-options">
                      <option value="WARIS" />
                      <option value="JUAL BELI" />
                      <option value="HIBAH" />
                      <option value="PEMBAGIAN HAK BERSAMA" />
                      <option value="LELANG" />
                    </datalist>
                  </div>
                  <Input 
                    label="Tahun Perolehan" 
                    type="number" 
                    placeholder="Contoh: 2024" 
                    value={formFile.tahun_perolehan} 
                    onChange={e => setFormFile({...formFile, tahun_perolehan: e.target.value})} 
                  />
                </div>
              </div>

              {/* Section: Waris (Conditional) */}
              {isWaris && (
                <div className="border-b pb-4 mb-4 bg-amber-50 p-4 rounded">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldAlert size={16} className="text-amber-600" />
                    <h4 className="text-[11px] font-bold text-amber-700 uppercase tracking-widest">Data Waris</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      label="Register Waris Desa" 
                      placeholder="Nomor Register Desa..." 
                      value={formFile.register_waris_desa} 
                      onChange={e => setFormFile({...formFile, register_waris_desa: e.target.value})} 
                    />
                    <Input 
                      label="Register Waris Kecamatan" 
                      placeholder="Nomor Register Kecamatan..." 
                      value={formFile.register_waris_kecamatan} 
                      onChange={e => setFormFile({...formFile, register_waris_kecamatan: e.target.value})} 
                    />
                    <div className="col-span-2">
                      <DateInput 
                        label="Tanggal Waris" 
                        value={formFile.tanggal_waris} 
                        onChange={val => {
                          setFormFile({
                            ...formFile, 
                            tanggal_waris: val,
                            ejaan_tanggal_waris: val ? spellDateIndo(val) : '' 
                          });
                        }} 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Section: Keterangan */}
              <div className="border-b pb-4 mb-4">
                <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-3">Keterangan Tambahan</h4>
                <Input 
                  label="Keterangan" 
                  placeholder="Informasi pendukung..." 
                  value={formFile.keterangan} 
                  onChange={e => setFormFile({...formFile, keterangan: e.target.value})} 
                />
              </div>

              {/* Section: Lokasi */}
              <div className="pb-4">
                <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-3">Lokasi Objek Tanah</h4>
                <div className={`p-4 rounded border ${
                  hasSelectedLocation 
                    ? 'bg-emerald-50 border-emerald-200' 
                    : 'bg-rose-50 border-rose-200'
                }`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded text-white ${
                        hasSelectedLocation ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}>
                        <MapPin size={20} />
                      </div>
                      <div>
                        <span className={`text-[10px] font-bold uppercase block ${
                          hasSelectedLocation ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {hasSelectedLocation ? 'Lokasi Sudah Ditentukan' : 'Lokasi Belum Ditentukan'}
                        </span>
                        <p className="text-sm font-bold text-slate-800 mt-0.5">
                          {hasSelectedLocation 
                            ? `${selectedCoords.lat.toFixed(6)}, ${selectedCoords.lng.toFixed(6)}` 
                            : 'Silakan tentukan lokasi pada peta'}
                        </p>
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      variant={hasSelectedLocation ? "secondary" : "primary"}
                      onClick={() => setShowMapPicker(true)}
                      className="text-sm px-4 py-2"
                    >
                      {hasSelectedLocation ? "Ubah" : "Tentukan Lokasi"}
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button 
                  variant="secondary" 
                  onClick={() => setIsCreating(false)}
                  className="px-6 py-2.5"
                >
                  Batal
                </Button>
                <Button 
                  onClick={handleSaveFile} 
                  className="px-8 py-2.5 font-bold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save size={16} className="mr-2"/> 
                  Simpan Berkas
                </Button>
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