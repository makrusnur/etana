// src/pages/PbbMaster.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/db';
import { 
  Building2, Plus, Trash2, Map, Loader2, 
  Upload, X, FileText, Globe, CheckCircle, File, Download,
  AlertCircle, ChevronRight, Menu, Sparkles,
  HardDrive, Image as ImageIcon, RefreshCw
} from 'lucide-react';

interface Desa {
  id: string;
  nama: string;
  kecamatan_id: string;
  dwg_url?: string;
  dwg_preview_url?: string;
  created_at?: string;
}

export const PbbMaster = () => {
  const [kecamatans, setKecamatans] = useState<any[]>([]);
  const [desas, setDesas] = useState<Desa[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDesa, setSelectedDesa] = useState<Desa | null>(null);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'kecamatan' | 'desa'>('kecamatan');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newKec, setNewKec] = useState('');
  const [newDesa, setNewDesa] = useState({ nama: '', kecId: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: k } = await supabase.from('kecamatan').select('*').order('nama');
      const { data: d } = await supabase.from('desa').select('*').order('nama');
      setKecamatans(k || []);
      setDesas(d || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addKecamatan = async () => {
    if (!newKec.trim()) return;
    await supabase.from('kecamatan').insert([{ nama: newKec.toUpperCase() }]);
    setNewKec('');
    loadData();
  };

  const addDesa = async () => {
    if (!newDesa.nama.trim() || !newDesa.kecId) return;
    await supabase.from('desa').insert([{ 
      nama: newDesa.nama.toUpperCase(), 
      kecamatan_id: newDesa.kecId 
    }]);
    setNewDesa({ nama: '', kecId: '' });
    loadData();
  };

  const deleteItem = async (table: string, id: string, nama: string) => {
    if (!confirm(`Hapus ${nama}?`)) return;
    await supabase.from(table).delete().eq('id', id);
    if (selectedDesa?.id === id) setSelectedDesa(null);
    loadData();
  };

  // ========== UPLOAD DWG DENGAN PREVIEW ==========
  const uploadDwgDesa = async (desaId: string, file: File) => {
    setUploading(true);
    setUploadProgress('Uploading DWG...');
    setUploadError('');
    setUploadSuccess(false);
    
    try {
      // 1. Upload file DWG ke storage
      const fileName = `dwg_${desaId}_${Date.now()}.dwg`;
      const filePath = `peta-desa/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('pbb-assets')
        .upload(filePath, file);
      
      if (uploadError) throw new Error(uploadError.message);
      
      const { data: urlData } = supabase.storage
        .from('pbb-assets')
        .getPublicUrl(filePath);
      
      setUploadProgress('Menyimpan data...');
      
      // 2. Simpan URL DWG ke database
      const { error: updateError } = await supabase
        .from('desa')
        .update({ dwg_url: urlData.publicUrl })
        .eq('id', desaId);
      
      if (updateError) throw new Error(updateError.message);
      
      // 3. Refresh data
      await loadData();
      
      if (selectedDesa?.id === desaId) {
        setSelectedDesa({ ...selectedDesa, dwg_url: urlData.publicUrl });
      }
      
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
      
    } catch (error: any) {
      setUploadError(error.message);
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-32">
      <div className="max-w-6xl mx-auto px-4 py-6 lg:py-10">
        
        {/* Header */}
        <div className="hidden lg:flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={18} className="text-emerald-500" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Geo Master</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Master Wilayah</h2>
            <p className="text-slate-400 text-xs mt-1">Kelola kecamatan, desa & upload peta DWG</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
            <HardDrive size={12} />
            <span>{kecamatans.length} Kecamatan • {desas.length} Desa</span>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-4 py-3 flex items-center justify-between -mx-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <h1 className="text-sm font-bold">Master Wilayah</h1>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
            <Menu size={20} />
          </button>
        </div>

        {/* Mobile Tab */}
        <div className="lg:hidden flex gap-2 mb-5 bg-slate-100 p-1 rounded-2xl">
          <button onClick={() => setActiveTab('kecamatan')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'kecamatan' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>
            🏙️ Kecamatan
          </button>
          <button onClick={() => setActiveTab('desa')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'desa' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>
            🏡 Desa
          </button>
        </div>

        {/* Grid Kecamatan & Desa */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* KECAMATAN */}
          {(activeTab === 'kecamatan' || window.innerWidth >= 1024) && (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center">
                    <Map size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Kecamatan</h3>
                    <p className="text-[10px] text-slate-400">{kecamatans.length} wilayah</p>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex gap-2">
                  <input className="flex-1 px-4 py-3 bg-slate-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nama kecamatan..." value={newKec} onChange={(e) => setNewKec(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addKecamatan()} />
                  <button onClick={addKecamatan} className="px-5 py-3 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-all"><Plus size={18} /></button>
                </div>
                <div className="space-y-2 max-h-[380px] overflow-y-auto">
                  {kecamatans.map(k => (
                    <div key={k.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                      <span className="text-sm font-medium">{k.nama}</span>
                      <button onClick={() => deleteItem('kecamatan', k.id, k.nama)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* DESA */}
          {(activeTab === 'desa' || window.innerWidth >= 1024) && (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center">
                    <Building2 size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Desa / Kelurahan</h3>
                    <p className="text-[10px] text-slate-400">{desas.length} wilayah</p>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl">
                  <select className="w-full px-4 py-3 bg-white rounded-xl text-sm" value={newDesa.kecId} onChange={(e) => setNewDesa({...newDesa, kecId: e.target.value})}>
                    <option value="">Pilih Kecamatan</option>
                    {kecamatans.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <input className="flex-1 px-4 py-3 bg-white rounded-xl text-sm" placeholder="Nama desa..." value={newDesa.nama} onChange={(e) => setNewDesa({...newDesa, nama: e.target.value})} onKeyPress={(e) => e.key === 'Enter' && addDesa()} />
                    <button onClick={addDesa} className="px-5 py-3 bg-emerald-600 text-white rounded-xl hover:bg-slate-900"><Plus size={18} /></button>
                  </div>
                </div>
                <div className="space-y-2 max-h-[380px] overflow-y-auto">
                  {desas.map(d => (
                    <div key={d.id} className={`flex justify-between items-center p-3 rounded-xl cursor-pointer transition-all ${selectedDesa?.id === d.id ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50'}`} onClick={() => setSelectedDesa(d)}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{d.nama}</span>
                          {d.dwg_url && <span className="text-[8px] px-1.5 py-0.5 bg-emerald-100 text-emerald-600 rounded-full"><CheckCircle size={8}/> DWG</span>}
                        </div>
                        <p className="text-[9px] text-slate-400">{kecamatans.find(k => k.id === d.kecamatan_id)?.nama}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); deleteItem('desa', d.id, d.nama); }} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={14}/></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* UPLOAD DWG - TAMPILAN RAPI TIDAK KEPOTONG */}
        {selectedDesa && (
          <div className="mt-8">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center">
                    <File size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Upload Peta DWG</h3>
                    <p className="text-xs text-slate-400">{selectedDesa.nama}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {/* Status File yang Sudah Ada */}
                {selectedDesa.dwg_url && (
                  <div className="mb-5 p-4 bg-white/10 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <FileText size={24} className="text-emerald-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">File DWG tersedia</p>
                        <p className="text-xs text-slate-400 truncate">{selectedDesa.dwg_url.split('/').pop()}</p>
                      </div>
                      <a href={selectedDesa.dwg_url} target="_blank" rel="noopener noreferrer" className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl">
                        <Download size={18} />
                      </a>
                    </div>
                    <p className="text-[10px] text-slate-500 text-center mt-3 pt-2 border-t border-white/10">
                      ⚠️ File DWG tidak bisa ditampilkan di browser. Download untuk melihat.
                    </p>
                  </div>
                )}
                
                {/* Upload Area */}
                <div className="border-2 border-dashed border-white/30 rounded-2xl p-8 text-center hover:border-emerald-400 transition-all">
                  <input type="file" accept=".dwg,.dxf" id="dwg-upload" className="hidden" onChange={(e) => e.target.files?.[0] && uploadDwgDesa(selectedDesa.id, e.target.files[0])} />
                  <label htmlFor="dwg-upload" className="cursor-pointer block">
                    {uploading ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="animate-spin text-emerald-400 mb-3" size={32} />
                        <p className="text-white text-sm">{uploadProgress}</p>
                      </div>
                    ) : (
                      <>
                        <Upload size={32} className="text-white/50 mx-auto mb-3" />
                        <p className="text-white font-medium mb-1">Upload file DWG / DXF</p>
                        <p className="text-xs text-slate-400">maks. 50 MB</p>
                      </>
                    )}
                  </label>
                </div>
                
                {uploadError && (
                  <div className="mt-4 p-3 bg-red-500/20 rounded-xl">
                    <p className="text-xs text-red-300">{uploadError}</p>
                  </div>
                )}
                
                {uploadSuccess && (
                  <div className="mt-4 p-3 bg-emerald-500/20 rounded-xl">
                    <p className="text-xs text-emerald-300 text-center">✅ Upload berhasil!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setMobileMenuOpen(false)}>
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">Ringkasan</h3>
                <button onClick={() => setMobileMenuOpen(false)}><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-2">KECAMATAN</p>
                  <div className="flex flex-wrap gap-2">
                    {kecamatans.map(k => <span key={k.id} className="px-3 py-1.5 bg-slate-100 rounded-full text-xs">{k.nama}</span>)}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-2">DESA</p>
                  <div className="flex flex-wrap gap-2">
                    {desas.map(d => <span key={d.id} className="px-3 py-1.5 bg-slate-100 rounded-full text-xs flex items-center gap-1">{d.nama}{d.dwg_url && <CheckCircle size={8} className="text-emerald-500" />}</span>)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PbbMaster;