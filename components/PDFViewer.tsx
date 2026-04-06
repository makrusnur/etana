import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Loader2, AlertCircle, FileWarning, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Maximize2, Minimize2 } from 'lucide-react';

// Set worker src
const pdfjsWorkerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc;

interface PDFViewerProps {
  pdfUrl: string | null;
  pageNumber?: number | null;
  searchKeyword?: string | null;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ 
  pdfUrl, 
  pageNumber, 
  searchKeyword 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<any>(null);
  const isMountedRef = useRef(true);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  
  // Zoom state
  const [zoom, setZoom] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch(e) {}
      }
    };
  }, []);

  // Load PDF
  useEffect(() => {
    if (!pdfUrl) {
      pdfDocRef.current = null;
      setNumPages(0);
      setCurrentPage(1);
      setError(null);
      return;
    }

    const loadPdf = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (renderTaskRef.current) {
          try { renderTaskRef.current.cancel(); } catch(e) {}
        }
        
        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          disableRange: true,
          disableStream: true,
        });
        
        const doc = await loadingTask.promise;
        
        if (!isMountedRef.current) {
          doc.destroy();
          return;
        }
        
        pdfDocRef.current = doc;
        setNumPages(doc.numPages);
        setCurrentPage(pageNumber && pageNumber <= doc.numPages ? pageNumber : 1);
      } catch (err: any) {
        if (isMountedRef.current) {
          setError(`Gagal memuat PDF: ${err.message || 'Periksa URL'}`);
        }
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
    };
    
    loadPdf();
  }, [pdfUrl]);

  // Render halaman
  const renderPage = async (pageNum: number) => {
    if (!pdfDocRef.current || !canvasRef.current || !isMountedRef.current) return;
    
    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel(); } catch(e) {}
    }
    
    try {
      const page = await pdfDocRef.current.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = '100%';
      canvas.style.height = 'auto';

      const renderTask = page.render({
        canvasContext: context,
        viewport: viewport,
      });
      renderTaskRef.current = renderTask;
      
      await renderTask.promise;
      renderTaskRef.current = null;
    } catch (err: any) {
      if (err.name !== 'RenderingCancelledException') {
        console.error('Render error:', err);
      }
    }
  };

  useEffect(() => {
    if (pdfDocRef.current && currentPage >= 1 && currentPage <= numPages) {
      renderPage(currentPage);
    }
  }, [currentPage, numPages]);

  // Navigasi dari props
  useEffect(() => {
    if (pageNumber && pdfDocRef.current && pageNumber >= 1 && pageNumber <= numPages) {
      setCurrentPage(pageNumber);
      setSearchResult(null);
    }
  }, [pageNumber, numPages]);

  // ========== PENCARIAN SEDERHANA ==========
  // Hanya menggunakan format: "persil no. {keyword}"
  useEffect(() => {
    if (!pdfDocRef.current || !searchKeyword || searchKeyword.trim() === '') {
      setSearchResult(null);
      return;
    }

    const performSearch = async () => {
      if (!pdfDocRef.current) return;
      
      setSearching(true);
      setSearchResult(null);
      
      try {
        const keyword = searchKeyword.trim();
        // Hanya satu format pencarian
        const searchText = `persil no. ${keyword}`.toLowerCase();
        
        console.log(`🔍 Mencari: "${searchText}"`);
        
        // Cari di semua halaman
        for (let pageIdx = 1; pageIdx <= pdfDocRef.current.numPages; pageIdx++) {
          const page = await pdfDocRef.current.getPage(pageIdx);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ')
            .toLowerCase();
          
          if (pageText.includes(searchText)) {
            setCurrentPage(pageIdx);
            setSearchResult(`✓ Ditemukan "persil no. ${keyword}" di halaman ${pageIdx}`);
            return;
          }
        }
        
        setSearchResult(`✗ "persil no. ${keyword}" tidak ditemukan`);
      } catch (err) {
        console.error('Search error:', err);
        setSearchResult('Gagal mencari');
      } finally {
        setSearching(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 500);
    return () => clearTimeout(timeoutId);
  }, [searchKeyword]);

  // Zoom handlers
  const zoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const resetZoom = () => setZoom(1);

  // Download PDF
  const downloadPDF = () => {
    if (pdfUrl) window.open(pdfUrl, '_blank');
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Page handlers
  const goToPrevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const goToNextPage = () => currentPage < numPages && setCurrentPage(currentPage + 1);
  const goToPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const page = parseInt(e.target.value);
    if (!isNaN(page) && page >= 1 && page <= numPages) setCurrentPage(page);
  };

  if (!pdfUrl) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-400 p-8">
        <FileWarning size={48} strokeWidth={1} />
        <p className="mt-4 text-sm font-medium">Belum ada dokumen</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-red-500 p-8 text-center">
        <AlertCircle size={40} />
        <p className="mt-4 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-zinc-100">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white border-b border-zinc-200 shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            className="p-1.5 hover:bg-zinc-100 rounded disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>
          <input
            type="number"
            value={currentPage}
            onChange={goToPage}
            min={1}
            max={numPages}
            className="w-12 text-center text-sm border border-zinc-200 rounded py-1"
          />
          <span className="text-xs text-zinc-500">/ {numPages}</span>
          <button
            onClick={goToNextPage}
            disabled={currentPage >= numPages}
            className="p-1.5 hover:bg-zinc-100 rounded disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={zoomOut} className="p-1.5 hover:bg-zinc-100 rounded">
            <ZoomOut size={16} />
          </button>
          <span className="text-xs font-medium min-w-[45px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={zoomIn} className="p-1.5 hover:bg-zinc-100 rounded">
            <ZoomIn size={16} />
          </button>
          <button onClick={resetZoom} className="text-xs px-2 py-1 hover:bg-zinc-100 rounded">
            Reset
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={downloadPDF} className="p-1.5 hover:bg-zinc-100 rounded">
            <Download size={16} />
          </button>
          <button onClick={toggleFullscreen} className="p-1.5 hover:bg-zinc-100 rounded">
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>

        {/* Status Pencarian */}
        {searching && <Loader2 size={14} className="animate-spin text-blue-500" />}
        {searchResult && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
            searchResult.includes('✓') ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {searchResult}
          </span>
        )}
      </div>

      {/* Canvas Container dengan CSS Zoom */}
      <div className="flex-1 overflow-auto p-4" style={{ backgroundColor: '#e5e7eb' }}>
        <div 
          className="flex justify-center transition-transform duration-200"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center top',
          }}
        >
          <canvas 
            ref={canvasRef} 
            className="shadow-lg bg-white"
            style={{
              display: 'block',
              maxWidth: '100%',
              height: 'auto',
            }}
          />
        </div>
      </div>
    </div>
  );
};