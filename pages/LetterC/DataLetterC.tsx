import { useState, useEffect } from 'react';
import { 
  Plus, MapPin, User, FolderPlus, Loader2, X, Trash2, Search, Layers, Edit3, Camera, ImageIcon, 
  Ban, ChevronLeft, ChevronRight, AlertCircle
} from 'lucide-react';
import { supabase } from '../../services/db'; 
import { processLetterC } from '../../services/ocr';
import { Kecamatan, Desa, LetterC, LetterCPersil } from '../../types';
import ReactCrop, { Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface FormTambahCProps {
  selectedDesaId: string;
  editData: LetterC | null;
  onClose: () => void;
  onSuccess: () => void;
  existingKohirList?: LetterC[]; // Tambahkan prop untuk daftar kohir yang ada
  currentIndex?: number; // Indeks data yang sedang diedit
  onNavigate?: (newIndex: number) => void; // Fungsi navigasi
}

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
  const [currentKohirIndex, setCurrentKohirIndex] = useState<number>(-1);
  const [searchTerm, setSearchTerm] = useState('');
  const [kohirSearch, setKohirSearch] = useState('');

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
      .order('created_at', { ascending: false })
      .order('nomor_c');
    if (data) setKohirList(data);
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { fetchKohir(); }, [selectedDesaId]);

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus data Kohir ini? Semua rincian persil juga akan ikut terhapus.")) {
      try {
        await supabase.from('letter_c_persil').delete().eq('letter_c_id', id);
        const { error } = await supabase.from('letter_c').delete().eq('id', id);
        if (error) throw error;
        fetchKohir();
        alert("Data berhasil dihapus");
      } catch (err: any) {
        alert("Gagal menghapus: " + err.message);
      }
    }
  };

  const handleEdit = (kohir: LetterC) => {
    const index = kohirList.findIndex(k => k.id === kohir.id);
    setSelectedKohir(kohir);
    setCurrentKohirIndex(index);
    setShowModal(true);
  };

  const handleNavigate = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < kohirList.length) {
      setSelectedKohir(kohirList[newIndex]);
      setCurrentKohirIndex(newIndex);
    }
  };

  const filteredKecamatans = kecamatans.map(kec => ({
    ...kec,
    desas: desas.filter(d => 
      d.kecamatan_id === kec.id && d.nama.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }));

  const filteredKohirList = kohirList.filter(k => 
    k.nomor_c.toLowerCase().includes(kohirSearch.toLowerCase()) ||
    k.nama_pemilik.toLowerCase().includes(kohirSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row h-screen lg:h-[calc(100vh-140px)] gap-4 lg:gap-8 p-2 lg:p-4 bg-[#F8F9FA] text-zinc-900 overflow-hidden font-sans">
      {/* SIDEBAR */}
      <div className="w-full lg:w-80 flex flex-col shrink-0">
        <div className="mb-4 lg:mb-6 space-y-4 px-2">
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

        <div className="flex-1 overflow-y-auto px-2 space-y-6 hidden lg:block">
          {loading ? (
            <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-zinc-300"/></div>
          ) : (
            filteredKecamatans.map(k => (
              <div key={k.id} className="group">
                <div className="flex items-center gap-3 mb-2 px-2">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{k.nama}</span>
                  <div className="h-[1px] flex-1 bg-zinc-100"></div>
                  <button onClick={async () => {
                    const n = prompt(`Tambah Desa di Kec. ${k.nama}:`);
                    if(n) { 
                      await supabase.from('desa').insert([{ nama: n, kecamatan_id: k.id }]); 
                      fetchData(); 
                    }
                  }} className="p-1.5 hover:bg-zinc-200 rounded-md text-zinc-400">
                    <Plus size={12}/>
                  </button>
                </div>
                {k.desas?.map(d => (
                  <button 
                    key={d.id} 
                    onClick={() => { setSelectedDesaId(d.id); localStorage.setItem('last_selected_desa_id', d.id); }}
                    className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-[13px] font-bold mb-1 transition-all ${
                      selectedDesaId === d.id ? 'bg-zinc-900 text-white shadow-xl' : 'text-zinc-600 hover:bg-white'
                    }`}
                  >
                    <span className="flex items-center gap-3"><MapPin size={14}/> {d.nama}</span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 bg-white rounded-t-[2.5rem] lg:rounded-[2.5rem] border border-zinc-100 flex flex-col overflow-hidden shadow-sm">
        <div className="p-6 lg:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-zinc-50 gap-4">
          <div>
            <h2 className="text-2xl lg:text-3xl font-black tracking-tight">
              {selectedDesaId ? desas.find(d => d.id === selectedDesaId)?.nama : "Pilih Desa"}
            </h2>
            <p className="text-sm text-zinc-400 font-medium mt-1">Buku Pendaftaran Tanah (Letter C)</p>
          </div>
          {selectedDesaId && (
            <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18}/>
                <input 
                  className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm outline-none focus:border-zinc-800 transition-all shadow-sm" 
                  placeholder="Cari Kohir..."
                  value={kohirSearch}
                  onChange={(e) => setKohirSearch(e.target.value)}
                />
              </div>
              <button onClick={() => { setSelectedKohir(null); setCurrentKohirIndex(-1); setShowModal(true); }} className="w-full sm:w-auto bg-zinc-900 text-white px-6 lg:px-8 py-3 lg:py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 shadow-lg transition-all">
                <Plus size={18}/> Tambah Kohir
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-x-auto lg:overflow-y-auto p-4 lg:p-8">
          {!selectedDesaId ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
              <Layers size={80} strokeWidth={0.5}/>
              <p className="font-black uppercase tracking-[0.5em] text-[10px] mt-4">Pilih wilayah kerja di sidebar</p>
            </div>
          ) : (
            <div className="min-w-[600px] lg:min-w-full">
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
                  {filteredKohirList.map((k, index) => (
                    <tr key={k.id} className="group hover:bg-zinc-50/50 transition-colors">
                      <td className="py-6 px-4 font-black text-zinc-900 text-lg">C.{k.nomor_c}</td>
                      <td className="py-6 font-bold text-zinc-700 text-[15px] uppercase">{k.nama_pemilik}</td>
                      <td className="py-6 text-zinc-400 text-sm truncate max-w-[200px]">{k.alamat_pemilik || '—'}</td>
                      <td className="py-6 text-right px-4 flex justify-end gap-2">
                        {k.image_url && (
                          <a href={k.image_url} target="_blank" rel="noreferrer" className="p-3 text-blue-500 hover:bg-blue-50 rounded-xl">
                            <ImageIcon size={18}/>
                          </a>
                        )}
                        <button onClick={() => handleEdit(k)} className="p-3 text-zinc-400 hover:text-zinc-900 hover:bg-white rounded-xl border border-transparent hover:border-zinc-100 transition-all">
                          <Edit3 size={18}/>
                        </button>
                        <button 
                          onClick={() => handleDelete(k.id)} 
                          className="p-3 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && selectedDesaId && (
        <FormTambahC 
          selectedDesaId={selectedDesaId} 
          editData={selectedKohir} 
          onClose={() => setShowModal(false)} 
          onSuccess={() => { fetchKohir(); setShowModal(false); }}
          existingKohirList={kohirList}
          currentIndex={currentKohirIndex}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
};

const FormTambahC = ({ selectedDesaId, editData, onClose, onSuccess, existingKohirList = [], currentIndex = -1, onNavigate }: FormTambahCProps) => {
  // --- STATE ---
  const [loading, setLoading] = useState(false);
  const [voidLoading, setVoidLoading] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(editData?.image_url || null);
  const [form, setForm] = useState({ nomor_c: '', nama_pemilik: '', alamat_pemilik: '', image_url: '' });
  const [rows, setRows] = useState<Partial<LetterCPersil>[]>([
    { nomor_persil: '', jenis_tanah: 'Tanah Kering', klas_desa: '', luas_meter: 0, asal_usul: '', is_void: false }
  ]);
  const [showAddPrompt, setShowAddPrompt] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // --- STATE UNTUK CROP ---
  const [crop, setCrop] = useState<Crop>({
    unit: 'px',
    x: 0,
    y: 0,
    width: 300,
    height: 300
  });
  const [imgRef, setImgRef] = useState<HTMLImageElement | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  useEffect(() => {
    if (editData) {
      setForm({
        nomor_c: editData.nomor_c,
        nama_pemilik: editData.nama_pemilik,
        alamat_pemilik: editData.alamat_pemilik || '',
        image_url: editData.image_url || ''
      });
      fetchPersils(editData.id);
    } else {
      // Reset form untuk data baru
      setForm({ nomor_c: '', nama_pemilik: '', alamat_pemilik: '', image_url: '' });
      setRows([{ nomor_persil: '', jenis_tanah: 'Tanah Kering', klas_desa: '', luas_meter: 0, asal_usul: '', is_void: false }]);
      setPreviewUrl(null);
      setImageFile(null);
    }
    setIsDirty(false);
  }, [editData]);

  // Deteksi perubahan form
  useEffect(() => {
    if (editData) {
      const isFormChanged = 
        form.nomor_c !== editData.nomor_c ||
        form.nama_pemilik !== editData.nama_pemilik ||
        form.alamat_pemilik !== (editData.alamat_pemilik || '') ||
        imageFile !== null;
      
      setIsDirty(isFormChanged);
    } else {
      const isFormFilled = 
        form.nomor_c !== '' || 
        form.nama_pemilik !== '' || 
        form.alamat_pemilik !== '' ||
        rows.some(r => r.nomor_persil !== '' && r.nomor_persil !== undefined) ||
        imageFile !== null;
      
      setIsDirty(isFormFilled);
    }
  }, [form, rows, imageFile, editData]);

  const fetchPersils = async (letterCId: string) => {
    const { data } = await supabase
      .from('letter_c_persil')
      .select('*')
      .eq('letter_c_id', letterCId)
      .order('created_at');
    if (data && data.length > 0) setRows(data);
  };

  // --- FUNGSI GENERATE HASIL CROP ---
  const getCroppedImg = (): Promise<File> => {
    return new Promise((resolve, reject) => {
      if (!imgRef || !crop) {
        reject("Image atau crop belum siap");
        return;
      }

      const width = Math.floor(crop.width ?? 0);
      const height = Math.floor(crop.height ?? 0);

      if (!width || !height) {
        reject("Area crop tidak valid");
        return;
      }

      const canvas = document.createElement('canvas');
      const scaleX = imgRef.naturalWidth / imgRef.width;
      const scaleY = imgRef.naturalHeight / imgRef.height;

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject("Canvas context gagal dibuat");
        return;
      }

      ctx.drawImage(
        imgRef,
        crop.x * scaleX,
        crop.y * scaleY,
        width * scaleX,
        height * scaleY,
        0,
        0,
        width,
        height
      );

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size === 0) {
            reject("Hasil crop kosong");
            return;
          }

          const file = new File([blob], `cropped_${Date.now()}.png`, {
            type: "image/png"
          });

          resolve(file);
        },
        "image/png",
        1
      );
    });
  };

  const handleScanLetterC = async (fileToScan: File) => {
    if (!fileToScan) return;
    setIsScanning(true);
    try {
      const data = await processLetterC(fileToScan);
      setForm(prev => ({
        ...prev,
        nomor_c: data.nomor_c || prev.nomor_c,
        nama_pemilik: data.nama_pemilik || prev.nama_pemilik,
        alamat_pemilik: data.alamat_pemilik || prev.alamat_pemilik
      }));
      if (data.persils && data.persils.length > 0) setRows(data.persils);
    } catch (err: any) {
      if (err.message?.includes("503") || err.message?.includes("overloaded")) {
        alert("Server AI sedang sibuk (antre). Silakan klik tombol 'Scan' lagi dalam beberapa detik.");
      } else {
        alert("Gagal membaca dokumen. Pastikan koneksi internet stabil.");
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleUpload = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `letter_c/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from('archives')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('archives').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleToggleVoid = async (persilId: string, currentVoidStatus: boolean) => {
    if (!confirm(`Apakah Anda yakin ingin ${currentVoidStatus ? 'mengaktifkan kembali' : 'mencoret'} persil ini?`)) return;
    
    setVoidLoading(persilId);
    try {
      const { error } = await supabase
        .from('letter_c_persil')
        .update({ is_void: !currentVoidStatus })
        .eq('id', persilId);
      
      if (error) throw error;
      
      // Update local state
      setRows(rows.map(row => 
        row.id === persilId ? { ...row, is_void: !currentVoidStatus } : row
      ));
    } catch (err: any) {
      alert("Gagal mengubah status: " + err.message);
    } finally {
      setVoidLoading(null);
    }
  };

  const handleSave = async () => {
    if (!form.nomor_c || !form.nama_pemilik) return;
    setLoading(true);
    try {
      let finalImageUrl = form.image_url;
      if (imageFile) finalImageUrl = await handleUpload(imageFile);

      let letterCId = '';
      const payload = { ...form, image_url: finalImageUrl };

      if (editData) {
        await supabase.from('letter_c').update(payload).eq('id', editData.id);
        letterCId = editData.id;
        await supabase.from('letter_c_persil').delete().eq('letter_c_id', letterCId);
      } else {
        const { data: kohir, error: e1 } = await supabase.from('letter_c').insert([{ desa_id: selectedDesaId, ...payload }]).select().single();
        if (e1) throw e1;
        letterCId = kohir.id;
      }

      const persils = rows.map(r => ({ 
        letter_c_id: letterCId, 
        nomor_persil: r.nomor_persil,
        jenis_tanah: r.jenis_tanah,
        klas_desa: r.klas_desa,
        luas_meter: r.luas_meter || 0,
        asal_usul: r.asal_usul,
        is_void: false
      }));

      await supabase.from('letter_c_persil').insert(persils);
      setIsDirty(false);
      onSuccess();
    } catch (err: any) { 
      alert(err.message); 
    }
    setLoading(false);
  };

  const updateRow = (index: number, field: keyof LetterCPersil, value: any) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const handleNavigateWithCheck = (direction: 'prev' | 'next') => {
  // Untuk data terbaru di paling atas (index 0):
  // - Prev (panah kiri) = ke data yang lebih baru (index lebih kecil)
  // - Next (panah kanan) = ke data yang lebih lama (index lebih besar)
  const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
  
  if (newIndex < 0) {
    // Jika di awal daftar dan prev, tampilkan prompt tambah data baru di awal?
    // Atau bisa juga kasih notifikasi sudah di data terbaru
    alert('Anda sudah berada di data terbaru');
    return;
  }
  
  if (newIndex >= existingKohirList.length) {
    // Jika di akhir daftar dan next, tampilkan prompt tambah data baru
    setShowAddPrompt(true);
    return;
  }

  if (isDirty) {
    if (confirm('Ada perubahan yang belum disimpan. Apakah Anda yakin ingin meninggalkan halaman ini?')) {
      onNavigate?.(newIndex);
    }
  } else {
    onNavigate?.(newIndex);
  }
};
  const handleAddNewFromPrompt = () => {
    setShowAddPrompt(false);
    onClose(); // Tutup modal saat ini
    // Trigger tambah data baru (akan membuka modal baru dengan form kosong)
    setTimeout(() => {
      // Ini akan memicu pembukaan modal baru dengan form kosong
      // Kita perlu mengkomunikasikan ke parent untuk membuka modal dengan editData = null
      // Untuk sementara, kita bisa menggunakan event custom atau props callback
      if (onNavigate) {
        // Reset ke form kosong dengan memanggil onNavigate dengan index -1
        // Tapi karena onNavigate hanya untuk navigasi antar data yang ada, kita perlu cara lain
        // Alternatif: buka modal baru dengan editData = null
        window.dispatchEvent(new CustomEvent('open-new-letter-c'));
      }
    }, 100);
  };

  return (
    <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-md z-[100] flex items-end lg:items-center justify-center p-0 lg:p-6 text-zinc-900">
      <div className="bg-white w-full max-w-6xl rounded-t-[2.5rem] lg:rounded-[3rem] flex flex-col h-[95vh] lg:h-auto lg:max-h-[92vh] shadow-2xl overflow-hidden shadow-black/50">
        
        {/* HEADER */}
        <div className="p-6 lg:p-8 border-b border-zinc-50 flex justify-between items-center bg-zinc-50/20 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              {editData ? 'Update Kohir' : 'Entry Kohir Baru'}
            </span>
            {editData && existingKohirList.length > 0 && (
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleNavigateWithCheck('prev')}
                  disabled={currentIndex <= 0}
                  className={`p-2 rounded-xl transition-all ${
                    currentIndex <= 0 
                      ? 'text-zinc-200 cursor-not-allowed' 
                      : 'text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-xs font-bold text-zinc-600">
                  {currentIndex + 1} / {existingKohirList.length}
                </span>
                <button
                  onClick={() => handleNavigateWithCheck('next')}
                  disabled={currentIndex >= existingKohirList.length - 1}
                  className={`p-2 rounded-xl transition-all ${
                    currentIndex >= existingKohirList.length - 1
                      ? 'text-zinc-200 cursor-not-allowed'
                      : 'text-zinc-600 hover:bg-zinc-100'
                  }`}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-3 hover:bg-zinc-100 rounded-full text-zinc-400"><X/></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* IDENTITAS */}
            <div className="lg:col-span-4 space-y-6">
              <h4 className="flex items-center gap-2 text-zinc-900 font-black text-xs uppercase tracking-widest">
                <User size={16}/> Identitas Pemilik
              </h4>
              
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Foto Arsip Letter C</label>
                <div className="relative group">
                  {previewUrl ? (
                    <div className="relative h-44 w-full rounded-2xl overflow-hidden border-2 border-zinc-100 shadow-sm">
                      {isScanning && (
                        <div className="absolute inset-0 z-10 bg-zinc-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                          <Loader2 className="animate-spin mb-2" size={24}/>
                          <span className="text-[9px] font-black uppercase tracking-tighter">Menganalisis...</span>
                        </div>
                      )}
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => { setPreviewUrl(null); setImageFile(null); setForm({...form, image_url: ''})}} 
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-20"
                      >
                        <X size={14}/>
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-44 w-full border-2 border-dashed border-zinc-200 rounded-2xl cursor-pointer hover:bg-zinc-50 transition-all relative overflow-hidden">
                      <Camera className="text-zinc-300 mb-2" size={32}/>
                      <span className="text-[10px] font-bold text-zinc-400 text-center px-4">Klik untuk ambil foto / upload</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setImageFile(file); 
                            setPreviewUrl(URL.createObjectURL(file));
                            setShowCropper(true);
                          }
                        }} 
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <input 
                  className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:bg-white font-bold text-sm text-zinc-900 placeholder:text-zinc-400" 
                  placeholder="Nomor Kohir (C)" 
                  value={form.nomor_c} 
                  onChange={e => setForm({...form, nomor_c: e.target.value})}
                />
                <input 
                  className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:bg-white font-bold text-sm text-zinc-900 placeholder:text-zinc-400" 
                  placeholder="Nama Lengkap" 
                  value={form.nama_pemilik} 
                  onChange={e => setForm({...form, nama_pemilik: e.target.value})}
                />
                <textarea 
                  className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:bg-white text-sm text-zinc-900 placeholder:text-zinc-400" 
                  placeholder="Alamat Singkat" 
                  rows={3} 
                  value={form.alamat_pemilik} 
                  onChange={e => setForm({...form, alamat_pemilik: e.target.value})}
                />
              </div>
            </div>

            {/* RINCIAN PERSIL */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="flex items-center gap-2 text-zinc-900 font-black text-xs uppercase tracking-widest">
                  <Layers size={16}/> Rincian Persil
                </h4>
                <button 
                  onClick={() => setRows([...rows, { nomor_persil: '', jenis_tanah: 'Tanah Kering', klas_desa: '', luas_meter: 0, asal_usul: '', is_void: false }])} 
                  className="text-[10px] font-black text-zinc-900 bg-zinc-100 px-5 py-2.5 rounded-xl uppercase hover:bg-zinc-200 transition-all"
                >
                  + Tambah
                </button>
              </div>
              
              {/* CONTAINER LIST PERSIL */}
              <div className="mt-8 space-y-4">
                {/* HEADER TABEL */}
                <div className="hidden lg:flex px-2 pb-2 gap-3 items-center border-b border-zinc-200">
                  <div className="w-[12%]"><label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">No. Persil</label></div>
                  <div className="w-[18%]"><label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Jenis</label></div>
                  <div className="w-[10%] text-center"><label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Klas</label></div>
                  <div className="w-[12%]"><label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Luas (M²)</label></div>
                  <div className="flex-1"><label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Asal-Usul / Keterangan</label></div>
                  {rows.length > 1 && <div className="w-20"></div>}
                </div>

                <div className="space-y-3">
                  {rows.map((row, i) => {
                    const isVoid = row.is_void || false;
                    const hasId = !!row.id;
                    
                    return (
                      <div key={i} className={`group p-2 lg:p-0 flex flex-wrap lg:flex-nowrap gap-3 items-center relative transition-all ${
                        isVoid ? 'opacity-50' : ''
                      }`}>
                        
                        {/* Nomor Persil */}
                        <div className="w-[48%] lg:w-[12%]">
                          <input 
                            className={`w-full px-4 py-3 text-xs border rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 bg-white font-bold transition-all text-zinc-900 ${
                              isVoid ? 'border-zinc-200 line-through text-zinc-400' : 'border-zinc-200'
                            }`} 
                            placeholder="Nomor Persil" 
                            value={row.nomor_persil} 
                            onChange={e => updateRow(i, 'nomor_persil', e.target.value)}
                            disabled={isVoid} 
                          />
                        </div>

                        {/* Jenis Tanah */}
                        <div className="w-[48%] lg:w-[18%] relative">
                          <select 
                            className={`w-full px-4 py-3 text-xs border rounded-xl outline-none focus:border-emerald-500 bg-white font-bold appearance-none cursor-pointer ${
                              isVoid ? 'border-zinc-200 line-through text-zinc-400' : 'border-zinc-200 text-zinc-900'
                            }`} 
                            value={row.jenis_tanah} 
                            onChange={e => updateRow(i, 'jenis_tanah', e.target.value)}
                            disabled={isVoid}
                          >
                            <option value="Tanah Kering">Tanah Kering</option>
                            <option value="Sawah">Sawah</option>
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M19 9l-7 7-7-7"/></svg>
                          </div>
                        </div>

                        {/* Klasifikasi */}
                        <div className="w-[30%] lg:w-[10%]">
                          <input 
                            className={`w-full px-4 py-3 text-xs border rounded-xl outline-none focus:border-emerald-500 bg-white font-bold text-center uppercase ${
                              isVoid ? 'border-zinc-200 line-through text-zinc-400' : 'border-zinc-200 text-zinc-900'
                            }`} 
                            placeholder="Klas" 
                            value={row.klas_desa} 
                            onChange={e => updateRow(i, 'klas_desa', e.target.value)}
                            disabled={isVoid}
                          />
                        </div>

                        {/* Luas */}
                        <div className="w-[30%] lg:w-[12%]">
                          <input 
                            className={`w-full px-4 py-3 text-xs border rounded-xl outline-none focus:border-emerald-500 bg-white font-bold ${
                              isVoid ? 'border-zinc-200 line-through text-zinc-400' : 'border-zinc-200 text-zinc-900'
                            }`} 
                            placeholder="0" 
                            type="number" 
                            value={row.luas_meter === 0 ? '' : row.luas_meter} 
                            onChange={e => {
                              const val = e.target.value;
                              updateRow(i, 'luas_meter', val === '' ? 0 : parseFloat(val));
                            }}
                            disabled={isVoid}
                          />
                        </div>

                        {/* Asal Usul */}
                        <div className="w-full lg:flex-1">
                          <textarea 
                            className={`w-full px-4 py-3 text-xs border rounded-xl outline-none focus:border-emerald-500 bg-white font-medium min-h-[50px] resize-y ${
                              isVoid ? 'border-zinc-200 line-through text-zinc-400' : 'border-zinc-200 text-zinc-900'
                            }`} 
                            placeholder="Asal-Usul / Keterangan Lengkap..." 
                            value={row.asal_usul} 
                            onChange={e => updateRow(i, 'asal_usul', e.target.value)}
                            disabled={isVoid}
                          />
                        </div>

                        {/* BUTTON CORE */}
                        {hasId && (
                          <button 
                            onClick={() => handleToggleVoid(row.id!, isVoid)}
                            disabled={voidLoading === row.id}
                            className={`p-2 rounded-xl transition-all ${
                              isVoid 
                                ? 'text-emerald-500 hover:bg-emerald-50' 
                                : 'text-zinc-300 hover:text-amber-500 hover:bg-amber-50'
                            }`}
                            title={isVoid ? 'Aktifkan kembali' : 'Coret persil (tidak berlaku)'}
                          >
                            {voidLoading === row.id ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Ban size={18} />
                            )}
                          </button>
                        )}

                        {/* Tombol Hapus */}
                        {rows.length > 1 && !isVoid && (
                          <button 
                            onClick={() => setRows(rows.filter((_, idx) => idx !== i))} 
                            className="p-2 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                          >
                            <Trash2 size={18}/>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-6 lg:p-10 border-t border-zinc-50 bg-white flex shrink-0 justify-end gap-6 items-center">
          <button 
            type="button" 
            onClick={onClose} 
            className="text-xs font-black text-zinc-400 uppercase tracking-widest hover:text-zinc-600 transition-all"
          >
            Batal
          </button>
          <button 
            onClick={handleSave} 
            disabled={loading} 
            className="w-full lg:w-auto px-12 py-4 bg-zinc-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-zinc-900/20 active:scale-95 transition-all flex justify-center items-center gap-2 hover:bg-zinc-800"
          >
            {loading ? <Loader2 className="animate-spin" size={18}/> : editData ? 'Update Kohir' : 'Simpan Data'}
          </button>
        </div>
      </div>

      {/* MODAL CROPPER */}
      {showCropper && previewUrl && (
        <div className="fixed inset-0 z-[110] bg-zinc-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="bg-white p-6 lg:p-10 rounded-[2.5rem] max-w-3xl w-full shadow-2xl shadow-black">
            <h3 className="text-xs font-black uppercase tracking-widest mb-6 text-center text-zinc-400">Sesuaikan Area Scan AI</h3>
            <div className="max-h-[50vh] overflow-auto mb-8 bg-zinc-50 rounded-2xl border flex justify-center">
              <ReactCrop crop={crop} onChange={c => setCrop(c)}>
                <img src={previewUrl} onLoad={(e) => setImgRef(e.currentTarget)} className="max-w-full h-auto" alt="To crop" />
              </ReactCrop>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowCropper(false)} 
                className="flex-1 py-4 text-xs font-black uppercase text-zinc-400 hover:text-zinc-600 transition-all"
              >
                Batal
              </button>
              <button 
                onClick={async () => {
                  try {
                    const cropped = await getCroppedImg();
                    setImageFile(cropped);
                    setPreviewUrl(URL.createObjectURL(cropped));
                    setShowCropper(false);
                    handleScanLetterC(cropped);
                  } catch (err: any) {
                    alert(err);
                  }
                }} 
                className="flex-1 py-4 bg-zinc-900 text-white rounded-2xl text-xs font-black uppercase shadow-lg shadow-zinc-200 hover:bg-zinc-800 transition-all"
              >
                Proses Area Ini
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PROMPT TAMBAH DATA BARU */}
      {showAddPrompt && (
        <div className="fixed inset-0 z-[120] bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] max-w-md w-full p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6 text-amber-600">
              <AlertCircle size={24} />
              <h3 className="text-sm font-black uppercase tracking-widest">Tambah Data Baru?</h3>
            </div>
            <p className="text-zinc-600 mb-8 text-sm">
              Anda sudah berada di akhir daftar kohir. Apakah Anda ingin menambah data kohir baru?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowAddPrompt(false)}
                className="flex-1 py-4 text-xs font-black uppercase text-zinc-400 hover:text-zinc-600 transition-all border border-zinc-200 rounded-2xl"
              >
                Kembali
              </button>
              <button
                onClick={handleAddNewFromPrompt}
                className="flex-1 py-4 bg-zinc-900 text-white rounded-2xl text-xs font-black uppercase shadow-lg hover:bg-zinc-800 transition-all"
              >
                Tambah Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};