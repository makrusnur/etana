// src/components/MapDrawingTool.tsx
import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Move, Square, Circle, PenTool, Eraser, Save, X } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface Polygon {
  id: string;
  points: Point[];
  color: string;
  nop?: string;
  nama_wp?: string;
}

interface MapDrawingToolProps {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  onSavePolygon: (polygon: Polygon) => void;
  existingPolygons?: Polygon[];
  selectedPolygon?: Polygon | null;
}

export const MapDrawingTool: React.FC<MapDrawingToolProps> = ({
  imageUrl,
  imageWidth,
  imageHeight,
  onSavePolygon,
  existingPolygons = [],
  selectedPolygon
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState<'draw' | 'select' | 'pan'>('draw');
  const [currentPolygon, setCurrentPolygon] = useState<Point[]>([]);
  const [polygons, setPolygons] = useState<Polygon[]>(existingPolygons);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);

  // Warna default untuk bidang
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec489a'];

  useEffect(() => {
    drawMap();
  }, [imageUrl, zoom, pan, polygons, currentPolygon, selectedPolygon]);

  const drawMap = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = imageWidth;
      canvas.height = imageHeight;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Gambar semua polygon yang sudah ada
      polygons.forEach((poly, idx) => {
        if (poly.points.length < 3) return;
        ctx.beginPath();
        ctx.moveTo(poly.points[0].x, poly.points[0].y);
        for (let i = 1; i < poly.points.length; i++) {
          ctx.lineTo(poly.points[i].x, poly.points[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = `${poly.color}40`;
        ctx.fill();
        ctx.strokeStyle = poly.color;
        ctx.lineWidth = 2 / zoom;
        ctx.stroke();
        
        // Tampilkan NOP jika ada
        if (poly.nop) {
          const centerX = poly.points.reduce((sum, p) => sum + p.x, 0) / poly.points.length;
          const centerY = poly.points.reduce((sum, p) => sum + p.y, 0) / poly.points.length;
          ctx.font = `${12 / zoom}px Arial`;
          ctx.fillStyle = poly.color;
          ctx.fillText(poly.nop, centerX + 5 / zoom, centerY - 5 / zoom);
        }
      });
      
      // Gambar polygon yang sedang digambar
      if (currentPolygon.length > 0) {
        ctx.beginPath();
        ctx.moveTo(currentPolygon[0].x, currentPolygon[0].y);
        for (let i = 1; i < currentPolygon.length; i++) {
          ctx.lineTo(currentPolygon[i].x, currentPolygon[i].y);
        }
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2 / zoom;
        ctx.stroke();
        
        // Gambar titik-titik
        currentPolygon.forEach((point, i) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 4 / zoom, 0, 2 * Math.PI);
          ctx.fillStyle = '#f59e0b';
          ctx.fill();
          ctx.fillStyle = 'white';
          ctx.fillText((i + 1).toString(), point.x - 3 / zoom, point.y - 3 / zoom);
        });
      }
      
      // Gambar polygon yang dipilih untuk edit
      if (selectedPolygon) {
        selectedPolygon.points.forEach((point, i) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 6 / zoom, 0, 2 * Math.PI);
          ctx.fillStyle = '#ef4444';
          ctx.fill();
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 2 / zoom;
          ctx.stroke();
        });
      }
      
      ctx.restore();
    };
    img.src = imageUrl;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'draw') return;
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;
    
    const originalX = (canvasX - pan.x) / zoom;
    const originalY = (canvasY - pan.y) / zoom;
    
    setCurrentPolygon([...currentPolygon, { x: originalX, y: originalY }]);
  };

  const finishPolygon = () => {
    if (currentPolygon.length < 3) {
      alert('Bidang harus memiliki minimal 3 titik!');
      return;
    }
    
    const newPolygon: Polygon = {
      id: Date.now().toString(),
      points: [...currentPolygon],
      color: colors[Math.floor(Math.random() * colors.length)]
    };
    
    onSavePolygon(newPolygon);
    setPolygons([...polygons, newPolygon]);
    setCurrentPolygon([]);
  };

  const cancelDrawing = () => {
    setCurrentPolygon([]);
  };

  const handleZoomIn = () => setZoom(Math.min(zoom * 1.2, 5));
  const handleZoomOut = () => setZoom(Math.max(zoom / 1.2, 0.5));
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (mode === 'pan') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && mode === 'pan') {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };
  
  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex gap-2 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
        <button
          onClick={() => setMode('draw')}
          className={`p-2 rounded-lg transition ${mode === 'draw' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          title="Gambar Bidang"
        >
          <PenTool size={18} />
        </button>
        <button
          onClick={() => setMode('pan')}
          className={`p-2 rounded-lg transition ${mode === 'pan' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          title="Geser Peta"
        >
          <Move size={18} />
        </button>
        <div className="w-px bg-slate-200 mx-1" />
        <button onClick={handleZoomIn} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition" title="Perbesar">
          <ZoomIn size={18} />
        </button>
        <button onClick={handleZoomOut} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition" title="Perkecil">
          <ZoomOut size={18} />
        </button>
        <div className="flex-1" />
        {currentPolygon.length > 0 && (
          <>
            <button onClick={finishPolygon} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1">
              <Save size={14} /> Selesai
            </button>
            <button onClick={cancelDrawing} className="px-4 py-2 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold flex items-center gap-1">
              <X size={14} /> Batal
            </button>
          </>
        )}
      </div>

      {/* Canvas Peta */}
      <div 
        className="relative border rounded-xl overflow-hidden bg-slate-100 shadow-inner"
        style={{ height: '500px' }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ cursor: mode === 'draw' ? 'crosshair' : mode === 'pan' ? 'grab' : 'default' }}
        />
        
        {/* Info */}
        <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-[10px] font-mono">
          Mode: {mode === 'draw' ? '🎨 Gambar Bidang' : '🖱️ Geser Peta'} | Zoom: {Math.round(zoom * 100)}%
        </div>
        {currentPolygon.length > 0 && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded text-[10px] font-bold">
            {currentPolygon.length} titik
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Bidang Terdaftar</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 border-2 border-orange-500 bg-orange-500/20 rounded"></div>
          <span>Bidang Sedang Digambar</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 border-2 border-red-500 rounded-full"></div>
          <span>Titik yang Dapat Diedit</span>
        </div>
      </div>
    </div>
  );
};

export default MapDrawingTool;