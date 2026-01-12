import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { db } from '../services/db'; 
import { LandData } from '../types';
import { Database, Activity, Map as MapIcon } from 'lucide-react';

// Fix Icon Marker Leaflet
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
    
    // Paksa Leaflet untuk resize setelah render pertama
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const markers = useMemo(() => lands.map((land) => (
    <Marker key={land.id} position={[land.latitude, land.longitude]}>
      <Popup>
        <div className="p-1 min-w-[150px]">
          <p className="font-black text-slate-900 text-[11px] uppercase mb-1">{land.atas_nama_nop || 'N/A'}</p>
          <p className="text-[9px] text-slate-500 mb-2">NOP: {land.nop}</p>
          <a href={`#/lands?id=${land.id}`} className="block w-full text-center bg-blue-600 text-white text-[9px] font-black py-2 rounded-lg uppercase">
            Detail Berkas
          </a>
        </div>
      </Popup>
    </Marker>
  )), [lands]);

  return (
    <div className="h-[calc(100vh-60px)] w-full flex flex-col animate-in fade-in duration-500 overflow-hidden">
      
      {/* HEADER DAN WIDGET INFO */}
      <div className="flex justify-between items-center mb-4 px-2 shrink-0">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
            <MapIcon className="text-blue-600" size={28} />
            Master <span className="text-blue-600">Map</span>
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 ml-10">
            Pemantauan Geospasial Aset Tanah
          </p>
        </div>

        {/* WIDGET STATUS */}
        <div className="flex gap-3">
            <div className="bg-white border border-slate-100 p-2 rounded-2xl shadow-sm flex items-center gap-3 px-4">
                <div className="bg-blue-50 p-2 rounded-xl">
                    <Database size={16} className="text-blue-600" />
                </div>
                <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase leading-none">Total Objek</p>
                    <p className="text-sm font-black text-slate-900 leading-none mt-1">
                        {lands.length} <span className="text-[10px] text-slate-400 font-bold">TITIK</span>
                    </p>
                </div>
            </div>
            <div className="hidden md:flex bg-emerald-500 p-2 rounded-2xl shadow-lg items-center gap-3 px-4">
                <Activity size={16} className="text-white animate-pulse" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Sistem Aktif</span>
            </div>
        </div>
      </div>

      {/* AREA PETA - MENGGUNAKAN DIV STANDAR UNTUK MENGHINDARI PADDING CARD */}
      <div className="flex-1 w-full relative min-h-0 pb-4 px-2">
        <div className="w-full h-full bg-slate-200 rounded-[3rem] overflow-hidden shadow-2xl border border-slate-200 relative">
          {loading && (
            <div className="absolute inset-0 z-[1000] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Sinkronisasi...</p>
            </div>
          )}

          <MapContainer 
            center={[-7.6448, 112.9061]} 
            zoom={13} 
            zoomControl={false}
            preferCanvas={true}
            style={{ height: '100%', width: '100%' }}
          >
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="Peta Administrasi">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Citra Satelit">
                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
              </LayersControl.BaseLayer>
            </LayersControl>
            <ZoomControl position="bottomright" />
            {markers}
          </MapContainer>
        </div>
      </div>

      <style>{`
        .leaflet-container { 
          height: 100% !important; 
          width: 100% !important; 
        }
      `}</style>
    </div>
  );
};