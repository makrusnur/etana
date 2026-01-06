
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { FileRecord, Relation, Identity, LandData, RelationRole } from '../types';
import { Button, Input, Card, DateInput, Select } from '../components/UI';
import { Plus, Trash2, Search, FileText, Edit2, UserPlus, Info, MapPin, Calendar, Hash, FileCheck, Save, X, Coins, Clock } from 'lucide-react';
import { generateId, formatDateIndo, getDayNameIndo, terbilang } from '../utils';

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
    jenis_berkas: '', 
    tanggal: new Date().toISOString().split('T')[0],
    hari: getDayNameIndo(new Date().toISOString().split('T')[0]),
    nomor_berkas: '',
    nomor_register: '',
    keterangan: '',
    jenis_perolehan: '',
    tahun_perolehan: '',
    harga: 0,
    ejaan_harga: ''
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
      console.error("Gagal sinkron cloud:", err);
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
    if (!formFile.nomor_berkas?.trim() || !formFile.jenis_berkas?.trim()) return alert('Nomor Berkas dan Jenis Berkas wajib diisi!');

    try {
      const payload: FileRecord = {
        id: editingId || generateId(),
        nomor_berkas: formFile.nomor_berkas.toUpperCase(),
        nomor_register: formFile.nomor_register?.toUpperCase() || '',
        hari: formFile.hari || getDayNameIndo(formFile.tanggal || ''),
        jenis_berkas: formFile.jenis_berkas.toUpperCase(),
        tanggal: formFile.tanggal || '',
        keterangan: formFile.keterangan || '',
        jenis_perolehan: formFile.jenis_perolehan?.toUpperCase() || '',
        tahun_perolehan: formFile.tahun_perolehan || '',
        harga: formFile.harga || 0,
        ejaan_harga: formFile.ejaan_harga || '',
        created_at: formFile.created_at || new Date().toISOString()
      };

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

  const filteredFiles = files.filter(f => 
    f.nomor_berkas.toLowerCase().includes(fileSearch.toLowerCase()) || 
    f.jenis_berkas.toLowerCase().includes(fileSearch.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-2rem)] flex gap-6 overflow-hidden">
      {/* SIDEBAR DAFTAR BERKAS */}
      <div className="w-1/3 flex flex-col gap-4 border-r border-slate-200 pr-6 overflow-y-auto">
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
            placeholder="Cari No. Berkas / Jenis..." 
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all" 
            value={fileSearch} 
            onChange={e => setFileSearch(e.target.value)} 
          />
        </div>

        <div className="space-y-2 mt-2">
          {isLoading ? (
            <div className="text-center p-10 flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Syncing Cloud...</span>
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
                  <div>
                    <div className="font-black text-slate-800 tracking-tight">{f.nomor_berkas}</div>
                    <div className="text-[10px] uppercase font-black text-blue-600 mt-1">{f.jenis_berkas}</div>
                    <div className="text-[9px] text-slate-400 font-bold mt-2 flex items-center gap-1">
                      <Calendar size={10} /> {formatDateIndo(f.tanggal)}
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
          {filteredFiles.length === 0 && !isLoading && (
             <div className="text-center p-10 border-2 border-dashed border-slate-200 rounded-2xl text-slate-300 text-xs font-bold uppercase">Tidak ada berkas</div>
          )}
        </div>
      </div>

      {/* DETAIL BERKAS & RELASI */}
      <div className="w-2/3 overflow-y-auto pr-2">
        {activeFile ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-start bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                <div>
                   <h3 className="text-2xl font-black text-slate-800">{activeFile.jenis_berkas}</h3>
                   <p className="text-slate-500 font-bold tracking-tighter">Nomor: {activeFile.nomor_berkas} {activeFile.nomor_register && ` / Reg: ${activeFile.nomor_register}`}</p>
                </div>
                <div className="bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100 text-right">
                   <div className="text-[10px] font-black text-blue-600 uppercase">Hari & Tanggal</div>
                   <div className="text-sm font-bold text-blue-800">{activeFile.hari}, {formatDateIndo(activeFile.tanggal)}</div>
                </div>
            </div>

            <Card title="Struktur Relasi Pihak">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-200 mb-8">
                <div className="col-span-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 px-1">Pilih Subjek</label>
                  <select className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" value={newRel.identityId} onChange={e => setNewRel({...newRel, identityId: e.target.value})}>
                    <option value="">-- Cari Nama --</option>
                    {allIdentities.map(i => <option key={i.id} value={i.id}>{i.nama}</option>)}
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 px-1">Peran Dalam Akta</label>
                  <select className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" value={newRel.role} onChange={e => setNewRel({...newRel, role: e.target.value as any})}>
                    <option value="PIHAK_1">PIHAK 1 (Penjual/Pemberi)</option>
                    <option value="PIHAK_2">PIHAK 2 (Pembeli/Penerima)</option>
                    <option value="SAKSI">SAKSI</option>
                    <option value="PERSETUJUAN_PIHAK_1">PEMBERI PERSETUJUAN</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 px-1">Objek Tanah Terkait (Opsional)</label>
                  <select className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500" value={newRel.landId} onChange={e => setNewRel({...newRel, landId: e.target.value})}>
                    <option value="">-- Tanpa Objek Tanah --</option>
                    {allLands.map(l => <option key={l.id} value={l.id}>{l.nop} - {l.atas_nama_nop}</option>)}
                  </select>
                </div>
                <Button className="col-span-2 h-12 font-black uppercase tracking-widest shadow-lg shadow-blue-500/20" onClick={handleAddRel}>
                   Hubungkan Subjek ke Berkas
                </Button>
              </div>

              <div className="space-y-6">
                {['PIHAK_1', 'PIHAK_2', 'SAKSI', 'PERSETUJUAN_PIHAK_1'].map(role => {
                  const roleRels = relations.filter(r => r.peran === role);
                  if (roleRels.length === 0) return null;
                  return (
                    <div key={role} className="space-y-3">
                      <div className="flex items-center gap-2">
                         <div className="h-px flex-1 bg-slate-200"></div>
                         <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{role.replace(/_/g, ' ')}</div>
                         <div className="h-px flex-1 bg-slate-200"></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {roleRels.map(r => (
                          <div key={r.id} className="flex justify-between items-center p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-blue-300 transition-colors group">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black text-slate-400">{role.charAt(0)}</div>
                               <span className="font-bold text-sm text-slate-700">{allIdentities.find(i => i.id === r.identitas_id)?.nama}</span>
                            </div>
                            <button onClick={() => deleteRel(r.id)} className="text-slate-300 hover:text-red-500 p-2 transition-colors"><Trash2 size={16}/></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 bg-white rounded-[40px] border border-dashed border-slate-200">
            <div className="p-8 bg-slate-50 rounded-full mb-6">
              <FileText size={64} className="opacity-20" />
            </div>
            <p className="font-black uppercase text-sm tracking-[0.3em]">Pilih Berkas Untuk Mengelola Relasi</p>
          </div>
        )}
      </div>

      {/* MODAL INPUT BERKAS BARU */}
      {isCreating && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden border border-white/20 modal-enter">
            <div className="p-8 bg-slate-800 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black uppercase tracking-widest">{editingId ? 'Edit Berkas' : 'Tambah Berkas Baru'}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Identifikasi Dokumen Notaris</p>
              </div>
              <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
            </div>

            <div className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Nomor Berkas" value={formFile.nomor_berkas} onChange={e => setFormFile({...formFile, nomor_berkas: e.target.value})} placeholder="Contoh: 123/2024" />
                <Input label="Nomor Register" value={formFile.nomor_register} onChange={e => setFormFile({...formFile, nomor_register: e.target.value})} placeholder="Opsional" />
              </div>

              <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="col-span-2">
                  <DateInput label="Tanggal Berkas" value={formFile.tanggal} onChange={d => setFormFile({...formFile, tanggal: d, hari: getDayNameIndo(d)})} />
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Hari</label>
                   <div className="h-[42px] flex items-center justify-center bg-blue-600 text-white rounded-lg text-sm font-black uppercase tracking-tighter shadow-inner">{formFile.hari || '-'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="mb-3">
                   <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Jenis Perolehan</label>
                   <input 
                    list="perolehan-options"
                    placeholder="Pilih/Ketik..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formFile.jenis_perolehan}
                    onChange={e => setFormFile({...formFile, jenis_perolehan: e.target.value})}
                   />
                   <datalist id="perolehan-options">
                      <option value="Jual Beli"/><option value="Hibah"/><option value="Waris"/><option value="Tukar Menukar"/><option value="Pembagian Hak Bersama"/>
                   </datalist>
                 </div>
                 <Input label="Tahun Perolehan" value={formFile.tahun_perolehan} onChange={e => setFormFile({...formFile, tahun_perolehan: e.target.value})} placeholder="Contoh: 2024" />
              </div>

              <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 shadow-inner">
                <label className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-2 mb-2"><Coins size={14}/> Nilai Transaksi / Harga</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-blue-400">Rp</span>
                  <input type="number" className="w-full bg-white border border-blue-200 rounded-xl p-3 pl-10 text-xl font-black text-blue-700 outline-none focus:ring-2 focus:ring-blue-500" value={formFile.harga} onChange={e => {
                    const v = parseFloat(e.target.value) || 0;
                    setFormFile({...formFile, harga: v, ejaan_harga: terbilang(v) + " rupiah"});
                  }} />
                </div>
                <div className="text-[10px] font-black text-blue-400 mt-2 italic capitalize tracking-tight leading-none">{formFile.ejaan_harga || 'nol rupiah'}</div>
              </div>

              <Input label="Jenis Berkas (Judul Akta)" value={formFile.jenis_berkas} onChange={e => setFormFile({...formFile, jenis_berkas: e.target.value})} placeholder="Contoh: Akta Jual Beli" />
              
              <div className="pt-4 flex gap-3">
                <Button onClick={handleSaveFile} className="flex-1 h-14 font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20">Simpan Data Berkas</Button>
                <Button variant="secondary" onClick={() => setIsCreating(false)} className="px-8 font-bold">Batal</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
