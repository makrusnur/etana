import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Loader2, AlertCircle, Search as SearchIcon, FileWarning } from 'lucide-react';

// Set worker src
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Fungsi untuk memeriksa apakah file PDF dapat diakses
  const checkPdfAccessibility = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (err) {
      return false;
    }
  };

  // Load PDF document
  useEffect(() => {
    if (!pdfUrl) {
      setPdfDoc(null);
      setNumPages(0);
      setCurrentPage(1);
      setError(null);
      setSearchResult(null);
      return;
    }

    const loadPdf = async () => {
      setLoading(true);
      setError(null);
      setSearchResult(null);
      
      try {
        // Cek apakah file dapat diakses
        const isAccessible = await checkPdfAccessibility(pdfUrl);
        if (!isAccessible) {
          throw new Error('File PDF tidak dapat diakses. Periksa URL atau permission bucket.');
        }

        // Load PDF tanpa cache parameter untuk menghindari masalah
        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          disableRange: true, // Matikan range request untuk menghindari CORS issues
          disableStream: true,
          isEvalSupported: false,
        });
        
        const doc = await loadingTask.promise;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setError(null);
      } catch (err: any) {
        console.error('Error loading PDF:', err);
        
        // Coba lagi dengan URL tanpa encoding jika error
        if (retryCount === 0 && pdfUrl.includes('%')) {
          setRetryCount(1);
          const decodedUrl = decodeURIComponent(pdfUrl);
          setPdfDoc(null); // Trigger reload dengan URL decoded
          setTimeout(() => {
            loadPdfWithUrl(decodedUrl);
          }, 100);
          return;
        }
        
        let errorMessage = 'Gagal memuat PDF. ';
        if (err.status === 400) {
          errorMessage += 'File tidak ditemukan atau URL tidak valid. ';
        } else if (err.status === 403) {
          errorMessage += 'Akses ditolak. Pastikan bucket storage bersifat public. ';
        } else if (err.status === 404) {
          errorMessage += 'File tidak ditemukan. ';
        } else {
          errorMessage += err.message || 'Periksa koneksi dan URL PDF.';
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    const loadPdfWithUrl = async (url: string) => {
      setLoading(true);
      try {
        const loadingTask = pdfjsLib.getDocument({
          url: url,
          disableRange: true,
          disableStream: true,
        });
        const doc = await loadingTask.promise;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setError(null);
      } catch (err) {
        setError('Gagal memuat PDF setelah percobaan ulang.');
      } finally {
        setLoading(false);
      }
    };
    
    loadPdf();
  }, [pdfUrl, retryCount]);

  // Render halaman tertentu
  const renderPage = async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current) return;
    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context!,
        viewport: viewport,
      };
      await page.render(renderContext).promise;
    } catch (err) {
      console.error('Render error:', err);
    }
  };

  useEffect(() => {
    if (pdfDoc && currentPage >= 1 && currentPage <= numPages) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, numPages]);

  // Navigasi berdasarkan pageNumber prop (dari database)
  useEffect(() => {
    if (pageNumber && pdfDoc && pageNumber >= 1 && pageNumber <= numPages) {
      setCurrentPage(pageNumber);
      setSearchResult(null);
    }
  }, [pageNumber, pdfDoc, numPages]);

  // Pencarian teks ketika searchKeyword berubah
  useEffect(() => {
    if (!pdfDoc || !searchKeyword || searchKeyword.trim() === '') {
      setSearchResult(null);
      return;
    }

    const performSearch = async () => {
      setSearching(true);
      setSearchResult(null);
      try {
        const keyword = searchKeyword.trim().toLowerCase();
        let foundPage = null;
        
        // Coba berbagai format pencarian
        const searchPatterns = [
          keyword,
          `persil ${keyword}`,
          `no. ${keyword}`,
          `nomor ${keyword}`,
          `persil no. ${keyword}`,
          `persil nomor ${keyword}`,
          ` ${keyword} `,
        ];
        
        // Iterasi semua halaman untuk mencari teks
        for (let pageIdx = 1; pageIdx <= pdfDoc.numPages; pageIdx++) {
          const page = await pdfDoc.getPage(pageIdx);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ').toLowerCase();
          
          // Cek apakah salah satu pattern ditemukan
          const isFound = searchPatterns.some(pattern => pageText.includes(pattern));
          
          if (isFound) {
            foundPage = pageIdx;
            setSearchResult(`✓ Ditemukan di halaman ${pageIdx}`);
            break;
          }
        }
        
        if (foundPage) {
          setCurrentPage(foundPage);
        } else {
          setSearchResult(`✗ "${searchKeyword}" tidak ditemukan`);
        }
      } catch (err) {
        console.error('Search error:', err);
        setSearchResult('Gagal melakukan pencarian');
      } finally {
        setSearching(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(() => {
      performSearch();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [pdfDoc, searchKeyword]);

  // Handler navigasi manual
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setSearchResult(null);
    }
  };
  
  const goToNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1);
      setSearchResult(null);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
  };

  if (!pdfUrl) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-400 p-8 text-center">
        <FileWarning size={48} strokeWidth={1} />
        <p className="mt-4 text-sm font-medium">Tidak ada PDF untuk desa ini</p>
        <p className="text-xs mt-1">Silakan pilih desa yang memiliki arsip krawangan</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-400" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-red-500 p-8 text-center">
        <AlertCircle size={48} />
        <p className="mt-4 text-sm font-medium">{error}</p>
        <button
          onClick={handleRetry}
          className="mt-4 px-4 py-2 bg-zinc-900 text-white text-sm rounded-lg hover:bg-zinc-800"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-zinc-100">
      {/* Toolbar navigasi */}
      {numPages > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-zinc-200">
          <button
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            className="px-3 py-1 text-sm bg-zinc-100 rounded disabled:opacity-50 hover:bg-zinc-200 transition-all"
          >
            ← Sebelumnya
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              Halaman {currentPage} dari {numPages}
            </span>
            {(searching || searchKeyword) && (
              <div className="flex items-center gap-1">
                {searching ? (
                  <Loader2 size={14} className="animate-spin text-blue-500" />
                ) : searchResult && (
                  <span className={`text-xs ${searchResult.includes('✓') ? 'text-green-600' : searchResult.includes('✗') ? 'text-amber-600' : 'text-blue-600'}`}>
                    {searchResult}
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={goToNextPage}
            disabled={currentPage >= numPages}
            className="px-3 py-1 text-sm bg-zinc-100 rounded disabled:opacity-50 hover:bg-zinc-200 transition-all"
          >
            Selanjutnya →
          </button>
        </div>
      )}
      {/* Canvas PDF */}
      <div className="flex-1 overflow-auto flex justify-center p-4">
        <canvas ref={canvasRef} className="shadow-lg max-w-full h-auto" />
      </div>
    </div>
  );
};