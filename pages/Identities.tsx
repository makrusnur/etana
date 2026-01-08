import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { processOCR } from '../services/ocr';
import { Identity } from '../types';
import { Button, Input, Select, Card, DateInput } from '../components/UI';
import { Camera, Edit2, Trash2, Plus, Search, Loader2, CheckCircle2, AlertCircle, Users, GraduationCap, Heart } from 'lucide-react';
import { spellDateIndo, formatDateIndo , toTitleCase} from '../utils';

// Fungsi Helper untuk merubah teks menjadi Title Case (Huruf depan kapital)
export const Identities: React.FC = () => {
  const [data, setData] = useState<Identity[]>([]);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [search, setSearch] = useState('');
  const [umur, setUmur] = useState('');
  const [error, setError] = useState<string | null>(null);

  const emptyForm: Identity = {
    id: '', 
    status: 'active', 
    sebutan: '',
    nik: '', 
    nama: '', 
    tempat_lahir: '', 
    tanggal_lahir: '', 
    ejaan_tanggal_lahir: '', 
    agama: 'Islam', 
    alamat: '', 
    rt: '', 
    rw: '', 
    desa: '', 
    kecamatan: '',
    kota_kabupaten: '', 
    provinsi: '', 
    pekerjaan: '', 
    ktp_berlaku: '',
    ejaan_tanggal_ktp_berlaku: '', 
    foto_ktp: '', 
    created_at: '', 
    is_seumur_hidup: false,
    nama_bapak_kandung: '',
    nama_ibuk_kandung: '',
    pendidikan_terakhir: ''
  };
  
  const [form, setForm] = useState<Identity>(emptyForm);

  useEffect(() => {
    loadData();
  }, [view]);

  const loadData = async () => {
    try {
      const res = await db.identities.getAll();
      setData(res || []);
      setError(null);
    } catch (err: any) {
      console.error("Gagal memuat identitas:", err);
      setError(err?.message || "Gagal menghubungkan ke database.");
    }
  };

  useEffect(() => {
  if (form.tanggal_lahir) {
    const today = new Date();
    const birthDate = new Date(form.tanggal_lahir);
    
    if (!isNaN(birthDate.getTime())) {
      // 1. Hitung Umur
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      setUmur(age >= 0 ? age + " Tahun" : "0 Tahun");

      // 2. Update Ejaan dengan Title Case
      // Kita ambil hasil spellDateIndo, lalu paksa ke toTitleCase
      const ejaanText = spellDateIndo(form.tanggal_lahir); 
      
      setForm((prev) => ({
        ...prev, 
        ejaan_tanggal_lahir: toTitleCase(ejaanText) // <--- DIPAKSA DI SINI
      }));
    }
  } else {
    setUmur("");
    setForm(prev => ({ ...prev, ejaan_tanggal_lahir: "" }));
  }
}, [form.tanggal_lahir]);

  const handleEdit = async (id: string) => {
    const item = data.find(i => i.id === id);
    if (item) {
      setForm({ ...item, is_seumur_hidup: item.ktp_berlaku?.toUpperCase() === 'SEUMUR HIDUP' });
      setEditingId(id);
      setView('form');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus identitas ini secara permanen?')) {
      try {
        await db.identities.delete(id);
        await loadData();
      } catch (err: any) {
        alert(err?.message || "Gagal menghapus data.");
      }
    }
  };

 const handleOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
    const file = e.target.files[0];

    // 1. Validasi awal: Pastikan file tidak terlalu besar (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran foto terlalu besar. Silakan gunakan foto yang lebih kecil (maksimal 5MB).");
      return;
    }

    setForm((prev) => ({ ...prev, foto_ktp: URL.createObjectURL(file) }));
    setIsProcessing(true);
    
    try {
      const result = await processOCR(file);
      
      // 2. Cek apakah result valid
      if (!result || typeof result !== 'object') {
        throw new Error("Format data OCR tidak valid.");
      }

      // 3. Masukkan data ke form dengan proteksi Title Case pada setiap field teks
      setForm((prev) => ({ 
        ...prev, 
        ...result, // Timpa data lama dengan hasil scan
        // Pastikan field penting langsung rapi (Title Case)
        nama: toTitleCase(result.nama || prev.nama),
        tempat_lahir: toTitleCase(result.tempat_lahir || prev.tempat_lahir),
        pekerjaan: toTitleCase(result.pekerjaan || prev.pekerjaan),
        alamat: toTitleCase(result.alamat || prev.alamat),
        desa: toTitleCase(result.desa || prev.desa),
        kecamatan: toTitleCase(result.kecamatan || prev.kecamatan),
        kota_kabupaten: toTitleCase(result.kota_kabupaten || prev.kota_kabupaten),
        provinsi: toTitleCase(result.provinsi || prev.provinsi),
        // Logika seumur hidup
        is_seumur_hidup: result.ktp_berlaku?.toUpperCase() === 'SEUMUR HIDUP' 
      }));

    } catch (err: any) {
      console.error("Detail Error OCR:", err);
      // Pesan error lebih ramah pengguna
      alert("AI gagal membaca data. Pastikan foto KTP jelas, tidak silau, dan tulisan terbaca.");
    } finally {
      setIsProcessing(false);
      // Bersihkan input file agar bisa digunakan lagi jika user mencoba foto ulang
      e.target.value = '';
    }
  }
};

  const handleSave = async () => {
    if (!form.nama || !form.nik) return alert('Nama dan NIK wajib diisi');
    
    // Format semua data teks penting menjadi Title Case sebelum simpan
    const payload = { 
      ...form, 
      nama: toTitleCase(form.nama),
      nama_bapak_kandung: toTitleCase(form.nama_bapak_kandung),
      nama_ibuk_kandung: toTitleCase(form.nama_ibuk_kandung),
      pekerjaan: toTitleCase(form.pekerjaan),
      desa: toTitleCase(form.desa),
      kecamatan: toTitleCase(form.kecamatan),
      alamat: toTitleCase(form.alamat),
      ejaan_tanggal_lahir: toTitleCase(form.ejaan_tanggal_lahir || spellDateIndo(form.tanggal_lahir)),
      created_at: form.created_at || new Date().toISOString() 
    };

    try {
      if (editingId) {
        await db.identities.update(editingId, payload);
      } else {
        await db.identities.add(payload);
      }
      setView('list'); 
      setEditingId(null); 
      setForm(emptyForm);
    } catch (err: any) {
      console.error("Gagal menyimpan identitas:", err);
      alert(err?.message || "Terjadi kesalahan saat menyimpan data.");
    }
  };

  const toggleSeumurHidup = (checked: boolean) => {
    setForm(prev => ({
      ...prev,
      is_seumur_hidup: checked,
      ktp_berlaku: checked ? 'Seumur Hidup' : '',
      ejaan_tanggal_ktp_berlaku: checked ? 'Seumur Hidup' : ''
    }));
  };

  const filteredData = data.filter(d => 
    d.nama.toLowerCase().includes(search.toLowerCase()) || 
    d.nik.includes(search)
  );

  if (view === 'form') {
    return (
      <div className="max-w-5xl mx-auto pb-10">
        <div className="flex items-center justify-between mb-8 px-2">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{editingId ? 'Edit Subjek' : 'Registrasi Baru'}</h2>
            <p className="text-slate-500 text-sm font-medium">Lengkapi data kependudukan secara akurat.</p>
          </div>
          <Button variant="secondary" onClick={() => setView('list')}>Batal</Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="col-span-1 h-fit shadow-xl shadow-slate-200/50">
            <div className="text-center space-y-4">
              <div className="w-full aspect-video bg-slate-50 rounded-[2rem] flex items-center justify-center border-2 border-dashed border-slate-200 relative overflow-hidden group">
                {form.foto_ktp ? (
                  <img src={form.foto_ktp} alt="KTP" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-slate-300 flex flex-col items-center">
                    <Camera size={48} strokeWidth={1} />
                    <span className="text-[10px] font-black uppercase mt-3 tracking-widest">Preview KTP</span>
                  </div>
                )}
                {isProcessing && (
                  <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                    <Loader2 size={32} className="text-blue-600 animate-spin mb-3" />
                    <p className="text-[10px] font-black text-blue-600 animate-pulse uppercase tracking-[0.2em]">AI Processing...</p>
                  </div>
                )}
              </div>
              <div className="relative">
                <input type="file" accept="image/*" onChange={handleOCR} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={isProcessing} />
                <Button className="w-full h-14" variant="outline" disabled={isProcessing}>{isProcessing ? 'SCANNING...' : 'AUTO-SCAN WITH AI'}</Button>
              </div>
            </div>
          </Card>

          <div className="col-span-2 space-y-6">
            <Card title="DATA PERSONAL">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                    <Select label="Sebutan Komparisi" value={form.sebutan} onChange={(e: any) => setForm({...form, sebutan: e.target.value})}>
                        <option value="">-- Tanpa Sebutan --</option>
                        <option value="Tuan">Tuan</option>
                        <option value="Nyonya">Nyonya</option>
                        <option value="Nona">Nona</option>
                        <option value="Duda">Duda</option>
                        <option value="Janda">Janda</option>
                    </Select>
                    <Input label="NIK" value={form.nik} maxLength={16} onChange={e => setForm({...form, nik: e.target.value.replace(/\D/g,'')})} />
                    <Input label="Nama Lengkap" className="text-blue-600" value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} />
                    <Input label="Tempat Lahir" value={form.tempat_lahir} onChange={e => setForm({...form, tempat_lahir: e.target.value})} />
                    
                    <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner my-4">
                        <div className="md:col-span-2">
                        <DateInput label="Tanggal Lahir" value={form.tanggal_lahir} onChange={val => setForm({...form, tanggal_lahir: val})} />
                        <div className="text-[10px] text-blue-600 font-bold mt-1.5">({form.ejaan_tanggal_lahir || '...'})</div>
                        </div>
                        <div className="flex flex-col">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Umur</label>
                        <div className="flex-1 min-h-[50px] flex items-center justify-center bg-white border border-slate-200 text-slate-900 rounded-2xl text-sm font-black shadow-sm">{umur || "-"}</div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Pekerjaan</label>
                        <input 
                            list="pekerjaan-options"
                            className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm focus:outline-none focus:border-blue-500 transition-all"
                            value={form.pekerjaan}
                            onChange={e => setForm({...form, pekerjaan: e.target.value})}
                        />
                        <datalist id="pekerjaan-options">
                            <option value="PNS" /><option value="TNI" /><option value="POLRI" />
                            <option value="Karyawan Swasta" /><option value="Wiraswasta" />
                            <option value="Buruh Harian Lepas" /><option value="Petani/Pekebun" />
                            <option value="Mengurus Rumah Tangga" /><option value="Pelajar/Mahasiswa" />
                            <option value="Belum/Tidak Bekerja" /><option value="Pensiunan" />   
                        </datalist>
                    </div>

                    <Select label="Agama" value={form.agama} onChange={(e) => setForm({...form, agama: e.target.value})}>
                        <option value="Islam">Islam</option><option value="Kristen">Kristen</option>
                        <option value="Katolik">Katolik</option><option value="Hindu">Hindu</option>
                        <option value="Buddha">Buddha</option><option value="Konghucu">Konghucu</option>
                    </Select>
                </div>
            </Card>
            <Card title="ALAMAT & DOMISILI">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                    <Input label="Alamat" className="md:col-span-2" value={form.alamat} onChange={e => setForm({...form, alamat: e.target.value})} />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="RT" value={form.rt} onChange={e => setForm({...form, rt: e.target.value})} />
                        <Input label="RW" value={form.rw} onChange={e => setForm({...form, rw: e.target.value})} />
                    </div>
                    <Input label="Desa/Kel" value={form.desa} onChange={e => setForm({...form, desa: e.target.value})} />
                    <Input label="Kecamatan" value={form.kecamatan} onChange={e => setForm({...form, kecamatan: e.target.value})} />
                    <Input label="Kota/Kab" value={form.kota_kabupaten} onChange={e => setForm({...form, kota_kabupaten: e.target.value})} />
                    <Input label="Provinsi" value={form.provinsi} onChange={e => setForm({...form, provinsi: e.target.value})} />
                </div>
            </Card>
            <Card title="GARIS KETURUNAN & PENDIDIKAN">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="relative">
                        <Heart className="absolute right-4 top-[42px] text-pink-500 opacity-20" size={20} />
                        <Input label="Nama Ibu Kandung" value={form.nama_ibuk_kandung} onChange={e => setForm({...form, nama_ibuk_kandung: e.target.value})} />
                    </div>
                    <Input label="Nama Bapak Kandung" value={form.nama_bapak_kandung} onChange={e => setForm({...form, nama_bapak_kandung: e.target.value})} />
                    <div className="md:col-span-2 relative">
                        <GraduationCap className="absolute right-4 top-[42px] text-blue-500 opacity-20" size={20} />
                        <Select label="Pendidikan Terakhir" value={form.pendidikan_terakhir} onChange={(e) => setForm({...form, pendidikan_terakhir: e.target.value})}>
                            <option value="">-- Pilih Pendidikan --</option>
                            <option value="Tidak/Belum Sekolah">Tidak/Belum Sekolah</option>
                            <option value="SD / Sederajat">SD / Sederajat</option>
                            <option value="SMP / Sederajat">SMP / Sederajat</option>
                            <option value="SMA / Sederajat">SMA / Sederajat</option>
                            <option value="Diploma I/II/III">Diploma I/II/III</option>
                            <option value="Sarjana (S1)">Sarjana (S1)</option>
                            <option value="Magister (S2)">Magister (S2)</option>
                            <option value="Doktor (S3)">Doktor (S3)</option>
                        </Select>
                    </div>
                </div>
            </Card>
            <Card title="DOKUMEN PENDUKUNG">
                <div className="flex justify-between items-center mb-6 px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Masa Berlaku KTP</label>
                    <label className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest cursor-pointer group">
                        <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500/20"
                            checked={form.is_seumur_hidup} 
                            onChange={e => toggleSeumurHidup(e.target.checked)} 
                        /> 
                        Set Seumur Hidup
                    </label>
                </div>
                {!form.is_seumur_hidup ? (
                    <DateInput value={form.ktp_berlaku} onChange={val => setForm({...form, ktp_berlaku: val})} />
                ) : (
                    <div className="h-14 px-6 flex items-center bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-xs font-black uppercase tracking-widest shadow-inner">
                        <CheckCircle2 size={16} className="mr-3" /> SEUMUR HIDUP
                    </div>
                )}
            </Card>
            
            <div className="flex justify-end gap-4 py-6">
              <Button variant="outline" className="px-10" onClick={() => setView('list')}>Batal</Button>
              <Button onClick={handleSave} className="px-12 shadow-xl shadow-blue-500/20">Simpan Identitas</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Database <span className="text-blue-600">Identitas</span></h2>
          <p className="text-slate-500 font-medium">Pengelolaan subjek hukum dan identitas klien.</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setEditingId(null); setView('form'); setError(null); }}>
          <Plus size={18} className="mr-2" /> Tambah Subjek
        </Button>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Cari berdasarkan Nama atau NIK..." 
          className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-[2rem] text-sm font-bold shadow-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
      </div>

      {error && (
        <div className="p-6 bg-red-50 border border-red-100 rounded-[2rem] flex items-center gap-4 text-red-600">
          <AlertCircle size={32} />
          <div>
            <p className="font-black text-xs uppercase tracking-widest mb-1">Database Error</p>
            <p className="text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      <Card className="p-0 overflow-hidden shadow-2xl shadow-slate-200/50 border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
              <tr>
                <th className="p-6">Nama / Identitas</th>
                <th className="p-6">Lokasi / Domisili</th>
                <th className="p-6 text-center">Status KTP</th>
                <th className="p-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black text-xs uppercase shadow-inner">
                            {item.nama.charAt(0)}
                        </div>
                        <div>
                            {/* Tampilkan Nama dengan Title Case di tabel */}
                            <div className="font-black text-slate-900 uppercase tracking-tight">{toTitleCase(item.nama)}</div>
                            <div className="text-[10px] text-slate-400 font-mono tracking-tighter mt-0.5">{item.nik}</div>
                        </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="text-xs font-bold text-slate-600 truncate max-w-[200px]">{toTitleCase(item.alamat)}</div>
                    <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-1">DESA {item.desa?.toUpperCase() || '-'} • KEC. {item.kecamatan?.toUpperCase() || '-'}</div>
                  </td>
                  <td className="p-6 text-center">
                    {item.ktp_berlaku?.toUpperCase() === 'SEUMUR HIDUP' ? (
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black border border-emerald-100 uppercase tracking-widest">
                        <CheckCircle2 size={12}/> Seumur Hidup
                      </span>
                    ) : (
                      <div className="text-slate-500 font-bold text-[11px]">{formatDateIndo(item.ktp_berlaku)}</div>
                    )}
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(item.id)} className="p-3 bg-white text-blue-600 hover:bg-blue-600 hover:text-white rounded-2xl shadow-sm border border-slate-100 transition-all active:scale-95"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-3 bg-white text-red-500 hover:bg-red-500 hover:text-white rounded-2xl shadow-sm border border-slate-100 transition-all active:scale-95"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && !error && (
                 <tr>
                    <td colSpan={4} className="p-20 text-center">
                        <div className="opacity-10 flex flex-col items-center">
                            <Users size={64} strokeWidth={1}/>
                            <p className="mt-4 font-black uppercase tracking-[0.3em]">No Subject Data Found</p>
                        </div>
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      <div className="flex justify-between items-center px-4">
         <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">ETANA v1.5</span>
         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Data: {filteredData.length}</span>
      </div>
    </div>
  );
};