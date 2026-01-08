
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { LandData, LandType, LandHistory } from '../types';
import { Button, Input, Card, DateInput } from '../components/UI';
import { Edit2, Trash2, Plus, Search, MapPin, FileStack,  AlignLeft, Layers, Maximize, Crosshair, Coins, CalendarDays } from 'lucide-react';
import { generateId, terbilang, spellDateIndo } from '../utils';

export const LandDataPage: React.FC = () => {
  const [data, setData] = useState<LandData[]>([]);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  
  // UI State for Measurement Type
  const [isPartial, setIsPartial] = useState(false);

  const emptyForm: LandData = {
    id: '', 
    nop: '', 
    atas_nama_nop: '', 
    nama_kepala_desa: '', 
    penggunaan_tanah: '', 
    alamat: '', 
    rt: '', 
    rw: '', 
    desa: '', 
    kecamatan: '', 
    kabupaten_kota: 'Pasuruan' as "Pasuruan", 
    kewajiban_pajak: '', 
    jenis_dasar_surat: 'LETTER_C',
    
    kohir: '', persil: '', klas: '', atas_nama_letter_c: '', berasal_dari_an: '', tahun_perolehan_alas_hak: '',
    atas_nama_shm: '', no_shm: '', nib: '', no_su: '', tanggal_su: '', ejaan_tanggal_su: '', tanggal_shm: '', ejaan_tanggal_shm: '',
    atas_nama_shm_el: '', kode_sertifikat: '', nibel: '',

    luas_dimohon: 0, ejaan_luas_dimohon: '', batas_utara_dimohon: '', batas_timur_dimohon: '', batas_selatan_dimohon: '', batas_barat_dimohon: '',
    luas_seluruhnya: 0, ejaan_luas_seluruhnya: '', batas_utara_seluruhnya: '', batas_timur_seluruhnya: '', batas_selatan_seluruhnya: '', batas_barat_seluruhnya: '',
    
    sppt_tahun: new Date().getFullYear().toString(),
    pajak_bumi_luas: 0, pajak_bumi_njop: 0, pajak_bumi_total: 0,
    pajak_bangunan_luas: 0, pajak_bangunan_njop: 0, pajak_bangunan_total: 0,
    pajak_grand_total: 0,
    harga_transaksi: 0, ejaan_harga_transaksi: '',

    koordinat_list: [''],
    bak_list: [''], 
    riwayat_tanah: [], 
    created_at: ''
  };
  
  const [form, setForm] = useState<LandData>(emptyForm);

  // Auto Calculations for Tax
  useEffect(() => {
    const totalBumi = (form.pajak_bumi_luas || 0) * (form.pajak_bumi_njop || 0);
    const totalBangunan = (form.pajak_bangunan_luas || 0) * (form.pajak_bangunan_njop || 0);
    const grandTotal = totalBumi + totalBangunan;

    setForm(prev => ({
      ...prev,
      pajak_bumi_total: totalBumi,
      pajak_bangunan_total: totalBangunan,
      pajak_grand_total: grandTotal
    }));
  }, [form.pajak_bumi_luas, form.pajak_bumi_njop, form.pajak_bangunan_luas, form.pajak_bangunan_njop]);

  useEffect(() => {
    loadData();
  }, [view]);

  const loadData = async () => {
    try {
      const res = await db.lands.getAll();
      setData(res || []);
    } catch (err) {
      console.error("Gagal memuat data tanah:", err);
    }
  };

  const updateLuas = (field: 'luas_dimohon' | 'luas_seluruhnya', val: number) => {
    const text = val > 0 ? terbilang(val) + " meter persegi" : "";
    setForm(prev => {
      const newState = { ...prev, [field]: val, [`ejaan_${field}`]: text };
      if (!isPartial && field === 'luas_seluruhnya') {
        newState.luas_dimohon = val;
        newState.ejaan_luas_dimohon = text;
      }
      return newState;
    });
  };

  const handleSave = async () => {
    if (!form.nop || !form.atas_nama_nop) return alert('NOP dan Atas Nama wajib diisi');
    
    const payload = { 
      ...form, 
      created_at: form.created_at || new Date().toISOString() 
    };

    try {
      if (editingId) {
        await db.lands.update(editingId, payload);
      } else {
        payload.id = generateId();
        await db.lands.add(payload);
      }
      
      setView('list'); 
      setEditingId(null); 
      setForm(emptyForm);
    } catch (err) {
      alert("Gagal menyimpan data objek tanah.");
    }
  };

  const handleEdit = async (id: string) => {
    try {
      const item = await db.lands.get(id);
      if (item) {
        setForm({ ...emptyForm, ...item });
        setIsPartial(item.luas_dimohon !== item.luas_seluruhnya && item.luas_dimohon > 0);
        setEditingId(id);
        setView('form');
      }
    } catch (err) {
      alert("Gagal memuat detail data tanah.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus data objek tanah ini?')) {
      await db.lands.delete(id);
      loadData();
    }
  };

  const addRiwayat = () => {
    const newEntry: LandHistory = { atas_nama: '', c_no: '', persil_no: '', klas: '', luas: '', dasar_dialihkan: '' };
    setForm(prev => ({ ...prev, riwayat_tanah: [...(prev.riwayat_tanah || []), newEntry] }));
  };

  const updateRiwayat = (index: number, field: keyof LandHistory, val: string) => {
    const newList = [...(form.riwayat_tanah || [])];
    newList[index] = { ...newList[index], [field]: val };
    setForm(prev => ({ ...prev, riwayat_tanah: newList }));
  };

  const removeRiwayat = (index: number) => {
    setForm(prev => ({ ...prev, riwayat_tanah: prev.riwayat_tanah?.filter((_, i) => i !== index) }));
  };

  const addBAK = () => setForm(prev => ({ ...prev, bak_list: [...(prev.bak_list || []), ''] }));
  const updateBAK = (index: number, val: string) => {
    const newList = [...(form.bak_list || [])];
    newList[index] = val;
    setForm(prev => ({ ...prev, bak_list: newList }));
  };
  const removeBAK = (index: number) => setForm(prev => ({ ...prev, bak_list: prev.bak_list?.filter((_, i) => i !== index) }));

  const addKoordinat = () => setForm(prev => ({ ...prev, koordinat_list: [...(prev.koordinat_list || []), ''] }));
  const updateKoordinat = (index: number, val: string) => {
    const newList = [...(form.koordinat_list || [])];
    newList[index] = val;
    setForm(prev => ({ ...prev, koordinat_list: newList }));
  };
  const removeKoordinat = (index: number) => setForm(prev => ({ ...prev, koordinat_list: prev.koordinat_list?.filter((_, i) => i !== index) }));

  useEffect(() => {
    if (form.jenis_dasar_surat === 'LETTER_C' && (form.persil || form.klas)) {
      const currentRiwayat = form.riwayat_tanah && form.riwayat_tanah.length > 0 
        ? [...form.riwayat_tanah] 
        : [{ atas_nama: '', c_no: '', persil_no: '', klas: '', luas: '', dasar_dialihkan: '' }];

      currentRiwayat[0] = {
        ...currentRiwayat[0],
        persil_no: form.persil || '',
        klas: form.klas || '',
        dasar_dialihkan: 'Letter C'
      };

      setForm(prev => ({
        ...prev,
        riwayat_tanah: currentRiwayat
      }));
    }
  }, [form.jenis_dasar_surat, form.persil, form.klas]);

  const renderSpecificAlasHak = () => {
    switch (form.jenis_dasar_surat) {
      case 'LETTER_C':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-inner">
            <Input label="Atas Nama (Letter C)" value={form.atas_nama_letter_c} onChange={e => setForm({...form, atas_nama_letter_c: e.target.value})} />
            <Input label="Nomor Kohir (C)" value={form.kohir} onChange={e => setForm({...form, kohir: e.target.value})} />
            <Input label="Nomor Persil" value={form.persil} onChange={e => setForm({...form, persil: e.target.value})} />
            <Input label="Klas" value={form.klas} onChange={e => setForm({...form, klas: e.target.value})} />
            <Input label="Berasal Dari" value={form.berasal_dari_an} onChange={e => setForm({...form, berasal_dari_an: e.target.value})} />
            <Input label="Tahun Perolehan" value={form.tahun_perolehan_alas_hak} onChange={e => setForm({...form, tahun_perolehan_alas_hak: e.target.value})} />
          </div>
        );
      case 'SHM_ANALOG':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-inner">
            <Input label="Atas Nama Sertifikat" className="md:col-span-2" value={form.atas_nama_shm} onChange={e => setForm({...form, atas_nama_shm: e.target.value.toUpperCase()})} />
            <Input label="Nomor Hak (SHM/M)" value={form.no_shm} onChange={e => setForm({...form, no_shm: e.target.value})} />
            <Input label="NIB" value={form.nib} onChange={e => setForm({...form, nib: e.target.value})} />
            <div className="space-y-1">
              <label className="block text-xs font-medium mb-1 text-slate-700">Tanggal Pembukuan Sertifikat</label>
              <DateInput value={form.tanggal_shm} onChange={val => setForm({...form, tanggal_shm: val, ejaan_tanggal_shm: spellDateIndo(val)})} />
              <div className="text-[10px] font-bold text-blue-600 italic px-1 lowercase">{form.ejaan_tanggal_shm ? `(${form.ejaan_tanggal_shm})` : ''}</div>
            </div>
            <div className="space-y-1">
              <Input label="Nomor Surat Ukur (SU)" value={form.no_su} onChange={e => setForm({...form, no_su: e.target.value})} />
              <DateInput label="Tanggal SU" value={form.tanggal_su} onChange={val => setForm({...form, tanggal_su: val, ejaan_tanggal_su: spellDateIndo(val)})} />
              <div className="text-[10px] font-bold text-blue-600 italic px-1 lowercase">{form.ejaan_tanggal_su ? `(${form.ejaan_tanggal_su})` : ''}</div>
            </div>
          </div>
        );
      case 'SHM_ELEKTRONIK':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-inner">
            <Input label="Atas Nama SHM EL" value={form.atas_nama_shm_el} onChange={e => setForm({...form, atas_nama_shm_el: e.target.value})} />
            <Input label="Nomor/Kode Sertifikat" value={form.no_shm} onChange={e => setForm({...form, no_shm: e.target.value})} />
            <Input label="Nibel" value={form.nibel} onChange={e => setForm({...form, nibel: e.target.value})} />
          </div>
        );
      default: return null;
    }
  };

  const filteredData = data.filter(item => 
    item.atas_nama_nop.toLowerCase().includes(search.toLowerCase()) || item.nop.includes(search)
  );

  if (view === 'form') {
    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-24">
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/90">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 text-white rounded-lg shadow-blue-200 shadow-lg"><MapPin size={20}/></div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Manajemen Objek Tanah</h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Identifikasi & Pengukuran Fisik</p>
              </div>
            </div>
            <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setView('list')}>Batal</Button>
                <Button onClick={handleSave} className="px-6 font-bold shadow-lg shadow-blue-500/20">Simpan Objek</Button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card title="1. Informasi Pajak (SPPT) & Lokasi">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                <Input label="Nomor Objek Pajak (NOP)" value={form.nop} onChange={e => setForm({...form, nop: e.target.value})} />
                <Input label="Atas Nama Sesuai NOP" value={form.atas_nama_nop} onChange={e => setForm({...form, atas_nama_nop: e.target.value})} />
                <Input label="Penggunaan Tanah" placeholder="Pekarangan / Sawah" value={form.penggunaan_tanah} onChange={e => setForm({...form, penggunaan_tanah: e.target.value})} />
                <Input label="Kepala Desa / Lurah Saat Ini" value={form.nama_kepala_desa} onChange={e => setForm({...form, nama_kepala_desa: e.target.value})} />
                <Input label="Alamat / Letak Tanah" className="col-span-2" value={form.alamat} onChange={e => setForm({...form, alamat: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                    <Input label="RT" value={form.rt} onChange={e => setForm({...form, rt: e.target.value})} />
                    <Input label="RW" value={form.rw} onChange={e => setForm({...form, rw: e.target.value})} />
                </div>
                <Input label="Desa/Kelurahan" value={form.desa} onChange={e => setForm({...form, desa: e.target.value})} />
                <Input label="Kecamatan" value={form.kecamatan} onChange={e => setForm({...form, kecamatan: e.target.value})} />
                <Input label="Kota / Kabupaten" value={form.kabupaten_kota} readOnly />
                <Input label="Status Pajak" placeholder="...." value={form.kewajiban_pajak} onChange={e => setForm({...form, kewajiban_pajak: e.target.value})} />
              </div>

              {/* Rincian SPPT */}
              <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                    <CalendarDays className="text-blue-500" size={18} />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-600">Rincian SPPT & NJOP</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Input label="SPPT Tahun" value={form.sppt_tahun} onChange={e => setForm({...form, sppt_tahun: e.target.value})} />
                </div>
                <div className="overflow-hidden border border-slate-200 rounded-xl bg-white mb-6">
                    <table className="w-full text-[10px] text-left">
                        <thead className="bg-slate-100 font-black uppercase text-slate-600">
                            <tr>
                                <th className="p-3">Objek Pajak</th>
                                <th className="p-3">Luas (m²)</th>
                                <th className="p-3">NJOP (Rp)</th>
                                <th className="p-3">Total NJOP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr>
                                <td className="p-3 font-bold text-slate-700">Bumi</td>
                                <td className="p-2"><input type="number" className="w-full p-2 border rounded font-bold" value={form.pajak_bumi_luas} onChange={e => setForm({...form, pajak_bumi_luas: parseFloat(e.target.value) || 0})} /></td>
                                <td className="p-2"><input type="number" className="w-full p-2 border rounded font-bold" value={form.pajak_bumi_njop} onChange={e => setForm({...form, pajak_bumi_njop: parseFloat(e.target.value) || 0})} /></td>
                                <td className="p-3 font-black text-blue-600">Rp {(form.pajak_bumi_total || 0).toLocaleString('id-ID')}</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-bold text-slate-700">Bangunan</td>
                                <td className="p-2"><input type="number" className="w-full p-2 border rounded font-bold" value={form.pajak_bangunan_luas} onChange={e => setForm({...form, pajak_bangunan_luas: parseFloat(e.target.value) || 0})} /></td>
                                <td className="p-2"><input type="number" className="w-full p-2 border rounded font-bold" value={form.pajak_bangunan_njop} onChange={e => setForm({...form, pajak_bangunan_njop: parseFloat(e.target.value) || 0})} /></td>
                                <td className="p-3 font-black text-blue-600">Rp {(form.pajak_bangunan_total || 0).toLocaleString('id-ID')}</td>
                            </tr>
                            <tr className="bg-blue-50">
                                <td colSpan={3} className="p-3 text-right font-black uppercase text-blue-800">Grand Total NJOP</td>
                                <td className="p-3 font-black text-blue-900 text-sm">Rp {(form.pajak_grand_total || 0).toLocaleString('id-ID')}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Harga Transaksi (Pindahan dari Files) */}
                <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-xl shadow-blue-500/20">
                    <div className="flex items-center gap-2 mb-4">
                        <Coins size={20} />
                        <span className="text-xs font-black uppercase tracking-widest">Harga Transaksi / Nilai Akta</span>
                    </div>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-blue-300">Rp</span>
                        <input type="number" className="w-full bg-white/10 border border-white/20 rounded-xl p-4 pl-12 text-2xl font-black text-white outline-none focus:bg-white/20 focus:ring-2 focus:ring-white/50 transition-all" value={form.harga_transaksi} onChange={e => {
                            const v = parseFloat(e.target.value) || 0;
                            setForm({...form, harga_transaksi: v, ejaan_harga_transaksi: terbilang(v) + " rupiah"});
                        }} />
                    </div>
                    <div className="mt-3 text-[10px] font-bold text-blue-100 uppercase tracking-widest italic">{form.ejaan_harga_transaksi || 'nol rupiah'}</div>
                </div>
              </div>
            </Card>

            <Card title="2. Jenis Dasar Hak / Alas Hak">
                <div className="flex items-center gap-4 mb-4 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                    <FileStack className="text-blue-600" size={24} />
                    <div className="flex flex-wrap gap-6">
                        {['LETTER_C', 'SHM_ANALOG', 'SHM_ELEKTRONIK'].map((type) => (
                            <label key={type} className="flex items-center gap-2 cursor-pointer group select-none">
                                <input 
                                  type="radio" 
                                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                  checked={form.jenis_dasar_surat === type} 
                                  onChange={() => setForm({...form, jenis_dasar_surat: type as LandType})} 
                                />
                                <span className={`text-xs font-black uppercase tracking-tight ${form.jenis_dasar_surat === type ? 'text-blue-700' : 'text-slate-400'}`}>
                                  {type.replace('_', ' ')}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
                {renderSpecificAlasHak()}
            </Card>

            <Card title="3. Riwayat Kepemilikan (Buku C Desa)">
                <div className="overflow-x-auto border border-slate-300 rounded-xl bg-white shadow-inner">
                    <table className="w-full text-[10px] text-left">
                        <thead className="bg-slate-100 font-black uppercase text-slate-600 border-b border-slate-300">
                            <tr>
                                <th className="p-3">Nama Pemilik</th>
                                <th className="p-3">No C</th>
                                <th className="p-3">Persil</th>
                                <th className="p-3">Klas</th>
                                <th className="p-3">Luas (m²)</th>
                                <th className="p-3">Dasar peralihan</th>
                                <th className="p-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {(form.riwayat_tanah || []).map((row, idx) => (
                                <tr key={idx} className="hover:bg-blue-50/30">
                                    <td className="p-2"><input className="w-full border border-slate-300 bg-white font-bold p-1.5 focus:ring-2 focus:ring-blue-500 rounded text-xs outline-none" value={row.atas_nama} onChange={e => updateRiwayat(idx, 'atas_nama', e.target.value)} /></td>
                                    <td className="p-2"><input className="w-full border border-slate-300 bg-white p-1.5 focus:ring-2 focus:ring-blue-500 rounded text-xs outline-none" value={row.c_no} onChange={e => updateRiwayat(idx, 'c_no', e.target.value)} /></td>
                                    <td className="p-2"><input className={`w-full border border-slate-300 p-1.5 rounded text-xs outline-none ${row.dasar_dialihkan === 'Letter C' ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-blue-500'}`} value={row.persil_no} onChange={e => updateRiwayat(idx, 'persil_no', e.target.value)} readOnly={row.dasar_dialihkan === 'Letter C'} /></td>
                                    <td className="p-2"><input className={`w-full border border-slate-300 p-1.5 rounded text-xs outline-none ${row.dasar_dialihkan === 'Letter C' ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-blue-500'}`} value={row.klas} onChange={e => updateRiwayat(idx, 'klas', e.target.value)} readOnly={row.dasar_dialihkan === 'Letter C'} /></td>
                                    <td className="p-2"><input className="w-full border border-slate-300 bg-white font-black p-1.5 focus:ring-2 focus:ring-blue-500 rounded text-xs outline-none text-blue-700" value={row.luas} onChange={e => updateRiwayat(idx, 'luas', e.target.value)} /></td>
                                    <td className="p-2"><input className="w-full border border-slate-300 bg-white p-1.5 focus:ring-2 focus:ring-blue-500 rounded text-xs outline-none" value={row.dasar_dialihkan} onChange={e => updateRiwayat(idx, 'dasar_dialihkan', e.target.value)} /></td>
                                    <td className="p-2 text-right">
                                        <button onClick={() => removeRiwayat(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Button variant="outline" size="sm" onClick={addRiwayat} className="w-full mt-4 border-dashed border-slate-300 hover:bg-slate-50">
                  <Plus size={14} className="mr-2" /> Tambah Baris Riwayat Tanah
                </Button>
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="4. Luas & Batas-batas">
                <div className="space-y-6">
                    <div className="flex p-1 bg-slate-100 rounded-lg">
                      <button onClick={() => setIsPartial(false)} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-md transition-all ${!isPartial ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><Layers size={14} className="inline mr-1" /> Seluruhnya</button>
                      <button onClick={() => setIsPartial(true)} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-md transition-all ${isPartial ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><Maximize size={14} className="inline mr-1" /> Sebagian</button>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                          <label className="block text-[10px] font-black text-emerald-600 uppercase mb-2">Luas Seluruhnya (m²)</label>
                          <input type="number" className="w-full px-4 py-3 bg-white border border-emerald-200 rounded-lg text-2xl font-black text-emerald-700 focus:ring-2 focus:ring-emerald-500 outline-none" value={form.luas_seluruhnya} onChange={e => updateLuas('luas_seluruhnya', parseFloat(e.target.value) || 0)} />
                          <p className="mt-2 text-[10px] font-bold text-emerald-500 italic lowercase tracking-tight">terbilang: {form.ejaan_luas_seluruhnya || 'nol meter persegi'}</p>
                          <div className="grid grid-cols-2 gap-2 mt-4">
                              <Input label="Utara" value={form.batas_utara_seluruhnya} onChange={e => setForm({...form, batas_utara_seluruhnya: e.target.value})} />
                              <Input label="Timur" value={form.batas_timur_seluruhnya} onChange={e => setForm({...form, batas_timur_seluruhnya: e.target.value})} />
                              <Input label="Selatan" value={form.batas_selatan_seluruhnya} onChange={e => setForm({...form, batas_selatan_seluruhnya: e.target.value})} />
                              <Input label="Barat" value={form.batas_barat_seluruhnya} onChange={e => setForm({...form, batas_barat_seluruhnya: e.target.value})} />
                          </div>
                      </div>

                      {isPartial && (
                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="block text-[10px] font-black text-blue-600 uppercase mb-2">Luas Dimohon (Sebagian m²)</label>
                            <input type="number" className="w-full px-4 py-3 bg-white border border-blue-200 rounded-lg text-2xl font-black text-blue-700 focus:ring-2 focus:ring-blue-500 outline-none" value={form.luas_dimohon} onChange={e => updateLuas('luas_dimohon', parseFloat(e.target.value) || 0)} />
                            <p className="mt-2 text-[10px] font-bold text-blue-500 italic lowercase tracking-tight">terbilang: {form.ejaan_luas_dimohon || 'nol meter persegi'}</p>
                            <div className="grid grid-cols-2 gap-2 mt-4">
                                <Input label="Utara" value={form.batas_utara_dimohon} onChange={e => setForm({...form, batas_utara_dimohon: e.target.value})} />
                                <Input label="Timur" value={form.batas_timur_dimohon} onChange={e => setForm({...form, batas_timur_dimohon: e.target.value})} />
                                <Input label="Selatan" value={form.batas_selatan_dimohon} onChange={e => setForm({...form, batas_selatan_dimohon: e.target.value})} />
                                <Input label="Barat" value={form.batas_barat_dimohon} onChange={e => setForm({...form, batas_barat_dimohon: e.target.value})} />
                            </div>
                        </div>
                      )}
                    </div>
                </div>
            </Card>

            <Card title="5. Titik Koordinat Geo-Lokasi">
               <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Crosshair size={18} className="text-blue-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Daftar Titik Koordinat</span>
                  </div>
                  <div className="space-y-3">
                    {(form.koordinat_list || []).map((koor, idx) => (
                      <div key={idx} className="flex gap-2 items-center group">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0">{idx + 1}</div>
                        <input 
                          className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-inner"
                          placeholder="-7.xxxx, 112.xxxx"
                          value={koor}
                          onChange={e => updateKoordinat(idx, e.target.value)}
                        />
                        {idx > 0 && (
                          <button onClick={() => removeKoordinat(idx)} className="p-2 text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 size={16}/>
                          </button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addKoordinat} className="w-full mt-2 border-dashed bg-white">
                      <Plus size={14} className="mr-2" /> Tambah Titik Koordinat
                    </Button>
                  </div>
               </div>
            </Card>

            <Card title="6. Narasi BAK (Kesaksian)">
              <div className="space-y-5">
                {(form.bak_list || []).map((txt, idx) => (
                    <div key={idx} className="relative group bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1.5"><AlignLeft size={14} className="text-blue-500"/> Narasi BAK Ke-{idx + 1}</label>
                          {idx > 0 && <button onClick={() => removeBAK(idx)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={16}/></button>}
                        </div>
                        <textarea className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[160px] bg-white shadow-inner resize-y" placeholder="Masukkan rincian keterangan saksi secara lengkap dan jelas..." value={txt} onChange={e => updateBAK(idx, e.target.value)} />
                    </div>
                ))}
                <Button variant="outline" size="sm" onClick={addBAK} className="w-full border-dashed bg-white"><Plus size={14} className="mr-2" /> Tambah Kolom BAK</Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Basis Data Objek Tanah</h2>
          <p className="text-slate-500 text-sm font-medium">Pengelolaan identitas fisik tanah untuk keperluan akta.</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setEditingId(null); setView('form'); setIsPartial(false); }}>
          <Plus size={18} className="mr-2 inline" /> Tambah Objek Baru
        </Button>
      </div>

      <div className="relative group">
        <Search className="absolute left-3.5 top-3 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
        <input type="text" placeholder="Cari berdasarkan NOP atau Nama Pemilik (SPPT)..." className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl text-sm outline-none shadow-sm focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="p-0 overflow-hidden shadow-sm border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[10px] font-black tracking-widest">
                <tr>
                    <th className="p-4">Jenis Alas Hak</th>
                    <th className="p-4">Nama Pemilik / NOP</th>
                    <th className="p-4">Alamat & Lokasi</th>
                    <th className="p-4 text-right">Harga Transaksi</th>
                    <th className="p-4 text-right">Aksi</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${item.jenis_dasar_surat === 'LETTER_C' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>{item.jenis_dasar_surat.replace('_', ' ')}</span>
                  </td>
                  <td className="p-4">
                    <div className="font-black text-slate-800 uppercase">{item.atas_nama_nop}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 tracking-tighter">{item.nop}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-xs font-bold text-slate-600 truncate max-w-[200px]">{item.alamat}</div>
                    <div className="text-[9px] font-black text-blue-500 uppercase mt-0.5 tracking-wider">DESA {item.desa || '-'}</div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="font-black text-blue-600">Rp {(item.harga_transaksi || 0).toLocaleString('id-ID')}</div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(item.id)} className="p-2.5 text-blue-600 hover:bg-blue-100 rounded-xl transition-all"><Edit2 size={16}/></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
