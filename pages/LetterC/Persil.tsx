import { useState, useEffect } from 'react';
import { 
  MapPin, Loader2, Search, Layers, ChevronRight, Hash, Building2, Eye, EyeOff, Menu, X,
  FileText, Maximize2, Minimize2
} from 'lucide-react';
import { supabase } from '../../services/db';
import { Kecamatan, Desa, LetterCPersil } from '../../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PDFViewer } from '../../components/PDFViewer';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // PDF States
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [selectedPageNumber, setSelectedPageNumber] = useState<number | null>(null);
  const [pdfSearchKeyword, setPdfSearchKeyword] = useState<string | null>(null);
  const [isSplitView, setIsSplitView] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  
  // selectedDesa dihitung dari state
  const selectedDesa = desas.find(d => d.id === selectedDesaId);
  const selectedKecamatan = kecamatans.find(k => k.id === selectedDesa?.kecamatan_id);

  // Base URL dari env
  const pdfBaseUrl = import.meta.env.VITE_PDF_BASE_URL;
  const pdfFilename = import.meta.env.VITE_PDF_FILENAME;

  // --- Fetch Data Wilayah ---
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

  // --- Fetch Data Persil ---
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
          
          const sorted = normalized.sort((a, b) => {
            const persilA = parseInt(a.nomor_persil) || 0;
            const persilB = parseInt(b.nomor_persil) || 0;
            if (persilA !== persilB) return persilA - persilB;
            
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

  // --- Set PDF URL ketika desa dipilih ---
  useEffect(() => {
    const loadPdfUrl = async () => {
      if (!selectedDesaId) {
        setSelectedPdfUrl(null);
        return;
      }
      
      setPdfLoading(true);
      
      try {
        // Untuk desa Genengwaru, gunakan URL dari env
        if (selectedDesa?.nama?.toLowerCase().includes('genengwaru')) {
          const pdfUrl = `${pdfBaseUrl}${pdfFilename}`;
          console.log('Loading PDF from:', pdfUrl);
          
          // Test URL terlebih dahulu
          try {
            const response = await fetch(pdfUrl, { method: 'HEAD' });
            if (response.ok) {
              setSelectedPdfUrl(pdfUrl);
            } else {
              console.error('PDF not accessible, status:', response.status);
              setError('File PDF tidak dapat diakses');
              setSelectedPdfUrl(null);
            }
          } catch (err) {
            console.error('Error testing PDF URL:', err);
            setSelectedPdfUrl(pdfUrl); // Tetap set URL meskipun test gagal
          }
        } else {
          // Untuk desa lain, ambil dari database
          const { data, error } = await supabase
            .from('desa')
            .select('krawangan_url')
            .eq('id', selectedDesaId)
            .single();
          
          if (error) {
            console.error('Error fetching desa PDF URL:', error);
            setSelectedPdfUrl(null);
          } else if (data?.krawangan_url) {
            // Jika URL sudah lengkap
            if (data.krawangan_url.startsWith('http')) {
              setSelectedPdfUrl(data.krawangan_url);
            } else {
              // Jika hanya path, gabungkan dengan base URL
              setSelectedPdfUrl(`${pdfBaseUrl}${data.krawangan_url}`);
            }
          } else {
            setSelectedPdfUrl(null);
          }
        }
      } catch (err) {
        console.error('Error in loadPdfUrl:', err);
        setSelectedPdfUrl(null);
      } finally {
        setPdfLoading(false);
      }
    };
    
    loadPdfUrl();
    setSelectedPageNumber(null);
    setPdfSearchKeyword(null);
  }, [selectedDesaId, selectedDesa, pdfBaseUrl, pdfFilename]);

  // --- Filter Logic ---
  const filteredKecamatans = kecamatans
    .map(kec => ({
      ...kec,
      desas: desas.filter(d => 
        d.kecamatan_id === kec.id && 
        d.nama.toLowerCase().includes(searchDesa.toLowerCase())
      )
    }))
    .filter(kec => kec.desas.length > 0);

  const filteredPersils = persilList.filter(p => {
    const noPersil = String(p.nomor_persil || "").trim();
    const cari = searchTerm.trim();
    
    const matchesSearch = cari === '' ? true : noPersil === cari;
    const matchesFilter = filterJenis === 'Semua' || p.jenis_tanah === filterJenis;
    const matchesVoid = showVoid ? true : !p.is_void;
    
    return matchesSearch && matchesFilter && matchesVoid;
  });

  // --- Auto-select page & search keyword when search matches exactly one persil ---
  useEffect(() => {
    const searchTermTrimmed = searchTerm.trim();
    
    if (searchTermTrimmed && filteredPersils.length === 1 && !filteredPersils[0].is_void) {
      const persil = filteredPersils[0];
      if (persil.halaman_krawangan && persil.halaman_krawangan > 0) {
        setSelectedPageNumber(persil.halaman_krawangan);
      } else {
        setSelectedPageNumber(null);
      }
      setPdfSearchKeyword(persil.nomor_persil?.toString() || null);
    } else if (!searchTermTrimmed) {
      setSelectedPageNumber(null);
      setPdfSearchKeyword(null);
    }
  }, [searchTerm, filteredPersils]);

  const handlePersilClick = (persil: PersilWithOwner) => {
    if (persil.halaman_krawangan && persil.halaman_krawangan > 0) {
      setSelectedPageNumber(persil.halaman_krawangan);
    } else {
      setSelectedPageNumber(null);
    }
  };

  const handlePrintPDF = async () => {
    if (filteredPersils.length === 0) {
      alert('Tidak ada data persil untuk dicetak');
      return;
    }
  
    try {
      setPrintLoading(true);
      const desa = desas.find(d => d.id === selectedDesaId);
      const kecamatan = kecamatans.find(k => k.id === desa?.kecamatan_id);
      
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
  
      const totalWidth = doc.internal.pageSize.width;
      const totalHeight = doc.internal.pageSize.height;
  
      const tableData = filteredPersils.map((p, index) => [
        { content: index + 1, styles: { halign: 'center' } },
        p.nomor_persil || '-',
        p.letter_c?.nomor_c || '-',
        p.letter_c?.nama_pemilik?.toUpperCase() || '-',
        { content: p.jenis_tanah || '-', styles: { halign: 'center' } },
        { content: p.klas_desa || '-', styles: { halign: 'center' } },
        { content: (p.luas_meter || 0).toLocaleString('id-ID'), styles: { halign: 'right' } },
        p.asal_usul || '-',
        { 
          content: p.is_void ? 'DICORET' : 'AKTIF', 
          styles: { fontStyle: p.is_void ? 'italic' : 'bold', textColor: p.is_void ? 100 : 0 } 
        }
      ]);
  
      autoTable(doc, {
        head: [['NO', 'PERSIL', 'KOHIR', 'NAMA PEMILIK', 'JENIS', 'KLAS', 'LUAS (m²)', 'KETERANGAN / ASAL-USUL', 'STATUS']],
        body: tableData,
        startY: 55,
        margin: { top: 20, bottom: 20, left: 10, right: 10 },
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
          textColor: 0,
          overflow: 'linebreak'
        },
        headStyles: {
          fillColor: [230, 230, 230],
          textColor: 0,
          fontStyle: 'bold',
          halign: 'center',
          lineWidth: 0.2,
          lineColor: [150, 150, 150]
        },
        columnStyles: {
          0: { cellWidth: 12 },
          1: { cellWidth: 20 },
          2: { cellWidth: 20 },
          3: { cellWidth: 55 }, 
          4: { cellWidth: 18 },
          5: { cellWidth: 15 },
          6: { cellWidth: 25 },
          7: { cellWidth: 'auto' }, 
          8: { cellWidth: 22 },
        },
        didDrawPage: (data) => {
          const pageCount = doc.internal.getNumberOfPages();
          
          if (pageCount === 1) {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('DAFTAR REKAPITULASI PERSIL TANAH (LETTER C)', totalWidth / 2, 15, { align: 'center' });
            
            doc.setFontSize(11);
            doc.text(`DESA ${desa?.nama.toUpperCase()} - KECAMATAN ${kecamatan?.nama.toUpperCase()}`, totalWidth / 2, 21, { align: 'center' });
            
            doc.setLineWidth(0.5);
            doc.line(10, 25, totalWidth - 10, 25);
  
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(`Kabupaten: PASURUAN`, 10, 32);
            doc.text(`Provinsi: JAWA TIMUR`, 10, 37);
            
            const rightAlignX = totalWidth - 10;
            doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, rightAlignX, 32, { align: 'right' });
            doc.text(`Total Baris: ${filteredPersils.length} Data`, rightAlignX, 37, { align: 'right' });
          } else {
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.text(`Lanjutan: Daftar Persil Desa ${desa?.nama}`, 10, 12);
            doc.text(`Hal: ${pageCount}`, totalWidth - 10, 12, { align: 'right' });
            doc.line(10, 14, totalWidth - 10, 14);
          }
  
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.text(`Halaman ${pageCount} dari {total_pages_count_string}`, totalWidth / 2, totalHeight - 10, { align: 'center' });
          doc.text(`Etana`, 10, totalHeight - 10);
        }
      });
  
      const finalY = (doc as any).lastAutoTable.finalY;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(`*** Dokumen ini dicetak secara sistem ***`, totalWidth / 2, finalY + 10, { align: 'center' });
  
      if (typeof doc.putTotalPages === 'function') {
        doc.putTotalPages('{total_pages_count_string}');
      }
  
      doc.save(`DATA_PERSIL_${desa?.nama.toUpperCase()}.pdf`);
  
    } catch (error) {
      console.error('Error:', error);
      alert('Gagal mengekspor PDF');
    } finally {
      setPrintLoading(false);
    }
  };

  // Mobile Sidebar Drawer
  const MobileSidebar = () => (
    <>
      {isSidebarOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 w-80 bg-white z-50 shadow-2xl lg:hidden flex flex-col overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg">Pilih Desa</h3>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full">
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
            <div className="flex-1 overflow-y-auto p-4">
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
                            setIsSidebarOpen(false);
                            setSearchDesa('');
                            setError(null);
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
        </>
      )}
    </>
  );

  return (
    <div className="flex flex-col lg:flex-row h-screen lg:h-[calc(100vh-140px)] gap-4 lg:gap-8 p-2 lg:p-4 bg-[#F8F9FA] text-zinc-900 font-sans overflow-hidden">
      
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="bg-zinc-900 text-white p-4 rounded-full shadow-lg"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar />

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

      {/* MAIN CONTENT - Split View */}
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
            <button
              onClick={() => setIsSplitView(!isSplitView)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-700 text-[10px] font-black uppercase rounded-xl hover:bg-zinc-200 transition-all"
            >
              {isSplitView ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              {isSplitView ? 'Sembunyikan PDF' : 'Tampilkan PDF'}
            </button>

            {selectedDesaId && filteredPersils.length > 0 && (
              <button
                onClick={handlePrintPDF}
                disabled={printLoading}
                className="flex items-center justify-center gap-2 px-5 py-2 bg-red-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {printLoading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                PDF ({filteredPersils.length})
              </button>
            )}
            
            <button
              onClick={() => setShowVoid(!showVoid)}
              className={`flex items-center justify-center gap-2 px-4 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${
                showVoid ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-100 text-zinc-400'
              }`}
            >
              {showVoid ? <Eye size={14} /> : <EyeOff size={14} />}
              {showVoid ? 'Sembunyikan Dicoret' : 'Tampilkan Dicoret'}
            </button>
            
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

        {/* Split Content Area */}
        <div className={`flex-1 overflow-hidden ${isSplitView ? 'flex flex-col lg:flex-row' : 'flex flex-col'}`}>
          
          {/* List Persil Panel */}
          <div className={`${isSplitView ? 'lg:w-1/2' : 'w-full'} flex flex-col overflow-hidden`}>
            <div className="p-4 lg:p-8 pb-0">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400" size={20}/>
                <input 
                  className="w-full pl-16 pr-6 py-4 lg:py-5 bg-zinc-50/50 border border-zinc-100 rounded-xl lg:rounded-[1.5rem] text-sm outline-none focus:bg-white focus:border-zinc-900 transition-all" 
                  placeholder="Cari No. Persil (exact match)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 lg:p-8 pt-4">
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
                    onClick={() => setIsSidebarOpen(true)}
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
                  <div className="space-y-2">
                    {filteredPersils.map(p => {
                      const isVoid = p.is_void === true;
                      return (
                        <div 
                          key={p.id} 
                          onClick={() => handlePersilClick(p)}
                          className={`group bg-white border cursor-pointer transition-all ${
                            isVoid ? 'border-red-100 bg-red-50/30' : 'border-zinc-100 hover:border-zinc-300 hover:shadow-md'
                          } rounded-xl`}
                        >
                          <div className="p-4 lg:p-5">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
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
                                    {p.halaman_krawangan && !isVoid && (
                                      <span className="text-[8px] font-black text-blue-500 uppercase bg-blue-100 px-1.5 py-0.5 rounded">
                                        Hlm {p.halaman_krawangan}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-zinc-500">
                                    C.{p.letter_c?.nomor_c || '-'} • {p.letter_c?.nama_pemilik || '-'}
                                  </p>
                                </div>
                              </div>

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

                  <div className="mt-6 text-xs text-zinc-400 font-medium px-2 flex justify-between items-center">
                    <span>
                      Menampilkan {filteredPersils.length} dari {persilList.length} persil
                      {!showVoid && persilList.filter(p => p.is_void).length > 0 && (
                        <span className="ml-2 text-amber-600">
                          ⚡ {persilList.filter(p => p.is_void).length} dicoret
                        </span>
                      )}
                    </span>
                    
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

          {/* PDF Viewer Panel */}
          {isSplitView && (
            <div className="lg:w-1/2 bg-zinc-100 border-t lg:border-t-0 lg:border-l border-zinc-200">
              {pdfLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="animate-spin text-zinc-400" size={32} />
                </div>
              ) : (
                <PDFViewer 
                  pdfUrl={selectedPdfUrl}
                  pageNumber={selectedPageNumber}
                  searchKeyword={pdfSearchKeyword}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};