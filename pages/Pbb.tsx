import React, { useState, useEffect } from 'react';
import { 
  Search, ArrowLeft, Printer, Trash2, 
  Plus, X, Map as MapIcon, ChevronRight, Hash, Edit3, Info
} from 'lucide-react';
import { db, supabase } from '../services/db';
import { LandData, Identity, PbbRecord } from '../types';

export const PbbPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allLands, setAllLands] = useState<LandData[]>([]);
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [pbbRecords, setPbbRecords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<{kec: string, desa: string} | null>(null);
  const [searchWP, setSearchWP] = useState(""); 
  const [searchOP, setSearchOP] = useState(""); 

  // State khusus Edit & Tambah Wilayah
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
  const [newLocation, setNewLocation] = useState({ kec: '', desa: '' });

  const [formData, setFormData] = useState<PbbRecord>({
    desa_id: '',
    identitas_id: '',
    data_tanah_id: '',
    tipe_layanan: 'PEREKAMAN DATA',
    nop_asal: '',
    status_subjek: 'PEMILIK',
    jenis_subjek: 'PRIBADI'
  });

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [l, i, p] = await Promise.all([db.lands.getAll(), db.identities.getAll(), db.pbb.getAll()]);
      setAllLands(l || []);
      setIdentities(i || []);
      setPbbRecords(p || []);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!formData.identitas_id || !formData.data_tanah_id) {
      alert("Pilih Wajib Pajak dan Objek Tanah dulu, Pak.");
      return;
    }

    try {
      const payload = { ...formData, desa_id: selectedLocation?.desa || '' };
      
      if (editingId) {
        const { error } = await supabase.from('pbb_records').update(payload).eq('id', editingId);
        if (error) throw error;
        alert("Data PBB berhasil diperbarui!");
      } else {
        await db.pbb.add(payload);
        alert("Data PBB berhasil ditambahkan!");
      }

      closeModal();
      fetchAllData();
    } catch (e) { 
      console.error(e);
      alert("Gagal menyimpan data ke database."); 
    }
  };

  const handleAddLocation = () => {
    if (!newLocation.kec || !newLocation.desa) return alert("Isi Kecamatan & Desa dulu!");
    
    // Alur: Simpan sementara atau langsung arahkan ke Tambah Tanah dengan parameter
    const confirmMove = window.confirm(`Wilayah ${newLocation.desa} akan didaftarkan melalui Manajemen Objek Tanah. Lanjutkan?`);
    if(confirmMove) {
        // Bapak bisa sesuaikan path navigasi ini ke halaman input tanah Bapak
        // window.location.href = `/data-tanah?add=true&kec=${newLocation.kec}&desa=${newLocation.desa}`;
        alert("Fungsi navigasi siap dikoneksikan ke modul Data Tanah.");
        setIsAddLocationOpen(false);
    }
  };

  const startEdit = (record: any) => {
    setEditingId(record.id);
    setFormData({
      desa_id: record.desa_id,
      identitas_id: record.identitas_id,
      data_tanah_id: record.data_tanah_id,
      tipe_layanan: record.tipe_layanan,
      nop_asal: record.nop_asal,
      status_subjek: record.status_subjek,
      jenis_subjek: record.jenis_subjek
    });
    // Set teks pencarian agar input tidak kosong saat edit
    setSearchWP(record.identities?.nama || "");
    setSearchOP(record.lands?.nop || "");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setSearchWP("");
    setSearchOP("");
    setFormData({
      desa_id: '', identitas_id: '', data_tanah_id: '',
      tipe_layanan: 'PEREKAMAN DATA', nop_asal: '',
      status_subjek: 'PEMILIK', jenis_subjek: 'PRIBADI'
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Hapus data PBB ini? Tindakan ini tidak bisa dibatalkan.")) {
      try {
        await db.pbb.delete(id);
        fetchAllData();
      } catch (e) { alert("Gagal menghapus."); }
    }
  };

  const kecamatanList = Array.from(new Set(allLands.map(l => (l.kecamatan || "Tanpa Kecamatan").toUpperCase()))).sort();

  // Logika Filter Pencarian Baru (Kecamatan + Desa)
  const filteredKecamatan = kecamatanList.filter(kec => {
    const isKecMatch = kec.includes(searchTerm.toUpperCase());
    const hasMatchingDesa = allLands.some(l => 
      (l.kecamatan || "").toUpperCase() === kec && 
      (l.desa || "").toUpperCase().includes(searchTerm.toUpperCase())
    );
    return isKecMatch || hasMatchingDesa;
  });

  if (loading) return <div className="p-10 text-[10px] font-mono tracking-widest text-slate-400 animate-pulse">SYNCING_DATABASE...</div>;

  // --- VIEW: DETAIL DATA PER DESA ---
  if (selectedLocation) {
    const filteredRecords = pbbRecords.filter(r => (r.desa_id || "").toUpperCase() === selectedLocation.desa.toUpperCase());

    return (
      <div className="min-h-screen bg-white p-6 lg:p-10 font-sans text-slate-900 animate-in fade-in duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <button onClick={() => { setSelectedLocation(null); setSearchWP(""); setSearchOP(""); }} className="p-2 hover:bg-slate-100 rounded-md transition-all">
                <ArrowLeft size={18} className="text-slate-400" />
              </button>
              <div>
                <h1 className="text-xl font-bold tracking-tight uppercase">{selectedLocation.desa}</h1>
                <p className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.2em]">{selectedLocation.kec}</p>
              </div>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-md text-[10px] font-black tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2">
              <Plus size={14}/> TAMBAH RECORD
            </button>
          </div>

          <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-tighter">
                  <th className="px-6 py-4 italic">Wajib Pajak (Subjek)</th>
                  <th className="px-6 py-4 italic">Objek Pajak (Tanah)</th>
                  <th className="px-6 py-4 italic">Administrasi</th>
                  <th className="px-6 py-4 text-right italic">Navigasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.length === 0 ? (
                   <tr><td colSpan={4} className="p-20 text-center text-slate-300 italic font-medium">Belum ada data terekam di desa ini.</td></tr>
                ) : filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-900 uppercase text-sm leading-tight">{r.identities?.nama || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400 mt-1 font-mono">NIK: {r.identities?.nik || '-'}</div>
                      <div className="text-[9px] text-indigo-400 mt-0.5 uppercase font-bold tracking-tighter">{r.identities?.pekerjaan || 'Pekerjaan tdk terdata'}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-mono text-slate-700 font-bold flex items-center gap-1">
                        <Hash size={12} className="text-slate-300"/> {r.lands?.nop || r.nop_asal || 'TANPA NOP'}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 uppercase">
                        Luas: <span className="font-bold text-slate-900">{r.lands?.luas_seluruhnya || 0} m²</span>
                      </div>
                      <div className="text-[9px] text-slate-400 truncate max-w-[200px] mt-0.5">{r.lands?.alamat}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5">
                        <span className="w-fit px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded text-[9px] font-black tracking-tighter uppercase">
                          {r.tipe_layanan}
                        </span>
                        <div className="text-[9px] text-slate-400 font-bold uppercase">{r.status_subjek} / {r.jenis_subjek}</div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                        <button onClick={() => startEdit(r)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Ubah Data">
                          <Edit3 size={16}/>
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all" title="Cetak SPOP">
                          <Printer size={16}/>
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Hapus">
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- MODAL EDIT / TAMBAH --- */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/10 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md border border-slate-200 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800">
                    {editingId ? 'Update Record' : 'New Database Entry'}
                  </h2>
                  <p className="text-[9px] text-slate-400 font-bold mt-0.5 uppercase italic">PBB / SPPT Schema Management</p>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-white rounded-full transition-all"><X size={18} className="text-slate-400"/></button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto overflow-x-hidden">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">1. Cari Wajib Pajak (Nama/NIK)</label>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Ketik Nama atau NIK..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:border-indigo-500 outline-none transition-all"
                      value={searchWP}
                      onChange={(e) => setSearchWP(e.target.value)}
                    />
                    {searchWP && !formData.identitas_id.includes(searchWP) && (
                      <div className="absolute z-[110] w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-40 overflow-y-auto">
                        {identities
                          .filter(i => 
                            i.nama.toLowerCase().includes(searchWP.toLowerCase()) || 
                            i.nik.includes(searchWP)
                          )
                          .map(i => (
                            <div 
                              key={i.id}
                              onClick={() => {
                                setFormData({...formData, identitas_id: i.id});
                                setSearchWP(i.nama.toUpperCase());
                              }}
                              className="p-3 text-[11px] font-bold hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-none"
                            >
                              <div className="text-slate-900">{i.nama.toUpperCase()}</div>
                              <div className="text-[9px] text-slate-400">NIK: {i.nik}</div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">2. Cari Objek Tanah (NOP/Desa)</label>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Ketik NOP atau Nama Desa..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:border-indigo-500 outline-none transition-all"
                      value={searchOP}
                      onChange={(e) => setSearchOP(e.target.value)}
                    />
                    {searchOP && !formData.data_tanah_id.includes(searchOP) && (
                      <div className="absolute z-[110] w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-40 overflow-y-auto">
                        {allLands
                          .filter(l => 
                            (l.nop || "").includes(searchOP) || 
                            (l.desa || "").toLowerCase().includes(searchOP.toLowerCase())
                          )
                          .map(l => (
                            <div 
                              key={l.id}
                              onClick={() => {
                                setFormData({...formData, data_tanah_id: l.id});
                                setSearchOP(l.nop || "TANPA NOP");
                              }}
                              className="p-3 text-[11px] font-bold hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-none"
                            >
                              <div className="text-slate-900">{l.nop || 'NO NOP'}</div>
                              <div className="text-[9px] text-slate-400 uppercase">{l.desa} - {l.alamat.substring(0, 30)}...</div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Jenis Layanan</label>
                    <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold" value={formData.tipe_layanan} onChange={(e) => setFormData({...formData, tipe_layanan: e.target.value as any})}>
                      <option>PEREKAMAN DATA</option>
                      <option>PEMUTAKHIRAN DATA</option>
                      <option>PENGHAPUSAN DATA</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Status Subjek</label>
                    <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold" value={formData.status_subjek} onChange={(e) => setFormData({...formData, status_subjek: e.target.value as any})}>
                      <option>PEMILIK</option>
                      <option>PENYEWA</option>
                      <option>PENGELOLA</option>
                      <option>PEMAKAI</option>
                      <option>SENGKETA</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex gap-3">
                   <Info size={16} className="text-indigo-400 mt-0.5 shrink-0"/>
                   <p className="text-[9px] text-indigo-600 font-medium leading-relaxed italic">Data Desa akan otomatis terdeteksi sebagai <b>{selectedLocation.desa}</b>.</p>
                </div>
              </div>

              <div className="p-6 bg-slate-50/80 border-t border-slate-100">
                <button onClick={handleSave} className="w-full py-3 bg-slate-900 text-white rounded-lg font-black text-[10px] hover:bg-slate-800 transition-all uppercase tracking-[0.2em] shadow-lg shadow-slate-200">
                  {editingId ? 'Confirm Update' : 'Finalize Record'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- VIEW: DASHBOARD (SCHEMA GRID) ---
  return (
    <div className="min-h-screen bg-white p-6 lg:p-10 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 border-b border-slate-100 pb-12">
          <div>
            <h1 className="text-3xl font-black tracking-tighter mb-2 uppercase italic">PBB</h1>
            <p className="text-[10px] text-slate-400 font-bold tracking-[0.3em]">GEOSPATIAL TAX RECORD</p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input 
                type="text" 
                placeholder="Cari Kecamatan atau Desa..." 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-xs font-bold outline-none focus:border-slate-900 transition-all"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setIsAddLocationOpen(true)}
              className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              title="Tambah Wilayah Baru"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        <div className="space-y-16">
          {filteredKecamatan.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-3xl">
              <p className="text-slate-300 font-bold italic text-sm">Wilayah tidak ditemukan. Coba tambah wilayah baru?</p>
            </div>
          ) : (
            filteredKecamatan.map(kec => {
              const desas = Array.from(new Set(
                allLands
                  .filter(l => (l.kecamatan || "").toUpperCase() === kec)
                  .map(l => (l.desa || "Tanpa Desa").toUpperCase())
              )).filter(d => d.includes(searchTerm.toUpperCase())).sort();

              return (
                <div key={kec} className="animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-4 mb-6">
                    <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.4em] bg-slate-100 px-4 py-1.5 rounded-full">{kec}</h2>
                    <div className="h-[1px] flex-1 bg-slate-100"></div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {desas.map(desa => (
                      <button key={desa} onClick={() => setSelectedLocation({kec, desa})} className="group flex flex-col p-6 border border-slate-100 rounded-2xl hover:border-slate-900 hover:bg-slate-50 transition-all text-left relative overflow-hidden bg-white shadow-sm hover:shadow-md">
                        <div className="flex justify-between items-start mb-6">
                          <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl group-hover:bg-slate-900 group-hover:text-white transition-all">
                            <MapIcon size={18} />
                          </div>
                          <ChevronRight size={16} className="text-slate-200 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
                        </div>
                        <span className="block text-sm font-black text-slate-900 uppercase tracking-tight mb-1">{desa}</span>
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest italic">
                          {allLands.filter(l => (l.desa || "").toUpperCase() === desa).length} Objek Terdaftar
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL TAMBAH WILAYAH BARU */}
      {isAddLocationOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/20 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-50">
              <h3 className="text-xs font-black uppercase tracking-widest">Tambah Wilayah Kerja</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase">Kecamatan</label>
                <input 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-indigo-500"
                  placeholder="Contoh: PASREPAN"
                  onChange={(e) => setNewLocation({...newLocation, kec: e.target.value.toUpperCase()})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase">Desa/Kelurahan</label>
                <input 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-indigo-500"
                  placeholder="Contoh: MANGUAN"
                  onChange={(e) => setNewLocation({...newLocation, desa: e.target.value.toUpperCase()})}
                />
              </div>
            </div>
            <div className="p-6 bg-slate-50 flex gap-3">
              <button onClick={() => setIsAddLocationOpen(false)} className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Batal</button>
              <button onClick={handleAddLocation} className="flex-1 py-3 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">Lanjutkan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};