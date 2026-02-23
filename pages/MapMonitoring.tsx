import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { db, supabase } from '../services/db'; // <-- Import DB lokal (Dexie) dan Supabase disatukan
import { LandData } from '../types';
import { Database, Map as MapIcon, User, Hash, Maximize, ArrowRight } from 'lucide-react';

// Fungsi membuat Icon Marker Bulat Custom
const createDotIcon = (color: string) => L.divIcon({
  className: 'custom-dot-marker',
  html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.4);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

export const MapMonitoring: React.FC = () => {
  const [lands, setLands] = useState<LandData[]>([]); // Berkas AJB dll
  const [pbbRecords, setPbbRecords] = useState<any[]>([]); // Data PBB SPPT
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Load Data Berkas (Local DB / Dexie)
        const data = await db.lands.getAll();
        setLands(data.filter(l => l.latitude && l.longitude));

        // 2. Load Data PBB (Supabase)
        const { data: pbbData } = await supabase.from('pbb_records').select('*');
        setPbbRecords(pbbData?.filter(p => p.latitude && p.longitude) || []);

      } catch (err) {
        console.error("Gagal load peta:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    
    // Paksa resize agar peta tidak terpotong saat pertama load
    const timer = setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Merender Titik Biru (Berkas)
  const berkasMarkers = useMemo(() => lands.map((land) => (
    <Marker key={`b-${land.id}`} position={[land.latitude, land.longitude]} icon={createDotIcon('#3b82f6')}>
      <Popup className="custom-etana-popup">
        <div className="w-64 p-1 font-sans">
          <div className="flex items-center gap-2 mb-3 border-b pb-2">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white"><User size={14} /></div>
            <div className="overflow-hidden">
              <span className="text-[9px] bg-blue-100 text-blue-700 px-2 rounded-full font-bold uppercase mb-1 inline-block">Berkas Desa</span>
              <p className="text-xs font-black text-slate-900 truncate uppercase mt-0.5">{land.atas_nama_nop || 'TIDAK TERSEDIA'}</p>
            </div>
          </div>
          <a href={`#/lands?id=${land.id}`} className="flex items-center justify-center gap-2 w-full bg-slate-900 text-white text-[10px] font-black py-2.5 rounded-xl hover:bg-blue-600 transition-all uppercase tracking-widest shadow-md">
            Lihat Berkas <ArrowRight size={12} />
          </a>
        </div>
      </Popup>
    </Marker>
  )), [lands]);

  // Merender Titik Hijau (SPPT PBB)
  const pbbMarkers = useMemo(() => pbbRecords.map((pbb) => (
    <Marker key={`p-${pbb.id}`} position={[pbb.latitude, pbb.longitude]} icon={createDotIcon('#10b981')}>
      <Popup className="custom-etana-popup">
        <div className="w-64 p-1 font-sans">
          <div className="flex items-center gap-2 mb-3 border-b pb-2">
            <div className="bg-emerald-500 p-1.5 rounded-lg text-white"><User size={14} /></div>
            <div className="overflow-hidden">
              <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 rounded-full font-bold uppercase mb-1 inline-block">Data SPPT (PBB)</span>
              <p className="text-xs font-black text-slate-900 truncate uppercase mt-0.5">{pbb.nama_wp}</p>
            </div>
          </div>
          <div className="space-y-2 mb-2">
            <div className="flex items-center justify-between text-[10px] bg-slate-50 p-2 rounded-lg">
              <div className="flex items-center gap-2 text-slate-500"><Hash size={12} /><span>NOP</span></div>
              <span className="font-bold text-slate-700">{pbb.nop}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] bg-slate-50 p-2 rounded-lg">
              <div className="flex items-center gap-2 text-slate-500"><Maximize size={12} /><span>Luas Bumi</span></div>
              <span className="font-bold text-slate-700">{pbb.luas_bumi} m²</span>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  )), [pbbRecords]);

  // PERHATIKAN PENGGUNAAN <></> DI SINI UNTUK MENGHINDARI ERROR JSX
  return (
    <>
      <div className="h-[calc(100vh-20px)] lg:h-[calc(100vh-60px)] w-full flex flex-col animate-in fade-in duration-500 overflow-hidden relative z-0">
        
        {/* Header dan Legend */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 px-2 shrink-0 gap-4">
          <div>
            <h2 className="text-2xl lg:text-3xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
              <MapIcon className="text-blue-600" size={24} /> Master <span className="text-blue-600">Map</span>
            </h2>
            <div className="flex gap-4 mt-2 ml-9">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-lg"></div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Berkas (AJB/PTSL)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg"></div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">SPPT (PBB)</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
              <div className="bg-white border border-slate-100 p-2 rounded-2xl shadow-sm flex items-center gap-3 px-4">
                  <Database size={14} className="text-blue-600" />
                  <p className="text-xs font-black text-slate-900">{lands.length + pbbRecords.length} TITIK</p>
              </div>
          </div>
        </div>

        {/* Kontainer Peta */}
        <div className="flex-1 w-full relative min-h-0 pb-4 px-2">
          <div className="w-full h-full bg-white rounded-[2rem] lg:rounded-[3rem] overflow-hidden shadow-2xl border border-slate-200 relative">
            {loading && (
              <div className="absolute inset-0 z-[1000] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Sinkronisasi...</p>
              </div>
            )}
            
            <MapContainer center={[-7.6448, 112.9061]} zoom={13} maxZoom={21} zoomControl={false} style={{ height: '100%', width: '100%', zIndex: 1 }}>
              <LayersControl position="topright">
                <LayersControl.BaseLayer name="Mode Jalan">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={21} maxNativeZoom={19}/>
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer checked name="Mode Satelit (HD)">
                  <TileLayer url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}" maxZoom={21} maxNativeZoom={20}/>
                </LayersControl.BaseLayer>
              </LayersControl>
              <ZoomControl position="bottomright" />
              
              {/* Memanggil Marker */}
              {berkasMarkers}
              {pbbMarkers}
            </MapContainer>
          </div>
        </div>
      </div>

      {/* Style Peta Terpisah Tapi Tetap Terbungkus Fragment */}
      <style>{`
        .leaflet-popup-content-wrapper { border-radius: 1.5rem !important; padding: 8px !important; border: none !important; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1) !important; }
        .leaflet-control-layers { border-radius: 12px !important; border: none !important; padding: 5px !important; }
      `}</style>
    </>
  );
};