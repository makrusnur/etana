import { useState, useEffect } from 'react';
import { 
  Plus, MapPin, User, 
  FolderPlus, Loader2, X, Trash2, Info, Search, Layers, Edit3
} from 'lucide-react';
import { supabase } from '../../services/db'; 
import { Kecamatan, Desa, LetterC, LetterCPersil } from '../../types';

export const DataLetterC = () => {
  const [loading, setLoading] = useState(true);
  const [kecamatans, setKecamatans] = useState<Kecamatan[]>([]);
  const [desas, setDesas] = useState<Desa[]>([]);
  const [kohirList, setKohirList] = useState<LetterC[]>([]);
  const [selectedDesaId, setSelectedDesaId] = useState<string | null>(
    localStorage.getItem('last_selected_desa_id') || null
  );
  const [showModal, setShowModal] = useState(false);
  const [selectedKohir, setSelectedKohir] = useState<LetterC | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const { data: kec } = await supabase.from('kecamatan').select('*').order('nama');
    const { data: des } = await supabase.from('desa').select('*').order('nama');
    if (kec) setKecamatans(kec);
    if (des) setDesas(des);
    setLoading(false);
  };

  const fetchKohir = async () => {
    if (!selectedDesaId) return;
    const { data } = await supabase.from('letter_c')
      .select('*')
      .eq('desa_id', selectedDesaId)
      .order('nomor_c');
    if (data) setKohirList(data);
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { fetchKohir(); }, [selectedDesaId]);

  const handleEdit = (kohir: LetterC) => {
    setSelectedKohir(kohir);
    setShowModal(true);
  };

  const filteredKecamatans = kecamatans.map(kec => ({
    ...kec,
    desas: desas.filter(d => 
      d.kecamatan_id === kec.id && d.nama.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(kec => (kec.desas?.length ?? 0) > 0);

  return (
    <div className="flex h-[calc(100vh-140px)] gap-8 p-4 bg-[#F8F9FA] text-zinc-900">
      {/* SIDEBAR */}
      <div className="w-80 flex flex-col overflow-hidden">
        <div className="mb-6 space-y-4 px-2">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Wilayah Kerja</h3>
            <button onClick={async () => {
              const n = prompt("Kecamatan Baru:");
              if(n) { await supabase.from('kecamatan').insert([{nama: n}]); fetchData(); }
            }} className="p-2 hover:bg-zinc-200 rounded-lg transition-colors text-zinc-500">
              <FolderPlus size={16}/>
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16}/>
            <input 
              className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm outline-none focus:border-zinc-800 transition-all shadow-sm" 
              placeholder="Cari Desa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-6">
          {loading ? <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-zinc-300"/></div> : 
            filteredKecamatans.map(k => (
              <div key={k.id}>
                <div className="flex items-center gap-3 mb-2 px-2">
                  <div className="h-[1px] flex-1 bg-zinc-100"></div>
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{k.nama}</span>
                  <div className="h-[1px] flex-1 bg-zinc-100"></div>
                </div>
                {k.desas?.map(d => (
                  <button 
                    key={d.id} 
                    onClick={() => { setSelectedDesaId(d.id); localStorage.setItem('last_selected_desa_id', d.id); }}
                    className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-[13px] font-bold mb-1 transition-all ${
                      selectedDesaId === d.id ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-400/20' : 'text-zinc-600 hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    <span className="flex items-center gap-3"><MapPin size={14} className="opacity-40"/> {d.nama}</span>
                  </button>
                ))}
              </div>
            ))
          }
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 bg-white rounded-[2.5rem] border border-zinc-100 flex flex-col overflow-hidden shadow-sm">
        <div className="p-8 flex justify-between items-end border-b border-zinc-50">
          <div>
            <h2 className="text-3xl font-black tracking-tight">
              {selectedDesaId ? desas.find(d => d.id === selectedDesaId)?.nama : "Pilih Desa"}
            </h2>
            <p className="text-sm text-zinc-400 font-medium mt-1">Buku Pendaftaran Tanah (Letter C)</p>
          </div>
          {selectedDesaId && (
            <button onClick={() => { setSelectedKohir(null); setShowModal(true); }} className="bg-zinc-900 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-3 active:scale-95 shadow-lg">
              <Plus size={18}/> Tambah Kohir
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {!selectedDesaId ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20">
              <Layers size={100} strokeWidth={0.5}/>
              <p className="font-black uppercase tracking-[0.5em] text-[10px] mt-4">Database Letter C</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100">
                  <th className="pb-6 px-4">No. Kohir</th>
                  <th className="pb-6">Pemilik</th>
                  <th className="pb-6">Alamat</th>
                  <th className="pb-6 text-right px-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {kohirList.map(k => (
                  <tr key={k.id} className="group hover:bg-zinc-50/50 transition-colors">
                    <td className="py-6 px-4 font-black text-zinc-900 text-lg">C.{k.nomor_c}</td>
                    <td className="py-6 font-bold text-zinc-700 text-[15px] uppercase">{k.nama_pemilik}</td>
                    <td className="py-6 text-zinc-400 text-sm max-w-[300px] truncate">{k.alamat_pemilik || '—'}</td>
                    <td className="py-6 text-right px-4 flex justify-end gap-2">
                      <button onClick={() => handleEdit(k)} className="p-3 text-zinc-400 hover:text-zinc-900 hover:bg-white rounded-xl border border-transparent hover:border-zinc-100 transition-all">
                        <Edit3 size={18}/>
                      </button>
                      <button className="p-3 text-zinc-400 hover:text-blue-600 hover:bg-white rounded-xl border border-transparent hover:border-zinc-100 transition-all">
                        <Info size={18}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && selectedDesaId && (
        <FormTambahC 
          selectedDesaId={selectedDesaId} 
          editData={selectedKohir} 
          onClose={() => setShowModal(false)} 
          onSuccess={() => { fetchKohir(); setShowModal(false); }} 
        />
      )}
    </div>
  );
};

// MODAL FORM (TAMBAH & EDIT)
const FormTambahC = ({ selectedDesaId, editData, onClose, onSuccess }: { selectedDesaId: string, editData: LetterC | null, onClose: () => void, onSuccess: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nomor_c: '', nama_pemilik: '', alamat_pemilik: '' });
  const [rows, setRows] = useState<Partial<LetterCPersil>[]>([
    { nomor_persil: '', jenis_tanah: 'Tanah Kering', klas_desa: '', luas_meter: 0, asal_usul: '' }
  ]);

  // Load data jika dalam mode EDIT
  useEffect(() => {
    if (editData) {
      setForm({
        nomor_c: editData.nomor_c,
        nama_pemilik: editData.nama_pemilik,
        alamat_pemilik: editData.alamat_pemilik || ''
      });
      fetchPersils(editData.id);
    }
  }, [editData]);

  const fetchPersils = async (letterCId: string) => {
    const { data } = await supabase.from('letter_c_persil').select('*').eq('letter_c_id', letterCId);
    if (data && data.length > 0) setRows(data);
  };

  const handleSave = async () => {
    if (!form.nomor_c || !form.nama_pemilik) return;
    setLoading(true);
    try {
      let letterCId = '';

      if (editData) {
        // UPDATE MODE
        await supabase.from('letter_c').update(form).eq('id', editData.id);
        letterCId = editData.id;
        // Hapus persil lama lalu insert baru (cara termudah untuk update multiple rows)
        await supabase.from('letter_c_persil').delete().eq('letter_c_id', letterCId);
      } else {
        // INSERT MODE
        const { data: kohir, error: e1 } = await supabase.from('letter_c').insert([{ desa_id: selectedDesaId, ...form }]).select().single();
        if (e1) throw e1;
        letterCId = kohir.id;
      }

      const persils = rows.map(r => ({ 
        letter_c_id: letterCId, 
        nomor_persil: r.nomor_persil,
        jenis_tanah: r.jenis_tanah,
        klas_desa: r.klas_desa,
        luas_meter: r.luas_meter || 0,
        asal_usul: r.asal_usul
      }));

      await supabase.from('letter_c_persil').insert(persils);
      onSuccess();
    } catch (err: any) { alert(err.message); }
    setLoading(false);
  };

  const updateRow = (index: number, field: keyof LetterCPersil, value: any) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  return (
    <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-zinc-900">
      <div className="bg-white w-full max-w-6xl rounded-[3rem] flex flex-col max-h-[92vh] shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="p-8 border-b border-zinc-50 flex justify-between items-center bg-zinc-50/20">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
            {editData ? 'Perbarui Data Kohir' : 'Entry Letter C Baru'}
          </span>
          <button onClick={onClose} className="p-3 hover:bg-zinc-100 rounded-full text-zinc-400"><X/></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* IDENTITAS */}
          <div className="lg:col-span-4 space-y-6 border-r border-zinc-50 pr-8">
            <h4 className="flex items-center gap-2 text-zinc-900 font-black text-xs uppercase tracking-widest"><User size={16}/> Identitas</h4>
            <div className="space-y-4">
              <input className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:bg-white font-bold text-sm" placeholder="Nomor Kohir (C)" value={form.nomor_c} onChange={e => setForm({...form, nomor_c: e.target.value})} />
              <input className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:bg-white font-bold text-sm" placeholder="Nama Lengkap" value={form.nama_pemilik} onChange={e => setForm({...form, nama_pemilik: e.target.value})} />
              <textarea className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:bg-white text-sm" placeholder="Alamat Singkat" rows={3} value={form.alamat_pemilik} onChange={e => setForm({...form, alamat_pemilik: e.target.value})} />
            </div>
          </div>

          {/* RINCIAN PERSIL */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="flex items-center gap-2 text-zinc-900 font-black text-xs uppercase tracking-widest"><Layers size={16}/> Rincian Persil</h4>
              <button onClick={() => setRows([...rows, { nomor_persil: '', jenis_tanah: 'Tanah Kering', klas_desa: '', luas_meter: 0, asal_usul: '' }])} className="text-[10px] font-black text-zinc-900 bg-zinc-100 px-5 py-2.5 rounded-xl uppercase">+ Tambah Persil</button>
            </div>
            
            <div className="space-y-3">
              {rows.map((row, i) => (
                <div key={i} className="p-5 bg-zinc-50/50 border border-zinc-100 rounded-3xl flex flex-wrap lg:flex-nowrap gap-3 items-center relative">
                  <input className="w-20 px-3 py-3 text-xs border border-zinc-200 rounded-xl outline-none bg-white font-bold" placeholder="Persil" value={row.nomor_persil} onChange={e => updateRow(i, 'nomor_persil', e.target.value)} />
                  <select className="w-36 px-3 py-3 text-xs border border-zinc-200 rounded-xl outline-none bg-white font-bold" value={row.jenis_tanah} onChange={e => updateRow(i, 'jenis_tanah', e.target.value)}>
                    <option>Tanah Kering</option><option>Sawah</option>
                  </select>
                  <input className="w-20 px-3 py-3 text-xs border border-zinc-200 rounded-xl outline-none bg-white font-bold" placeholder="Klas" value={row.klas_desa} onChange={e => updateRow(i, 'klas_desa', e.target.value)} />
                  <input className="w-24 px-3 py-3 text-xs border border-zinc-200 rounded-xl outline-none bg-white font-bold" placeholder="Luas" type="number" value={row.luas_meter} onChange={e => updateRow(i, 'luas_meter', parseFloat(e.target.value))} />
                  <input className="flex-1 min-w-[200px] px-4 py-3 text-xs border border-zinc-200 rounded-xl outline-none bg-white font-medium" placeholder="Keterangan Asal-Usul..." value={row.asal_usul} onChange={e => updateRow(i, 'asal_usul', e.target.value)} />
                  {rows.length > 1 && (
                    <button onClick={() => setRows(rows.filter((_, idx) => idx !== i))} className="p-2 text-zinc-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-10 border-t border-zinc-50 bg-white flex justify-end gap-6">
          <button type="button" onClick={onClose} className="text-sm font-black text-zinc-400 uppercase tracking-widest">Batal</button>
          <button onClick={handleSave} disabled={loading} className="px-12 py-4 bg-zinc-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
            {loading ? <Loader2 className="animate-spin" size={18}/> : editData ? 'Update Data' : 'Simpan Data'}
          </button>
        </div>
      </div>
    </div>
  );
};