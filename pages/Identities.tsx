import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/db';
import { processOCR } from '../services/ocr';
import { Identity } from '../types';
import { Button, Input, Select, Card, DateInput } from '../components/UI';
import { 
  Camera, 
  Edit2, 
  Trash2, 
  Plus, 
  Search, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Fingerprint, 
  Mail, 
  Phone, 
  ShieldCheck,  
  UserCheck 
} from 'lucide-react';
import { spellDateIndo , toTitleCase} from '../utils';
import SignatureCanvas from 'react-signature-canvas';

export const Identities: React.FC = () => {
  const [data, setData] = useState<Identity[]>([]);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [search, setSearch] = useState('');
  const [umur, setUmur] = useState('');
  const [error, setError] = useState<string | null>(null);
  const sigCanvas = useRef<any>(null);

  const emptyForm: Identity = {
    id: '', 
    status: 'active', 
    sebutan: '',
    nik: '', 
    nama: '', 
    alias: '',
    tempat_lahir: '', 
    tanggal_lahir: '', 
    ejaan_tanggal_lahir: '', 
    jenis_kelamin: '',
    agama: 'Islam', 
    status_perkawinan: 'Belum Kawin',
    golongan_darah: '',
    alamat: '', 
    rt: '', 
    rw: '', 
    wilayah_type: '',
    desa: '', 
    kecamatan: '',
    daerah_type: '',
    kota_kabupaten: '', 
    provinsi: '', 
    kode_pos: '',
    pekerjaan: '', 
    kewarganegaraan: '',
    ktp_berlaku: '',
    ejaan_tanggal_ktp_berlaku: '', 
    foto_ktp: '', 
    foto_verifikasi: '',
    ttd_digital: '',
    sidik_jari: '',
    created_at: '', 
    is_seumur_hidup: false,
    nama_bapak_kandung: '',
    nama_ibuk_kandung: '',
    pendidikan_terakhir: '',
    telepon: '',
    npwp: '',
    email: ''
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
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        setUmur(age >= 0 ? age + " Tahun" : "0 Tahun");

        const ejaanText = spellDateIndo(form.tanggal_lahir); 
        setForm((prev) => ({
          ...prev, 
          ejaan_tanggal_lahir: (ejaanText)
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
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran foto terlalu besar (maksimal 5MB).");
      return;
    }

    setForm((prev) => ({ ...prev, foto_ktp: URL.createObjectURL(file) }));
    setIsProcessing(true);

    try {
      const result = await processOCR(file);
      if (!result || typeof result !== 'object') throw new Error("Format data tidak valid.");

      // Deteksi apakah AI membaca teks "HIDUP"
      const isLifeTime = result.ktp_berlaku?.toUpperCase().includes('HIDUP');

      setForm((prev) => ({ 
        ...prev, 
        ...result, 
        nama: toTitleCase(result.nama || prev.nama),
        tempat_lahir: toTitleCase(result.tempat_lahir || prev.tempat_lahir),
        jenis_kelamin: /laki/i.test(result.jenis_kelamin || "") 
          ? "Laki-laki" 
          : /perempuan/i.test(result.jenis_kelamin || "") 
            ? "Perempuan" 
            : "",
        pekerjaan: toTitleCase(result.pekerjaan || prev.pekerjaan),
        alamat: toTitleCase(result.alamat || prev.alamat),
        desa: toTitleCase(result.desa || prev.desa),
        kecamatan: toTitleCase(result.kecamatan || prev.kecamatan),
        kota_kabupaten: toTitleCase(
            (result.kota_kabupaten || "")
              .replace(/KABUPATEN|KOTA|KAB/gi, "") // Hapus kata "KABUPATEN" atau "KOTA"
              .trim()
          ),
        provinsi: toTitleCase(
            (result.provinsi || "")
              .replace(/PROVINSI|PROV/gi, "") // Hapus kata "PROVINSI"
              .trim()
          ),
        // Logika Krusial:
        is_seumur_hidup: isLifeTime,
        // Jika seumur hidup, kita set kosong di form agar tidak bentrok
        ktp_berlaku: isLifeTime ? '' : (result.ktp_berlaku || ''),
        ejaan_tanggal_ktp_berlaku: isLifeTime ? 'SEUMUR HIDUP' : (result.ejaan_tanggal_ktp_berlaku || '')
      }));
    } catch (err: any) {
      const msg = err?.message?.includes('503') ? "Server AI Sibuk, coba 10 detik lagi." : "Gagal scan KTP.";
        alert(msg);
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  }
};

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'ttd_digital' | 'sidik_jari' | 'foto_verifikasi' | 'foto_ktp') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const saveSignature = () => {
    if (sigCanvas.current) {
      if (sigCanvas.current.isEmpty()) return alert("Silakan coret tanda tangan terlebih dahulu.");
      const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      setForm(prev => ({ ...prev, ttd_digital: dataUrl }));
      alert("Tanda tangan berhasil dikunci.");
    }
  };

  const clearSignature = () => {
    if (sigCanvas.current) sigCanvas.current.clear();
    setForm(prev => ({ ...prev, ttd_digital: '' }));
  };

 const handleSave = async () => {
  if (!form.nama || !form.nik) return alert('Nama dan NIK wajib diisi');

  // 1. KITA PISAHKAN id dari data lainnya agar tidak ikut terkirim ke database
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...dataTanpaId } = form; 

  const payload: any = { 
    ...dataTanpaId, // Pakai data yang sudah bersih dari properti 'id'
    nama: toTitleCase(form.nama),
    // Kirim null untuk kolom DATE jika seumur hidup
    ktp_berlaku: form.is_seumur_hidup ? null : (form.ktp_berlaku || null),
    ejaan_tanggal_lahir: toTitleCase(form.ejaan_tanggal_lahir || (form.tanggal_lahir ? spellDateIndo(form.tanggal_lahir) : '')),
    created_at: form.created_at || new Date().toISOString() 
  };

  try {
    if (editingId) {
      // Saat EDIT, kita butuh editingId untuk tahu baris mana yang diupdate
      await db.identities.update(editingId, payload);
    } else {
      // Saat TAMBAH BARU, pastikan payload tidak punya properti 'id' sama sekali
      // supaya Supabase otomatis men-generate UUID-nya.
      await db.identities.add(payload);
    }
    
    alert("Berhasil disimpan!");
    setView('list'); 
    setEditingId(null); 
    setForm(emptyForm);
  } catch (err: any) {
    console.error("Save Error:", err);
    alert(err?.message || "Terjadi kesalahan saat menyimpan.");
  }
};

  const toggleSeumurHidup = (checked: boolean) => {
    setForm(prev => ({
      ...prev,
      is_seumur_hidup: checked,
      // Jangan isi 'Seumur Hidup' ke sini karena ini kolom DATE
      // Biarkan kosong, nanti di handleSave kita ubah jadi null
      ktp_berlaku: checked ? '' : '', 
      ejaan_tanggal_ktp_berlaku: checked ? 'SEUMUR HIDUP' : ''
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
          <div className="col-span-1 space-y-6">
            <Card className="h-fit shadow-xl shadow-slate-200/50" title="DOKUMEN IDENTITAS">
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

            <Card className="h-fit shadow-xl shadow-slate-200/50" title="VERIFIKASI WAJAH">
                <div className="text-center space-y-4">
                    <div className="w-full aspect-square bg-slate-50 rounded-[2.5rem] flex items-center justify-center border-2 border-dashed border-slate-200 relative overflow-hidden group hover:border-blue-400 transition-colors cursor-pointer">
                        {form.foto_verifikasi ? (
                            <img src={form.foto_verifikasi} alt="Verifikasi" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-slate-300 flex flex-col items-center">
                                <UserCheck size={48} strokeWidth={1} />
                                <span className="text-[10px] font-black uppercase mt-3 tracking-widest">Foto Orang Asli</span>
                            </div>
                        )}
                        <input 
                            type="file" 
                            accept="image/*" 
                            capture="user"
                            onChange={e => handleFileUpload(e, 'foto_verifikasi')} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                        />
                        <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-all flex items-center justify-center">
                            <Plus size={24} className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Pastikan Wajah & KTP terlihat jelas dalam satu frame jika perlu.</p>
                </div>
            </Card>
          </div>

          <div className="col-span-2 space-y-6">
            <Card title="DATA PERSONAL">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                    <Select label="Gelar Kehormatan Umum" value={form.sebutan} onChange={(e: any) => setForm({...form, sebutan: e.target.value})}>
                        <option value="">-- Tanpa Sebutan --</option>
                        <option value="Tuan">Tuan</option>
                        <option value="Nyonya">Nyonya</option>
                        <option value="Nona">Nona</option>
                        <option value="Duda">Duda</option>
                        <option value="Janda">Janda</option>
                    </Select>
                    <Input 
                      label="NIK" 
                      value={
                        form.nik
                          .replace(/\D/g, '') // Bersihkan dari karakter non-angka
                          .replace(/^(\d{6})(\d{6})(\d{4}).*/, '$1.$2.$3') // Format titik 6.6.4
                          .replace(/^(\d{6})(\d{1,6})/, '$1.$2') // Format titik saat baru mencapai 7-12 digit
                          .replace(/^(\d{6}\.\d{6})(\d{1,4})/, '$1.$2') // Format titik saat baru mencapai 13-16 digit
                      } 
                      maxLength={19} // NIK 16 digit + 3 titik pemisah
                      placeholder="Contoh: 320101.121290.0001"
                      onChange={e => {
                        // Ambil nilai mentah (hanya angka) untuk disimpan ke state database
                        const rawValue = e.target.value.replace(/\D/g, '');
                        if (rawValue.length <= 16) {
                          setForm({...form, nik: rawValue});
                        }
                      }} 
                    />
                    <Input label="Nama Lengkap" className="text-blue-600 font-bold" value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} />
                    <Input label="Alias / Disebut Juga" placeholder="Contoh: Haji Somad" value={form.alias} onChange={e => setForm({...form, alias: e.target.value})} />
                    <Input label="Tempat Lahir" value={form.tempat_lahir} onChange={e => setForm({...form, tempat_lahir: e.target.value})} />
                    
                    <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner my-4">
                        <div className="md:col-span-2">
                        <DateInput label="Tanggal Lahir" value={form.tanggal_lahir} onChange={val => setForm({...form, tanggal_lahir: val})} />
                        <div className="text-[12px] text-blue-600 font-bold mt-1.5">({form.ejaan_tanggal_lahir || '...'})</div>
                        </div>
                        <div className="flex flex-col">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Umur</label>
                        <div className="flex-1 min-h-[50px] flex items-center justify-center bg-white border border-slate-200 text-slate-900 rounded-2xl text-sm font-black shadow-sm">{umur || "-"}</div>
                        </div>
                    </div>
                    <Select label="Jenis Kelamin" value={form.jenis_kelamin} onChange={(e: any) => setForm({...form, jenis_kelamin: e.target.value})}>
                        <option value="">--Pilih Jenis Kelamin--</option>
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                    </Select>
                    <Select label="Status Perkawinan" value={form.status_perkawinan} onChange={(e) => setForm({...form, status_perkawinan: e.target.value})}>
                        <option value="Belum Kawin">Belum Kawin</option>
                        <option value="Kawin">Kawin</option>
                        <option value="Cerai Hidup">Cerai Hidup</option>
                        <option value="Cerai Mati">Cerai Mati</option>
                    </Select>

                    <Select label="Golongan Darah" value={form.golongan_darah} onChange={(e) => setForm({...form, golongan_darah: e.target.value})}>
                        <option value="">-- Pilih Gol. Darah --</option>
                        <option value="A">A</option><option value="B">B</option>
                        <option value="AB">AB</option><option value="O">O</option>
                    </Select>

                    <Input 
                      label="Pekerjaan"
                      list="pekerjaan-options"
                      value={form.pekerjaan}
                      onChange={e => setForm({...form, pekerjaan: e.target.value})}
                    />
                    <datalist id="pekerjaan-options">
                        <option value="PNS" /><option value="TNI" /><option value="POLRI" />
                        <option value="Karyawan Swasta" /><option value="Wiraswasta" />
                        <option value="Buruh Harian Lepas" /><option value="Petani/Pekebun" />
                        <option value="Mengurus Rumah Tangga" /><option value="Pelajar/Mahasiswa" />
                    </datalist>

                    <Select label="Agama" value={form.agama} onChange={(e) => setForm({...form, agama: e.target.value})}>
                        <option value="Islam">Islam</option><option value="Kristen">Kristen</option>
                        <option value="Katolik">Katolik</option><option value="Hindu">Hindu</option>
                        <option value="Buddha">Buddha</option><option value="Konghucu">Konghucu</option>
                    </Select>
                    <Select label="Kewarganegaraan" value={form.kewarganegaraan} onChange={(e) => setForm({...form, kewarganegaraan: e.target.value})}>
                        <option value="WNI">WNI</option>
                        <option value="WNA">WNA</option>  
                    </Select>
                </div>
            </Card>

            <Card title="ALAMAT & DOMISILI">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {/* Alamat Full Width */}
                <Input 
                  label="Alamat / Jalan" 
                  className="md:col-span-2" 
                  placeholder="Nama Jalan, No. Rumah, Blok..."
                  value={form.alamat} 
                  onChange={e => setForm({...form, alamat: e.target.value})} 
                />

                {/* RT/RW Row */}
                <div className="grid grid-cols-2 gap-4">
                  <Input label="RT" placeholder="000" value={form.rt} onChange={e => setForm({...form, rt: e.target.value})} />
                  <Input label="RW" placeholder="000" value={form.rw} onChange={e => setForm({...form, rw: e.target.value})} />
                </div>

                {/* Desa atau Kelurahan Selection */}
                <div className="space-y-2">
                  <div className="flex items-center gap-4 mb-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tingkat Wilayah</label>
                    <div className="flex gap-3">
                      {['Desa', 'Kelurahan'].map((opt) => (
                        <label key={opt} className="flex items-center gap-1.5 cursor-pointer group">
                          <input 
                            type="radio" 
                            name="wilayah_type" 
                            className="w-3 h-3 accent-slate-900"
                            checked={form.wilayah_type === opt}
                            onChange={() => setForm({...form, wilayah_type: opt})} 
                          />
                          <span className="text-[11px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <Input 
                    label={`Nama ${form.wilayah_type || 'Desa/Kel'}`}
                    placeholder="Masukkan nama..."
                    value={form.desa} 
                    onChange={e => setForm({...form, desa: e.target.value})} 
                  />
                </div>

                {/* Kecamatan */}
                <Input label="Kecamatan" placeholder="Nama Kecamatan..." value={form.kecamatan} onChange={e => setForm({...form, kecamatan: e.target.value})} />

                {/* Kabupaten atau Kota Selection */}
                <div className="space-y-2">
                  <div className="flex items-center gap-4 mb-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Daerah</label>
                    <div className="flex gap-3">
                      {['Kabupaten', 'Kota'].map((opt) => (
                        <label key={opt} className="flex items-center gap-1.5 cursor-pointer group">
                          <input 
                            type="radio" 
                            name="daerah_type" 
                            className="w-3 h-3 accent-slate-900"
                            checked={form.daerah_type === opt}
                            // Pastikan saat pilih radio, input di bawah tidak berubah isinya
                            onChange={() => setForm({...form, daerah_type: opt})} 
                          />
                          <span className="text-[11px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <Input 
                    label={`Nama ${form.daerah_type || 'Kab/Kota'}`}
                    placeholder="Masukkan nama daerah saja (contoh: PASURUAN)..."
                    value={form.kota_kabupaten} 
                    onChange={e => setForm({...form, kota_kabupaten: e.target.value})} 
                  />
                </div>
                {/* Provinsi & Kode Pos Row */}
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Provinsi" placeholder="Jawa Timur" value={form.provinsi} onChange={e => setForm({...form, provinsi: e.target.value})} />
                  <Input 
                    label="Kode Pos" 
                    placeholder="671xx"
                    value={form.kode_pos} 
                    maxLength={5} 
                    onChange={e => setForm({...form, kode_pos: e.target.value.replace(/\D/g,'')})} 
                  />
                </div>
              </div>
            </Card>
            
            <Card title="DOKUMEN PENDUKUNG">
              <div className="flex justify-between items-center mb-6 px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Masa Berlaku KTP
                </label>
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
                <div className="space-y-3">
                  <DateInput 
                    value={form.ktp_berlaku} 
                    onChange={val => setForm({...form, ktp_berlaku: val})} 
                  />
                  {/* TAMPILKAN EJAAN DI SINI (SAAT INPUT TANGGAL) */}
                  {form.ejaan_tanggal_ktp_berlaku && (
                    <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                      <p className="text-[11px] font-black text-slate-500 leading-relaxed tracking-wider">
                        {form.ejaan_tanggal_ktp_berlaku}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="h-14 px-6 flex items-center bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-xs font-black uppercase tracking-widest shadow-inner animate-in fade-in duration-300">
                    <CheckCircle2 size={16} className="mr-3 text-emerald-500" /> 
                    SEUMUR HIDUP
                  </div>
                  {/* TAMPILKAN EJAAN DI SINI (SAAT SEUMUR HIDUP) */}
                  <div className="px-4 py-2 bg-emerald-100/30 border border-emerald-100/50 rounded-xl">
                    <p className="text-[12px] text-blue-600 font-bold mt-1.5">
                      {form.ejaan_tanggal_ktp_berlaku || 'SEUMUR HIDUP'}
                    </p>
                  </div>
                </div>
              )}
            </Card>

            <Card title="KONTAK & LEGALITAS">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                    <Input label="Nomor Telepon / WA" value={form.telepon} onChange={e => setForm({...form, telepon: e.target.value})} />
                    <Input label="Alamat Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                    <Input label="NPWP Pribadi" value={form.npwp} onChange={e => setForm({...form, npwp: e.target.value})} />
                </div>
            </Card>

            <Card title="ASET DIGITAL & BIOMETRIK (INTERAKTIF)">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-2">
                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex justify-between">
                            Tanda Tangan Digital 
                            {form.ttd_digital && <span className="text-emerald-500 text-[8px] animate-pulse">● TERKUNCI</span>}
                        </label>
                        <div className="w-full aspect-video bg-white border-2 border-slate-200 rounded-3xl relative overflow-hidden shadow-inner group">
                            {form.ttd_digital && (
                                <div className="absolute inset-0 bg-emerald-50/30 flex items-center justify-center p-4">
                                    <img src={form.ttd_digital} className="max-h-full object-contain mix-blend-multiply opacity-80" />
                                </div>
                            )}
                            <SignatureCanvas 
                                ref={sigCanvas} 
                                {...({ penColor: 'black' } as any)}
                                canvasProps={{ className: 'signature-canvas w-full h-full relative z-10' }}
                            />
                            <div className="absolute bottom-3 right-3 flex gap-2 z-20">
                                <button type="button" onClick={clearSignature} className="bg-slate-100 text-slate-500 text-[10px] font-black px-4 py-2 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm">ULANGI</button>
                                <button type="button" onClick={saveSignature} className={`${form.ttd_digital ? 'bg-emerald-500' : 'bg-blue-600'} text-white text-[10px] font-black px-4 py-2 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all`}>
                                    {form.ttd_digital ? 'UPDATE TANDA TANGAN' : 'KUNCI TANDA TANGAN'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Scan Sidik Jari (Kamera HP)</label>
                        <div className="w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center relative overflow-hidden group hover:border-blue-400 transition-colors">
                            {form.sidik_jari ? (
                                <div className="relative w-full h-full">
                                    <img src={form.sidik_jari} className="w-full h-full object-contain mix-blend-multiply grayscale contrast-125" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <Camera className="text-white" size={32} />
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <Fingerprint className="text-slate-200 mx-auto" size={48} />
                                    <span className="text-[10px] font-black text-slate-400 block mt-2 tracking-widest">AMBIL FOTO JARI</span>
                                </div>
                            )}
                            <input type="file" accept="image/*" capture="environment" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={e => handleFileUpload(e, 'sidik_jari')} />
                        </div>
                    </div>
                </div>
            </Card>

            <Card title="GARIS KETURUNAN & PENDIDIKAN">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <Input label="Nama Ibu Kandung" value={form.nama_ibuk_kandung} onChange={e => setForm({...form, nama_ibuk_kandung: e.target.value})} />
                    <Input label="Nama Bapak Kandung" value={form.nama_bapak_kandung} onChange={e => setForm({...form, nama_bapak_kandung: e.target.value})} />
                    <div className="md:col-span-2">
                        <Select label="Pendidikan Terakhir" value={form.pendidikan_terakhir} onChange={(e) => setForm({...form, pendidikan_terakhir: e.target.value})}>
                            <option value="">-- Pilih Pendidikan --</option>
                            <option value="Tidak/Belum Sekolah">Tidak/Belum Sekolah</option>
                            <option value="SD / Sederajat">SD / Sederajat</option>
                            <option value="SMP / Sederajat">SMP / Sederajat</option>
                            <option value="SMA / Sederajat">SMA / Sederajat</option>
                            <option value="Diploma (I/II/III/IV)">Diploma (I/II/III/IV)</option>
                            <option value="Sarjana (S1)">Sarjana (S1)</option>
                            <option value="Magister (S2)">Magister (S2)</option>
                            <option value="Doktor (S3)">Doktor (S3)</option>
                        </Select>
                    </div>
                </div>
            </Card>
  
            <div className="flex justify-end gap-4 py-6">
              <Button variant="outline" className="px-10" onClick={() => setView('list')}>Batal</Button>
              <Button onClick={handleSave} className="px-12 shadow-xl shadow-blue-500/20">Simpan Identitas</Button>
            </div>
          </div>
        </div>
        <style>{`.signature-canvas { touch-action: none !important; cursor: crosshair; width: 100% !important; height: 100% !important; }`}</style>
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
        <input type="text" placeholder="Cari berdasarkan Nama atau NIK..." className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-[2rem] text-sm font-bold shadow-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" value={search} onChange={(e) => setSearch(e.target.value)} />
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
                <th className="p-6 text-center">Info Kontak</th>
                <th className="p-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black text-xs uppercase shadow-inner">{item.nama.charAt(0)}</div>
                        <div>
                            <div className="font-black text-slate-900 uppercase tracking-tight">{toTitleCase(item.nama)}</div>
                            <div className="text-[10px] text-slate-400 font-mono tracking-tighter mt-0.5">{item.nik}</div>
                        </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="text-xs font-bold text-slate-600 truncate max-w-[200px]">{toTitleCase(item.alamat)}</div>
                    <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-1">DESA {item.desa?.toUpperCase() || '-'} • {item.kode_pos || 'KODE POS -'}</div>
                  </td>
                  <td className="p-6 text-center">
                    <div className="flex justify-center gap-3">
                       {item.telepon && <span title={item.telepon}><Phone size={14} className="text-emerald-500" /></span>}
                       {item.email && <span title={item.email}><Mail size={14} className="text-blue-500" /></span>}
                       {item.npwp && <span title="NPWP Tersedia"><ShieldCheck size={14} className="text-amber-500" /></span>}
                    </div>
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
                    <td colSpan={4} className="p-20 text-center opacity-10 flex flex-col items-center">
                        <Users size={64} strokeWidth={1}/><p className="mt-4 font-black uppercase tracking-[0.3em]">No Subject Data Found</p>
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};