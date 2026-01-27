import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, ArrowLeft, Trash2, Plus, X, 
  ChevronRight, Edit3, Database, User, MapPin, CreditCard, Building2
} from 'lucide-react';
import { db } from '../services/db';
import { LandData, Identity } from '../types';

// --- KOMPONEN INPUT KOTAK (NOP & NIK) ---
const CustomBlockInput = ({ label, value, pattern, onChange, readonly = false }: { 
  label: string, value: string, pattern: number[], onChange: (val: string) => void, readonly?: boolean 
}) => {
  const totalCells = pattern.reduce((a, b) => a + b, 0);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const chars = value.replace(/[^A-Z0-9]/g, '').padEnd(totalCells, " ").split("");

  const handleInput = (char: string, index: number) => {
    if (readonly) return;
    const currentDigits = [...chars];
    currentDigits[index] = char.toUpperCase();
    onChange(currentDigits.join("").trimEnd());
    if (char && index < totalCells - 1) inputsRef.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (readonly) return;
    const pastedData = e.clipboardData.getData('Text').replace(/[^A-Z0-9]/g, '').slice(0, totalCells);
    onChange(pastedData);
  };

  let currentIndex = 0;
  return (
    <div className="mb-6">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block italic">{label}</label>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
        {pattern.map((groupCount, groupIdx) => {
          const group = (
            <div key={groupIdx} className="flex gap-1 bg-slate-50 p-1 rounded-md border border-slate-100">
              {Array.from({ length: groupCount }).map(() => {
                const i = currentIndex++;
                return (
                  <input
                    key={i}
                    ref={(el) => { inputsRef.current[i] = el; }}
                    value={chars[i] === " " ? "" : chars[i]}
                    maxLength={1}
                    readOnly={readonly}
                    onPaste={handlePaste}
                    onChange={(e) => handleInput(e.target.value, i)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !chars[i] && i > 0) inputsRef.current[i - 1]?.focus();
                    }}
                    className={`w-7 h-9 text-center text-sm font-bold rounded border ${readonly ? 'bg-slate-100 text-slate-400 border-transparent' : 'bg-white text-slate-900 border-slate-200 focus:border-slate-900 shadow-sm'} outline-none transition-all`}
                  />
                );
              })}
            </div>
          );
          return group;
        })}
      </div>
    </div>
  );
};

export const PbbPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allLands, setAllLands] = useState<LandData[]>([]);
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [pbbRecords, setPbbRecords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<{kec: string, desa: string} | null>(null);

  const [linkedWP, setLinkedWP] = useState<Identity | null>(null);
  const [linkedOP, setLinkedOP] = useState<LandData | null>(null);
  
  const [formData, setFormData] = useState<any>({
    tipe_layanan: 'PEREKAMAN DATA',
    status_subjek: 'PEMILIK',
    jenis_subjek: 'PRIBADI',
    pekerjaan: 'PNS',
    nop_bersama: '',
    nop_asal: '',
    manual_nik: '',
    manual_nama: '',
    manual_alamat: ''
  });

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [l, i, p] = await Promise.all([db.lands.getAll(), db.identities.getAll(), db.pbb.getAll()]);
      setAllLands(l || []); setIdentities(i || []); setPbbRecords(p || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setLinkedWP(null); setLinkedOP(null);
    setFormData({ 
        tipe_layanan: 'PEREKAMAN DATA', status_subjek: 'PEMILIK', jenis_subjek: 'PRIBADI', 
        pekerjaan: 'PNS', nop_bersama: '', nop_asal: '', manual_nik: '', manual_nama: '', manual_alamat: '' 
    });
  };

  const kecamatanList = Array.from(new Set(allLands.map(l => (l.kecamatan || "N/A").toUpperCase()))).sort();

  if (loading && !allLands.length) return <div className="h-screen flex items-center justify-center text-xs font-bold tracking-widest text-slate-400">MEMUAT DATABASE...</div>;

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900">
      {selectedLocation ? (
        <div className="p-8 max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setSelectedLocation(null)} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-900 hover:text-white transition-all">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{selectedLocation.desa}</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{selectedLocation.kec}</p>
              </div>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl text-[11px] font-bold tracking-wider flex items-center gap-2 shadow-lg shadow-slate-200">
              <Plus size={16}/> RECORD BARU
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Subjek Pajak</th>
                  <th className="px-6 py-4">NOP</th>
                  <th className="px-6 py-4">Layanan</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pbbRecords.filter(r => r.desa_id?.toUpperCase() === selectedLocation.desa.toUpperCase()).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-6 py-4 font-bold text-sm uppercase">{r.identities?.nama || r.manual_nama}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{r.lands?.nop}</td>
                    <td className="px-6 py-4"><span className="text-[9px] font-bold border border-slate-200 px-2 py-1 rounded bg-white">{r.tipe_layanan}</span></td>
                    <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 text-slate-400">
                            <Edit3 size={16} className="hover:text-slate-900 cursor-pointer"/>
                            <Trash2 size={16} className="hover:text-red-600 cursor-pointer"/>
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-10 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">E-PBB Pasuruan</h1>
              <p className="text-sm text-slate-400 mt-1">Grup Desa per Wilayah Kecamatan</p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Cari desa..." className="w-full p-3 pl-10 border border-slate-200 rounded-xl text-sm outline-none bg-white shadow-sm" onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="space-y-12">
            {kecamatanList.map(kec => (
              <div key={kec}>
                <h2 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase mb-6 flex items-center gap-4">
                  {kec} <div className="h-px flex-1 bg-slate-200"></div>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.from(new Set(allLands.filter(l => l.kecamatan?.toUpperCase() === kec).map(l => l.desa?.toUpperCase())))
                    .filter(d => d?.includes(searchTerm.toUpperCase()))
                    .map(desa => (
                      <button key={desa} onClick={() => setSelectedLocation({kec, desa: desa!})} className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-slate-900 transition-all text-left shadow-sm flex justify-between items-center group">
                        <span className="text-sm font-bold text-slate-700 uppercase tracking-tight">{desa}</span>
                        <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL SYSTEM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-5xl h-[92vh] rounded-[2.5rem] border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-900 rounded-xl text-white"><Database size={20}/></div>
                <h2 className="text-lg font-bold">Perekaman Data PBB</h2>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all"><X size={20}/></button>
            </div>

            <div className="p-8 overflow-y-auto space-y-10">
              {/* SECTION 1: KONEKSI */}
              <section className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200/50 grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identitas (Hanya Pribadi)</label>
                    <select className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none" onChange={(e) => setLinkedWP(identities.find(i => i.id === e.target.value) || null)}>
                      <option value="">-- PILIH WP JIKA PRIBADI --</option>
                      {identities.map(i => <option key={i.id} value={i.id}>{i.nama} [{i.nik}]</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data Tanah (Objek Pajak)</label>
                    <select className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none" onChange={(e) => setLinkedOP(allLands.find(l => l.id === e.target.value) || null)}>
                      <option value="">-- PILIH NOP / LOKASI --</option>
                      {allLands.filter(l => l.desa?.toUpperCase() === selectedLocation?.desa.toUpperCase()).map(l => (
                        <option key={l.id} value={l.id}>{l.nop} - {l.alamat.slice(0, 30)}</option>
                      ))}
                    </select>
                 </div>
              </section>

              {linkedOP && (
                <div className="space-y-10">
                  {/* PILIHAN LAYANAN & JENIS */}
                  <div className="flex flex-col md:flex-row gap-5">
                     <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase italic">Jenis Layanan</label>
                        <select className="w-full p-4 border border-slate-200 rounded-2xl text-sm font-bold bg-white" value={formData.tipe_layanan} onChange={e => setFormData({...formData, tipe_layanan: e.target.value})}>
                          <option>PEREKAMAN DATA</option><option>PEMUTAKHIRAN DATA</option><option>PENGHAPUSAN DATA</option>
                        </select>
                     </div>
                     <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase italic">Jenis Subjek</label>
                        <select className="w-full p-4 border border-slate-200 rounded-2xl text-sm font-bold bg-slate-900 text-white" value={formData.jenis_subjek} onChange={e => setFormData({...formData, jenis_subjek: e.target.value})}>
                          <option value="PRIBADI">PRIBADI (AMBIL DATA IDENTITAS)</option>
                          <option value="BADAN">BADAN (PENGISIAN MANUAL)</option>
                        </select>
                     </div>
                  </div>

                  {/* NOP AREA */}
                  <div className="p-8 bg-white border border-slate-100 rounded-[2rem]">
                    <CustomBlockInput label="NOP UTAMA" value={linkedOP.nop || ''} pattern={[2,2,3,3,3,4,1]} onChange={() => {}} readonly />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
                      <CustomBlockInput label="NOP BERSAMA" value={formData.nop_bersama} pattern={[2,2,3,3,3,4,1]} onChange={v => setFormData({...formData, nop_bersama: v})} />
                      <CustomBlockInput label="NOP ASAL" value={formData.nop_asal} pattern={[2,2,3,3,3,4,1]} onChange={v => setFormData({...formData, nop_asal: v})} />
                    </div>
                  </div>

                  {/* DETAIL FORM: NIK BARIS PENUH */}
                  <div className="space-y-10">
                    <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                       <CustomBlockInput 
                          label={formData.jenis_subjek === 'PRIBADI' ? "NIK (AUTO DARI DATA KLIEN)" : "NOMOR IDENTITAS BADAN / LAINNYA (MANUAL)"} 
                          value={formData.jenis_subjek === 'PRIBADI' ? (linkedWP?.nik || '') : formData.manual_nik} 
                          pattern={[16]} 
                          onChange={v => setFormData({...formData, manual_nik: v})} 
                          readonly={formData.jenis_subjek === 'PRIBADI'} 
                       />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
                        <div className="space-y-8">
                           <h3 className="text-xs font-black uppercase text-slate-400 flex items-center gap-2"><User size={14}/> Profil Subjek Pajak</h3>
                           
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                 <label className="text-[10px] font-bold text-slate-400 uppercase">Pekerjaan</label>
                                 <select className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold" value={formData.pekerjaan} onChange={e => setFormData({...formData, pekerjaan: e.target.value})}>
                                   <option>PNS</option><option>ABRI</option><option>PENSIUNAN</option><option>BADAN</option><option>LAINNYA</option>
                                 </select>
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[10px] font-bold text-slate-400 uppercase">Status WP</label>
                                 <select className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold" value={formData.status_subjek} onChange={e => setFormData({...formData, status_subjek: e.target.value})}>
                                   <option>PEMILIK</option><option>PENYEWA</option><option>PENGELOLA</option><option>PEMAKAI</option><option>SENGKETA</option>
                                 </select>
                              </div>
                           </div>

                           <div className="p-6 bg-white border-2 border-slate-100 rounded-3xl space-y-5 shadow-sm">
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nama Lengkap Subjek</label>
                                 <input 
                                    className={`w-full bg-transparent border-b border-slate-200 font-bold text-sm uppercase outline-none pb-1 ${formData.jenis_subjek === 'PRIBADI' ? 'text-slate-500' : 'text-slate-900 border-slate-900'}`}
                                    value={formData.jenis_subjek === 'PRIBADI' ? (linkedWP?.nama || '') : formData.manual_nama}
                                    onChange={e => setFormData({...formData, manual_nama: e.target.value})}
                                    readOnly={formData.jenis_subjek === 'PRIBADI'}
                                    placeholder="NAMA BADAN / WP..."
                                 />
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Alamat Domisili WP</label>
                                 <textarea 
                                    className={`w-full bg-transparent border-b border-slate-200 font-medium text-xs uppercase outline-none pb-1 resize-none h-16 ${formData.jenis_subjek === 'PRIBADI' ? 'text-slate-500' : 'text-slate-900 border-slate-900'}`}
                                    value={formData.jenis_subjek === 'PRIBADI' ? `${linkedWP?.alamat || ''}, RT${linkedWP?.rt || ''}/RW${linkedWP?.rw || ''}, ${linkedWP?.desa || ''}, ${linkedWP?.kecamatan || ''}` : formData.manual_alamat}
                                    onChange={e => setFormData({...formData, manual_alamat: e.target.value})}
                                    readOnly={formData.jenis_subjek === 'PRIBADI'}
                                    placeholder="ALAMAT LENGKAP WP..."
                                 />
                              </div>
                           </div>
                        </div>

                        <div className="space-y-8">
                           <h3 className="text-xs font-black uppercase text-slate-400 flex items-center gap-2"><MapPin size={14}/> Lokasi Objek Pajak</h3>
                           <div className="p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-xl relative overflow-hidden">
                              <Building2 className="absolute right-[-20px] top-[-20px] text-white/5" size={140} />
                              <div className="relative z-10 space-y-6">
                                 <div className="border-b border-white/10 pb-3">
                                    <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest block mb-1">Letak Objek</label>
                                    <div className="text-xs font-bold uppercase tracking-tight leading-relaxed">{linkedOP.alamat}</div>
                                 </div>
                                 <div className="grid grid-cols-2 gap-4">
                                    <div className="border-b border-white/10 pb-3">
                                       <label className="text-[9px] font-bold text-white/40 uppercase block mb-1">RT / RW</label>
                                       <div className="text-xs font-bold">{linkedOP.rt || '0'}/{linkedOP.rw || '0'}</div>
                                    </div>
                                    <div className="border-b border-white/10 pb-3">
                                       <label className="text-[9px] font-bold text-white/40 uppercase block mb-1">Persil / Desa</label>
                                       <div className="text-xs font-bold uppercase">{linkedOP.persil || '-'} / {linkedOP.desa}</div>
                                    </div>
                                 </div>
                                 <div className="flex justify-between items-end pt-2">
                                    <div>
                                       <div className="text-[8px] bg-white/10 px-2 py-0.5 rounded text-white/60 font-black inline-block uppercase tracking-widest mb-1">Valid Geo</div>
                                       <div className="text-[10px] font-bold text-white/40 uppercase">Kec. {linkedOP.kecamatan}</div>
                                    </div>
                                    <div className="text-right">
                                       <label className="text-[9px] font-bold text-white/40 uppercase block">Luas Tanah</label>
                                       <div className="text-4xl font-black italic tracking-tighter">{linkedOP.luas_seluruhnya} <span className="text-xs not-italic font-bold opacity-30">M²</span></div>
                                    </div>
                                 </div>
                              </div>
                           </div>
                           <div className="p-5 border-2 border-slate-900 rounded-2xl flex items-center justify-between bg-white">
                              <div className="flex items-center gap-3">
                                 <CreditCard className="text-slate-400" size={18}/>
                                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 italic">Syncronize Ready</span>
                              </div>
                              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                           </div>
                        </div>
                    </div>
                  </div>

                  <button className="w-full py-7 bg-slate-900 text-white rounded-[1.8rem] font-bold text-sm uppercase tracking-[0.4em] hover:bg-black hover:scale-[1.01] active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-4 mt-6">
                    <Database size={18}/> Simpan Perubahan PBB
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PbbPage;