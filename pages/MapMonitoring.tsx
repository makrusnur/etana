import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { db } from '../services/db'; 
import { LandData } from '../types';
import { Database, Activity, Map as MapIcon, User, Hash, Maximize, ArrowRight } from 'lucide-react';

// Perbaikan Icon Marker Leaflet
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export const MapMonitoring: React.FC = () => {
  const [lands, setLands] = useState<LandData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await db.lands.getAll();
        const validLands = data.filter(l => l.latitude && l.longitude);
        setLands(validLands);
      } catch (err) {
        console.error("Gagal load peta:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    
    // Paksa resize agar peta tidak setengah saat pertama load
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Merender titik-titik lokasi
  const markers = useMemo(() => lands.map((land) => (
    <Marker key={land.id} position={[land.latitude, land.longitude]}>
      <Popup className="custom-etana-popup">
        <div className="w-64 p-1 font-sans">
          <div className="flex items-center gap-2 mb-3 border-b pb-2">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white">
              <User size={14} />
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Nama Wajib Pajak</p>
              <p className="text-xs font-black text-slate-900 truncate uppercase mt-1">
                {land.atas_nama_nop || 'TIDAK TERSEDIA'}
              </p>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-[10px] bg-slate-50 p-2 rounded-lg">
              <div className="flex items-center gap-2 text-slate-500">
                <Hash size={12} />
                <span>NOP</span>
              </div>
              <span className="font-bold text-slate-700">{land.nop}</span>
            </div>

            <div className="flex items-center justify-between text-[10px] bg-slate-50 p-2 rounded-lg">
              <div className="flex items-center gap-2 text-slate-500">
                <Maximize size={12} />
                <span>Luas</span>
              </div>
              <span className="font-bold text-slate-700">{land.luas_seluruhnya || 0} m²</span>
            </div>
          </div>

          <a 
            href={`#/lands?id=${land.id}`} 
            className="flex items-center justify-center gap-2 w-full bg-slate-900 text-white text-[10px] font-black py-2.5 rounded-xl hover:bg-blue-600 transition-all uppercase tracking-widest shadow-md"
          >
            Lihat Detail Berkas
            <ArrowRight size={12} />
          </a>
        </div>
      </Popup>
    </Marker>
  )), [lands]);

  return (
    <div className="h-[calc(100vh-20px)] lg:h-[calc(100vh-60px)] w-full flex flex-col animate-in fade-in duration-500 overflow-hidden relative z-0">
      
      {/* HEADER DAN WIDGET INFO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 px-2 shrink-0 gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
            <MapIcon className="text-blue-600" size={24} />
            Master <span className="text-blue-600">Map</span>
          </h2>
          <p className="hidden md:block text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 ml-9">
            ETANA Geospasial Monitoring
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
            <div className="flex-1 md:flex-none bg-white border border-slate-100 p-2 rounded-2xl shadow-sm flex items-center gap-3 px-4">
                <Database size={14} className="text-blue-600" />
                <p className="text-xs font-black text-slate-900">{lands.length} TITIK</p>
            </div>
            <div className="bg-emerald-500 p-2 rounded-2xl shadow-md flex items-center gap-2 px-4">
                <Activity size={14} className="text-white animate-pulse" />
                <span className="text-[9px] font-black text-white uppercase tracking-widest">Sistem Aktif</span>
            </div>
        </div>
      </div>

      {/* AREA PETA */}
      <div className="flex-1 w-full relative min-h-0 pb-4 px-2">
        <div className="w-full h-full bg-white rounded-[2rem] lg:rounded-[3rem] overflow-hidden shadow-2xl border border-slate-200 relative">
          
          {loading && (
            <div className="absolute inset-0 z-[1000] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Sinkronisasi...</p>
            </div>
          )}

          <MapContainer 
            center={[-7.6448, 112.9061]} 
            zoom={13} 
            maxZoom={21} // Mengizinkan zoom sangat dekat
            zoomControl={false}
            preferCanvas={true}
            style={{ height: '100%', width: '100%', zIndex: 1 }}
          >
            <LayersControl position="topright">
              {/* Mode Peta Jalan Standar */}
              <LayersControl.BaseLayer checked name="Mode Jalan">
                <TileLayer 
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                    maxZoom={21}
                    maxNativeZoom={19}
                />
              </LayersControl.BaseLayer>
              
              {/* Mode Satelit Menggunakan Google Maps (Lebih Jernih untuk Zoom Dekat) */}
              <LayersControl.BaseLayer name="Mode Satelit (HD)">
                <TileLayer 
                    url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                    maxZoom={21}
                    maxNativeZoom={20}
                    attribution="&copy; Google Maps"
                />
              </LayersControl.BaseLayer>
            </LayersControl>

            <ZoomControl position="bottomright" />
            {markers}
          </MapContainer>
        </div>
      </div>

      <style>{`
        .leaflet-popup-content-wrapper { 
          border-radius: 1.5rem !important; 
          padding: 8px !important; 
          border: none !important;
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1) !important;
        }
        .leaflet-container { 
            z-index: 1 !important; 
            background: #f8fafc !important;
        }
        /* Memperbaiki tampilan control layers agar lebih modern */
        .leaflet-control-layers {
            border-radius: 12px !important;
            border: none !important;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important;
            padding: 5px !important;
        }
      `}</style>
    </div>
  );
};