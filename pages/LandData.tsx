
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { LandData, LandType, LandHistory, BuildingDetail } from '../types';
import { Button, Input, Card, DateInput, Select } from '../components/UI';
import { Edit2, Trash2, Plus, Search, MapPin, FileStack, Info, AlignLeft, Layers, Maximize, Crosshair, Coins,  Receipt, TrendingUp, Landmark, X, CheckCircle, Home } from 'lucide-react';
import { generateId, terbilang, spellDateIndo, generateUUID} from '../utils';
import LandMap from '../components/LandMap';
import { useSearchParams } from 'react-router-dom';

export const LandDataPage: React.FC = () => {
  const [data, setData] = useState<LandData[]>([]);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showMapModal, setShowMapModal] = useState(false);
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  
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
    kabupaten_kota: 'Pasuruan', 
    kewajiban_pajak: '', 
    surat_hak_sebelumnya: [],
    jenis_dasar_surat: 'LETTER_C',
    
    kohir: '', persil: '', klas: '', atas_nama_letter_c: '', berasal_dari_an: '', tahun_perolehan_alas_hak: '',
    atas_nama_shm: '', no_shm: '', nib: '', no_su: '', tanggal_su: '', ejaan_tanggal_su: '', tanggal_shm: '', ejaan_tanggal_shm: '',
    atas_nama_shm_el: '', kode_sertifikat: '', nibel: '',

    luas_dimohon: 0, ejaan_luas_dimohon: '', batas_utara_dimohon: '', batas_timur_dimohon: '', batas_selatan_dimohon: '', batas_barat_dimohon: '',
    luas_seluruhnya: 0, ejaan_luas_seluruhnya: '', batas_utara_seluruhnya: '', batas_timur_seluruhnya: '', batas_selatan_seluruhnya: '', batas_barat_seluruhnya: '',
    
    sppt_tahun: new Date().getFullYear().toString(),
    pajak_bumi_luas: 0, pajak_bumi_njop: 0, pajak_bumi_total: 0,
    
    jumlah_bangunan: 0,
    pajak_bangunan_luas: 0, pajak_bangunan_njop: 0, pajak_bangunan_total: 0,
    detail_bangunan: [],

    pajak_grand_total: 0,
    harga_transaksi: 0, ejaan_harga_transaksi: '',

    latitude: -7.6448, 
    longitude: 112.9033,
    koordinat_list: [''],
    bak_list: [''], 
    riwayat_tanah: [], 
    created_at: ''
  };
  
  const [form, setForm] = useState<LandData>(emptyForm);

  useEffect(() => {
    const totalBumi = (Number(form.pajak_bumi_luas) || 0) * (Number(form.pajak_bumi_njop) || 0);
    const totalBangunan = (Number(form.pajak_bangunan_luas) || 0) * (Number(form.pajak_bangunan_njop) || 0);
    const grandTotal = totalBumi + totalBangunan;

    if (
      form.pajak_bumi_total !== totalBumi || 
      form.pajak_bangunan_total !== totalBangunan || 
      form.pajak_grand_total !== grandTotal
    ) {
      setForm(prev => ({
        ...prev,
        pajak_bumi_total: totalBumi,
        pajak_bangunan_total: totalBangunan,
        pajak_grand_total: grandTotal
      }));
    }
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

  const addSuratHak = () => {
    setForm(prev => ({
      ...prev,
      // Gunakan huruf kecil 'sebelumnya' agar sama dengan interface
      surat_hak_sebelumnya: [
        ...(Array.isArray(prev.surat_hak_sebelumnya) ? prev.surat_hak_sebelumnya : []),
        { jenis: '', tanggal: '', nomor: '', nama_ppat: '' }
      ]
    }));
  };

const updateSuratHak = (index: number, field: string, value: string) => {
  const newSurat = [...form.surat_hak_sebelumnya];
  newSurat[index] = { ...newSurat[index], [field]: value };
  setForm({ ...form, surat_hak_sebelumnya: newSurat });
};

const removeSuratHak = (index: number) => {
  setForm({
    ...form,
    surat_hak_sebelumnya: form.surat_hak_sebelumnya.filter((_, i) => i !== index)
  });
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
    
    // PASTIKAN BARIS INI MENGGUNAKAN generateUUID(), BUKAN generateId()
    const finalId = editingId || generateUUID(); 

    const payload = { 
      ...form, 
      id: finalId, // Ini harus jadi format UUID
      created_at: form.created_at || new Date().toISOString(),
      // Tambahkan ini untuk memastikan data array tidak kosong/null
      tanggal_su: form.tanggal_su || undefined,
      tanggal_shm: form.tanggal_shm || undefined,
      surat_hak_sebelumnya: form.surat_hak_sebelumnya || [],
      riwayat_tanah: form.riwayat_tanah || [],
      detail_bangunan: form.detail_bangunan || [],
      koordinat_list: form.koordinat_list || [],
      bak_list: form.bak_list || []
    };

    try {
      if (editingId) {
        await db.lands.update(editingId, payload);
      } else {
        // Log untuk memastikan ID sudah benar sebelum dikirim
        console.log("Mengirim ID UUID:", payload.id); 
        await db.lands.add(payload);
      }
      // ... sisanya sama

      setShowMapModal(false);
      setShowBuildingModal(false);
      
      setView('list'); 
      setEditingId(null); 
      setForm(emptyForm);
      alert("✅ Data Berhasil Disimpan!");
    } catch (err: any) {
      console.error("Detail Error:", err);
      // Jika masih error UUID, kita bisa lihat pesannya di console
      alert(`Gagal menyimpan: ${err.message || 'Cek koneksi/database'}`);
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

  // Letakkan ini setelah deklarasi fungsi handleEdit agar tidak error
  useEffect(() => {
  if (editId) {
    // Kita panggil fungsi handleEdit milik Bapak yang sudah lengkap logikanya
    handleEdit(editId);
    }
  }, [editId]); // editId didapat dari searchParams.get('edit')

  // --- Building Detail Logic ---
  const addBuilding = () => {
    const nextNum = (form.detail_bangunan?.length || 0) + 1;
    const newBuilding: BuildingDetail = {
      id: generateId(),
      bangunan_ke: nextNum,
      jenis_penggunaan: 'Perumahan',
      luas: 0,
      jumlah_lantai: 1,
      tahun_dibangun: '',
      tahun_direnovasi: '',
      daya_listrik: '',
      kondisi: 'Baik',
      konstruksi: 'Beton',
      atap: 'Gtg Glazur',
      dinding: 'Batubata',
      lantai: 'Keramik',
      langit_langit: 'Triplek'
    };
    setForm(prev => ({ 
      ...prev, 
      detail_bangunan: [...(prev.detail_bangunan || []), newBuilding],
      jumlah_bangunan: (prev.jumlah_bangunan || 0) + 1
    }));
  };

  const updateBuilding = (index: number, field: keyof BuildingDetail, val: any) => {
    const newList = [...(form.detail_bangunan || [])];
    newList[index] = { ...newList[index], [field]: val };
    
    // Auto-update total area in main form if buildings change
    const totalLuasBuilding = newList.reduce((sum, b) => sum + (Number(b.luas) || 0), 0);
    
    setForm(prev => ({ 
      ...prev, 
      detail_bangunan: newList,
      pajak_bangunan_luas: totalLuasBuilding
    }));
  };

  const removeBuilding = (index: number) => {
    const newList = (form.detail_bangunan || []).filter((_, i) => i !== index);
    const totalLuasBuilding = newList.reduce((sum, b) => sum + (Number(b.luas) || 0), 0);
    setForm(prev => ({ 
      ...prev, 
      detail_bangunan: newList,
      jumlah_bangunan: newList.length,
      pajak_bangunan_luas: totalLuasBuilding
    }));
  };

  // Riwayat logic
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
        {/* Header Sticky */}
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/90">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-lg shadow-blue-200 shadow-lg"><MapPin size={20} /></div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">Manajemen Objek Tanah</h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Identifikasi & Pengukuran Fisik</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setView('list')}>Batal</Button>
            <Button onClick={handleSave} className="px-6 font-bold shadow-lg shadow-blue-500/20">Simpan Objek</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* KOLOM KIRI (LEBAR) */}
          <div className="lg:col-span-2 space-y-6">
            <Card title="1. Informasi Pajak (SPPT) & Lokasi">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                <Input label="Nomor Objek Pajak (NOP)" value={form.nop} onChange={e => setForm({ ...form, nop: e.target.value })} />
                <Input label="Atas Nama Sesuai NOP" value={form.atas_nama_nop} onChange={e => setForm({ ...form, atas_nama_nop: e.target.value })} />
                <Input label="Penggunaan Tanah" placeholder="Pekarangan / Sawah" value={form.penggunaan_tanah} onChange={e => setForm({ ...form, penggunaan_tanah: e.target.value })} />
                <Input label="Kepala Desa / Lurah Saat Ini" value={form.nama_kepala_desa} onChange={e => setForm({ ...form, nama_kepala_desa: e.target.value })} />
                <Input label="Alamat / Letak Tanah" className="col-span-2" value={form.alamat} onChange={e => setForm({ ...form, alamat: e.target.value })} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="RT" value={form.rt} onChange={e => setForm({ ...form, rt: e.target.value })} />
                  <Input label="RW" value={form.rw} onChange={e => setForm({ ...form, rw: e.target.value })} />
                </div>
                <Input label="Desa/Kelurahan" value={form.desa} onChange={e => setForm({ ...form, desa: e.target.value })} />
                <Input label="Kecamatan" value={form.kecamatan} onChange={e => setForm({ ...form, kecamatan: e.target.value })} />
                <Input label="Kota / Kabupaten" value={form.kabupaten_kota} readOnly />
                <Input label="Kewajiban Pajak" placeholder="...." value={form.kewajiban_pajak} onChange={e => setForm({ ...form, kewajiban_pajak: e.target.value })} />
                </div>
                <div className="mt-8 space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-tighter">
                      Riwayat Surat Hak Sebelumnya (Dinamis)
                    </h3>
                    <button 
                      type="button"
                      onClick={addSuratHak}
                      className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl text-[10px] font-bold transition-all shadow-sm border border-blue-100"
                    >
                      + TAMBAH RIWAYAT SURAT
                    </button>
                  </div>

                  <div className="grid gap-4">
                    {form.surat_hak_sebelumnya && form.surat_hak_sebelumnya.map((item, index) => (
                      <div key={index} className="group relative grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-slate-50/50 rounded-[24px] border border-slate-200 transition-all hover:bg-white hover:shadow-md">
                        <Input 
                          label="Jenis" 
                          placeholder="Contoh: Akta" 
                          value={item.jenis} 
                          onChange={(e) => updateSuratHak(index, 'jenis', e.target.value)} 
                        />
                        <Input 
                          label="Tanggal" 
                          type="date" 
                          value={item.tanggal} 
                          onChange={(e) => updateSuratHak(index, 'tanggal', e.target.value)} 
                        />
                        <Input 
                          label="Nomor" 
                          placeholder="No. Surat" 
                          value={item.nomor} 
                          onChange={(e) => updateSuratHak(index, 'nomor', e.target.value)} 
                        />
                        <div className="relative">
                          <Input 
                            label="Nama PPAT/Notaris" 
                            placeholder="Nama Lengkap" 
                            value={item.nama_ppat} 
                            onChange={(e) => updateSuratHak(index, 'nama_ppat', e.target.value)} 
                          />
                          {/* Tombol Hapus Baris */}
                          <button 
                            type="button"
                            onClick={() => removeSuratHak(index)}
                            className="absolute -top-2 -right-2 bg-white text-red-500 shadow-sm border border-red-100 rounded-full p-1.5 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {form.surat_hak_sebelumnya.length === 0 && (
                      <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-[32px] bg-slate-50/30">
                        <p className="text-xs text-slate-400 font-medium">Klik tombol tambah jika ada riwayat surat sebelumnya</p>
                      </div>
                    )}
                  </div>
                </div>

              {/* Rincian SPPT & NJOP */}
              <div className="mt-10 p-1 bg-slate-100/50 rounded-[2.5rem] border border-slate-200">
                <div className="bg-white rounded-[2.2rem] p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 shadow-sm">
                        <Receipt size={22} />
                      </div>
                      <div>
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-800">SPPT & Nilai NJOP</span>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Penetapan Nilai Objek Pajak</p>
                      </div>
                    </div>
                    <div className="w-32">
                      <Input label="Tahun Pajak" value={form.sppt_tahun} onChange={e => setForm({ ...form, sppt_tahun: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col group hover:border-blue-200 transition-all">
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200/50">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Objek Bumi</span>
                        </div>
                        <TrendingUp size={16} className="text-blue-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Input label="Luas (M²)" type="number" value={form.pajak_bumi_luas} onChange={e => setForm({ ...form, pajak_bumi_luas: parseFloat(e.target.value) || 0 })} />
                          <Input label="NJOP/M² (Rp)" type="number" value={form.pajak_bumi_njop} onChange={e => setForm({ ...form, pajak_bumi_njop: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200/50 shadow-inner">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total NJOP Bumi</p>
                          <div className="text-xl font-black text-slate-900 tracking-tight">Rp {(form.pajak_bumi_total || 0).toLocaleString('id-ID')}</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col group hover:border-emerald-200 transition-all">
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200/50">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Objek Bangunan</span>
                        </div>
                        <TrendingUp size={16} className="text-emerald-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Input label="Luas (M²)" type="number" value={form.pajak_bangunan_luas} onChange={e => setForm({ ...form, pajak_bangunan_luas: parseFloat(e.target.value) || 0 })} />
                          <Input label="NJOP/M² (Rp)" type="number" value={form.pajak_bangunan_njop} onChange={e => setForm({ ...form, pajak_bangunan_njop: parseFloat(e.target.value) || 0 })} />
                        </div>
                        
                        <div className="bg-white p-4 rounded-2xl border border-slate-200/50 shadow-inner">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total NJOP Bangunan</p>
                          <div className="text-xl font-black text-slate-900 tracking-tight">Rp {(form.pajak_bangunan_total || 0).toLocaleString('id-ID')}</div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full border-blue-200 text-blue-600 bg-blue-50/50 hover:bg-blue-100 font-black tracking-widest uppercase text-[10px] h-11 rounded-xl"
                          onClick={() => setShowBuildingModal(true)}
                        >
                          <Home size={14} className="mr-2" /> 
                          {form.detail_bangunan && form.detail_bangunan.length > 0 
                            ? `Kelola ${form.detail_bangunan.length} Detail Bangunan` 
                            : 'Masukkan Detail Bangunan'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-5 scale-150 rotate-12 transition-transform group-hover:scale-125 duration-700">
                      <Landmark size={120} />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Akumulasi Total NJOP</p>
                        <h4 className="text-4xl font-black tracking-tighter">Rp {(form.pajak_grand_total || 0).toLocaleString('id-ID')}</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status Pajak Terdaftar</p>
                        <div className="px-5 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-400 inline-block backdrop-blur-md">
                          Sudah Tervalidasi Sistem
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Harga Transaksi */}
                <div className="mt-6 bg-white rounded-[2.2rem] p-8 shadow-sm border border-slate-200/50 relative overflow-hidden group">
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 shadow-sm">
                        <Coins size={22} />
                      </div>
                      <div>
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-800">Nilai Transaksi Riil</span>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Nilai perolehan akta</p>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300 text-3xl select-none">Rp</div>
                      <input
                        type="number"
                        className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] p-8 pl-20 text-5xl font-black text-slate-900 outline-none focus:bg-white focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-inner"
                        placeholder="0"
                        value={form.harga_transaksi || ''}
                        onChange={e => {
                          const v = parseFloat(e.target.value) || 0;
                          setForm({ ...form, harga_transaksi: v, ejaan_harga_transaksi: terbilang(v) + " rupiah" });
                        }}
                      />
                    </div>
                    {form.ejaan_harga_transaksi && (
                      <div className="mt-6 p-5 bg-blue-50/30 rounded-2xl border border-blue-100/50 flex items-start gap-4">
                        <Info size={16} className="text-blue-500 mt-0.5" />
                        <div>
                          <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Terbilang</p>
                          <div className="text-xs font-bold text-blue-700 italic">({form.ejaan_harga_transaksi})</div>
                        </div>
                      </div>
                    )}
                  </div>
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
                        className="w-4 h-4 text-blue-600"
                        checked={form.jenis_dasar_surat === type}
                        onChange={() => {
                          // LOGIKA BARU: Jika pindah ke selain LETTER_C, reset data riwayat dan BAK
                          const baseUpdate = { ...form, jenis_dasar_surat: type as LandType };
                          
                          if (type !== 'LETTER_C') {
                            setForm({
                              ...baseUpdate,
                              riwayat_tanah: [], // Kosongkan riwayat
                              bak_list: ['']     // Reset narasi BAK ke satu kolom kosong
                            });
                          } else {
                            setForm(baseUpdate);
                          }
                        }}
                      />
                      <span className={`text-xs font-black uppercase ${form.jenis_dasar_surat === type ? 'text-blue-700' : 'text-slate-400'}`}>
                        {type.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              {renderSpecificAlasHak()}
            </Card>

            {/* HANYA MUNCUL JIKA JENIS DASAR SURAT ADALAH LETTER C */}
            {form.jenis_dasar_surat === 'LETTER_C' && (
              <Card title="2.1 Riwayat Kepemilikan (Buku C Desa)">
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
                          <td className="p-2">
                            <input 
                              className="w-full border border-slate-300 p-1.5 rounded text-xs outline-none" 
                              value={row.atas_nama} 
                              onChange={e => updateRiwayat(idx, 'atas_nama', e.target.value)} 
                            />
                          </td>
                          <td className="p-2">
                            <input 
                              className="w-full border border-slate-300 p-1.5 rounded text-xs outline-none" 
                              value={row.c_no} 
                              onChange={e => updateRiwayat(idx, 'c_no', e.target.value)} 
                            />
                          </td>
                          <td className="p-2">
                            <input 
                              className="w-full border border-slate-300 p-1.5 rounded text-xs outline-none bg-white" 
                              value={row.persil_no} 
                              onChange={e => updateRiwayat(idx, 'persil_no', e.target.value)} 
                            />
                          </td>
                          <td className="p-2">
                            <input 
                              className="w-full border border-slate-300 p-1.5 rounded text-xs outline-none bg-white" 
                              value={row.klas} 
                              onChange={e => updateRiwayat(idx, 'klas', e.target.value)} 
                            />
                          </td>
                          <td className="p-2">
                            <input 
                              className="w-full border border-slate-300 font-black p-1.5 rounded text-xs outline-none text-blue-700" 
                              value={row.luas} 
                              onChange={e => updateRiwayat(idx, 'luas', e.target.value)} 
                            />
                          </td>
                          <td className="p-2">
                            <input 
                              className="w-full border border-slate-300 p-1.5 rounded text-xs outline-none" 
                              value={row.dasar_dialihkan} 
                              onChange={e => updateRiwayat(idx, 'dasar_dialihkan', e.target.value)} 
                            />
                          </td>
                          <td className="p-2 text-right">
                            <button 
                              onClick={() => removeRiwayat(idx)} 
                              className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button variant="outline" size="sm" onClick={addRiwayat} className="w-full mt-4 border-dashed">
                  <Plus size={14} className="mr-2" /> Tambah Baris Riwayat
                </Button>
              </Card>
            )}
          </div>

          {/* KOLOM KANAN (SIDEBAR) */}
          <div className="space-y-6">
            <Card title="3. Luas & Batas-batas">
              <div className="space-y-6">
                <div className="flex p-1 bg-slate-100 rounded-lg">
                  <button onClick={() => setIsPartial(false)} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-md ${!isPartial ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}><Layers size={14} className="inline mr-1" /> Seluruhnya</button>
                  <button onClick={() => setIsPartial(true)} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-md ${isPartial ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}><Maximize size={14} className="inline mr-1" /> Sebagian</button>
                </div>
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                  <label className="block text-[10px] font-black text-emerald-600 uppercase mb-2">Luas Seluruhnya (m²)</label>
                  <input type="number" className="w-full px-4 py-3 bg-white border border-emerald-200 rounded-lg text-2xl font-black text-emerald-700 outline-none" value={form.luas_seluruhnya} onChange={e => updateLuas('luas_seluruhnya', parseFloat(e.target.value) || 0)} />
                  <p className="mt-2 text-[10px] font-bold text-emerald-500 italic lowercase tracking-tight">terbilang: {form.ejaan_luas_seluruhnya || 'nol meter persegi'}</p>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <Input label="Utara" value={form.batas_utara_seluruhnya} onChange={e => setForm({ ...form, batas_utara_seluruhnya: e.target.value })} />
                    <Input label="Timur" value={form.batas_timur_seluruhnya} onChange={e => setForm({ ...form, batas_timur_seluruhnya: e.target.value })} />
                    <Input label="Selatan" value={form.batas_selatan_seluruhnya} onChange={e => setForm({ ...form, batas_selatan_seluruhnya: e.target.value })} />
                    <Input label="Barat" value={form.batas_barat_seluruhnya} onChange={e => setForm({ ...form, batas_barat_seluruhnya: e.target.value })} />
                  </div>
                </div>
                {isPartial && (
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-2">
                    <label className="block text-[10px] font-black text-blue-600 uppercase mb-2">Luas Dimohon (m²)</label>
                    <input type="number" className="w-full px-4 py-3 bg-white border border-blue-200 rounded-lg text-2xl font-black text-blue-700 outline-none" value={form.luas_dimohon} onChange={e => updateLuas('luas_dimohon', parseFloat(e.target.value) || 0)} />
                    <p className="mt-2 text-[10px] font-bold text-blue-500 italic">terbilang: {form.ejaan_luas_dimohon || 'nol meter persegi'}</p>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <Input label="Utara" value={form.batas_utara_dimohon} onChange={e => setForm({ ...form, batas_utara_dimohon: e.target.value })} />
                      <Input label="Timur" value={form.batas_timur_dimohon} onChange={e => setForm({ ...form, batas_timur_dimohon: e.target.value })} />
                      <Input label="Selatan" value={form.batas_selatan_dimohon} onChange={e => setForm({ ...form, batas_selatan_dimohon: e.target.value })} />
                      <Input label="Barat" value={form.batas_barat_dimohon} onChange={e => setForm({ ...form, batas_barat_dimohon: e.target.value })} />
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card title="4. Titik Koordinat Geo-Lokasi">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Crosshair size={18} className="text-blue-500" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Titik Koordinat Bidang Tanah</span>
                </div>
                <div className="space-y-3">
                  {(form.koordinat_list || ['']).map((koor, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded-2xl border border-slate-200">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0 border border-slate-100">{idx + 1}</div>
                      <input className="flex-1 px-4 py-2 bg-transparent text-xs font-bold font-mono outline-none" placeholder="-7.xxxx, 112.xxxx" value={koor} onChange={e => updateKoordinat(idx, e.target.value)} />
                      {idx > 0 && <button type="button" onClick={() => removeKoordinat(idx)} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>}
                    </div>
                  ))}
                  <button type="button" onClick={addKoordinat} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase">
                    <Plus size={14} /> Tambah Titik Koordinat
                  </button>
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <button type="button" onClick={() => setShowMapModal(true)} className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 hover:bg-indigo-100 flex items-center justify-center gap-2 text-[10px] font-black uppercase">
                      <MapPin size={14} /> {form.latitude ? 'Tambahkan Titik Lokasi Peta' : 'Pilih Lokasi di Peta (Visual)'}
                    </button>
                    {form.latitude && (
                      <div className="mt-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100 flex justify-between items-center">
                        <span className="text-[9px] font-black text-emerald-600 uppercase">Pin Peta:</span>
                        <code className="text-[9px] font-bold text-emerald-700">{form.latitude.toFixed(6)}, {form.longitude?.toFixed(6)}</code>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* HANYA MUNCUL JIKA JENIS DASAR SURAT ADALAH LETTER C */}
              {form.jenis_dasar_surat === 'LETTER_C' && (
                <Card title="2.2 Narasi BAK (Kesaksian)">
                  <div className="space-y-5">
                    {(form.bak_list || []).map((txt, idx) => (
                      <div key={idx} className="relative group bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1.5">
                            <AlignLeft size={14} className="text-blue-500" /> 
                            Narasi BAK Ke-{idx + 1}
                          </label>
                          {idx > 0 && (
                            <button onClick={() => removeBAK(idx)} className="text-red-400 hover:text-red-600">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                        <textarea 
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none min-h-[160px] bg-white resize-y" 
                          placeholder="Masukkan rincian keterangan saksi..." 
                          value={txt} 
                          onChange={e => updateBAK(idx, e.target.value)} 
                        />
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addBAK} className="w-full border-dashed bg-white">
                      <Plus size={14} className="mr-2" /> Tambah Kolom BAK
                    </Button>
                  </div>
                </Card>
              )}
          </div>
        </div>

        {/* MODAL PETA */}
        {showMapModal && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowMapModal(false)} />
            <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-black text-slate-800">Pilih Koordinat</h3>
                <button type="button" onClick={() => setShowMapModal(false)} className="p-2 text-slate-400 hover:text-red-500"><X size={24} /></button>
              </div>
              <div className="p-4">
                <div className="h-[600px] w-full rounded-2xl overflow-hidden border-2 border-slate-300 shadow-inner mt-4">
                    <LandMap 
                      latitude={form.latitude || -7.6448} // Berikan default Pasuruan jika kosong
                      longitude={form.longitude || 112.9061} 
                      onChange={(newLat, newLng) => 
                        setForm((prev: any) => ({ 
                          ...prev, 
                          latitude: newLat, 
                          longitude: newLng 
                        }))
                      } 
                    />
                  </div>
                <div className="mt-4 p-4 bg-indigo-50 rounded-2xl flex justify-between items-center">
                  <code className="text-xs font-bold text-indigo-700">
                    {form.latitude ? `${form.latitude.toFixed(6)}, ${form.longitude?.toFixed(6)}` : 'Klik pada peta...'}
                  </code>
                  <button
                    type="button"
                    onClick={() => setShowMapModal(false)}
                    className="px-6 py-3 bg-indigo-600 text-white text-xs font-black rounded-xl uppercase flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg"
                  >
                    <CheckCircle size={16} /> Gunakan Lokasi Ini
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DETAIL BANGUNAN */}
        {showBuildingModal && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-5xl h-[90vh] rounded-[3rem] shadow-2xl flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b bg-slate-50 flex justify-between items-center px-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Home size={24}/></div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Manajemen Detail Bangunan</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Lengkapi spesifikasi fisik konstruksi</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="secondary" onClick={() => setShowBuildingModal(false)}>Tutup</Button>
                  <Button onClick={() => setShowBuildingModal(false)} className="bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20 px-8">Simpan Detail</Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-10">
                {(form.detail_bangunan || []).length === 0 && (
                   <div className="py-20 text-center flex flex-col items-center opacity-30">
                      <Home size={64} className="mb-4" strokeWidth={1}/>
                      <p className="font-black uppercase tracking-[0.3em] text-sm">Belum Ada Data Bangunan</p>
                      <Button variant="outline" className="mt-6 border-dashed" onClick={addBuilding}><Plus size={16} className="mr-2"/> Tambah Bangunan Pertama</Button>
                   </div>
                )}

                {(form.detail_bangunan || []).map((b, idx) => (
                  <div key={b.id} className="bg-slate-50 rounded-[2.5rem] border border-slate-200 transition-all shadow-sm overflow-hidden hover:border-blue-300">
                    {/* FIXED HEADER: Bangunan X & Aksi Hapus diletakkan di luar form grid */}
                    <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black text-[10px] border border-blue-100 shadow-sm">
                            {idx + 1}
                         </div>
                         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">DATA BANGUNAN KE-{idx + 1}</span>
                      </div>
                      <button 
                        onClick={() => removeBuilding(idx)} 
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Hapus Unit Bangunan"
                      >
                        <Trash2 size={18}/>
                      </button>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-1">
                       <Select label="Jenis Penggunaan" value={b.jenis_penggunaan} onChange={e => updateBuilding(idx, 'jenis_penggunaan', e.target.value)}>
                          <option value="Perumahan">Perumahan</option>
                          <option value="Pabrik">Pabrik</option>
                          <option value="Perkantoran Swasta">Perkantoran Swasta</option>
                          <option value="Toko Apotik/Pasar/Ruko">Toko Apotik/Pasar/Ruko</option>
                          <option value="Rumah Sakit/Klinik">Rumah Sakit/Klinik</option>
                       </Select>
                       <Input label="Luas Bangunan (m²)" type="number" value={b.luas} onChange={e => updateBuilding(idx, 'luas', parseFloat(e.target.value) || 0)} />
                       <Input label="Jumlah Lantai" type="number" value={b.jumlah_lantai} onChange={e => updateBuilding(idx, 'jumlah_lantai', parseInt(e.target.value) || 1)} />
                       <Input label="Daya Listrik (Watt)" placeholder="Misal: 1300" value={b.daya_listrik} onChange={e => updateBuilding(idx, 'daya_listrik', e.target.value)} />
                       
                       <Input label="Tahun Dibangun" type="number" placeholder="YYYY" value={b.tahun_dibangun} onChange={e => updateBuilding(idx, 'tahun_dibangun', e.target.value)} />
                       <Input label="Tahun Direnovasi" type="number" placeholder="YYYY (Jika Ada)" value={b.tahun_direnovasi} onChange={e => updateBuilding(idx, 'tahun_direnovasi', e.target.value)} />
                       
                       <Select label="Kondisi" value={b.kondisi} onChange={e => updateBuilding(idx, 'kondisi', e.target.value)}>
                          <option value="Sangat Baik">Sangat Baik</option>
                          <option value="Baik">Baik</option>
                          <option value="Sedang">Sedang</option>
                          <option value="Jelek">Jelek</option>
                       </Select>

                       <Select label="Konstruksi" value={b.konstruksi} onChange={e => updateBuilding(idx, 'konstruksi', e.target.value)}>
                          <option value="Beton">Beton</option>
                          <option value="Baja">Baja</option>
                          <option value="Batu Bata">Batu Bata</option>
                          <option value="Kayu">Kayu</option>
                       </Select>

                       <Select label="Atap" value={b.atap} onChange={e => updateBuilding(idx, 'atap', e.target.value)}>
                          <option value="Decrabon/Beton/Gtg Glazur">Decrabon/Beton/Gtg Glazur</option>
                          <option value="Gtg Beton/Alumunium">Gtg Beton/Alumunium</option>
                          <option value="Gtg Biasa/Sirap">Gtg Biasa/Sirap</option>
                          <option value="Asbes">Asbes</option>
                          <option value="Seng">Seng</option>
                       </Select>

                       <Select label="Dinding" value={b.dinding} onChange={e => updateBuilding(idx, 'dinding', e.target.value)}>
                          <option value="Batubata/Cenblok">Batubata/Cenblok</option>
                          <option value="Kaca/Alumunium">Kaca/Alumunium</option>
                          <option value="Beton">Beton</option>
                          <option value="Kayu">Kayu</option>
                          <option value="Seng">Seng</option>
                          <option value="Tidak Ada">Tidak Ada</option>
                       </Select>

                       <Select label="Lantai" value={b.lantai} onChange={e => updateBuilding(idx, 'lantai', e.target.value)}>
                          <option value="Keramik">Keramik</option>
                          <option value="Marmer">Marmer</option>
                          <option value="Teraso">Teraso</option>
                          <option value="Ubin PC/Papan">Ubin PC/Papan</option>
                          <option value="Semen">Semen</option>
                       </Select>

                       <Select label="Langit-langit" value={b.langit_langit} onChange={e => updateBuilding(idx, 'langit_langit', e.target.value)}>
                          <option value="Triplek/Asbes Bambu">Triplek/Asbes Bambu</option>
                          <option value="Akustik/Jati">Akustik/Jati</option>
                          <option value="Tidak Ada">Tidak Ada</option>
                       </Select>
                    </div>
                  </div>
                ))}
                
                {(form.detail_bangunan || []).length > 0 && (
                  <Button variant="outline" className="w-full h-16 border-dashed border-2 bg-white rounded-[2rem] text-blue-600 font-black uppercase tracking-widest text-[10px]" onClick={addBuilding}>
                    <Plus size={18} className="mr-2"/> Tambah Bangunan Baru
                  </Button>
                )}
              </div>
              
              <div className="p-8 bg-slate-900 text-white flex justify-between items-center px-12">
                 <div className="flex gap-10">
                    <div>
                       <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">Total Unit Bangunan</p>
                       <h4 className="text-2xl font-black">{(form.detail_bangunan || []).length} Unit</h4>
                    </div>
                    <div>
                       <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">Akumulasi Luas Keseluruhan</p>
                       <h4 className="text-2xl font-black text-blue-400">{(form.pajak_bangunan_luas || 0)} m²</h4>
                    </div>
                 </div>
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Ethana Building Engine v1.0</p>
              </div>
            </div>
          </div>
        )}
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
