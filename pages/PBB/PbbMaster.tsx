import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/db';
import { Building2, Plus, Trash2, Map, ChevronRight, Loader2 } from 'lucide-react';

export const PbbMaster = () => {
  const [kecamatans, setKecamatans] = useState<any[]>([]);
  const [desas, setDesas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newKec, setNewKec] = useState('');
  const [newDesa, setNewDesa] = useState({ nama: '', kecId: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: k } = await supabase.from('kecamatan').select('*').order('nama');
    const { data: d } = await supabase.from('desa').select('*').order('nama');
    setKecamatans(k || []);
    setDesas(d || []);
    setLoading(false);
  };

  const addKecamatan = async () => {
    if(!newKec) return;
    await supabase.from('kecamatan').insert([{ nama: newKec.toUpperCase() }]);
    setNewKec('');
    loadData();
  };

  const addDesa = async () => {
    if(!newDesa.nama || !newDesa.kecId) return;
    await supabase.from('desa').insert([{ 
      nama: newDesa.nama.toUpperCase(), 
      kecamatan_id: newDesa.kecId 
    }]);
    setNewDesa({ nama: '', kecId: '' });
    loadData();
  };

  const deleteItem = async (table: string, id: string) => {
    if(!confirm('Hapus wilayah ini? Data PBB di dalamnya mungkin akan terdampak.')) return;
    await supabase.from(table).delete().eq('id', id);
    loadData();
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="mb-10">
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Master Wilayah</h2>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Pengaturan Basis Data Kecamatan & Desa</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* KELOLA KECAMATAN */}
        <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
          <h3 className="flex items-center gap-2 font-black uppercase text-xs tracking-widest mb-6 text-blue-600">
            <Map size={16}/> Daftar Kecamatan
          </h3>
          <div className="flex gap-2 mb-6">
            <input 
              className="flex-1 px-4 py-3 bg-slate-50 rounded-xl text-sm font-bold outline-none border-2 border-transparent focus:border-blue-500 transition-all"
              placeholder="Nama Kecamatan Baru..."
              value={newKec}
              onChange={(e) => setNewKec(e.target.value)}
            />
            <button onClick={addKecamatan} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-all">
              <Plus size={20}/>
            </button>
          </div>
          <div className="space-y-2">
            {kecamatans.map(k => (
              <div key={k.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl group">
                <span className="font-black text-xs uppercase">{k.nama}</span>
                <button onClick={() => deleteItem('kecamatan', k.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all">
                  <Trash2 size={14}/>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* KELOLA DESA */}
        <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
          <h3 className="flex items-center gap-2 font-black uppercase text-xs tracking-widest mb-6 text-emerald-600">
            <Building2 size={16}/> Daftar Desa / Kelurahan
          </h3>
          <div className="space-y-3 mb-6 bg-slate-50 p-6 rounded-[2rem]">
            <select 
              className="w-full px-4 py-3 bg-white rounded-xl text-xs font-bold outline-none border-2 border-slate-100 focus:border-emerald-500 transition-all"
              value={newDesa.kecId}
              onChange={(e) => setNewDesa({...newDesa, kecId: e.target.value})}
            >
              <option value="">Pilih Kecamatan...</option>
              {kecamatans.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
            </select>
            <div className="flex gap-2">
              <input 
                className="flex-1 px-4 py-3 bg-white rounded-xl text-sm font-bold outline-none border-2 border-slate-100 focus:border-emerald-500 transition-all"
                placeholder="Nama Desa Baru..."
                value={newDesa.nama}
                onChange={(e) => setNewDesa({...newDesa, nama: e.target.value})}
              />
              <button onClick={addDesa} className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-slate-900 transition-all">
                <Plus size={20}/>
              </button>
            </div>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2 scrollbar-hide">
            {desas.map(d => (
              <div key={d.id} className="flex justify-between items-center p-4 border border-slate-100 rounded-2xl group hover:bg-slate-50 transition-all">
                <div>
                  <span className="font-black text-xs uppercase">{d.nama}</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                      {kecamatans.find(k => k.id === d.kecamatan_id)?.nama}
                    </span>
                  </div>
                </div>
                <button onClick={() => deleteItem('desa', d.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all">
                  <Trash2 size={14}/>
                </button>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};