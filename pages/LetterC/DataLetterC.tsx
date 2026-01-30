import { useState, useEffect } from 'react';
import { 
  Plus, MapPin, User, FolderPlus, Loader2, X, Trash2,  Search, Layers, Edit3, Camera, Image as ImageIcon
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
  const [searchTerm, setSearchTerm] = useState('');

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
      .order('nomor_c');
    if (data) setKohirList(data);
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { fetchKohir(); }, [selectedDesaId]);

  const handleDelete = async (id: string) => {
  if (confirm("Apakah Anda yakin ingin menghapus data Kohir ini? Semua rincian persil juga akan ikut terhapus.")) {
    try {
      // 1. Hapus rincian persil dulu (karena foreign key)
      await supabase.from('letter_c_persil').delete().eq('letter_c_id', id);
      
      // 2. Hapus data utama Letter C
      const { error } = await supabase.from('letter_c').delete().eq('id', id);
      
      if (error) throw error;
      
      // 3. Refresh data
      fetchKohir();
      alert("Data berhasil dihapus");
    } catch (err: any) {
      alert("Gagal menghapus: " + err.message);
      }
    }
  };

  const handleEdit = (kohir: LetterC) => {
    setSelectedKohir(kohir);
    setShowModal(true);
  };

  const filteredKecamatans = kecamatans.map(kec => ({
    ...kec,
    desas: desas.filter(d => 
      d.kecamatan_id === kec.id && d.nama.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }));

  

  return (
    <div className="flex flex-col lg:flex-row h-screen lg:h-[calc(100vh-140px)] gap-4 lg:gap-8 p-2 lg:p-4 bg-[#F8F9FA] text-zinc-900 overflow-hidden">
      {/* SIDEBAR - Scrollable horizontal on mobile */}
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

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 bg-white rounded-t-[2.5rem] lg:rounded-[2.5rem] border border-zinc-100 flex flex-col overflow-hidden shadow-sm">
        <div className="p-6 lg:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-zinc-50 gap-4">
          <div>
            <h2 className="text-2xl lg:text-3xl font-black tracking-tight">
              {selectedDesaId ? desas.find(d => d.id === selectedDesaId)?.nama : "Pilih Desa"}
            </h2>
            <p className="text-sm text-zinc-400 font-medium mt-1">Buku Pendaftaran Tanah (Letter C)</p>
          </div>
          {selectedDesaId && (
            <button onClick={() => { setSelectedKohir(null); setShowModal(true); }} className="w-full sm:w-auto bg-zinc-900 text-white px-6 lg:px-8 py-3 lg:py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 shadow-lg transition-all">
              <Plus size={18}/> Tambah Kohir
            </button>
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
                  {kohirList.map(k => (
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
        />
      )}
    </div>
  );
};

const FormTambahC = ({ selectedDesaId, editData, onClose, onSuccess }: FormTambahCProps) => {
  // --- STATE ---
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(editData?.image_url || null);
  const [form, setForm] = useState({ nomor_c: '', nama_pemilik: '', alamat_pemilik: '', image_url: '' });
  const [rows, setRows] = useState<Partial<LetterCPersil>[]>([
    { nomor_persil: '', jenis_tanah: 'Tanah Kering', klas_desa: '', luas_meter: 0, asal_usul: '' }
  ]);

  // --- STATE UNTUK CROP ---
  const [crop, setCrop] = useState<Crop>();
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
    }
  }, [editData]);

  const fetchPersils = async (letterCId: string) => {
    const { data } = await supabase.from('letter_c_persil').select('*').eq('letter_c_id', letterCId);
    if (data && data.length > 0) setRows(data);
  };

  // --- FUNGSI GENERATE HASIL CROP ---
  const getCroppedImg = (): Promise<File> => {
    return new Promise((resolve, reject) => {
      if (!imgRef || !crop) return reject("No image or crop area");
      
      const canvas = document.createElement('canvas');
      const scaleX = imgRef.naturalWidth / imgRef.width;
      const scaleY = imgRef.naturalHeight / imgRef.height;
      canvas.width = crop.width;
      canvas.height = crop.height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(
          imgRef,
          crop.x * scaleX,
          crop.y * scaleY,
          crop.width * scaleX,
          crop.height * scaleY,
          0, 0, crop.width, crop.height
        );
      }

      canvas.toBlob((blob) => {
        if (!blob) return reject("Canvas is empty");
        const file = new File([blob], "cropped_letter.png", { type: "image/png" });
        resolve(file);
      }, 'image/png');
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
    // CEK JIKA ERROR 503
      if (err.message?.includes("503") || err.message?.includes("overloaded")) {
        alert("Server AI sedang sibuk (antre). Silakan klik tombol 'Scan' lagi dalam beberapa detik.");
      } else {
        alert("Gagal membaca dokumen. Pastikan koneksi internet stabil.");
      }
    }finally {
      setIsScanning(false);
    }
  };

  const handleUpload = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `letter_c/${fileName}`;
    const { error: uploadError } = await supabase.storage.from('archives').upload(filePath, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('archives').getPublicUrl(filePath);
    return data.publicUrl;
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
        asal_usul: r.asal_usul
      }));

      await supabase.from('letter_c_persil').insert(persils);
      onSuccess();
    } catch (err: any) { alert(err.message); }
    setLoading(false);
  };

  const updateRow = (index: number, field: keyof LetterCPersil, value: any) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };


  return (
    <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-md z-[100] flex items-end lg:items-center justify-center p-0 lg:p-6 text-zinc-900">
      <div className="bg-white w-full max-w-6xl rounded-t-[2.5rem] lg:rounded-[3rem] flex flex-col h-[95vh] lg:h-auto lg:max-h-[92vh] shadow-2xl overflow-hidden shadow-black/50">
        
        {/* HEADER */}
        <div className="p-6 lg:p-8 border-b border-zinc-50 flex justify-between items-center bg-zinc-50/20 shrink-0">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
            {editData ? 'Update Kohir' : 'Entry Kohir Baru'}
          </span>
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
                            setShowCropper(true); // Buka cropper dulu
                          }
                        }} 
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <input className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:bg-white font-bold text-sm" placeholder="Nomor Kohir (C)" value={form.nomor_c} onChange={e => setForm({...form, nomor_c: e.target.value})} />
                <input className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:bg-white font-bold text-sm" placeholder="Nama Lengkap" value={form.nama_pemilik} onChange={e => setForm({...form, nama_pemilik: e.target.value})} />
                <textarea className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl outline-none focus:bg-white text-sm" placeholder="Alamat Singkat" rows={2} value={form.alamat_pemilik} onChange={e => setForm({...form, alamat_pemilik: e.target.value})} />
              </div>
            </div>

            {/* RINCIAN PERSIL */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="flex items-center gap-2 text-zinc-900 font-black text-xs uppercase tracking-widest"><Layers size={16}/> Rincian Persil</h4>
                <button onClick={() => setRows([...rows, { nomor_persil: '', jenis_tanah: 'Tanah Kering', klas_desa: '', luas_meter: 0, asal_usul: '' }])} className="text-[10px] font-black text-zinc-900 bg-zinc-100 px-5 py-2.5 rounded-xl uppercase hover:bg-zinc-200 transition-all">+ Tambah</button>
              </div>
              
              <div className="space-y-3">
                {rows.map((row, i) => (
                  <div key={i} className="p-4 bg-zinc-50/50 border border-zinc-100 rounded-2xl grid grid-cols-2 lg:flex lg:flex-nowrap gap-3 items-center relative">
                    <input className="px-3 py-3 text-xs border border-zinc-200 rounded-xl outline-none bg-white font-bold" placeholder="Persil" value={row.nomor_persil} onChange={e => updateRow(i, 'nomor_persil', e.target.value)} />
                    <select className="px-3 py-3 text-xs border border-zinc-200 rounded-xl outline-none bg-white font-bold" value={row.jenis_tanah} onChange={e => updateRow(i, 'jenis_tanah', e.target.value)}>
                      <option>Tanah Kering</option><option>Sawah</option>
                    </select>
                    <input className="px-3 py-3 text-xs border border-zinc-200 rounded-xl outline-none bg-white font-bold" placeholder="Klas" value={row.klas_desa} onChange={e => updateRow(i, 'klas_desa', e.target.value)} />
                    <input className="px-3 py-3 text-xs border border-zinc-200 rounded-xl outline-none bg-white font-bold" placeholder="Luas" type="number" value={row.luas_meter} onChange={e => updateRow(i, 'luas_meter', parseFloat(e.target.value))} />
                    <input className="col-span-2 lg:flex-1 px-4 py-3 text-xs border border-zinc-200 rounded-xl outline-none bg-white font-medium" placeholder="Asal-Usul..." value={row.asal_usul} onChange={e => updateRow(i, 'asal_usul', e.target.value)} />
                    {rows.length > 1 && (
                      <button onClick={() => setRows(rows.filter((_, idx) => idx !== i))} className="absolute lg:static top-2 right-2 p-2 text-zinc-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-6 lg:p-10 border-t border-zinc-50 bg-white flex shrink-0 justify-end gap-6 items-center">
          <button type="button" onClick={onClose} className="text-xs font-black text-zinc-400 uppercase tracking-widest hover:text-zinc-600 transition-all">Batal</button>
          <button onClick={handleSave} disabled={loading} className="w-full lg:w-auto px-12 py-4 bg-zinc-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-zinc-900/20 active:scale-95 transition-all flex justify-center items-center gap-2">
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
              <button onClick={() => setShowCropper(false)} className="flex-1 py-4 text-xs font-black uppercase text-zinc-400">Batal</button>
              <button 
                onClick={async () => {
                  const cropped = await getCroppedImg();
                  setShowCropper(false);
                  handleScanLetterC(cropped);
                }} 
                className="flex-1 py-4 bg-zinc-900 text-white rounded-2xl text-xs font-black uppercase shadow-lg shadow-zinc-200"
              >
                Proses Area Ini
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};