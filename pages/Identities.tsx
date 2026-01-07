
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { processOCR } from '../services/ocr';
import { Identity } from '../types';
import { Button, Input, Select, Card, DateInput } from '../components/UI';
import { Camera, Edit2, Trash2, Plus, Search, Loader2, CheckCircle2 } from 'lucide-react';
import { generateId, spellDateIndo, formatDateIndo } from '../utils';

export const Identities: React.FC = () => {
  const [data, setData] = useState<Identity[]>([]);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [search, setSearch] = useState('');
  const [umur, setUmur] = useState('');

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
    nama_bapak_kandung: '',
    nama_ibuk_kandung: '',
    pendidikan_terakhir: '',
    foto_ktp: '', 
    created_at: '', 
    is_seumur_hidup: false
  };
  const [form, setForm] = useState<Identity>(emptyForm);

  useEffect(() => {
    loadData();
  }, [view]);

  const loadData = async () => {
    try {
      const res = await db.identities.getAll();
      setData(res || []);
    } catch (err) {
      console.error("Gagal memuat identitas:", err);
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
      } else {
        setUmur("");
      }
      setForm((prev) => ({...prev, ejaan_tanggal_lahir: spellDateIndo(form.tanggal_lahir)}));
    } else {
      setUmur("");
    }
  }, [form.tanggal_lahir]);

  const handleEdit = async (id: string) => {
    const item = data.find(i => i.id === id);
    if (item) {
      setForm({ ...item, is_seumur_hidup: item.ktp_berlaku === 'SEUMUR HIDUP' });
      setEditingId(id);
      setView('form');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus identitas ini?')) {
      await db.identities.delete(id);
      await loadData();
    }
  };

  const handleOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setForm((prev) => ({...prev, foto_ktp: URL.createObjectURL(file)}));
      setIsProcessing(true);
      
      try {
        const result = await processOCR(file);
        setForm((prev) => ({ 
          ...prev, 
          ...result,
          // Perbaikan di sini: Ambil result.nama, jika tidak ada gunakan string kosong, lalu jadikan huruf besar
          nama: (result.nama || "").toUpperCase(),
          is_seumur_hidup: result.ktp_berlaku === 'SEUMUR HIDUP' 
        }));
      } catch (err: any) {
        alert(err.message || "Gagal memproses gambar.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleSave = async () => {
    if (!form.nama || !form.nik) return alert('Nama dan NIK wajib diisi');
    
    const payload = { 
      ...form, 
      nama: form.nama.toUpperCase(),
      pekerjaan: form.pekerjaan.toUpperCase(),
      created_at: form.created_at || new Date().toISOString() 
    };

    try {
      if (editingId) {
        await db.identities.update(editingId, payload);
      } else {
        payload.id = generateId();
        await db.identities.add(payload);
      }
      setView('list'); 
      setEditingId(null); 
      setForm(emptyForm);
    } catch (err) {
      console.error("Gagal menyimpan identitas:", err);
      alert("Terjadi kesalahan saat menyimpan data.");
    }
  };

  const toggleSeumurHidup = (checked: boolean) => {
    setForm(prev => ({
      ...prev,
      is_seumur_hidup: checked,
      ktp_berlaku: checked ? 'SEUMUR HIDUP' : '',
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">{editingId ? 'Edit Identitas' : 'Tambah Identitas Baru'}</h2>
          <Button variant="secondary" onClick={() => setView('list')}>Batal</Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-1 h-fit">
            <div className="text-center space-y-4">
              <div className="w-full aspect-video bg-slate-100 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-300 relative overflow-hidden group">
                {form.foto_ktp ? (
                  <img src={form.foto_ktp} alt="KTP" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-slate-400 flex flex-col items-center">
                    <Camera size={40} strokeWidth={1.5} />
                    <span className="text-[10px] font-bold uppercase mt-2">Preview Scan</span>
                  </div>
                )}
                {isProcessing && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                    <Loader2 size={32} className="text-blue-600 animate-spin mb-2" />
                    <p className="text-[10px] font-black text-blue-700 animate-pulse uppercase">OCR AI Processing...</p>
                  </div>
                )}
              </div>
              <div className="relative">
                <input type="file" accept="image/*" onChange={handleOCR} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={isProcessing} />
                <Button className="w-full h-11 font-bold" disabled={isProcessing}>{isProcessing ? 'Memproses...' : 'Scan KTP dengan AI'}</Button>
              </div>
            </div>
          </Card>

          <Card className="col-span-2 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <Select label="Sebutan Komparisi" value={form.sebutan} onChange={(e: any) => setForm({...form, sebutan: e.target.value})}>
                <option value="">-- Tanpa Sebutan --</option>
                <option value="Tuan">Tuan</option>
                <option value="Nyonya">Nyonya</option>
                <option value="Nona">Nona</option>
                <option value="Duda">Duda</option>
                <option value="Janda">Janda</option>
              </Select>
              <Input label="NIK" value={form.nik} maxLength={16} onChange={e => setForm({...form, nik: e.target.value.replace(/\D/g,'')})} />
              <Input label="Nama Lengkap" className="font-bold text-slate-800" value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} />
              <Input label="Tempat Lahir" value={form.tempat_lahir} onChange={e => setForm({...form, tempat_lahir: e.target.value})} />
              
              <div className="col-span-2 grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="col-span-2">
                  <DateInput label="Tanggal Lahir" value={form.tanggal_lahir} onChange={val => setForm({...form, tanggal_lahir: val})} />
                  <div className="text-[10px] text-blue-600 font-bold italic mt-1">{form.ejaan_tanggal_lahir}</div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Umur</label>
                  <div className="h-[42px] flex items-center justify-center bg-blue-600 text-white rounded-md text-sm font-black">{umur || "-"}</div>
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium mb-1 text-slate-700">Pekerjaan</label>
                <input 
                  list="pekerjaan-options"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={form.pekerjaan}
                  onChange={e => setForm({...form, pekerjaan: e.target.value})}
                />
                <datalist id="pekerjaan-options">
                  <option value="PNS" /><option value="TNI" /><option value="Polri" />
                  <option value="Karyawan Swasta" /><option value="Wiwaswasta" />
                  <option value="Buruh Harian Lepas" /><option value="Petani/Pekebun" />
                  <option value="Mengurus Rumah Tangga" /><option value="Pelajar/Mahasiswa" />
                </datalist>
              </div>

              <Select label="Agama" value={form.agama} onChange={(e) => setForm({...form, agama: e.target.value})}>
                <option value="Islam">Islam</option><option value="Kristen">Kristen</option>
                <option value="Katolik">Katolik</option><option value="Hindu">Hindu</option>
                <option value="Buddha">Buddha</option><option value="Konghucu">Konghucu</option>
              </Select>

              <Input label="Alamat" className="col-span-2" value={form.alamat} onChange={e => setForm({...form, alamat: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="RT" value={form.rt} onChange={e => setForm({...form, rt: e.target.value})} />
                <Input label="RW" value={form.rw} onChange={e => setForm({...form, rw: e.target.value})} />
              </div>
              <Input label="Desa/Kel" value={form.desa} onChange={e => setForm({...form, desa: e.target.value})} />
              <Input label="Kecamatan" value={form.kecamatan} onChange={e => setForm({...form, kecamatan: e.target.value})} />
              <Input label="Kota/Kab" value={form.kota_kabupaten} onChange={e => setForm({...form, kota_kabupaten: e.target.value})} />
              <Input label="Provinsi" value={form.provinsi} onChange={e => setForm({...form, provinsi: e.target.value})} />
              <Input label="Nama Ibu Kandung" value={form.nama_ibuk_kandung} onChange={e => setForm({...form, nama_ibuk_kandung: e.target.value})} />
              <Input label="Nama Bapak Kandung" value={form.nama_bapak_kandung} onChange={e => setForm({...form, nama_bapak_kandung: e.target.value})} />

              <Select label="Pendidikan terakhir" value={form.pendidikan_terakhir} onChange={(e) => setForm({...form, pendidikan_terakhir: e.target.value})}>
                <option value="Sekolah Dasar">Sekolah Dasar</option><option value="SMP">SMP Sederajat</option>
                <option value="SMA">SMA Sederajat</option><option value="S1/D4">Strata 1</option>
                <option value="S2">S2 Sederajat</option><option value="S3">S3 Sederajat</option>
              </Select>  
 
              <div className="col-span-2 border-t pt-4 mt-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[11px] font-black text-slate-700 uppercase">Masa Berlaku KTP</label>
                  <label className="flex items-center gap-2 text-xs font-bold text-blue-600 cursor-pointer">
                    <input type="checkbox" checked={form.is_seumur_hidup} onChange={e => toggleSeumurHidup(e.target.checked)} /> Set Seumur Hidup
                  </label>
                </div>
                {!form.is_seumur_hidup ? (
                  <DateInput value={form.ktp_berlaku} onChange={val => setForm({...form, ktp_berlaku: val})} />
                ) : (
                  <div className="h-[42px] px-4 flex items-center bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-sm font-black">SEUMUR HIDUP</div>
                )}
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setView('list')}>Batal</Button>
              <Button onClick={handleSave} className="px-8 font-bold">Simpan Identitas</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Identitas Utama</h2>
          <p className="text-slate-500 text-sm">Kelola subjek hukum yang sinkron dengan Supabase Cloud.</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setEditingId(null); setView('form'); }}>
          <Plus size={18} className="mr-2 inline" /> Tambah Subjek
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 text-slate-400" size={18} />
        <input type="text" placeholder="Cari Nama atau NIK..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="p-0 overflow-hidden shadow-sm border-slate-200">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 border-b font-bold uppercase text-[10px] tracking-widest">
            <tr>
              <th className="p-4">Subjek / NIK</th>
              <th className="p-4">Lokasi</th>
              <th className="p-4 text-center">Sebutan</th>
              <th className="p-4">Masa Berlaku</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                <td className="p-4">
                  <div className="font-black text-slate-800">{item.nama}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{item.nik}</div>
                </td>
                <td className="p-4 text-slate-600">
                  <div className="truncate max-w-[200px]">{item.alamat}</div>
                  <div className="text-[9px] font-black text-blue-500 uppercase">DESA {item.desa || '-'}</div>
                </td>
                <td className="p-4 text-center">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black border border-blue-100">{item.sebutan || '-'}</span>
                </td>
                <td className="p-4">
                  {item.ktp_berlaku === 'SEUMUR HIDUP' ? (
                    <span className="text-emerald-600 font-black text-[10px] flex items-center gap-1"><CheckCircle2 size={12}/> SEUMUR HIDUP</span>
                  ) : (
                    <div className="text-slate-600 font-medium">{formatDateIndo(item.ktp_berlaku)}</div>
                  )}
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(item.id)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
