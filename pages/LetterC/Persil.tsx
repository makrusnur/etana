import { useState, useEffect } from 'react';
import { 
  MapPin, Loader2, Search, Layers, ChevronRight, Hash, Building2, Eye, EyeOff, Menu, X, ChevronDown,
  FileText, Download
} from 'lucide-react';
import { supabase } from '../../services/db';
import { Kecamatan, Desa, LetterCPersil } from '../../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PersilWithOwner extends LetterCPersil {
  letter_c: {
    nomor_c: string;
    nama_pemilik: string;
    desa_id: string;
  } | null;
}

export const Persil = () => {
  // --- States ---
  const [loading, setLoading] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);
  const [kecamatans, setKecamatans] = useState<Kecamatan[]>([]);
  const [desas, setDesas] = useState<Desa[]>([]);
  const [persilList, setPersilList] = useState<PersilWithOwner[]>([]);
  const [selectedDesaId, setSelectedDesaId] = useState<string | null>(
    localStorage.getItem('last_selected_desa_id') || null
  );
  const [error, setError] = useState<string | null>(null);
  
  const [searchDesa, setSearchDesa] = useState(''); 
  const [searchTerm, setSearchTerm] = useState(''); 
  const [filterJenis, setFilterJenis] = useState('Semua');
  const [showVoid, setShowVoid] = useState(false);
  const [showDesaModal, setShowDesaModal] = useState(false);

  // --- 1. Fetch Data Wilayah ---
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const { data: kec } = await supabase.from('kecamatan').select('*').order('nama');
        const { data: des } = await supabase.from('desa').select('*').order('nama');
        if (kec) setKecamatans(kec);
        if (des) setDesas(des);
      } catch (err: any) {
        console.error("Error fetching regions:", err.message);
        setError("Gagal memuat data wilayah");
      }
    };
    fetchRegions();
  }, []);

  // --- 2. Fetch Data Persil ---
  useEffect(() => {
    const fetchPersils = async () => {
      if (!selectedDesaId) {
        setPersilList([]);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('letter_c_persil')
          .select(`
            *,
            letter_c:letter_c_id!inner (
              nomor_c,
              nama_pemilik,
              desa_id
            )
          `)
          .eq('letter_c.desa_id', selectedDesaId);

        if (error) throw error;

        if (data && data.length > 0) {
          const normalized = data.map((item: any) => ({
            ...item,
            letter_c: Array.isArray(item.letter_c) ? item.letter_c[0] : item.letter_c
          }));
          
          // Sorting: pertama berdasarkan nomor_persil, lalu berdasarkan nomor_c
          const sorted = normalized.sort((a, b) => {
            // Sort by nomor_persil (ascending)
            const persilA = parseInt(a.nomor_persil) || 0;
            const persilB = parseInt(b.nomor_persil) || 0;
            if (persilA !== persilB) return persilA - persilB;
            
            // If same nomor_persil, sort by nomor_c (ascending)
            const kohirA = parseInt(a.letter_c?.nomor_c) || 0;
            const kohirB = parseInt(b.letter_c?.nomor_c) || 0;
            return kohirA - kohirB;
          });
          
          setPersilList(sorted);
        } else {
          setPersilList([]);
        }

      } catch (err: any) {
        console.error("Error fetching data:", err.message);
        setError(`Gagal memuat data: ${err.message}`);
        setPersilList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPersils();
  }, [selectedDesaId]);

  // --- 3. Filter Logic ---
  const filteredKecamatans = kecamatans
    .map(kec => ({
      ...kec,
      desas: desas.filter(d => 
        d.kecamatan_id === kec.id && 
        d.nama.toLowerCase().includes(searchDesa.toLowerCase())
      )
    }))
    .filter(kec => kec.desas.length > 0);

  // Filter berdasarkan nomor persil (exact match)
  const filteredPersils = persilList.filter(p => {
    const noPersil = String(p.nomor_persil || "").trim();
    const cari = searchTerm.trim();
    
    const matchesSearch = cari === '' ? true : noPersil === cari;
    const matchesFilter = filterJenis === 'Semua' || p.jenis_tanah === filterJenis;
    const matchesVoid = showVoid ? true : !p.is_void;
    
    return matchesSearch && matchesFilter && matchesVoid;
  });

  const selectedDesa = desas.find(d => d.id === selectedDesaId);
  const selectedKecamatan = kecamatans.find(k => k.id === selectedDesa?.kecamatan_id);

  // --- 4. Fungsi Print PDF dengan Page Number ---
  // --- 4. Fungsi Print PDF dengan Page Number (Diperbaiki) ---
// --- 4. Fungsi Print PDF dengan Page Number (FIXED) ---
// --- 4. Fungsi Print PDF dengan Page Number (FINAL FIX) ---
const handlePrintPDF = async () => {
  if (filteredPersils.length === 0) {
    alert('Tidak ada data persil untuk dicetak');
    return;
  }

  try {
    setPrintLoading(true);
    
    const desa = desas.find(d => d.id === selectedDesaId);
    const kecamatan = kecamatans.find(k => k.id === desa?.kecamatan_id);
    
    if (!desa || !kecamatan) {
      alert("Data desa tidak ditemukan");
      return;
    }

    // Data tabel
    const tableData = filteredPersils.map((p, index) => [
      index + 1,
      p.nomor_persil || '-',
      p.letter_c?.nomor_c || '-',
      p.letter_c?.nama_pemilik || '-',
      p.jenis_tanah || '-',
      p.klas_desa || '-',
      (p.luas_meter || 0).toLocaleString('id-ID'),
      p.asal_usul || '-',
      p.is_void ? 'DICORET' : 'AKTIF'
    ]);
    
    // Buat dokumen PDF
    const finalDoc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    // Variabel untuk tracking
    let totalPages = 0;
    let isFirstPage = true;
    
    // Hitung total halaman terlebih dahulu
    const tempDoc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    autoTable(tempDoc, {
      head: [['No.', 'No. Persil', 'No. Kohir', 'Nama Pemilik', 'Jenis', 'Klas', 'Luas (m²)', 'Keterangan', 'Status']],
      body: tableData,
      startY: 65,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 20 },
        2: { cellWidth: 20 },
        3: { cellWidth: 40 },
        4: { cellWidth: 20 },
        5: { cellWidth: 15 },
        6: { cellWidth: 20 },
        7: { cellWidth: 30 },
        8: { cellWidth: 15 }
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250]
      },
      margin: { top: 65, bottom: 20 }
    });
    
    totalPages = (tempDoc as any).lastAutoTable?.pageCount || 1;
    
    // ========== HEADER HALAMAN PERTAMA ==========
    // Header halaman pertama (kop surat lengkap)
    finalDoc.setFontSize(18);
    finalDoc.setFont('helvetica', 'bold');
    finalDoc.text('DAFTAR PERSIL', finalDoc.internal.pageSize.width / 2, 15, { align: 'center' });
    
    finalDoc.setFontSize(12);
    finalDoc.setFont('helvetica', 'normal');
    finalDoc.text(`BUKU LETTER C DESA ${desa.nama.toUpperCase()}`, finalDoc.internal.pageSize.width / 2, 22, { align: 'center' });
    
    // Garis pemisah
    finalDoc.setLineWidth(0.5);
    finalDoc.line(10, 27, finalDoc.internal.pageSize.width - 10, 27);
    
    // Info desa
    finalDoc.setFontSize(10);
    finalDoc.setFont('helvetica', 'bold');
    finalDoc.text('Desa:', 15, 35);
    finalDoc.text('Kecamatan:', 15, 40);
    finalDoc.text('Kabupaten:', 15, 45);
    finalDoc.text('Provinsi:', 15, 50);
    finalDoc.text('Tanggal Cetak:', 15, 55);
    
    finalDoc.setFont('helvetica', 'normal');
    finalDoc.text(`: ${desa.nama}`, 45, 35);
    finalDoc.text(`: ${kecamatan.nama}`, 45, 40);
    finalDoc.text(`: PASURUAN`, 45, 45);
    finalDoc.text(`: JAWA TIMUR`, 45, 50);
    finalDoc.text(`: ${new Date().toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })}`, 45, 55);
    
    // Fungsi untuk menambahkan footer
    const addFooter = (doc: jsPDF, pageNum: number) => {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const pageNumberText = `Halaman ${pageNum}`;
      doc.text(pageNumberText, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10, { align: 'right' });
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      const dateText = `Dicetak: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}`;
      doc.text(dateText, 10, doc.internal.pageSize.height - 10);
    };
    
    // Generate tabel dengan page numbering
    autoTable(finalDoc, {
      head: [['No.', 'No. Persil', 'No. Kohir', 'Nama Pemilik', 'Jenis', 'Klas', 'Luas (m²)', 'Keterangan', 'Status']],
      body: tableData,
      startY: 65, // Start Y untuk halaman pertama
      styles: {
        fontSize: 8,
        cellPadding: 2,
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 20 },
        2: { cellWidth: 20 },
        3: { cellWidth: 40 },
        4: { cellWidth: 20 },
        5: { cellWidth: 15 },
        6: { cellWidth: 20 },
        7: { cellWidth: 30 },
        8: { cellWidth: 15 }
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250]
      },
      margin: { top: 20, bottom: 20 }, // Margin top lebih kecil untuk halaman selanjutnya
      didDrawPage: (data) => {
        const pageNum = data.pageNumber;
        
        if (pageNum === 1) {
          // Halaman pertama: hanya footer
          addFooter(finalDoc, pageNum);
        } else {
          // Halaman selanjutnya: atur ulang posisi Y untuk header sederhana
          // PENTING: Kita perlu menambahkan header sederhana di awal halaman
          // dan menyesuaikan posisi tabel
          
          // Pindah ke koordinat yang tepat untuk header sederhana
          finalDoc.setFontSize(8);
          finalDoc.setFont('helvetica', 'italic');
          finalDoc.text(`BUKU LETTER C DESA ${desa.nama.toUpperCase()} (Lanjutan)`, finalDoc.internal.pageSize.width / 2, 10, { align: 'center' });
          finalDoc.setLineWidth(0.3);
          finalDoc.line(10, 12, finalDoc.internal.pageSize.width - 10, 12);
          
          // Footer
          addFooter(finalDoc, pageNum);
          
          // CATATAN: autoTable secara otomatis akan menangani posisi Y
          // untuk halaman selanjutnya, jadi tidak perlu mengatur ulang
        }
      }
    });
    
    // Tambahkan total data di halaman terakhir
    const finalY = (finalDoc as any).lastAutoTable?.finalY || 200;
    finalDoc.setFontSize(9);
    finalDoc.setFont('helvetica', 'bold');
    finalDoc.text(`Total Data: ${filteredPersils.length} Persil`, finalDoc.internal.pageSize.width - 20, finalY + 10, { align: 'right' });
    
    finalDoc.setFont('helvetica', 'italic');
    finalDoc.text('Dokumen ini dicetak secara sistem', finalDoc.internal.pageSize.width / 2, finalY + 20, { align: 'center' });
    
    // Download PDF
    finalDoc.save(`DAFTAR_PERSIL_${desa.nama}_${new Date().getTime()}.pdf`);

  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Gagal mencetak PDF');
  } finally {
    setPrintLoading(false);
  }
};
  // Mobile Modal Pilih Desa
  const DesaModal = () => (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-end lg:items-center justify-center" onClick={() => setShowDesaModal(false)}>
      <div className="bg-white w-full max-w-lg rounded-t-2xl lg:rounded-2xl max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0">
          <h3 className="font-bold text-lg">Pilih Desa</h3>
          <button onClick={() => setShowDesaModal(false)} className="p-2 hover:bg-zinc-100 rounded-full">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18}/>
            <input 
              className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm" 
              placeholder="Cari desa..."
              value={searchDesa}
              onChange={(e) => setSearchDesa(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        
        <div className="overflow-y-auto p-4 max-h-[60vh]">
          {filteredKecamatans.length === 0 ? (
            <div className="p-4 text-center text-zinc-400 text-sm">Tidak ada kecamatan</div>
          ) : (
            filteredKecamatans.map(k => (
              <div key={k.id} className="mb-6">
                <h4 className="text-xs font-bold text-zinc-500 mb-2 px-2">{k.nama}</h4>
                <div className="space-y-1">
                  {k.desas.map(d => (
                    <button
                      key={d.id}
                      onClick={() => {
                        setSelectedDesaId(d.id);
                        localStorage.setItem('last_selected_desa_id', d.id);
                        setShowDesaModal(false);
                        setSearchDesa('');
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center justify-between ${
                        selectedDesaId === d.id 
                          ? 'bg-zinc-900 text-white' 
                          : 'hover:bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <MapPin size={16} className={selectedDesaId === d.id ? 'text-white' : 'text-zinc-400'} />
                        {d.nama}
                      </span>
                      {selectedDesaId === d.id && (
                        <span className="text-xs bg-white text-zinc-900 px-2 py-1 rounded-full">Dipilih</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-screen lg:h-[calc(100vh-140px)] gap-4 lg:gap-8 p-2 lg:p-4 bg-[#F8F9FA] text-zinc-900 font-sans overflow-hidden">
      
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-3 bg-white border-b border-zinc-200 mb-2 rounded-xl shadow-sm">
        <button
          onClick={() => setShowDesaModal(true)}
          className="p-2 hover:bg-zinc-100 rounded-lg"
        >
          <Menu size={24} />
        </button>
        <div className="flex-1 mx-2 text-center">
          <h2 className="font-bold text-lg truncate">
            {selectedDesa ? selectedDesa.nama : "Pilih Desa"}
          </h2>
        </div>
      </div>

      {/* Mobile Modal */}
      {showDesaModal && <DesaModal />}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block lg:w-80 flex-col shrink-0">
        <div className="mb-4 lg:mb-6 space-y-4 px-2">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Wilayah Kerja</h3>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16}/>
            <input 
              className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm outline-none focus:border-zinc-800 transition-all shadow-sm" 
              placeholder="Cari Desa..."
              value={searchDesa}
              onChange={(e) => setSearchDesa(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-6">
          {filteredKecamatans.map(k => (
            <div key={k.id} className="space-y-1">
              <div className="flex items-center gap-2 px-2 mb-2">
                <Building2 size={12} className="text-zinc-400"/>
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{k.nama}</span>
              </div>
              {k.desas.map(d => (
                <button 
                  key={d.id} 
                  onClick={() => { 
                    setSelectedDesaId(d.id); 
                    localStorage.setItem('last_selected_desa_id', d.id);
                    setError(null);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-bold transition-all ${
                    selectedDesaId === d.id ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-500 hover:bg-white'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <MapPin size={14} className={selectedDesaId === d.id ? 'text-white' : 'text-zinc-300'}/> 
                    {d.nama}
                  </span>
                  {selectedDesaId === d.id && <ChevronRight size={14}/>}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 bg-white rounded-t-[2.5rem] lg:rounded-[2.5rem] border border-zinc-100 flex flex-col overflow-hidden shadow-sm">
        
        {/* Header */}
        <div className="p-4 lg:p-8 border-b border-zinc-50 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
          <div>
            <h2 className="text-2xl lg:text-3xl font-black tracking-tight">
              {selectedDesa ? selectedDesa.nama : "Data Persil"}
            </h2>
            <p className="text-sm text-zinc-400 font-medium mt-1">Arsip Rincian Tanah Desa</p>
            {error && <p className="text-xs text-red-500 mt-2 font-bold">{error}</p>}
          </div>
          
          <div className="flex flex-col lg:flex-row gap-2 w-full lg:w-auto">
            {/* Tombol PDF */}
            {selectedDesaId && filteredPersils.length > 0 && (
              <button
                onClick={handlePrintPDF}
                disabled={printLoading}
                className="flex items-center justify-center gap-2 px-5 py-2 bg-red-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {printLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <FileText size={14} />
                )}
                PDF ({filteredPersils.length})
              </button>
            )}
            
            {/* Toggle Button */}
            <button
              onClick={() => setShowVoid(!showVoid)}
              className={`flex items-center justify-center gap-2 px-4 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${
                showVoid ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-100 text-zinc-400'
              }`}
            >
              {showVoid ? <Eye size={14} /> : <EyeOff size={14} />}
              {showVoid ? 'Sembunyikan Dicoret' : 'Tampilkan Dicoret'}
            </button>
            
            {/* Filter Jenis */}
            <div className="flex gap-2 bg-zinc-100 p-1.5 rounded-2xl">
              {['Semua', 'Sawah', 'Tanah Kering'].map(j => (
                <button 
                  key={j} 
                  onClick={() => setFilterJenis(j)} 
                  className={`px-5 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${
                    filterJenis === j ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'
                  }`}
                >
                  {j}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile: Ganti Desa */}
        {selectedDesaId && (
          <div className="lg:hidden p-3 border-b border-zinc-100">
            <button
              onClick={() => setShowDesaModal(true)}
              className="w-full flex items-center justify-between p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm"
            >
              <span className="flex items-center gap-2">
                <MapPin size={16} className="text-zinc-500" />
                <span className="font-medium">Ganti Desa</span>
              </span>
              <ChevronDown size={16} className="text-zinc-400" />
            </button>
          </div>
        )}

        {/* Search */}
        <div className="p-4 lg:p-8 flex-1 overflow-y-auto">
          <div className="relative mb-4 lg:mb-8">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400" size={20}/>
            <input 
              className="w-full pl-16 pr-6 py-4 lg:py-5 bg-zinc-50/50 border border-zinc-100 rounded-xl lg:rounded-[1.5rem] text-sm outline-none focus:bg-white focus:border-zinc-900 transition-all" 
              placeholder="Cari No. Persil (exact match)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-20">
              <Loader2 className="animate-spin text-zinc-300" size={40}/>
              <p className="text-xs font-black text-zinc-300 mt-4">Memuat Data...</p>
            </div>
          ) : !selectedDesaId ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
              <Layers size={80} strokeWidth={1}/>
              <p className="font-black uppercase tracking-[0.4em] text-[10px] mt-6">Pilih desa pada sidebar</p>
              <button 
                onClick={() => setShowDesaModal(true)}
                className="lg:hidden mt-4 bg-zinc-900 text-white px-6 py-3 rounded-xl text-sm font-black uppercase"
              >
                Pilih Desa
              </button>
            </div>
          ) : filteredPersils.length === 0 ? (
            <div className="text-center p-20">
              <p className="text-zinc-300 font-bold uppercase text-[10px] tracking-widest">
                {error ? 'Error memuat data' : `Tidak ada persil dengan nomor "${searchTerm}"`}
              </p>
            </div>
          ) : (
            <>
              {/* List Persil - sudah terurut */}
              <div className="space-y-2">
                {filteredPersils.map(p => {
                  const isVoid = p.is_void === true;
                  return (
                    <div key={p.id} className={`group bg-white border ${isVoid ? 'border-red-100 bg-red-50/30' : 'border-zinc-100'} rounded-xl transition-all`}>
                      <div className="p-4 lg:p-5">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                          {/* Left */}
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isVoid ? 'bg-zinc-300' : 'bg-zinc-100'}`}>
                              <Hash size={18} className="text-zinc-500" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`font-black text-xl ${isVoid ? 'line-through text-zinc-400' : 'text-zinc-900'}`}>
                                  {p.nomor_persil || '-'}
                                </span>
                                {isVoid && (
                                  <span className="text-[8px] font-black text-red-500 uppercase bg-red-100 px-1.5 py-0.5 rounded">
                                    Dicoret
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-zinc-500">
                                C.{p.letter_c?.nomor_c || '-'} • {p.letter_c?.nama_pemilik || '-'}
                              </p>
                            </div>
                          </div>

                          {/* Right */}
                          <div className="flex flex-wrap items-center gap-3 lg:gap-4">
                            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
                              p.jenis_tanah === 'Sawah' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
                            }`}>
                              {p.jenis_tanah || '-'}
                            </span>
                            <span className="text-sm font-bold text-zinc-400 bg-zinc-100 px-3 py-1.5 rounded-lg">
                              {p.klas_desa || '-'}
                            </span>
                            <span className="font-bold text-zinc-800">
                              {p.luas_meter?.toLocaleString('id-ID') || '0'} m²
                            </span>
                          </div>
                        </div>
                        
                        {p.asal_usul && (
                          <div className="mt-3 pt-3 border-t border-zinc-100">
                            <p className="text-xs text-zinc-500 italic">Keterangan: {p.asal_usul}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Info jumlah data */}
              <div className="mt-6 text-xs text-zinc-400 font-medium px-2 flex justify-between items-center">
                <span>
                  Menampilkan {filteredPersils.length} dari {persilList.length} persil
                  {!showVoid && persilList.filter(p => p.is_void).length > 0 && (
                    <span className="ml-2 text-amber-600">
                      ⚡ {persilList.filter(p => p.is_void).length} dicoret
                    </span>
                  )}
                </span>
                
                {/* Tombol PDF Mobile */}
                {filteredPersils.length > 0 && (
                  <button
                    onClick={handlePrintPDF}
                    disabled={printLoading}
                    className="lg:hidden flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl"
                  >
                    {printLoading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                    PDF
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};