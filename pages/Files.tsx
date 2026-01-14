import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { FileRecord, Relation, Identity, LandData, RelationRole } from '../types';
import { Button, Input, Card, DateInput } from '../components/UI';
import { Plus, Trash2, Search, FileText, Edit2,  Calendar, Save, X, Clock, ShieldAlert } from 'lucide-react';
import { generateId, formatDateIndo, getDayNameIndo, toTitleCase } from '../utils';

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
    } catch (err) {
      setRelations([]);
    }
    setNewRel({ identityId: '', role: 'PIHAK_1', landId: '' });
  };

  const handleSaveFile = async () => {
    if (!formFile.nomor_berkas?.trim() || !formFile.jenis_perolehan?.trim()) {
      return alert('Nomor Berkas dan Jenis Perolehan wajib diisi!');
    }

    try {
      const payload: FileRecord = {
        ...initialFileState,
        ...formFile,
        id: editingId || generateId(),
        kategori: 'PPAT_NOTARIS',
        nomor_berkas: formFile.nomor_berkas!.toUpperCase(),
        nomor_register: formFile.nomor_register?.toUpperCase() || '',
        hari: formFile.hari || getDayNameIndo(formFile.tanggal || ''),
        jenis_perolehan: formFile.jenis_perolehan!.toUpperCase(),
        created_at: formFile.created_at || new Date().toISOString()
      } as FileRecord;

      if (editingId) {
        await db.files.update(editingId, payload);
      } else {
        await db.files.add(payload);
      }

      setIsCreating(false);
      setEditingId(null);
      setFormFile(initialFileState);
      await refreshData();
      setActiveFile(payload);
    } catch (err) {
      alert("Gagal menyimpan data.");
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
      id: generateId(),
      berkas_id: activeFile.id,
      identitas_id: newRel.identityId,
      peran: newRel.role,
      data_tanah_id: newRel.landId || undefined
    };
    await db.relations.add(rel);
    setRelations(await db.relations.getByFileId(activeFile.id));
    setNewRel({ ...newRel, identityId: '' });
  };

  const deleteRel = async (id: string) => {
    await db.relations.delete(id);
    if (activeFile) setRelations(await db.relations.getByFileId(activeFile.id));
  };

  // LOKASI: Sekitar baris 139
  const filteredFiles = files.filter(f => {
  // 1. Cek apakah kategorinya PPAT_NOTARIS (atau kosong untuk data lama)
  const isKategoriCocok = f.kategori === 'PPAT_NOTARIS' || !f.kategori;
  // 2. Cek apakah cocok dengan pencarian
  const isSearchCocok = f.nomor_berkas.toLowerCase().includes(fileSearch.toLowerCase()) || 
                       f.jenis_perolehan.toLowerCase().includes(fileSearch.toLowerCase());
  // PASTIKAN BARIS RETURN INI MENGGUNAKAN KEDUANYA:
  return isKategoriCocok && isSearchCocok; 
  });

  const isWaris = formFile.jenis_perolehan?.toUpperCase().includes('WARIS');

  return (
    <div className="h-[calc(100vh-2rem)] flex gap-6 overflow-hidden">
      {/* SIDEBAR DAFTAR BERKAS */}
      <div className="w-1/3 flex flex-col gap-4 border-r border-slate-200 pr-6 overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center sticky top-0 bg-slate-50 py-2 z-10 border-b border-slate-100 mb-2">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Manajemen Berkas</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">PPAT Administration</p>
          </div>
          <Button onClick={() => { setIsCreating(true); setEditingId(null); setFormFile(initialFileState); }}>
            <Plus size={18} />
          </Button>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input 
            placeholder="Cari No. Berkas / Perolehan..." 
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all" 
            value={fileSearch} 
            onChange={e => setFileSearch(e.target.value)} 
          />
        </div>

        <div className="space-y-2 mt-2">
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
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 relative group ${
                  activeFile?.id === f.id 
                    ? 'border-blue-500 bg-white shadow-xl scale-[1.02]' 
                    : 'bg-white border-transparent hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-2">
                    <div className="font-black text-slate-800 tracking-tight break-words">{f.nomor_berkas}</div>
                    <div className="text-[10px] uppercase font-black text-blue-600 mt-1">{f.jenis_perolehan}</div>
                    <div className="text-[9px] text-slate-400 font-bold mt-2 flex items-center gap-1">
                      <Calendar size={10} /> {formatDateIndo(f.tanggal)} ({f.hari})
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => handleEditFile(e, f)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg"><Edit2 size={16}/></button>
                    <button onClick={(e) => handleDeleteFile(e, f.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
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
            <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 px-1 tracking-widest">
                    Objek Tanah Terhubung (Opsional)
                  </label>
                  <select 
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm font-bold appearance-none" 
                    value={newRel.landId} 
                    onChange={e => setNewRel({...newRel, landId: e.target.value})}
                  >
                    <option value="">-- Tanpa Hubungan Objek Tanah --</option>
                    
                    {/* TAMBAHKAN ATAU PASTIKAN BAGIAN INI ADA: */}
                    {allLands.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.nop} - {l.atas_nama_nop}
                      </option>
                    ))}
                    
                  </select>
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
               {/* Konten Relasi tetap sama */}
               <div className="grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-200 mb-8 shadow-inner">
                <div className="col-span-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 px-1 tracking-widest">Pilih Subjek</label>
                  <select className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm font-bold appearance-none" value={newRel.identityId} onChange={e => setNewRel({...newRel, identityId: e.target.value})}>
                    <option value="">-- Cari Nama --</option>
                    {allIdentities.map(i => <option key={i.id} value={i.id}>{toTitleCase(i.nama)}</option>)}
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 px-1 tracking-widest">Peran</label>
                  <select className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm font-bold appearance-none" value={newRel.role} onChange={e => setNewRel({...newRel, role: e.target.value as any})}>
                    <option value="PIHAK_1">PIHAK 1</option>
                    <option value="PIHAK_2">PIHAK 2</option>
                    <option value="SAKSI">SAKSI</option>
                    <option value="PERSETUJUAN_PIHAK_1">PERSETUJUAN</option>
                  </select>
                </div>
                <Button className="col-span-2 h-12" onClick={handleAddRel}>Hubungkan Pihak</Button>
              </div>
              {/* List Relasi */}
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
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6">
          <Card className="w-full max-w-2xl relative shadow-2xl" title={editingId ? "Edit Berkas" : "Buat Berkas Baru"}>
            <button onClick={() => setIsCreating(false)} className="absolute top-6 right-8 p-2 text-slate-400 hover:text-red-500"><X size={24} /></button>
            <div className="space-y-4">
              
              {/* BARIS 1: NOMOR BERKAS & REGISTER */}
              <div className="grid grid-cols-2 gap-4">
                <Input label="Nomor Berkas" placeholder="Ex: 123/2024" value={formFile.nomor_berkas} onChange={e => setFormFile({...formFile, nomor_berkas: e.target.value})} />
                <Input label="Nomor Register" placeholder="Ex: REG-XXX" value={formFile.nomor_register} onChange={e => setFormFile({...formFile, nomor_register: e.target.value})} />
              </div>

              {/* BARIS 2: TANGGAL BERKAS (FULL WIDTH) */}
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

              {/* BARIS 3: JENIS PEROLEHAN & TAHUN PEROLEHAN */}
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

              {/* BARIS 4: KONDISIONAL KHUSUS WARIS (MUNCUL DI BAWAH JENIS PEROLEHAN) */}
              {isWaris && (
                <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 space-y-4 animate-in slide-in-from-top-4">
                   <div className="flex items-center gap-2 mb-2">
                      <ShieldAlert size={16} className="text-amber-500" />
                      <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Input Khusus Waris</span>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <Input label="Reg. Waris Desa" placeholder="Nomor Reg. Desa..." value={formFile.register_waris_desa} onChange={e => setFormFile({...formFile, register_waris_desa: e.target.value})} />
                      <Input label="Reg. Waris Kecamatan" placeholder="Nomor Reg. Kec..." value={formFile.register_waris_kecamatan} onChange={e => setFormFile({...formFile, register_waris_kecamatan: e.target.value})} />
                      <div className="col-span-2">
                         <DateInput label="Tertanggal Waris" value={formFile.tanggal_waris} onChange={val => setFormFile({...formFile, tanggal_waris: val})} />
                      </div>
                   </div>
                </div>
              )}
              
              <Input label="Keterangan Tambahan" placeholder="Informasi pendukung..." value={formFile.keterangan} onChange={e => setFormFile({...formFile, keterangan: e.target.value})} />
              
              <div className="flex justify-end gap-3 mt-4 pt-6 border-t">
                <Button variant="secondary" onClick={() => setIsCreating(false)}>Batal</Button>
                <Button onClick={handleSaveFile} className="px-12 shadow-blue-500/20 shadow-lg font-black"><Save size={18} className="mr-2"/> Simpan Berkas</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};