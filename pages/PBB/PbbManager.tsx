import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Plus, Save, X, LayoutDashboard, 
  ChevronRight, Building2, Map, Users, Settings2, Trash2, Zap, Loader2, Home
} from 'lucide-react';
import { supabase } from '../../services/db';
// Mengambil semua logika dari "Satu Pintu" types
import { PBB_OPTIONS, sanitizePbbPayload, PbbRecord } from '../../types';

export const PbbManager = () => {
  const [loading, setLoading] = useState(false);
  const [kecamatans, setKecamatans] = useState<any[]>([]);
  const [desas, setDesas] = useState<any[]>([]);
  const [selectedDesa, setSelectedDesa] = useState<any>(null);
  const [pbbRecords, setPbbRecords] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // STATE FORM SESUAI INTERFACE PbbRecord
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
    f_pemadam_hydrant: false, f_pemadam_sprinkler: false, f_pemadam_alarm: false
  };

  const [formData, setFormData] = useState(initialForm);

  // 1. LOAD DATA WILAYAH
  useEffect(() => {
    const fetchWilayah = async () => {
      const { data: kec } = await supabase.from('kecamatan').select('*').order('nama');
      const { data: des } = await supabase.from('desa').select('*').order('nama');
      setKecamatans(kec || []);
      setDesas(des || []);
    };
    fetchWilayah();
  }, []);

  // 2. LOAD DATA RECORD PER DESA
  const fetchRecords = async (desaId: string) => {
    setLoading(true);
    const { data } = await supabase.from('pbb_records').select('*').eq('desa_id', desaId).order('created_at', { ascending: false });
    setPbbRecords(data || []);
    setLoading(false);
  };

  // 3. SIMPAN DATA (DENGAN SANITASI)
  const handleSave = async () => {
    if (formData.nop.length !== 18) return alert("NOP harus 18 digit!");
    if (!formData.nama_wp) return alert("Nama Wajib Pajak wajib diisi!");

    setLoading(true);
    const cleanData = sanitizePbbPayload(formData);
    
    const { error } = await supabase.from('pbb_records').insert([{
      ...cleanData,
      desa_id: selectedDesa.id,
      kecamatan_id: selectedDesa.kecamatan_id
    }]);

    if (!error) {
      setIsModalOpen(false);
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

  const filteredDesas = desas.filter(d => d.nama.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex h-[calc(100vh-1rem)] gap-4 p-2 bg-[#f1f5f9] font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-80 bg-white border border-slate-200 rounded-[2.5rem] flex flex-col shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 space-y-4">
          <button 
            onClick={() => setSelectedDesa(null)}
            className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${!selectedDesa ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
          >
            <LayoutDashboard size={18}/> Dashboard Utama
          </button>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
            <input 
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-xs font-bold outline-none focus:ring-2 ring-slate-100 transition-all" 
              placeholder="Cari Wilayah..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
          {kecamatans.map(kec => (
            <div key={kec.id}>
              <div className="px-4 mb-2"><span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">{kec.nama}</span></div>
              {filteredDesas.filter(d => d.kecamatan_id === kec.id).map(desa => (
                <button 
                  key={desa.id} 
                  onClick={() => { setSelectedDesa(desa); fetchRecords(desa.id); }}
                  className={`w-full text-left px-5 py-4 rounded-[1.2rem] text-[11px] font-bold transition-all flex items-center justify-between mb-1 ${selectedDesa?.id === desa.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  {desa.nama}
                  {selectedDesa?.id === desa.id && <ChevronRight size={14} />}
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm flex flex-col overflow-hidden relative">
        {!selectedDesa ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-20">
            <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-8 border border-slate-100">
              <Home size={60} className="text-slate-200" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Sistem Manajemen PBB</h2>
            <p className="text-slate-400 text-sm mt-2 max-w-sm">Pilih desa pada panel kiri untuk mengelola data SPOP/LSPOP atau melihat statistik wilayah.</p>
          </div>
        ) : (
          <>
            <header className="p-10 flex justify-between items-center">
              <div>
                <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  <span>PBB-P2</span> <ChevronRight size={10}/> <span>{selectedDesa.nama}</span>
                </nav>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Daftar Objek Pajak</h2>
              </div>
              <button 
                onClick={() => { setFormData(initialForm); setIsModalOpen(true); }} 
                className="flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-[1.5rem] text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-2xl shadow-slate-200"
              >
                <Plus size={20}/> Entri Data Baru
              </button>
            </header>

            <div className="flex-1 px-10 pb-10 overflow-y-auto">
              <table className="w-full text-left border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-4">Identitas Wajib Pajak</th>
                    <th className="px-6 py-4">Nomor Objek Pajak (NOP)</th>
                    <th className="px-6 py-4">Luas Bumi/Bng</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pbbRecords.map((r) => (
                    <tr key={r.id} className="group transition-all">
                      <td className="px-6 py-6 bg-slate-50 rounded-l-[1.5rem] group-hover:bg-slate-100/50">
                        <p className="text-sm font-black text-slate-900 uppercase">{r.nama_wp}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">{r.nik}</p>
                      </td>
                      <td className="px-6 py-6 bg-slate-50 group-hover:bg-slate-100/50">
                        <p className="text-xs font-mono font-bold text-blue-600 tracking-widest">{r.nop}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{r.jalan_op} {r.blok_op}</p>
                      </td>
                      <td className="px-6 py-6 bg-slate-50 group-hover:bg-slate-100/50">
                        <p className="text-xs font-black text-slate-700">{r.luas_bumi} m² / {r.luas_bng} m²</p>
                        <p className="text-[9px] font-black text-emerald-600 uppercase mt-1">ZNT: {r.znt}</p>
                      </td>
                      <td className="px-6 py-6 bg-slate-50 rounded-r-[1.5rem] text-right group-hover:bg-slate-100/50">
                        <button onClick={() => handleDelete(r.id)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-white rounded-xl transition-all">
                          <Trash2 size={18}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      {/* MODAL SPOP/LSPOP */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-7xl h-[90vh] rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden border border-white">
            
            <div className="px-12 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-slate-900 text-white rounded-[1.2rem] shadow-lg"><Building2 size={24}/></div>
                <div>
                  <h3 className="font-black text-slate-900 uppercase text-lg tracking-tight">Formulir SPOP & LSPOP Digital</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Pendataan Objek & Subjek Pajak Baru</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-white rounded-full transition-all border border-transparent hover:border-slate-100"><X size={24}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-12 space-y-16 scrollbar-hide">
              
              {/* SECTION 1: NOP & IDENTITAS OBJEK */}
              <section>
                <h4 className="flex items-center gap-3 font-black text-xs uppercase tracking-[0.2em] text-slate-900 mb-8">
                  <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">01</span>
                  Informasi Objek Pajak (NOP)
                </h4>
                <div className="space-y-8">
                  <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Masukkan 18 Digit NOP</label>
                    <DigitInput 
                      length={18} value={formData.nop} 
                      onChange={(v) => setFormData({...formData, nop: v})} 
                      format={[2, 2, 3, 3, 3, 4, 1]} 
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-6">
                    <Input label="Jalan / Dusun" value={formData.jalan_op} onChange={v => setFormData({...formData, jalan_op: v})} />
                    <Input label="Blok / No" value={formData.blok_op} onChange={v => setFormData({...formData, blok_op: v})} />
                    <Input label="RT" value={formData.rt_op} onChange={v => setFormData({...formData, rt_op: v})} />
                    <Input label="RW" value={formData.rw_op} onChange={v => setFormData({...formData, rw_op: v})} />
                  </div>
                </div>
              </section>

              {/* SECTION 2: SUBJEK PAJAK */}
              <section>
                <h4 className="flex items-center gap-3 font-black text-xs uppercase tracking-[0.2em] text-slate-900 mb-8">
                  <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">02</span>
                  Data Subjek Pajak (WP)
                </h4>
                <div className="grid grid-cols-3 gap-8">
                  <div className="col-span-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">NIK (16 Digit)</label>
                    <DigitInput length={16} value={formData.nik} onChange={(v) => setFormData({...formData, nik: v})} format={[4, 4, 4, 4]} />
                  </div>
                  <Input label="Nama Lengkap WP" value={formData.nama_wp} onChange={v => setFormData({...formData, nama_wp: v})} />
                  <Input label="NPWP" value={formData.npwp} onChange={v => setFormData({...formData, npwp: v})} />
                  <Select label="Pekerjaan" value={formData.pekerjaan} onChange={v => setFormData({...formData, pekerjaan: v})} options={PBB_OPTIONS.PEKERJAAN} />
                  <div className="col-span-2"><Input label="Alamat KTP" value={formData.jalan_wp} onChange={v => setFormData({...formData, jalan_wp: v})} /></div>
                  <Select label="Status WP" value={formData.status_wp} onChange={v => setFormData({...formData, status_wp: v})} options={PBB_OPTIONS.STATUS_WP} />
                </div>
              </section>

              {/* SECTION 3: BUMI & BANGUNAN */}
              <div className="grid grid-cols-2 gap-12">
                <section className="bg-blue-50/30 p-10 rounded-[2.5rem] border border-blue-50">
                   <h4 className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-blue-900 mb-8"><Map size={16}/> Data Bumi</h4>
                   <div className="grid grid-cols-2 gap-6">
                      <Input label="Luas Bumi (m2)" type="number" value={formData.luas_bumi} onChange={v => setFormData({...formData, luas_bumi: v})} />
                      <Input label="ZNT" value={formData.znt} onChange={v => setFormData({...formData, znt: v})} />
                      <div className="col-span-2"><Select label="Jenis Tanah" value={formData.jenis_tanah} onChange={v => setFormData({...formData, jenis_tanah: v})} options={PBB_OPTIONS.JENIS_TANAH} /></div>
                   </div>
                </section>
                <section className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100">
                   <h4 className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-slate-900 mb-8"><Building2 size={16}/> Data Bangunan Utama</h4>
                   <div className="grid grid-cols-2 gap-6">
                      <Input label="Luas Bangunan (m2)" type="number" value={formData.luas_bng} onChange={v => setFormData({...formData, luas_bng: v})} />
                      <Input label="Jumlah Lantai" type="number" value={formData.jumlah_lantai} onChange={v => setFormData({...formData, jumlah_lantai: v})} />
                      <Input label="Tahun Dibangun" value={formData.tahun_dibangun} onChange={v => setFormData({...formData, tahun_dibangun: v})} />
                      <Select label="Kondisi Umum" value={formData.kondisi_umum} onChange={v => setFormData({...formData, kondisi_umum: v})} options={PBB_OPTIONS.KONDISI_BNG} />
                   </div>
                </section>
              </div>

              {/* SECTION 4: MATERIAL & FASILITAS */}
              <section className="p-12 border-2 border-slate-50 rounded-[3rem]">
                 <h4 className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-slate-900 mb-10"><Settings2 size={16}/> Rincian LSPOP (Material & Fasilitas)</h4>
                 <div className="grid grid-cols-4 gap-8 mb-12">
                    <Select label="Atap" value={formData.m_atap} onChange={v => setFormData({...formData, m_atap: v})} options={PBB_OPTIONS.MATERIAL_ATAP} />
                    <Select label="Dinding" value={formData.m_dinding} onChange={v => setFormData({...formData, m_dinding: v})} options={PBB_OPTIONS.MATERIAL_DINDING} />
                    <Select label="Lantai" value={formData.m_lantai} onChange={v => setFormData({...formData, m_lantai: v})} options={PBB_OPTIONS.MATERIAL_LANTAI} />
                    <Select label="Langit-Langit" value={formData.m_langit} onChange={v => setFormData({...formData, m_langit: v})} options={PBB_OPTIONS.MATERIAL_LANGIT} />
                 </div>
                 <div className="grid grid-cols-4 gap-8 bg-slate-50/50 p-8 rounded-[2rem]">
                    <Input label="AC Split" type="number" value={formData.f_ac_split} onChange={v => setFormData({...formData, f_ac_split: v})} />
                    <Input label="Daya Listrik (VA)" type="number" value={formData.daya_listrik} onChange={v => setFormData({...formData, daya_listrik: v})} />
                    <Input label="Pagar (Panjang m)" type="number" value={formData.f_pagar_panjang} onChange={v => setFormData({...formData, f_pagar_panjang: v})} />
                    <Select label="Bahan Pagar" value={formData.f_pagar_bahan} onChange={v => setFormData({...formData, f_pagar_bahan: v})} options={PBB_OPTIONS.PAGAR_BAHAN} />
                 </div>
                 <div className="flex gap-10 mt-10 px-4">
                    <Checkbox label="Pemadam Hydrant" checked={formData.f_pemadam_hydrant} onChange={v => setFormData({...formData, f_pemadam_hydrant: v})} />
                    <Checkbox label="Pemadam Sprinkler" checked={formData.f_pemadam_sprinkler} onChange={v => setFormData({...formData, f_pemadam_sprinkler: v})} />
                    <Checkbox label="Fire Alarm" checked={formData.f_pemadam_alarm} onChange={v => setFormData({...formData, f_pemadam_alarm: v})} />
                 </div>
              </section>

            </div>

            <div className="px-12 py-8 border-t border-slate-50 flex justify-end gap-5 bg-white shadow-[0_-20px_50px_rgba(0,0,0,0.02)]">
              <button onClick={() => setIsModalOpen(false)} className="px-10 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all">Batal</button>
              <button 
                onClick={handleSave} disabled={loading}
                className="px-14 py-5 bg-slate-900 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 hover:bg-blue-600 transition-all flex items-center gap-3 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Simpan SPOP Final
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// SUB-COMPONENTS (SAMA DALAM 1 FILE)
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

  let els = [];
  let curr = 0;
  format.forEach((size: number, si: number) => {
    for (let j = 0; j < size; j++) {
      const idx = curr++;
      els.push(
        <input 
          key={idx} ref={el => inputs.current[idx] = el}
          className="w-9 h-12 text-center text-sm font-black border-2 border-slate-200 rounded-xl focus:border-slate-900 focus:ring-4 ring-slate-100 outline-none transition-all"
          value={value[idx] || ''} onChange={e => handleChange(e.target.value, idx)} onKeyDown={e => handleKey(e, idx)}
        />
      );
    }
    if (si < format.length - 1) els.push(<span key={`s-${si}`} className="text-slate-300 font-bold">-</span>);
  });
  return <div className="flex items-center gap-1 flex-wrap">{els}</div>;
};

const Input = ({ label, ...props }: any) => (
  <div className="flex flex-col gap-2.5">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{label}</label>
    <input {...props} className="px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-slate-900 transition-all placeholder:text-slate-200" onChange={e => props.onChange(e.target.value)} />
  </div>
);

const Select = ({ label, options, ...props }: any) => (
  <div className="flex flex-col gap-2.5">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{label}</label>
    <select {...props} className="px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-slate-900 transition-all cursor-pointer appearance-none" onChange={e => props.onChange(e.target.value)}>
      {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const Checkbox = ({ label, checked, onChange }: any) => (
  <label className="flex items-center gap-3 cursor-pointer group">
    <input type="checkbox" checked={checked} className="w-5 h-5 rounded-lg border-2 border-slate-200 text-slate-900 focus:ring-0" onChange={e => onChange(e.target.checked)} />
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-900 transition-all">{label}</span>
  </label>
);