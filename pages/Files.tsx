import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { FileRecord, Relation, Identity, LandData, RelationRole } from '../types';
import { Button, Input, Card, DateInput } from '../components/UI';
import LandMap from '../components/LandMap'; // Import default sesuai file Bapak
import { Plus, Trash2, Search, FileText, Edit2, Calendar, Save, X, Clock, ShieldAlert, MapPin } from 'lucide-react';
import {  formatDateIndo, getDayNameIndo, toTitleCase, spellDateIndo, generateUUID } from '../utils';

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
  const [searchOP, setSearchOP] = useState(''); // Untuk cari Tanah

  // STATE UNTUK PETA
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{lat: number, lng: number}>({ 
    lat: -7.6448, 
    lng: 112.9061 
  });
  const [hasSelectedLocation, setHasSelectedLocation] = useState(false);

  const initialFileState: Partial<FileRecord> = { 
    tanggal: new Date().toISOString().split('T')[0],
    hari: getDayNameIndo(new Date().toISOString().split('T')[0]),
    nomor_berkas: '',
    nomor_register: '',
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
  const [newRel, setNewRel] = useState({ identityId: '', role: 'PIHAK_1' as RelationRole, landId: '' });

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
      const rels = await db.relations.getByFileId(f.id);
      setRelations(rels || []);
      
      // Jika berkas punya relasi tanah, set koordinat agar peta sinkron (opsional)
      const landRel = rels?.find(r => r.data_tanah_id);
      if (landRel) {
        const landData = allLands.find(l => l.id === landRel.data_tanah_id);
        if (landData && landData.latitude) {
           setSelectedCoords({ lat: landData.latitude, lng: landData.longitude });
           setHasSelectedLocation(true);
        }
      }
    } catch (err) {
      setRelations([]);
    }
    setNewRel({ identityId: '', role: 'PIHAK_1', landId: '' });
  };

  const handleSaveFile = async () => {
  if (!formFile.nomor_berkas?.trim() || !formFile.jenis_perolehan?.trim()) {
    return alert('Nomor Berkas dan Jenis Perolehan wajib diisi!');
  }

  // Kita tetap butuh koordinat untuk tahu berkas ini ada di lokasi mana,
  // tapi kita simpan koordinatnya DI DALAM data Berkas saja.
  if (!hasSelectedLocation) {
    return alert('Silahkan tentukan lokasi objek tanah pada peta terlebih dahulu!');
  }
  
  try {
    const fileId = editingId || generateUUID();
    
    // Payload hanya untuk tabel FILES
    const payload: FileRecord = {
      ...initialFileState,
      ...formFile,
      id: fileId,
      kategori: 'PPAT_NOTARIS',
      nomor_berkas: formFile.nomor_berkas!.toUpperCase(),
      nomor_register: formFile.nomor_register?.toUpperCase() || '',
      
      // Pastikan koordinat tersimpan di tabel Files jika kolomnya ada
      // @ts-ignore (jika latitude/longitude belum ada di interface FileRecord)
      latitude: selectedCoords.lat,
      // @ts-ignore
      longitude: selectedCoords.lng,

      // Cegah error DATE ""
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

    // --- BAGIAN SIMPAN KE DB.LANDS SUDAH SAYA HAPUS TOTAL ---
    // Agar tidak ada data tanah palsu yang muncul di rincian

    setIsCreating(false);
    setEditingId(null);
    setFormFile(initialFileState);
    setHasSelectedLocation(false);
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
  if (!activeFile || !newRel.identityId) return;

  const rel: Relation = {
    id: generateUUID(), // Pakai fungsi manual ini
    berkas_id: activeFile.id,
    identitas_id: newRel.identityId,
    peran: newRel.role,
    data_tanah_id: newRel.landId || undefined
  };

  try {
    await db.relations.add(rel);
    const updatedRels = await db.relations.getByFileId(activeFile.id);
    setRelations(updatedRels);
    setNewRel({ ...newRel, identityId: '' });
  } catch (err: any) {
    console.error("Gagal menambah relasi:", err);
    alert("Database menolak format ID. Harap ubah tipe data kolom di Supabase menjadi TEXT.");
  }
};

  const deleteRel = async (id: string) => {
    await db.relations.delete(id);
    if (activeFile) setRelations(await db.relations.getByFileId(activeFile.id));
  };

  const filteredFiles = files.filter(f => {
    const isKategoriCocok = f.kategori === 'PPAT_NOTARIS' || !f.kategori;
    const isSearchCocok = f.nomor_berkas.toLowerCase().includes(fileSearch.toLowerCase()) || 
                         f.jenis_perolehan.toLowerCase().includes(fileSearch.toLowerCase());
    return isKategoriCocok && isSearchCocok; 
  });

  const isWaris = formFile.jenis_perolehan?.toUpperCase().includes('WARIS');

  return (
    <div className="h-[calc(100vh-2rem)] flex gap-6 overflow-hidden">
      <div className="w-1/3 flex flex-col gap-4 border-r border-slate-200 pr-4 pl-1 overflow-y-auto custom-scrollbar">
        {/* Header Sidebar */}
        <div className="flex justify-between items-center sticky top-0 bg-slate-50 py-4 z-10 border-b border-slate-100 mb-2 px-1">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Manajemen Berkas</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">PPAT Administration</p>
          </div>
          <Button onClick={() => { setIsCreating(true); setEditingId(null); setFormFile(initialFileState); setHasSelectedLocation(false); }}>
            <Plus size={18} />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative px-1">
          <Search size={16} className="absolute left-4 top-3.5 text-slate-400" />
          <input 
            placeholder="Cari No. Berkas / Perolehan..." 
            className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all" 
            value={fileSearch} 
            onChange={e => setFileSearch(e.target.value)} 
          />
        </div>

        {/* List Berkas - Tambahkan padding bawah agar tidak terpotong saat scroll */}
        <div className="space-y-3 mt-2 px-1 pb-10">
          {isLoading ? (
            <div className="text-center p-10 flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Syncing...</span>
            </div>
          ) : (
            filteredFiles.map(f => (
              <div 
                key={f.id} 
                onClick={() => handleSelect(f)} 
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 relative group overflow-hidden ${
                  activeFile?.id === f.id 
                    ? 'border-blue-500 bg-white shadow-xl translate-x-1' 
                    : 'bg-white border-transparent hover:border-slate-200 shadow-sm'
                }`}
              >
                {/* Garis indikator aktif di samping */}
                {activeFile?.id === f.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600"></div>
                )}

                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-2">
                    <div className="font-black text-slate-800 tracking-tight text-sm break-words">{f.nomor_berkas}</div>
                    <div className="text-[9px] uppercase font-black text-blue-600 mt-1 tracking-wider">{f.jenis_perolehan}</div>
                    <div className="text-[9px] text-slate-400 font-bold mt-3 flex items-center gap-1.5">
                      <Calendar size={12} className="text-slate-300" /> {formatDateIndo(f.tanggal)}
                    </div>
                  </div>
                  
                  {/* Tombol aksi yang hanya muncul saat hover agar tidak penuh */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => handleEditFile(e, f)} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg"><Edit2 size={14}/></button>
                    <button onClick={(e) => handleDeleteFile(e, f.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* DETAIL BERKAS & RELASI */}
      <div className="w-2/3 overflow-y-auto pr-2 custom-scrollbar">
        {activeFile ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                <div className="flex flex-col gap-1">
                   <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-tight">{activeFile.jenis_perolehan}</h3>
                   <p className="text-slate-500 font-bold tracking-tighter text-sm">Nomor Berkas: {activeFile.nomor_berkas} {activeFile.nomor_register && ` / Reg: ${activeFile.nomor_register}`}</p>
                </div>
            </div>

            <div className="bg-blue-600 px-6 py-4 rounded-2xl shadow-lg flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                <Calendar size={20} className="opacity-80" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Hari & Tanggal Berkas</span>
              </div>
              <div className="text-lg font-black tracking-tight">
                {activeFile.hari}, <span className="text-blue-100">{formatDateIndo(activeFile.tanggal)}</span>
              </div>
            </div>

            {activeFile.jenis_perolehan.toUpperCase().includes('WARIS') && (
              <div className="p-6 bg-amber-50 rounded-[2.5rem] border border-amber-100 flex items-start gap-4">
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-amber-200 text-amber-600">
                    <Clock size={24} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
                      <div>
                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em]">Reg. Waris Desa</span>
                        <p className="text-sm font-black text-amber-900 mt-0.5">{activeFile.register_waris_desa || '-'}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em]">Reg. Waris Kec.</span>
                        <p className="text-sm font-black text-amber-900 mt-0.5">{activeFile.register_waris_kecamatan || '-'}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em]">Tertanggal Waris</span>
                        <p className="text-sm font-black text-amber-900 mt-0.5">{activeFile.tanggal_waris ? formatDateIndo(activeFile.tanggal_waris) : '-'}</p>
                      </div>
                  </div>
              </div>
            )}

            <Card title="Penyusunan Struktur Relasi Pihak">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-200 mb-8 shadow-inner">
                
                {/* SEARCH WAJIB PAJAK / SUBJEK */}
                <div className="col-span-1 relative">
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 px-1 tracking-widest">Cari Subjek (Nama/NIK)</label>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Ketik Nama/NIK..."
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                      value={searchWP}
                      onChange={(e) => setSearchWP(e.target.value)}
                    />
                    {searchWP && !newRel.identityId && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                        {allIdentities
                          .filter(i => i.nama.toLowerCase().includes(searchWP.toLowerCase()) || i.nik.includes(searchWP))
                          .map(i => (
                            <div 
                              key={i.id}
                              className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-none"
                              onClick={() => {
                                setNewRel({...newRel, identityId: i.id});
                                setSearchWP(i.nama.toUpperCase());
                              }}
                            >
                              <p className="text-[11px] font-black text-slate-800">{i.nama.toUpperCase()}</p>
                              <p className="text-[9px] text-slate-400 font-mono">{i.nik}</p>
                            </div>
                          ))}
                      </div>
                    )}
                    {newRel.identityId && (
                      <button 
                        onClick={() => {setNewRel({...newRel, identityId: ''}); setSearchWP('');}}
                        className="absolute right-3 top-3 text-red-500 hover:bg-red-50 rounded-full p-0.5"
                      >
                        <X size={14}/>
                      </button>
                    )}
                  </div>
                </div>

                {/* PILIH PERAN */}
                <div className="col-span-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 px-1 tracking-widest">Peran</label>
                  <select 
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm font-bold appearance-none h-[46px]" 
                    value={newRel.role} 
                    onChange={e => setNewRel({...newRel, role: e.target.value as any})}
                  >
                    <option value="PIHAK_1">PIHAK 1</option>
                    <option value="PIHAK_2">PIHAK 2</option>
                    <option value="SAKSI">SAKSI</option>
                    <option value="PERSETUJUAN_PIHAK_1">PERSETUJUAN</option>
                  </select>
                </div>
                
                {/* SEARCH OBJEK TANAH */}
                <div className="col-span-2 relative">
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 px-1 tracking-widest">Cari Objek Tanah (NOP/Nama NOP)</label>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Ketik NOP atau Nama yang tertera di NOP..."
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                      value={searchOP}
                      onChange={(e) => setSearchOP(e.target.value)}
                    />
                    {searchOP && !newRel.landId && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                        {allLands
                          .filter(l => (l.nop || "").includes(searchOP) || (l.atas_nama_nop || "").toLowerCase().includes(searchOP.toLowerCase()))
                          .map(l => (
                            <div 
                              key={l.id}
                              className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-none"
                              onClick={() => {
                                setNewRel({...newRel, landId: l.id});
                                setSearchOP(l.nop || 'TANPA NOP');
                              }}
                            >
                              <p className="text-[11px] font-black text-slate-800">{l.nop || 'NO NOP'}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">{l.atas_nama_nop} - {l.desa}</p>
                            </div>
                          ))}
                      </div>
                    )}
                    {newRel.landId && (
                      <button 
                        onClick={() => {setNewRel({...newRel, landId: ''}); setSearchOP('');}}
                        className="absolute right-3 top-3 text-red-500 hover:bg-red-50 rounded-full p-0.5"
                      >
                        <X size={14}/>
                      </button>
                    )}
                  </div>
                </div>

                <Button className="col-span-2 h-12 shadow-lg font-black tracking-widest" onClick={() => {
                    handleAddRel();
                    setSearchWP(''); // Reset setelah tambah
                    setSearchOP(''); // Reset setelah tambah
                }}>
                  HUBUNGKAN PIHAK KE BERKAS
                </Button>
              </div>

              <div className="space-y-4">
                {relations.map(r => (
                  <div key={r.id} className="flex justify-between p-3 bg-white border rounded-xl items-center">
                    <span className="font-bold text-sm">{toTitleCase(allIdentities.find(i => i.id === r.identitas_id)?.nama || '')}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded uppercase">{r.peran}</span>
                      <button onClick={() => deleteRel(r.id)} className="text-red-500"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
              <FileText size={80} strokeWidth={1}/>
              <p className="mt-4 font-black uppercase tracking-[0.5em] text-sm text-center">Pilih atau Buat Berkas</p>
          </div>
        )}
      </div>

      {/* OVERLAY FORM PEMBUATAN/EDIT BERKAS */}
      {isCreating && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6 overflow-y-auto">
          <Card className="w-full max-w-2xl relative shadow-2xl my-auto" title={editingId ? "Edit Berkas" : "Buat Berkas Baru"}>
            <button onClick={() => setIsCreating(false)} className="absolute top-6 right-8 p-2 text-slate-400 hover:text-red-500 transition-colors"><X size={24} /></button>
            <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
              
              <div className="grid grid-cols-2 gap-4">
                <Input label="Nomor Berkas" placeholder="Ex: 123/2024" value={formFile.nomor_berkas} onChange={e => setFormFile({...formFile, nomor_berkas: e.target.value})} />
                <Input label="Nomor Register" placeholder="Ex: REG-XXX" value={formFile.nomor_register} onChange={e => setFormFile({...formFile, nomor_register: e.target.value})} />
              </div>

              <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="col-span-2">
                  <DateInput label="Tanggal Berkas" value={formFile.tanggal} onChange={val => setFormFile({...formFile, tanggal: val, hari: getDayNameIndo(val)})} />
                </div>
                <div className="relative">
                   <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 px-1">Hari</label>
                   <div className="h-[46px] flex items-center justify-center bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg">
                      {formFile.hari || '-'}
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5 text-slate-400 px-1">Jenis Perolehan</label>
                  <input 
                    list="perolehan-options"
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none uppercase h-[50px]"
                    placeholder="Pilih/Ketik..."
                    value={formFile.jenis_perolehan}
                    onChange={e => setFormFile({...formFile, jenis_perolehan: e.target.value})}
                  />
                  <datalist id="perolehan-options">
                    <option value="WARIS" /><option value="JUAL BELI" /><option value="HIBAH" />
                    <option value="PEMBAGIAN HAK BERSAMA" /><option value="LELANG" />
                  </datalist>
                </div>
                <Input label="Tahun Perolehan" type="number" placeholder="Ex: 2024" value={formFile.tahun_perolehan} onChange={e => setFormFile({...formFile, tahun_perolehan: e.target.value})} />
              </div>

              {isWaris && (
                <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 space-y-4 animate-in slide-in-from-top-4">
                   <div className="flex items-center gap-2 mb-2">
                      <ShieldAlert size={16} className="text-amber-500" />
                      <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Input Khusus Waris</span>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <Input label="Reg. Waris Desa" placeholder="Nomor Reg. Desa..." value={formFile.register_waris_desa} onChange={e => setFormFile({...formFile, register_waris_desa: e.target.value})} />
                      <Input label="Reg. Waris Kecamatan" placeholder="Nomor Reg. Kec..." value={formFile.register_waris_kecamatan} onChange={e => setFormFile({...formFile, register_waris_kecamatan: e.target.value})} />
                      <div className="col-span-2 space-y-4">
                          <DateInput 
                            label="Tertanggal Waris" 
                            value={formFile.tanggal_waris} 
                            onChange={val => {
                              setFormFile({
                                ...formFile, 
                                tanggal_waris: val,
                                ejaan_tanggal_waris: val ? spellDateIndo(val) : '' 
                              });
                            }} 
                          />
                          <div className="bg-slate-50/80 p-4 rounded-2xl border border-dashed border-slate-200">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Terbilang Tanggal (Otomatis)</label>
                            <textarea
                              className="w-full bg-transparent border-none text-xs font-bold text-slate-600 outline-none resize-none italic leading-relaxed"
                              rows={2}
                              placeholder="Ejaan akan muncul di sini..."
                              value={formFile.ejaan_tanggal_waris || ''}
                              onChange={e => setFormFile({...formFile, ejaan_tanggal_waris: e.target.value})}
                            />
                          </div>
                      </div>
                   </div>
                </div>
              )}
              
              <Input label="Keterangan Tambahan" placeholder="Informasi pendukung..." value={formFile.keterangan} onChange={e => setFormFile({...formFile, keterangan: e.target.value})} />

              {/* SEKSI LOKASI OBJEK (INTEGRASI LANDMAP) */}
              <div className={`p-5 rounded-[2rem] border-2 transition-all duration-500 ${hasSelectedLocation ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-100 animate-pulse'}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl text-white shadow-lg ${hasSelectedLocation ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                      <MapPin size={24} />
                    </div>
                    <div>
                      <span className={`text-[10px] font-black uppercase tracking-widest block ${hasSelectedLocation ? 'text-emerald-600' : 'text-rose-600'}`}>
                        Lokasi Objek Tanah (Wajib)
                      </span>
                      <p className="text-sm font-black text-slate-700">
                        {hasSelectedLocation 
                          ? `${selectedCoords.lat.toFixed(6)}, ${selectedCoords.lng.toFixed(6)}` 
                          : 'Titik Koordinat Belum Ditentukan'}
                      </p>
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    variant={hasSelectedLocation ? "secondary" : "primary"}
                    onClick={() => setShowMapPicker(true)}
                    className="text-xs px-6"
                  >
                    {hasSelectedLocation ? "Ubah Lokasi" : "Buka Peta"}
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-4 pt-6 border-t">
                <Button variant="secondary" onClick={() => setIsCreating(false)}>Batal</Button>
                <Button onClick={handleSaveFile} className="px-12 shadow-blue-500/20 shadow-lg font-black"><Save size={18} className="mr-2"/> Simpan Berkas</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL POPUP UNTUK LANDMAP PICKER */}
      {showMapPicker && (
        <div className="fixed inset-0 z-[150] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-[40px] overflow-hidden shadow-2xl flex flex-col h-[85vh] border border-white/20">
            <div className="p-8 border-b flex justify-between items-center bg-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl"><MapPin size={24}/></div>
                <div>
                  <h3 className="font-black text-slate-800 text-xl uppercase tracking-tight">Tentukan Titik Objek</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Klik pada area tanah untuk menetapkan koordinat monitoring</p>
                </div>
              </div>
              <button onClick={() => setShowMapPicker(false)} className="p-3 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-red-500"><X size={28} /></button>
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
              <div className="absolute top-6 left-6 z-[1000] bg-white/90 backdrop-blur-md p-5 rounded-3xl shadow-2xl border border-white max-w-xs">
                 <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Koordinat Terdeteksi</p>
                 <div className="space-y-1">
                    <p className="text-sm font-mono font-black text-slate-800 flex justify-between"><span>LAT:</span> {selectedCoords.lat.toFixed(8)}</p>
                    <p className="text-sm font-mono font-black text-slate-800 flex justify-between"><span>LNG:</span> {selectedCoords.lng.toFixed(8)}</p>
                 </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t flex justify-between items-center">
              <p className="text-xs font-bold text-slate-400 italic">* Pastikan titik berada tepat di atas objek tanah yang dimaksud.</p>
              <div className="flex gap-4">
                <Button variant="secondary" onClick={() => setShowMapPicker(false)} className="px-8">Batal</Button>
                <Button 
                  disabled={!hasSelectedLocation}
                  onClick={() => setShowMapPicker(false)} 
                  className="px-12 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 shadow-xl"
                >
                  Konfirmasi Titik Lokasi
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};