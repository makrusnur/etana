import { useState, useEffect } from 'react';
import { db } from '../services/db';
import { FileRecord, PtslVillage } from '../types';
import { Button, Input, Card  } from '../components/UI';
import { Plus,  X, ChevronRight, Home, Map as MapIcon, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import {  getDayNameIndo } from '../utils';

export const PtslHalaman = () => {
  // States Data
  const [villages, setVillages] = useState<PtslVillage[]>([]);
  const [activeVillage, setActiveVillage] = useState<PtslVillage | null>(null);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [activeFile, setActiveFile] = useState<FileRecord | null>(null);
  
  // UI States
  const [isCreatingVillage, setIsCreatingVillage] = useState(false);
  const [modalFile, setModalFile] = useState<{show: boolean, mode: 'add' | 'edit'}>({ show: false, mode: 'add' });

  // Form States
  const [formVillage, setFormVillage] = useState<Partial<PtslVillage>>({ 
    nama_desa: '', 
    kecamatan: '', 
    tahun_anggaran: '2026', 
    target_kuota: 0 
  });

  const [formFile, setFormFile] = useState<Partial<FileRecord>>({
    nomor_berkas: '',
    nomor_register: '',
    kasun: '',
    jenis_tanah: '',
    nama_pemohon: '',
    asal_perolehan: '',
    tahun_pemohon: '',
    tahun_penjual: '',
    sebab_perolehan: '',
    bukti_perolehan: '',
    batas_utara: '',
    batas_timur: '',
    batas_selatan: '',
    batas_barat: '',
    cek_ktp: false, 
    cek_kk: false, 
    cek_sppt: false, 
    cek_bukti: false,
    keterangan: '',
    jenis_perolehan: '',
    tahun_perolehan: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const v = await db.ptslVillages.getAll();
      setVillages(v || []);
    } catch (err) { console.error("Gagal load desa:", err); }
  };

  const selectVillage = async (v: PtslVillage) => {
    setActiveVillage(v);
    setActiveFile(null);
    const allFiles = await db.files.getAll();
    // Filter berdasarkan village_id dan kategori
    setFiles(allFiles.filter(f => f.village_id === v.id && f.kategori === 'PTSL'));
  };

  // --- LOGIKA DESA ---
  const handleSaveVillage = async () => {
    if (!formVillage.nama_desa) return alert("Nama desa wajib diisi");
    const { id, ...payload } = { ...formVillage, created_at: new Date().toISOString() };
    
    try {
      // @ts-ignore
      await db.ptslVillages.add(payload);
      setIsCreatingVillage(false);
      setFormVillage({ nama_desa: '', kecamatan: '', tahun_anggaran: '2026', target_kuota: 0 });
      loadInitialData();
    } catch (err) { console.error(err); }
  };

  // --- LOGIKA BERKAS (Sesuai 12 Poin Perombakan) ---
  const handleSaveFile = async () => {
    if (!activeVillage || !formFile.nomor_berkas) return alert("NUB dan Desa wajib ada");
    
    const payload = {
      ...formFile,
      village_id: activeVillage.id,
      kategori: 'PTSL' as const,
      tanggal: formFile.tanggal || new Date().toISOString().split('T')[0],
      hari: getDayNameIndo(formFile.tanggal || new Date().toISOString().split('T')[0]),
      created_at: modalFile.mode === 'add' ? new Date().toISOString() : formFile.created_at
    };

    try {
      if (modalFile.mode === 'add') {
        const { id, ...addPayload } = payload;
        // @ts-ignore
        await db.files.add(addPayload);
      } else {
        if (!activeFile?.id) return;
        await db.files.update(activeFile.id, payload);
      }
      
      setModalFile({ show: false, mode: 'add' });
      resetFileForm();
      selectVillage(activeVillage);
    } catch (err) { console.error(err); }
  };

  const resetFileForm = () => {
    setFormFile({
      nomor_berkas: '', nomor_register: '', kasun: '', jenis_tanah: '',
      nama_pemohon: '', asal_perolehan: '', tahun_pemohon: '', tahun_penjual: '',
      sebab_perolehan: '', bukti_perolehan: '', batas_utara: '', batas_timur: '',
      batas_selatan: '', batas_barat: '', cek_ktp: false, cek_kk: false,
      cek_sppt: false, cek_bukti: false, keterangan: '', jenis_perolehan: '', tahun_perolehan: ''
    });
  };

  const handleDeleteFile = async (id: string) => {
    if (confirm("Hapus berkas ini?")) {
      await db.files.delete(id);
      if (activeVillage) selectVillage(activeVillage);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6">
      {/* HEADER & BREADCRUMBS */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 text-sm font-bold uppercase">
          <button onClick={() => { setActiveVillage(null); setActiveFile(null); }} className="flex items-center gap-1 text-slate-400 hover:text-emerald-600 transition-colors">
            <Home size={16}/> DASHBOARD
          </button>
          {activeVillage && (
            <>
              <ChevronRight size={14} className="text-slate-300"/>
              <span className="text-slate-800">DESA {activeVillage.nama_desa}</span>
            </>
          )}
        </div>
        {!activeVillage && (
          <Button onClick={() => setIsCreatingVillage(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus size={18} className="mr-2"/> Tambah Desa Proyek
          </Button>
        )}
      </div>

      {/* VIEW 1: GRID DESA */}
      {!activeVillage && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {villages.map(v => (
            <div key={v.id} onClick={() => selectVillage(v)} className="bg-white p-6 rounded-[32px] border-2 border-transparent hover:border-emerald-500 shadow-sm hover:shadow-xl transition-all cursor-pointer group">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><MapIcon size={24}/></div>
              <h3 className="text-xl font-black text-slate-800 uppercase leading-tight">{v.nama_desa}</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase mt-1 tracking-widest">Kec. {v.kecamatan}</p>
              <div className="mt-6 pt-4 border-t flex justify-between items-center">
                <span className="text-[9px] font-black bg-slate-100 px-3 py-1 rounded-full text-slate-500 uppercase">Target: {v.target_kuota} Bidang</span>
                <ChevronRight size={18} className="text-emerald-500" />
              </div>
            </div>
          ))}
          {villages.length === 0 && (
            <div className="col-span-full py-20 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-bold uppercase text-xs tracking-widest text-center">Belum ada desa proyek. Silakan tambah desa baru.</p>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: DAFTAR BERKAS */}
      {activeVillage && (
        <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center bg-white p-6 rounded-[32px] border shadow-sm">
            <div>
              <h2 className="text-2xl font-black text-slate-800 uppercase">Berkas PTSL</h2>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Sistem Administrasi Desa {activeVillage.nama_desa}</p>
            </div>
            <Button onClick={() => { resetFileForm(); setModalFile({ show: true, mode: 'add' }); }} className="bg-emerald-600">
              <Plus size={18} className="mr-2"/> Input Berkas Baru
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map(f => (
              <div key={f.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative">
                <div className="flex justify-between items-start mb-3">
                  <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase">NUB: {f.nomor_berkas}</div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setFormFile(f); setActiveFile(f); setModalFile({ show: true, mode: 'edit' }); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"><Edit2 size={14}/></button>
                    <button onClick={() => handleDeleteFile(f.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={14}/></button>
                  </div>
                </div>
                <h4 className="font-black text-slate-800 uppercase text-lg leading-tight mb-1">{f.nama_pemohon || 'Tanpa Nama'}</h4>
                <p className="text-[10px] font-bold text-slate-400 mb-4 tracking-tighter">NOP: {f.nomor_register || '-'}</p>
                
                <div className="grid grid-cols-2 gap-2 border-t pt-4 text-[9px] font-bold uppercase">
                   <div className="text-slate-500">Kasun: <span className="text-slate-800">{f.kasun || '-'}</span></div>
                   <div className="text-slate-500 text-right">Sebab: <span className="text-emerald-600">{f.sebab_perolehan || '-'}</span></div>
                </div>

                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-50">
                   {f.cek_ktp && <div title="KTP Ada"><CheckCircle2 size={14} className="text-emerald-500"/></div>}
                   {f.cek_kk && <div title="KK Ada"><CheckCircle2 size={14} className="text-emerald-500"/></div>}
                   {f.cek_sppt && <div title="SPPT Ada"><CheckCircle2 size={14} className="text-emerald-500"/></div>}
                   {f.cek_bukti && <div title="Bukti Ada"><CheckCircle2 size={14} className="text-emerald-500"/></div>}
                </div>
              </div>
            ))}
            {files.length === 0 && (
               <div className="col-span-full py-16 text-center text-slate-300 font-bold uppercase text-[10px] tracking-[0.2em]">Belum ada data berkas masuk</div>
            )}
          </div>
        </div>
      )}

      {/* MODAL INPUT/EDIT BERKAS (12 POIN LENGKAP) */}
      {modalFile.show && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto relative shadow-2xl p-8 rounded-[40px]" title={modalFile.mode === 'add' ? "Input Berkas PTSL Baru" : "Update Data Berkas"}>
            <button onClick={() => setModalFile({show: false, mode: 'add'})} className="absolute top-8 right-8 p-2 text-slate-400 hover:text-red-500 transition-colors"><X size={24}/></button>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
              {/* KOLOM KIRI: IDENTITAS TANAH */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="1. NUB" placeholder="000" value={formFile.nomor_berkas || ''} onChange={e => setFormFile({...formFile, nomor_berkas: e.target.value})} />
                  <Input label="2. NOP" placeholder="00.00..." value={formFile.nomor_register || ''} onChange={e => setFormFile({...formFile, nomor_register: e.target.value})} />
                </div>
                <Input label="3. KASUN / DUSUN" placeholder="Masukkan Nama Dusun" value={formFile.kasun || ''} onChange={e => setFormFile({...formFile, kasun: e.target.value})} />
                <Input label="4. JENIS TANAH" placeholder="Darat / Sawah / Yasan" value={formFile.jenis_tanah || ''} onChange={e => setFormFile({...formFile, jenis_tanah: e.target.value})} />
                <Input label="5. NAMA PEMOHON" placeholder="Nama Sesuai KTP" value={formFile.nama_pemohon || ''} onChange={e => setFormFile({...formFile, nama_pemohon: e.target.value})} />
                <Input label="6. ASAL PEROLEHAN DARI" placeholder="Nama Pemilik Sebelumnya" value={formFile.asal_perolehan || ''} onChange={e => setFormFile({...formFile, asal_perolehan: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="7. THN PEROLEHAN PEMOHON" type="number" placeholder="2024" value={formFile.tahun_pemohon || ''} onChange={e => setFormFile({...formFile, tahun_pemohon: e.target.value})} />
                  <Input label="8. THN PEROLEHAN PEMBERI" type="number" placeholder="2010" value={formFile.tahun_penjual || ''} onChange={e => setFormFile({...formFile, tahun_penjual: e.target.value})} />
                </div>
              </div>

              {/* KOLOM KANAN: LEGALITAS & BATAS */}
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">9. SEBAB PEROLEHAN</label>
                  <select className="w-full p-3 border rounded-2xl bg-slate-50 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 border-slate-200" value={formFile.sebab_perolehan || ''} onChange={e => setFormFile({...formFile, sebab_perolehan: e.target.value})}>
                    <option value="">-- Pilih Sebab --</option>
                    <option value="Jual Beli">JUAL BELI</option>
                    <option value="Hibah">HIBAH</option>
                    <option value="Waris">WARIS</option>
                    <option value="Tukar Menukar">TUKAR MENUKAR</option>
                    <option value="Pembagian Hak Bersama">PHB</option>
                  </select>
                </div>

                <Input label="10. BUKTI (SEGEL/AKTA/KWITANSI)" placeholder="No. Akta / Tgl Segel" value={formFile.bukti_perolehan || ''} onChange={e => setFormFile({...formFile, bukti_perolehan: e.target.value})} />
                
                <div className="p-5 bg-slate-50 rounded-[32px] border border-slate-200">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest text-center">11. BATAS-BATAS BIDANG</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Utara" value={formFile.batas_utara || ''} onChange={e => setFormFile({...formFile, batas_utara: e.target.value})} />
                    <Input placeholder="Timur" value={formFile.batas_timur || ''} onChange={e => setFormFile({...formFile, batas_timur: e.target.value})} />
                    <Input placeholder="Selatan" value={formFile.batas_selatan || ''} onChange={e => setFormFile({...formFile, batas_selatan: e.target.value})} />
                    <Input placeholder="Barat" value={formFile.batas_barat || ''} onChange={e => setFormFile({...formFile, batas_barat: e.target.value})} />
                  </div>
                </div>

                <div className="p-5 bg-emerald-50 rounded-[32px] border border-emerald-100">
                  <p className="text-[10px] font-black uppercase text-emerald-600 mb-4 tracking-widest text-center">12. KELENGKAPAN BERKAS (CEKLIS)</p>
                  <div className="grid grid-cols-2 gap-y-3 px-2">
                    <label className="flex items-center gap-3 text-xs font-bold text-slate-700 cursor-pointer group">
                      <input type="checkbox" checked={formFile.cek_ktp || false} onChange={e => setFormFile({...formFile, cek_ktp: e.target.checked})} className="w-5 h-5 rounded-lg border-emerald-300 text-emerald-600 focus:ring-emerald-500" /> 
                      <span className="group-hover:text-emerald-600">FOTOCOPI KTP</span>
                    </label>
                    <label className="flex items-center gap-3 text-xs font-bold text-slate-700 cursor-pointer group">
                      <input type="checkbox" checked={formFile.cek_kk || false} onChange={e => setFormFile({...formFile, cek_kk: e.target.checked})} className="w-5 h-5 rounded-lg border-emerald-300 text-emerald-600 focus:ring-emerald-500" /> 
                      <span className="group-hover:text-emerald-600">FOTOCOPI KK</span>
                    </label>
                    <label className="flex items-center gap-3 text-xs font-bold text-slate-700 cursor-pointer group">
                      <input type="checkbox" checked={formFile.cek_sppt || false} onChange={e => setFormFile({...formFile, cek_sppt: e.target.checked})} className="w-5 h-5 rounded-lg border-emerald-300 text-emerald-600 focus:ring-emerald-500" /> 
                      <span className="group-hover:text-emerald-600">SPPT PBB</span>
                    </label>
                    <label className="flex items-center gap-3 text-xs font-bold text-slate-700 cursor-pointer group">
                      <input type="checkbox" checked={formFile.cek_bukti || false} onChange={e => setFormFile({...formFile, cek_bukti: e.target.checked})} className="w-5 h-5 rounded-lg border-emerald-300 text-emerald-600 focus:ring-emerald-500" /> 
                      <span className="group-hover:text-emerald-600">BUKTI ALAS HAK</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-10">
              <Button variant="secondary" onClick={() => setModalFile({show: false, mode: 'add'})} className="px-8 font-black uppercase text-xs">Batal</Button>
              <Button onClick={handleSaveFile} className="bg-emerald-600 px-12 font-black uppercase text-xs shadow-lg shadow-emerald-200">
                {modalFile.mode === 'add' ? 'Simpan Berkas' : 'Update Berkas'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL: TAMBAH DESA */}
      {isCreatingVillage && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
          <Card className="w-full max-w-md relative shadow-2xl rounded-[40px]" title="Registrasi Desa Proyek">
            <button onClick={() => setIsCreatingVillage(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-red-500"><X size={20}/></button>
            <div className="space-y-4 pt-4">
              <Input label="Nama Desa" placeholder="Contoh: Sumberanyar" value={formVillage.nama_desa || ''} onChange={e => setFormVillage({...formVillage, nama_desa: e.target.value})} />
              <Input label="Kecamatan" placeholder="Contoh: Nguling" value={formVillage.kecamatan || ''} onChange={e => setFormVillage({...formVillage, kecamatan: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Tahun" value={formVillage.tahun_anggaran || ''} onChange={e => setFormVillage({...formVillage, tahun_anggaran: e.target.value})} />
                <Input label="Target" type="number" value={formVillage.target_kuota || 0} onChange={e => setFormVillage({...formVillage, target_kuota: parseInt(e.target.value)})} />
              </div>
              <div className="flex justify-end gap-2 pt-6">
                <Button variant="secondary" onClick={() => setIsCreatingVillage(false)} className="px-6 font-bold uppercase text-xs">Batal</Button>
                <Button onClick={handleSaveVillage} className="bg-emerald-600 px-8 font-bold uppercase text-xs">Simpan Desa</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};