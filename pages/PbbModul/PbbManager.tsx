import React, { useState, useEffect, useRef } from 'react';
import { 
  Edit2,Printer, Map as MapIcon, Table as TableIcon,
  Search, Plus, Save, X, LayoutDashboard, 
  ChevronRight, Building2, Map, Users, Settings2,
  Trash2, Loader2, Home, FileText, Globe
} from 'lucide-react';
import { supabase } from '../../services/db';
import { PBB_OPTIONS, sanitizePbbPayload } from '../../types';
import LandMap from '../../components/LandMap';

export const PbbManager = () => {
  const [loading, setLoading] = useState(false);
  const [kecamatans, setKecamatans] = useState<any[]>([]);
  const [desas, setDesas] = useState<any[]>([]);
  const [selectedDesa, setSelectedDesa] = useState<any>(null);
  const [pbbRecords, setPbbRecords] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialForm: any = {
    tahun_pajak: '2026',
    tgl_rekam: new Date().toISOString().split('T')[0],
    nop: '', nama_wp: '', nik: '', npwp: '', pekerjaan: 'SWASTA', status_wp: 'PEMILIK',
    jalan_op: '', blok_op: '', rt_op: '', rw_op: '',
    jalan_wp: '', rt_wp: '', rw_wp: '', kel_wp: '', kab_wp: '',
    luas_bumi: '', znt: '', jenis_tanah: 'TANAH DARAT',
    luas_bng: '', jumlah_lantai: '1', tahun_dibangun: '', kondisi_umum: 'BAIK', daya_listrik: '',
    m_lantai: 'KERAMIK', m_dinding: 'TEMBOK BATA', m_langit: 'GYPSUM', m_atap: 'GENTENG KERAMIK',
    f_ac_split: '', f_ac_window: '', f_ac_central: '',
    f_kolam_luas: '', f_kolam_finishing: 'DIPLESTER',
    f_pagar_panjang: '', f_pagar_bahan: 'BATA/BATAKO',
    f_paving_luas: '', f_lift_penumpang: '', f_lift_barang: '',
    f_pemadam_hydrant: false, f_pemadam_sprinkler: false, f_pemadam_alarm: false,
    latitude: '',longitude: ''
  };


  const [isEdit, setIsEdit] = useState(false); // Tambahkan ini
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    const fetchWilayah = async () => {
      try {
        const { data: kec } = await supabase.from('kecamatan').select('*').order('nama');
        const { data: des } = await supabase.from('desa').select('*').order('nama');
        setKecamatans(kec || []);
        setDesas(des || []);
      } catch (error) {
        console.error("Error load wilayah:", error);
      }
    };
    fetchWilayah();
  }, []);

  useEffect(() => {
    // Ambil ID dari URL (Contoh: #/pbb?edit=12)
    const hashParts = window.location.hash.split('?');
    const params = new URLSearchParams(hashParts.length > 1 ? hashParts[1] : '');
    const editId = params.get('edit');
  
    // Jika tidak ada ID yang mau diedit, jangan lakukan apa-apa
    if (!editId) return;
  
    const initiateEdit = async () => {
      try {
        // 1. Cari dulu di data yang sudah ter-load (pbbRecords)
        let target = pbbRecords.find(r => String(r.id) === String(editId));
  
        // 2. Kalau tidak ada (karena beda desa), tarik paksa langsung ke database
        if (!target) {
          const { data, error } = await supabase
            .from('pbb_records')
            .select('*')
            .eq('id', editId)
            .single();
          
          if (error) throw error;
          target = data;
        }
  
        // 3. Masukkan ke Form jika data ditemukan
        if (target) {
          setFormData({
            ...initialForm, // Template field lengkap
            ...target,      // Timpa dengan data dari DB
            latitude: target.latitude?.toString() || '',
            longitude: target.longitude?.toString() || ''
          });
  
          // Nyalakan semua trigger untuk buka modal
          setEditingId(editId);
          setIsEdit(true);
          setIsModalOpen(true);
  
          // Bersihkan URL agar tidak looping saat refresh
          window.history.replaceState(null, '', '#/pbb');
        }
      } catch (err) {
        console.error("Gagal melakukan Global Edit:", err);
      }
    };
  
    initiateEdit();
  }, [pbbRecords, window.location.hash]); // Pantau perubahan data dan URL
    
  const fetchRecords = async (desaId: string) => {
    setLoading(true);
    const { data } = await supabase.from('pbb_records').select('*').eq('desa_id', desaId).order('created_at', { ascending: false });
    setPbbRecords(data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (formData.nop.length !== 18) return alert("NOP harus 18 digit!");
    setLoading(true);
    const cleanData = sanitizePbbPayload(formData);
    
    let error;
    if (editingId) {
      // Jika ada editingId, lakukan UPDATE
      const { error: err } = await supabase.from('pbb_records').update(cleanData).eq('id', editingId);
      error = err;
    } else {
      // Jika tidak ada, lakukan INSERT
      const { error: err } = await supabase.from('pbb_records').insert([{
        ...cleanData,
        desa_id: selectedDesa.id,
        kecamatan_id: selectedDesa.kecamatan_id
      }]);
      error = err;
    }

    if (!error) {
      setIsModalOpen(false);
      setEditingId(null); // Reset mode edit
      setFormData(initialForm);
      fetchRecords(selectedDesa.id);
    } else {
      alert("Error: " + error.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus data ini?")) return;
    await supabase.from('pbb_records').delete().eq('id', id);
    fetchRecords(selectedDesa.id);
  };
  // Fungsi untuk memicu Mode Edit
  const handleEdit = (record: any) => {
    setEditingId(record.id);
    setFormData({ ...record }); // Mengisi form dengan data yang akan diedit
    setIsModalOpen(true);
  };

  // Fungsi Cetak SPOP Pasuruan
  const handlePrint = (r: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const nopArr = r.nop.padEnd(18, ' ').split('');
    const html = `
      <html>
        <head>
          <title>SPOP - ${r.nama_wp}</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 11px; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; margin-bottom: 15px; }
            .nop-box { display: inline-block; width: 18px; border: 1px solid #000; text-align: center; margin-right: 2px; font-weight: bold; line-height: 20px; }
            .section { border: 1px solid #000; padding: 10px; margin-bottom: 10px; }
            .title { font-weight: bold; background: #eee; padding: 4px; border-bottom: 1px solid #000; margin: -10px -10px 10px -10px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; }
          </style>
        </head>
        <body>
          <div class="header">
            <h3 style="margin:0">PEMERINTAH KABUPATEN PASURUAN</h3>
            <h4 style="margin:0">BADAN PENGELOLAAN KEUANGAN DAN PENDAPATAN DAERAH</h4>
            <h2 style="text-decoration: underline; margin: 10px 0;">SURAT PEMBERITAHUAN OBJEK PAJAK (SPOP)</h2>
          </div>
          <p><strong>NOP:</strong> ${nopArr.map(n => `<span class="nop-box">${n}</span>`).join('')}</p>
          <div class="section">
            <div class="title">A. LETAK OBJEK PAJAK</div>
            <p>Jalan/Blok: ${r.jalan_op || '-'} / ${r.blok_op || '-'}</p>
            <p>RT/RW: ${r.rt_op}/${r.rw_op} | Desa: ${selectedDesa.nama}</p>
          </div>
          <div class="section">
            <div class="title">B. DATA SUBJEK PAJAK</div>
            <div class="grid">
              <div> Nama: ${r.nama_wp}<br>NIK: ${r.nik} </div>
              <div> Pekerjaan: ${r.pekerjaan}<br>Status: ${r.status_wp} </div>
            </div>
          </div>
          <div class="section">
            <div class="title">C. DATA BUMI & BANGUNAN</div>
            <div class="grid">
              <div> Luas Bumi: ${r.luas_bumi} m2<br>ZNT: ${r.znt} </div>
              <div> Luas Bng: ${r.luas_bng} m2<br>Tahun: ${r.tahun_dibangun} </div>
            </div>
          </div>
          <div style="margin-top:30px; display:flex; justify-content:space-between; text-align:center;">
             <div style="width:200px">Petugas Pendata<br><br><br>( ........................ )</div>
             <div style="width:200px">Pasuruan, ${new Date().toLocaleDateString('id-ID')}<br>Wajib Pajak<br><br><br><strong>${r.nama_wp}</strong></div>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredDesas = desas.filter(d => d.nama.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased overflow-hidden">
      
      {/* SIDEBAR: ELEGANT & MINIMAL */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 px-2 mb-6">
            <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-indigo-100">
              <Globe size={20} />
            </div>
            <span className="font-bold text-lg tracking-tight">Wilayah PBB</span>
          </div>

          <button 
            onClick={() => setSelectedDesa(null)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${!selectedDesa ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <LayoutDashboard size={16}/> Ringkasan
          </button>

          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={14}/>
            <input 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-transparent border rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all" 
              placeholder="Cari desa..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-6 scrollbar-thin">
          {kecamatans.map(kec => (
            <div key={kec.id} className="space-y-1">
              <div className="px-3 py-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kec.nama}</span>
              </div>
              {filteredDesas.filter(d => d.kecamatan_id === kec.id).map(desa => (
                <button 
                  key={desa.id} 
                  onClick={() => { setSelectedDesa(desa); fetchRecords(desa.id); }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${selectedDesa?.id === desa.id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {desa.nama}
                  <ChevronRight size={14} className={`transition-transform ${selectedDesa?.id === desa.id ? 'translate-x-0' : '-translate-x-2 opacity-0 group-hover:opacity-100'}`} />
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN CONTENT: CLEAN CANVAS */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {!selectedDesa ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-white m-4 rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 border border-slate-100">
              <Home size={40} className="text-slate-300" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Manajemen Pajak Daerah</h2>
            <p className="text-slate-400 text-sm mt-2 font-medium">Silahkan pilih wilayah untuk mulai mengelola data.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col p-8">
            <header className="flex justify-between items-end mb-10">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-3">
                  <span className="bg-indigo-50 px-2 py-1 rounded">MODUL PBB-P2</span>
                  <ChevronRight size={12}/>
                  <span className="text-slate-400">{selectedDesa.nama}</span>
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Daftar Objek Pajak</h2>
              </div>
              <button 
                onClick={() => { setEditingId(null); setFormData(initialForm); setIsModalOpen(true); }} 
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"  >
                <Plus size={18}/> ENTRI DATA BARU
              </button>
            </header>

            <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identitas WP</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nomor Objek Pajak</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Luas Bumi / Bangunan</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {pbbRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-8 py-5">
                          <p className="text-sm font-bold text-slate-800">{r.nama_wp}</p>
                          <p className="text-xs font-medium text-slate-400 mt-0.5">{r.nik}</p>
                        </td>
                        <td className="px-8 py-5">
                          <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-mono text-xs font-bold tracking-wider">
                            {r.nop}
                          </div>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase mt-1.5">{r.jalan_op} {r.blok_op}</p>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-sm font-bold text-slate-700">{r.luas_bumi}m² <span className="text-slate-300 mx-1">/</span> {r.luas_bng}m²</p>
                          <div className="flex items-center gap-1.5 mt-1">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                             <span className="text-[10px] font-bold text-slate-500 uppercase">ZNT: {r.znt}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* TOMBOL PRINT */}
                          <button onClick={() => handlePrint(r)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl" title="Cetak SPOP">
                            <Printer size={16}/>
                          </button>
                          
                          {/* TOMBOL EDIT */}
                          <button onClick={() => handleEdit(r)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl" title="Edit Data">
                            <Edit2 size={16}/>
                          </button>
                          
                          {/* TOMBOL HAPUS */}
                          <button onClick={() => handleDelete(r.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl">
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pbbRecords.length === 0 && !loading && (
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-slate-400">
                  <FileText size={40} className="mb-4 opacity-20" />
                  <p className="text-sm font-medium">Belum ada data terekam di wilayah ini.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL: CLEAN 2-COLUMN GRID */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-6xl h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="px-10 py-6 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl"><Building2 size={24}/></div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{editingId ? 'Update Data SPOP' : 'Formulir SPOP Digital'}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pendataan Objek & Subjek Pajak</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-100 rounded-full transition-all"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-12 scrollbar-hide">
              
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] bg-slate-900 text-white w-6 h-6 flex items-center justify-center rounded-lg font-black italic">01</span>
                  <h4 className="font-bold text-xs uppercase tracking-widest text-slate-800">Informasi NOP & Lokasi</h4>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Digit Nomor Objek Pajak</label>
                    <DigitInput 
                      length={18} value={formData.nop} 
                      onChange={(v: string) => setFormData({...formData, nop: v})} 
                      format={[2, 2, 3, 3, 3, 4, 1]} 
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <Input label="Jalan / Dusun" value={formData.jalan_op} onChange={(v: string) => setFormData({...formData, jalan_op: v})} />
                    <Input label="Blok / Nomor" value={formData.blok_op} onChange={(v: string) => setFormData({...formData, blok_op: v})} />
                    <Input label="RT" value={formData.rt_op} onChange={(v: string) => setFormData({...formData, rt_op: v})} />
                    <Input label="RW" value={formData.rw_op} onChange={(v: string) => setFormData({...formData, rw_op: v})} />
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] bg-slate-900 text-white w-6 h-6 flex items-center justify-center rounded-lg font-black italic">02</span>
                  <h4 className="font-bold text-xs uppercase tracking-widest text-slate-800">Subjek Pajak (Identitas WP)</h4>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Nomor Induk Kependudukan (16 Digit)</label>
                    <DigitInput length={16} value={formData.nik} onChange={(v: string) => setFormData({...formData, nik: v})} format={[4, 4, 4, 4]} />
                  </div>
                  <Input label="Nama Lengkap" value={formData.nama_wp} onChange={(v: string) => setFormData({...formData, nama_wp: v})} />
                  <Input label="NPWP (Opsional)" value={formData.npwp} onChange={(v: string) => setFormData({...formData, npwp: v})} />
                  <Select label="Pekerjaan" value={formData.pekerjaan} onChange={(v: string) => setFormData({...formData, pekerjaan: v})} options={PBB_OPTIONS.PEKERJAAN} />
                  <div className="col-span-2"><Input label="Alamat Sesuai KTP" value={formData.jalan_wp} onChange={(v: string) => setFormData({...formData, jalan_wp: v})} /></div>
                  <Select label="Status Hubungan" value={formData.status_wp} onChange={(v: string) => setFormData({...formData, status_wp: v})} options={PBB_OPTIONS.STATUS_WP} />
                </div>
              </section>

              <div className="grid grid-cols-2 gap-10">
                <section className="p-8 bg-indigo-50/50 rounded-3xl border border-indigo-100/50 space-y-6">
                  <h4 className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-indigo-900"><Map size={14}/> Detail Bumi</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Luas (m2)" type="number" value={formData.luas_bumi} onChange={(v: string) => setFormData({...formData, luas_bumi: v})} />
                    <Input label="Kode ZNT" value={formData.znt} onChange={(v: string) => setFormData({...formData, znt: v})} />
                    <div className="col-span-2"><Select label="Kategori Tanah" value={formData.jenis_tanah} onChange={(v: string) => setFormData({...formData, jenis_tanah: v})} options={PBB_OPTIONS.JENIS_TANAH} /></div>
                  </div>
                </section>
                
                <section className="p-8 bg-slate-50 rounded-3xl border border-slate-200/50 space-y-6">
                  <h4 className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-slate-900"><Building2 size={14}/> Bangunan Utama</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Luas (m2)" type="number" value={formData.luas_bng} onChange={(v: string) => setFormData({...formData, luas_bng: v})} />
                    <Input label="Jml Lantai" type="number" value={formData.jumlah_lantai} onChange={(v: string) => setFormData({...formData, jumlah_lantai: v})} />
                    <Input label="Thn Bangun" value={formData.tahun_dibangun} onChange={(v: string) => setFormData({...formData, tahun_dibangun: v})} />
                    <Select label="Kondisi" value={formData.kondisi_umum} onChange={(v: string) => setFormData({...formData, kondisi_umum: v})} options={PBB_OPTIONS.KONDISI_BNG} />
                  </div>
                </section>
              </div>

              <section className="p-8 border border-slate-100 rounded-3xl space-y-8">
                <h4 className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-slate-800"><Settings2 size={14}/> Rincian Fasilitas (LSPOP)</h4>
                <div className="grid grid-cols-4 gap-4">
                  <Select label="Jenis Atap" value={formData.m_atap} onChange={(v: string) => setFormData({...formData, m_atap: v})} options={PBB_OPTIONS.MATERIAL_ATAP} />
                  <Select label="Material Dinding" value={formData.m_dinding} onChange={(v: string) => setFormData({...formData, m_dinding: v})} options={PBB_OPTIONS.MATERIAL_DINDING} />
                  <Select label="Jenis Lantai" value={formData.m_lantai} onChange={(v: string) => setFormData({...formData, m_lantai: v})} options={PBB_OPTIONS.MATERIAL_LANTAI} />
                  <Select label="Langit-langit" value={formData.m_langit} onChange={(v: string) => setFormData({...formData, m_langit: v})} options={PBB_OPTIONS.MATERIAL_LANGIT} />
                </div>
                <div className="grid grid-cols-4 gap-4 p-6 bg-slate-50/50 rounded-2xl">
                  <Input label="AC Split (Unit)" type="number" value={formData.f_ac_split} onChange={(v: string) => setFormData({...formData, f_ac_split: v})} />
                  <Input label="Listrik (VA)" type="number" value={formData.daya_listrik} onChange={(v: string) => setFormData({...formData, daya_listrik: v})} />
                  <Input label="Pagar (Panjang)" type="number" value={formData.f_pagar_panjang} onChange={(v: string) => setFormData({...formData, f_pagar_panjang: v})} />
                  <Select label="Bahan Pagar" value={formData.f_pagar_bahan} onChange={(v: string) => setFormData({...formData, f_pagar_bahan: v})} options={PBB_OPTIONS.PAGAR_BAHAN} />
                </div>
                <div className="flex gap-8 px-2">
                  <Checkbox label="Pemadam Hydrant" checked={formData.f_pemadam_hydrant} onChange={(v: boolean) => setFormData({...formData, f_pemadam_hydrant: v})} />
                  <Checkbox label="Sistem Sprinkler" checked={formData.f_pemadam_sprinkler} onChange={(v: boolean) => setFormData({...formData, f_pemadam_sprinkler: v})} />
                  <Checkbox label="Fire Alarm" checked={formData.f_pemadam_alarm} onChange={(v: boolean) => setFormData({...formData, f_pemadam_alarm: v})} />
                </div>
                {/* BAGIAN INPUT LOKASI DI DALAM POP-UP (PALING BAWAH) */}
                <div className="mt-8 pt-8 border-t border-slate-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl">
                      <MapIcon size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Lokasi Objek Pajak</h3>
                      <p className="text-[10px] text-slate-500 font-medium">Klik pada peta untuk memasukkan lokasi baru</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Latitude</label>
                      <input 
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        value={formData.latitude}
                        onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                        placeholder="-7.xxxxx"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Longitude</label>
                      <input 
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        value={formData.longitude}
                        onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                        placeholder="112.xxxxx"
                      />
                    </div>
                  </div>

                  {/* WADAH PETA */}
                  <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
                    <LandMap 
                      latitude={parseFloat(formData.latitude) || -7.6448} 
                      longitude={parseFloat(formData.longitude) || 112.9061} 
                      onChange={(lat, lng) => {
                        setFormData({
                          ...formData,
                          latitude: lat.toString(),
                          longitude: lng.toString()
                        });
                      }}
                    />
                  </div>
                  <p className="mt-2 text-[9px] text-slate-400 italic text-center">
                    *Geser peta dan klik tepat di lokasi bidang tanah untuk akurasi data
                  </p>
                </div>
              </section>
            </div>

            <div className="px-10 py-6 border-t border-slate-100 flex justify-end gap-4 bg-slate-50/50">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-xs font-bold text-slate-400 hover:text-slate-600 transition-all">BATAL</button>
              <button 
                onClick={handleSave} 
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-300 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-slate-200"
              >
                {loading ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} 
                {editingId ? 'SIMPAN PERUBAHAN' : 'SIMPAN DATA FINAL'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// SUB-COMPONENTS (RE-DESIGNED)
// ==========================================

const DigitInput = ({ length, value, onChange, format }: any) => {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const handleChange = (val: string, i: number) => {
    const newVal = value.split('');
    newVal[i] = val.toUpperCase().slice(-1);
    onChange(newVal.join(''));
    if (val && i < length - 1) inputs.current[i + 1]?.focus();
  };
  const handleKey = (e: any, i: number) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  let els: any[] = [];
  let curr = 0;
  format.forEach((size: number, si: number) => {
    for (let j = 0; j < size; j++) {
      const idx = curr++;
      els.push(
        <input 
          key={idx} ref={el => inputs.current[idx] = el}
          className="w-8 h-10 text-center text-xs font-bold border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
          value={value[idx] || ''} onChange={e => handleChange(e.target.value, idx)} onKeyDown={e => handleKey(e, idx)}
        />
      );
    }
    if (si < format.length - 1) els.push(<span key={`s-${si}`} className="text-slate-300 font-bold px-0.5">•</span>);
  });
  return <div className="flex items-center gap-1 flex-wrap">{els}</div>;
};

const Input = ({ label, ...props }: any) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input {...props} className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-slate-200" onChange={e => props.onChange(e.target.value)} />
  </div>
);

const Select = ({ label, options, ...props }: any) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative">
      <select {...props} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all cursor-pointer appearance-none" onChange={e => props.onChange(e.target.value)}>
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <ChevronRight size={14} className="rotate-90" />
      </div>
    </div>
  </div>
);

const Checkbox = ({ label, checked, onChange }: any) => (
  <label className="flex items-center gap-3 cursor-pointer group">
    <input type="checkbox" checked={checked} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 transition-all" onChange={e => onChange(e.target.checked)} />
    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-900 transition-all">{label}</span>
  </label>
);