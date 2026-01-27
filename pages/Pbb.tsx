import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, ArrowLeft, Trash2, Plus, X, 
  ChevronRight, Edit3, Database, User, MapPin, Building2, Filter, Calendar, Info
} from 'lucide-react';
import { db } from '../services/db';
import { LandData, Identity } from '../types';

// --- KOMPONEN PENCARIAN NOP KOTAK (REAL-TIME) ---
const NopSearchBox = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const pattern = [2, 2, 3, 3, 3, 4, 1];
  const totalCells = 18;
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const chars = value.padEnd(totalCells, " ").split("");

  const handleInput = (char: string, index: number) => {
    const newChars = [...chars];
    newChars[index] = char.toUpperCase().replace(/[^0-9]/g, '');
    const newValue = newChars.join("").trimEnd();
    onChange(newValue);
    if (char && index < totalCells - 1) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !chars[index] && index > 0) inputsRef.current[index - 1]?.focus();
  };

  let currentIndex = 0;
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm mb-8 animate-in slide-in-from-top duration-500">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-slate-900 text-white rounded-lg"><Filter size={16}/></div>
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Pencarian NOP Real-time</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {pattern.map((count, gIdx) => (
          <div key={gIdx} className="flex gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
            {Array.from({ length: count }).map(() => {
              const i = currentIndex++;
              return (
                <input
                  key={i}
                  ref={(el) => { inputsRef.current[i] = el; }}
                  value={chars[i] === " " ? "" : chars[i]}
                  maxLength={1}
                  onChange={e => handleInput(e.target.value, i)}
                  onKeyDown={e => handleKeyDown(e, i)}
                  className="w-8 h-10 text-center font-bold text-slate-900 bg-white border border-slate-200 rounded-md focus:border-slate-900 outline-none transition-all text-sm"
                  placeholder="0"
                />
              );
            })}
          </div>
        ))}
        <button onClick={() => onChange("")} className="px-4 text-[10px] font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all">RESET</button>
      </div>
    </div>
  );
};

// --- KOMPONEN INPUT FORM MODAL (NOP & NIK) ---
const CustomBlockInput = ({ label, value, pattern, onChange, readonly = false }: any) => {
  const totalCells = pattern.reduce((a: number, b: number) => a + b, 0);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const chars = value.replace(/[^A-Z0-9]/g, '').padEnd(totalCells, " ").split("");

  const handleInput = (char: string, index: number) => {
    if (readonly) return;
    const newChars = [...chars];
    newChars[index] = char.toUpperCase();
    onChange(newChars.join("").trimEnd());
    if (char && index < totalCells - 1) inputsRef.current[index + 1]?.focus();
  };

  let currentIndex = 0;
  return (
    <div className="mb-4">
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">{label}</label>
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
        {pattern.map((groupCount: number, groupIdx: number) => (
          <div key={groupIdx} className="flex gap-0.5 bg-slate-50 p-1 rounded-lg border border-slate-100">
            {Array.from({ length: groupCount }).map(() => {
              const i = currentIndex++;
              return (
                <input
                  key={i}
                  ref={(el) => { inputsRef.current[i] = el; }}
                  value={chars[i] === " " ? "" : chars[i]}
                  maxLength={1}
                  readOnly={readonly}
                  onChange={(e) => handleInput(e.target.value, i)}
                  className={`w-6 h-8 text-center text-[11px] font-bold rounded border ${readonly ? 'bg-slate-100 text-slate-400 border-transparent' : 'bg-white text-slate-900 border-slate-200 focus:border-slate-900'} outline-none transition-all`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export const PbbPage: React.FC = () => {
  const [allLands, setAllLands] = useState<LandData[]>([]);
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [pbbRecords, setPbbRecords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchNop, setSearchNop] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{kec: string, desa: string} | null>(null);
  
  const [linkedWP, setLinkedWP] = useState<Identity | null>(null);
  const [linkedOP, setLinkedOP] = useState<LandData | null>(null);
  
  const [formData, setFormData] = useState<any>({
    tahun_pajak: new Date().getFullYear().toString(),
    tgl_rekam: new Date().toISOString().split('T')[0],
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

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    const [l, i, p] = await Promise.all([db.lands.getAll(), db.identities.getAll(), db.pbb.getAll()]);
    setAllLands(l || []); setIdentities(i || []); setPbbRecords(p || []);
  };

  const filteredLands = allLands.filter(l => {
    const matchDesa = l.desa?.toUpperCase().includes(searchTerm.toUpperCase());
    const matchNop = l.nop?.replace(/\./g, '').includes(searchNop);
    return matchDesa && matchNop;
  });

  const kecamatanList = Array.from(new Set(allLands.map(l => (l.kecamatan || "N/A").toUpperCase()))).sort();

  return (
    <div className="h-screen bg-slate-50/50 flex flex-col overflow-hidden font-sans">
      {selectedLocation ? (
        /* DETAIL VIEW PER DESA */
        <div className="flex-1 overflow-y-auto p-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedLocation(null)} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-900 hover:text-white transition-all">
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h1 className="text-3xl font-black uppercase tracking-tight">{selectedLocation.desa}</h1>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Kecamatan {selectedLocation.kec}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] text-[11px] font-black tracking-[0.2em] flex items-center gap-3 shadow-xl">
                <Plus size={18}/> TAMBAH DATA PBB
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-10 py-6">Wajib Pajak</th>
                    <th className="px-10 py-6">NOP (Objek Pajak)</th>
                    <th className="px-10 py-6">Layanan</th>
                    <th className="px-10 py-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pbbRecords.filter(r => r.desa_id?.toUpperCase() === selectedLocation.desa.toUpperCase()).map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/30 transition-all">
                      <td className="px-10 py-6 font-bold text-sm uppercase">{r.identities?.nama || r.manual_nama}</td>
                      <td className="px-10 py-6 font-mono text-xs text-slate-500">{r.lands?.nop}</td>
                      <td className="px-10 py-6"><span className="text-[9px] font-black border-2 border-slate-100 px-3 py-1 rounded-full">{r.tipe_layanan}</span></td>
                      <td className="px-10 py-6 text-right">
                          <div className="flex justify-end gap-3 text-slate-300">
                              <Edit3 size={16} className="hover:text-slate-900 cursor-pointer"/>
                              <Trash2 size={16} className="hover:text-red-500 cursor-pointer"/>
                          </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* MAIN DASHBOARD */
        <>
          <div className="p-10 pb-2 max-w-7xl mx-auto w-full flex-shrink-0">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-4xl font-black tracking-tighter italic">E-PBB <span className="text-slate-300 not-italic">SPOP/LSPOP</span></h1>
                <p className="text-sm text-slate-400 mt-1">Pencarian Objek Pajak Desa melalui Filter NOP Kotak</p>
              </div>
              <div className="relative w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="CARI DESA..." className="w-full p-4 pl-12 bg-white border-2 border-slate-100 rounded-[1.2rem] outline-none focus:border-slate-900 text-xs font-bold" onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
            <NopSearchBox value={searchNop} onChange={setSearchNop} />
          </div>

          <div className="flex-1 overflow-y-auto px-10 pb-20">
            <div className="max-w-7xl mx-auto space-y-14">
              {kecamatanList.map(kec => {
                const desaInKec = Array.from(new Set(filteredLands.filter(l => l.kecamatan?.toUpperCase() === kec).map(l => l.desa?.toUpperCase())));
                if (desaInKec.length === 0) return null;
                return (
                  <div key={kec}>
                    <h2 className="text-[10px] font-black tracking-[0.3em] text-slate-300 uppercase mb-8 flex items-center gap-6">
                      WILAYAH {kec} <div className="h-[2px] flex-1 bg-slate-100"></div>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {desaInKec.map(desa => (
                        <button key={desa} onClick={() => setSelectedLocation({kec, desa: desa!})} className="p-7 bg-white border-2 border-slate-50 rounded-[2rem] hover:border-slate-900 hover:shadow-xl transition-all text-left flex justify-between items-center group shadow-sm">
                           <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{desa}</span>
                           <ChevronRight size={18} className="text-slate-200 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* MODAL FORM SUPER LENGKAP */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6">
          <div className="bg-white w-full max-w-6xl h-[94vh] rounded-[3.5rem] border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-lg"><Database size={24}/></div>
                <div>
                  <h2 className="text-xl font-black uppercase">Perekaman Data SPOP</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Administrasi Pajak Bumi dan Bangunan</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-100 rounded-full text-slate-400 transition-all"><X size={28}/></button>
            </div>

            <div className="p-10 overflow-y-auto space-y-12">
              {/* STEP 1: KONEKSI DATA */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tahun Pajak</label>
                    <div className="relative">
                       <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                       <input type="number" className="w-full p-4 pl-10 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold" value={formData.tahun_pajak} onChange={e => setFormData({...formData, tahun_pajak: e.target.value})} />
                    </div>
                 </div>
                 <div className="md:col-span-2 grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Cari Wajib Pajak (Database)</label>
                      <select className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-slate-900" onChange={(e) => setLinkedWP(identities.find(i => i.id === e.target.value) || null)}>
                        <option value="">-- PILIH DATA IDENTITAS --</option>
                        {identities.map(i => <option key={i.id} value={i.id}>{i.nama} [{i.nik}]</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Objek (NOP)</label>
                      <select className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-slate-900" onChange={(e) => setLinkedOP(allLands.find(l => l.id === e.target.value) || null)}>
                        <option value="">-- PILIH NOP / LOKASI --</option>
                        {allLands.filter(l => l.desa?.toUpperCase() === selectedLocation?.desa.toUpperCase()).map(l => (
                          <option key={l.id} value={l.id}>{l.nop} - {l.alamat.slice(0, 20)}...</option>
                        ))}
                      </select>
                    </div>
                 </div>
              </div>

              {linkedOP && (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
                  {/* DETAIL NOP LENGKAP */}
                  <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 relative">
                    <div className="absolute top-8 right-10 flex gap-4">
                       <div className="text-right">
                          <span className="text-[9px] font-black text-slate-400 uppercase block">Tanggal Rekam</span>
                          <span className="text-xs font-bold">{formData.tgl_rekam}</span>
                       </div>
                    </div>
                    <CustomBlockInput label="NOP UTAMA (DARI DATABASE)" value={linkedOP.nop || ''} pattern={[2,2,3,3,3,4,1]} readonly />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-6">
                      <CustomBlockInput label="NOP ASAL" value={formData.nop_asal} pattern={[2,2,3,3,3,4,1]} onChange={(v:string) => setFormData({...formData, nop_asal: v})} />
                      <CustomBlockInput label="NOP INDUK / BERSAMA" value={formData.nop_bersama} pattern={[2,2,3,3,3,4,1]} onChange={(v:string) => setFormData({...formData, nop_bersama: v})} />
                    </div>
                  </div>

                  {/* FORM LAYANAN & SUBJEK */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                     <div className="space-y-10">
                        <div className="space-y-6">
                           <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-2"><Info size={16}/> Informasi Layanan</h3>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Jenis Layanan</label>
                                 <select className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold" value={formData.tipe_layanan} onChange={e => setFormData({...formData, tipe_layanan: e.target.value})}>
                                    <option>PEREKAMAN DATA</option><option>PEMUTAKHIRAN DATA</option><option>PENGHAPUSAN DATA</option>
                                 </select>
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status Subjek</label>
                                 <select className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold" value={formData.status_subjek} onChange={e => setFormData({...formData, status_subjek: e.target.value})}>
                                    <option>PEMILIK</option><option>PENYEWA</option><option>PENGELOLA</option><option>PEMAKAI</option>
                                 </select>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-6">
                           <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-2"><User size={16}/> Detail Subjek Pajak</h3>
                           <div className="p-8 bg-white border-2 border-slate-900/5 rounded-[2.5rem] space-y-6">
                              <select className="w-full p-4 bg-slate-900 text-white rounded-2xl text-xs font-bold shadow-lg mb-4" value={formData.jenis_subjek} onChange={e => setFormData({...formData, jenis_subjek: e.target.value})}>
                                 <option value="PRIBADI">WAJIB PAJAK PRIBADI</option>
                                 <option value="BADAN">WAJIB PAJAK BADAN / MANUAL</option>
                              </select>
                              
                              <CustomBlockInput 
                                label="NOMOR IDENTITAS (NIK/NIB)" 
                                value={formData.jenis_subjek === 'PRIBADI' ? (linkedWP?.nik || '') : formData.manual_nik} 
                                pattern={[16]} 
                                onChange={(v:string) => setFormData({...formData, manual_nik: v})} 
                                readonly={formData.jenis_subjek === 'PRIBADI'} 
                              />

                              <div className="grid grid-cols-2 gap-4">
                                 <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Nama Subjek</label>
                                    <input className="w-full border-b-2 border-slate-100 font-bold text-xs uppercase outline-none pb-2 focus:border-slate-900" value={formData.jenis_subjek === 'PRIBADI' ? (linkedWP?.nama || '') : formData.manual_nama} onChange={e => setFormData({...formData, manual_nama: e.target.value})} readOnly={formData.jenis_subjek === 'PRIBADI'} placeholder="INPUT NAMA..." />
                                 </div>
                                 <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Pekerjaan</label>
                                    <select className="w-full border-b-2 border-slate-100 font-bold text-xs outline-none pb-2" value={formData.pekerjaan} onChange={e => setFormData({...formData, pekerjaan: e.target.value})}>
                                       <option>PNS</option><option>ABRI</option><option>PENSIUNAN</option><option>SWASTA</option><option>NELAYAN</option>
                                    </select>
                                 </div>
                              </div>
                              <div>
                                 <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Alamat Domisili</label>
                                 <textarea className="w-full border-b-2 border-slate-100 font-medium text-[11px] uppercase outline-none pb-2 h-16 resize-none" value={formData.jenis_subjek === 'PRIBADI' ? `${linkedWP?.alamat}, RT${linkedWP?.rt}/RW${linkedWP?.rw}` : formData.manual_alamat} onChange={e => setFormData({...formData, manual_alamat: e.target.value})} readOnly={formData.jenis_subjek === 'PRIBADI'} placeholder="ALAMAT LENGKAP..." />
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-8">
                        <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-2"><MapPin size={16}/> Resume Objek Pajak</h3>
                        <div className="p-10 bg-slate-900 text-white rounded-[3.5rem] shadow-2xl relative overflow-hidden">
                           <Building2 className="absolute right-[-30px] top-[-30px] text-white/5" size={200} />
                           <div className="relative z-10 space-y-8">
                              <div>
                                 <label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] block mb-2">Letak Objek Pajak</label>
                                 <div className="text-lg font-black uppercase leading-tight">{linkedOP.alamat}</div>
                                 <div className="text-xs font-bold text-white/50 mt-1 uppercase">DESA {linkedOP.desa}, KEC. {linkedOP.kecamatan}</div>
                              </div>
                              <div className="grid grid-cols-2 gap-8">
                                 <div className="bg-white/5 p-5 rounded-[2rem] border border-white/10">
                                    <label className="text-[9px] font-bold text-white/30 uppercase block mb-1">Luas Tanah</label>
                                    <div className="text-3xl font-black italic">{linkedOP.luas_seluruhnya} <span className="text-[10px] not-italic opacity-40">M²</span></div>
                                 </div>
                                 <div className="p-5">
                                    <label className="text-[9px] font-bold text-white/30 uppercase block mb-1">Status Geografis</label>
                                    <div className="flex items-center gap-2">
                                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                       <span className="text-[10px] font-black uppercase tracking-widest">Terpetakan</span>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                        <div className="p-6 border-2 border-slate-100 rounded-[2rem] flex items-center justify-between">
                           <div className="flex items-center gap-4">
                              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Info size={20}/></div>
                              <div className="text-[10px] font-black uppercase text-slate-400 leading-tight">Pastikan data NOP Induk <br/>sesuai dengan arsip desa.</div>
                           </div>
                        </div>
                     </div>
                  </div>

                  <button className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.5em] hover:bg-black hover:scale-[1.01] active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-4 group">
                    <Database size={20} className="group-hover:rotate-12 transition-transform"/> Simpan Perekaman SPOP
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