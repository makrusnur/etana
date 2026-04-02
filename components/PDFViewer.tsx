import { useState, useEffect, useRef } from 'react';
import { Loader2, Maximize2, Minimize2, Download } from 'lucide-react';

interface PDFViewerProps {
  pdfUrl: string | null;
  pageNumber: number | null;
  onLoad?: () => void;
}

export const PDFViewer = ({ pdfUrl, pageNumber, onLoad }: PDFViewerProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!pdfUrl) {
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    let finalUrl = pdfUrl;
    if (pageNumber && pageNumber > 0) {
      finalUrl = `${pdfUrl}#page=${pageNumber}`;
    }

    if (iframeRef.current) {
      iframeRef.current.src = finalUrl;
    }

    const timer = setTimeout(() => {
      setLoading(false);
      onLoad?.();
    }, 800);

    return () => clearTimeout(timer);
  }, [pdfUrl, pageNumber, onLoad]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleDownload = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!pdfUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-zinc-50 to-zinc-100 rounded-xl">
        <div className="text-center p-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-white shadow-sm rounded-2xl flex items-center justify-center">
            <svg className="w-10 h-10 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-zinc-600 font-semibold mt-4">Belum ada PDF yang dipilih</p>
          <p className="text-zinc-400 text-sm mt-2 max-w-xs mx-auto">
            Klik pada persil untuk melihat file krawangan
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative flex flex-col h-full bg-zinc-100 rounded-xl overflow-hidden shadow-lg">
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-zinc-200 shadow-sm">
        <div className="flex items-center gap-3">
          {pageNumber && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-100">
              <span className="text-xs font-medium text-blue-600">Halaman</span>
              <span className="text-sm font-bold text-blue-700">{pageNumber}</span>
            </div>
          )}
          
          {loading && (
            <div className="flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-zinc-400" />
              <span className="text-xs text-zinc-500">Memuat PDF...</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
            title="Buka di tab baru"
          >
            <Download size={18} className="text-zinc-600" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
            title={isFullscreen ? "Keluar Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      <div className="flex-1 relative bg-zinc-200">
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50">
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-red-600 font-medium">Gagal memuat PDF</p>
              <p className="text-red-400 text-sm mt-1">{error}</p>
              <button
                onClick={() => window.open(pdfUrl, '_blank')}
                className="mt-4 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
              >
                Buka di tab baru
              </button>
            </div>
          </div>
        )}
        
        <iframe
          ref={iframeRef}
          src={pdfUrl}
          className="w-full h-full border-0"
          title="PDF Viewer"
          onError={() => {
            setError('Gagal memuat file PDF');
            setLoading(false);
          }}
          onLoad={() => {
            setLoading(false);
            onLoad?.();
          }}
        />
        
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm">
            <div className="text-center">
              <Loader2 size={48} className="animate-spin text-zinc-400 mx-auto" />
              <p className="text-sm text-zinc-500 mt-4 font-medium">Memuat dokumen...</p>
              <p className="text-xs text-zinc-400 mt-1">Gunakan Ctrl + / Ctrl - untuk zoom</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};