import { useState, useEffect } from 'react';
import { 
  MapPin, Loader2, X, ArrowRightLeft, 
  Search 
} from 'lucide-react';
import { supabase } from '../../services/db';
import { Kecamatan, Desa, Mutasi } from '../../types';

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

  const fetchData = async () => {
    setLoading(true);
    const { data: kec } = await supabase.from('kecamatan').select('*').order('nama');
    const { data: des } = await supabase.from('desa').select('*').order('nama');
    if (kec) setKecamatans(kec);
    if (des) setDesas(des);
    setLoading(false);
  };

  const fetchMutasi = async () => {
    if (!selectedDesaId) return;
    setLoading(true);
    const { data } = await supabase
      .from('mutasi_c')
      .select('*')
      .eq('desa_id', selectedDesaId)
      .order('tanggal_mutasi', { ascending: false });
    if (data) setMutasiList(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { fetchMutasi(); }, [selectedDesaId]);

  const filteredKecamatans = kecamatans.map(kec => ({
    ...kec,
    desas: desas.filter(d => 
      d.kecamatan_id === kec.id && d.nama.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(kec => kec.desas.length > 0);

  return (
    <div className="flex h-[calc(100vh-140px)] gap-8 p-4 bg-[#F8F9FA]">
      {/* SIDEBAR */}
      <div className="w-80 flex flex-col overflow-hidden px-2">
        <div className="mb-8 space-y-4 text-zinc-900">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Riwayat Mutasi</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16}/>
            <input 
              className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm outline-none focus:border-zinc-800 transition-all shadow-sm shadow-zinc-100/50" 
              placeholder="Cari Desa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6">
          {filteredKecamatans.map(k => (
            <div key={k.id}>
              <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest block mb-3 px-2">{k.nama}</span>
              {k.desas.map(d => (
                <button 
                  key={d.id} 
                  onClick={() => { setSelectedDesaId(d.id); localStorage.setItem('last_selected_desa_id', d.id); }} 
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl text-[13px] font-bold mb-1 transition-all ${
                    selectedDesaId === d.id ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-200' : 'text-zinc-500 hover:bg-white hover:text-zinc-900'
                  }`}
                >
                  <span className="flex items-center gap-3"><MapPin size={14}/> {d.nama}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 bg-white rounded-[2.5rem] border border-zinc-100 flex flex-col overflow-hidden shadow-sm">
        <div className="p-8 flex justify-between items-end border-b border-zinc-50">
          <div className="text-zinc-900">
            <h2 className="text-3xl font-black tracking-tight">
              {selectedDesaId ? desas.find(d => d.id === selectedDesaId)?.nama : "Jurnal Mutasi"}
            </h2>
            <p className="text-sm text-zinc-400 font-medium mt-1">Histori Perubahan Kepemilikan (C-to-C)</p>
          </div>
          {selectedDesaId && (
            <button onClick={() => setShowModal(true)} className="bg-zinc-900 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-3">
              <ArrowRightLeft size={18}/> Catat Mutasi
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-8 text-zinc-900">
          {!selectedDesaId ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20">
              <ArrowRightLeft size={120} strokeWidth={0.5}/>
              <p className="font-black uppercase tracking-[0.5em] text-[10px] mt-4">Transaction History</p>
            </div>
          ) : loading ? (
            <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-zinc-300"/></div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-[10px] font-black text-zinc-300 uppercase tracking-widest border-b border-zinc-100">
                  <th className="pb-6 px-4 text-left">Tanggal</th>
                  <th className="pb-6 text-left">Asal</th>
                  <th className="pb-6 text-center">Arah</th>
                  <th className="pb-6 text-left">Tujuan</th>
                  <th className="pb-6 text-right px-4">Luas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {mutasiList.map(m => (
                  <tr key={m.id} className="group hover:bg-zinc-50/80 transition-all duration-300">
                    <td className="py-8 px-4 font-bold text-zinc-400 text-xs">
                      {new Date(m.tanggal_mutasi).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}
                    </td>
                    <td className="py-8">
                       <span className="block text-zinc-900 font-black text-lg leading-none">C.{m.c_asal}</span>
                       <span className="text-[11px] text-zinc-400 uppercase tracking-tighter mt-1 block">{m.nama_pihak_asal}</span>
                    </td>
                    <td className="py-8 text-center">
                      <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center mx-auto border border-zinc-100">
                        <ArrowRightLeft size={14} className="text-zinc-400"/>
                      </div>
                    </td>
                    <td className="py-8">
                       <span className="block text-zinc-900 font-black text-lg leading-none">C.{m.c_tujuan}</span>
                       <span className="text-[11px] text-zinc-400 uppercase tracking-tighter mt-1 block">{m.nama_pihak_tujuan}</span>
                    </td>
                    <td className="py-8 text-right px-4">
                      <span className="font-black text-zinc-900 text-lg">{m.luas_mutasi?.toLocaleString('id-ID')}</span>
                      <span className="text-zinc-400 text-xs ml-1 font-bold">m²</span>
                    </td>
                  </tr>
                ))}
                {mutasiList.length === 0 && (
                  <tr><td colSpan={5} className="py-20 text-center text-zinc-300 text-sm italic tracking-widest uppercase">Belum ada riwayat mutasi</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && selectedDesaId && (
        <FormMutasi selectedDesaId={selectedDesaId} onClose={() => setShowModal(false)} onSuccess={() => { fetchMutasi(); setShowModal(false); }} />
      )}
    </div>
  );
};

// MODAL FORM MUTASI
const FormMutasi = ({ selectedDesaId, onClose, onSuccess }: { selectedDesaId: string, onClose: () => void, onSuccess: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    c_asal: '', nama_pihak_asal: '', c_tujuan: '',
    nama_pihak_tujuan: '', luas_mutasi: '', jenis_mutasi: 'Jual Beli',
    tanggal_mutasi: new Date().toISOString().split('T')[0], keterangan: ''
  });

  const lookupOwner = async (nomorC: string, target: 'asal' | 'tujuan') => {
    if (!nomorC) return;
    
    // Gunakan any untuk menghindari error 'never' sementara datanya ditarik
    const { data } = await supabase
      .from('letter_c')
      .select('nama_pemilik')
      .eq('desa_id', selectedDesaId)
      .eq('nomor_c', nomorC)
      .maybeSingle();

    if (data) {
      const result = data as { nama_pemilik: string };
      if (target === 'asal') {
        setForm(prev => ({ ...prev, nama_pihak_asal: result.nama_pemilik }));
      } else {
        setForm(prev => ({ ...prev, nama_pihak_tujuan: result.nama_pemilik }));
      }
    }
  };

  const handleSave = async () => {
    if (!form.c_asal || !form.c_tujuan) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('mutasi_c').insert([{
        desa_id: selectedDesaId, ...form, luas_mutasi: parseFloat(form.luas_mutasi) || 0
      }]);
      if (error) throw error;
      onSuccess();
    } catch (err: any) { alert(err.message); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-zinc-900">
      <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl border border-zinc-100 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
        <div className="p-8 border-b border-zinc-50 flex justify-between items-center bg-zinc-50/30">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Pencatatan Mutasi Baru</span>
          <button onClick={onClose} className="p-3 hover:bg-zinc-100 rounded-full text-zinc-400"><X/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-12 space-y-12">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase ml-1 tracking-widest">Jenis Mutasi</label>
              <select className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none font-bold text-sm appearance-none" onChange={e => setForm({...form, jenis_mutasi: e.target.value})}>
                <option>Jual Beli</option><option>Waris</option><option>Hibah</option><option>Tukar Menukar</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase ml-1 tracking-widest">Tgl Transaksi</label>
              <input type="date" className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none font-bold text-sm" value={form.tanggal_mutasi} onChange={e => setForm({...form, tanggal_mutasi: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-4">
              <h5 className="font-black text-[10px] uppercase tracking-widest border-l-4 border-zinc-900 pl-3">Dari (Asal)</h5>
              <div className="relative">
                <input 
                  className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:bg-white font-bold text-sm transition-all" 
                  placeholder="No. Kohir Asal" 
                  value={form.c_asal}
                  onChange={e => setForm({...form, c_asal: e.target.value})}
                  onBlur={() => lookupOwner(form.c_asal, 'asal')}
                />
                <button type="button" onClick={() => lookupOwner(form.c_asal, 'asal')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-300 hover:text-zinc-900 uppercase">Cek</button>
              </div>
              <input className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:bg-white font-bold text-sm transition-all" placeholder="Nama Pihak Asal" value={form.nama_pihak_asal} onChange={e => setForm({...form, nama_pihak_asal: e.target.value})} />
            </div>
            <div className="space-y-4">
              <h5 className="font-black text-[10px] uppercase tracking-widest border-l-4 border-zinc-900 pl-3">Ke (Tujuan)</h5>
              <div className="relative">
                <input 
                  className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:bg-white font-bold text-sm transition-all" 
                  placeholder="No. Kohir Baru" 
                  value={form.c_tujuan}
                  onChange={e => setForm({...form, c_tujuan: e.target.value})}
                  onBlur={() => lookupOwner(form.c_tujuan, 'tujuan')}
                />
                <button type="button" onClick={() => lookupOwner(form.c_tujuan, 'tujuan')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-300 hover:text-zinc-900 uppercase">Cek</button>
              </div>
              <input className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:bg-white font-bold text-sm transition-all" placeholder="Nama Pihak Tujuan" value={form.nama_pihak_tujuan} onChange={e => setForm({...form, nama_pihak_tujuan: e.target.value})} />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-zinc-50">
             <input className="w-full px-6 py-5 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:bg-white focus:border-zinc-900 font-black text-lg transition-all" placeholder="Luas Dimutasi (m²)" type="number" value={form.luas_mutasi} onChange={e => setForm({...form, luas_mutasi: e.target.value})} />
             <textarea className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:bg-white text-sm" placeholder="Keterangan (Persil, Klas, dsb)" rows={2} value={form.keterangan} onChange={e => setForm({...form, keterangan: e.target.value})} />
          </div>
        </div>
        <div className="p-10 border-t border-zinc-50 flex justify-end gap-6 bg-white">
          <button type="button" onClick={onClose} className="text-sm font-black text-zinc-400 uppercase tracking-widest">Batal</button>
          <button onClick={handleSave} disabled={loading} className="px-12 py-4 bg-zinc-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-zinc-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50">
             {loading ? <Loader2 className="animate-spin" size={18}/> : 'Simpan Transaksi'}
          </button>
        </div>
      </div>
    </div>
  );
};