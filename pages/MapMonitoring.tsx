import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { db, supabase } from '../services/db';
import { LandData } from '../types';
import { Database, Map as MapIcon, User, Box, Hash, Maximize, ArrowRight, ShieldCheck, Activity } from 'lucide-react';

// --- DESIGN PRO: CUSTOM MARKER DENGAN EFEK PULSA ---
const createDotIcon = (color: string) => L.divIcon({
  className: 'custom-dot-marker',
  html: `
    <div style="position: relative; width: 20px; height: 20px;">
      <div style="background-color: ${color}; width: 100%; height: 100%; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px ${color}88; z-index: 2; position: relative;"></div>
      <div style="background-color: ${color}; width: 100%; height: 100%; border-radius: 50%; position: absolute; top: 0; left: 0; animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite; opacity: 0.5;"></div>
    </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

export const MapMonitoring: React.FC = () => {
  const [lands, setLands] = useState<LandData[]>([]); // Berkas Desa (Lokal)
  const [pbbRecords, setPbbRecords] = useState<any[]>([]); // Data PBB (Supabase)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load data dari dua sumber berbeda
        const berkas = await db.lands.getAll();
        setLands(berkas.filter(l => l.latitude && l.longitude));

        const { data: pbb } = await supabase.from('pbb_records').select('*');
        setPbbRecords(pbb?.filter(p => p.latitude && p.longitude) || []);
      } catch (err) {
        console.error("Sync Error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    
    // Fix untuk Leaflet render bug
    const timer = setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 500);
    return () => clearTimeout(timer);
  }, []);

  // --- RENDER: MARKER BERKAS DESA (BLUE THEME) ---
  const berkasMarkers = useMemo(() => lands.map((land) => (
    <Marker key={`b-${land.id}`} position={[land.latitude, land.longitude]} icon={createDotIcon('#3b82f6')}>
      <Popup className="schema-popup">
        <div className="w-80 bg-slate-950 rounded-[1.5rem] overflow-hidden border border-slate-800 shadow-2xl">
          
          {/* 1. NAMA (Header Utama) */}
          <div className="bg-blue-950/40 p-5 border-b border-blue-500/20 relative">
             <div className="absolute top-4 right-4 text-blue-500/10"><Box size={30} /></div>
             <span className="text-[7px] font-black text-blue-400 tracking-[0.4em] uppercase">Profil Berkas Internal</span>
             <h4 className="text-white font-bold text-base mt-1 uppercase truncate leading-tight tracking-tight">
              {land?.atas_nama_nop || 'TANPA NAMA'}
             </h4>
          </div>
  
          <div className="p-5 space-y-4 bg-slate-950/40 backdrop-blur-sm">
            
            {/* 2. DESA & 4. JENIS ALAS HAK */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">2. Desa/Wilayah</p>
                <p className="text-[10px] text-blue-300 font-bold bg-blue-500/10 px-2 py-1.5 rounded-lg border border-blue-500/20 truncate">
                  {land?.desa || '-'}
                </p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">4. Jenis Alas Hak</p>
                <p className="text-[10px] text-white font-bold bg-slate-900 px-2 py-1.5 rounded-lg border border-slate-800 inline-block uppercase">
                  {land?.jenis_dasar_surat || ''}
                </p>
              </div>
            </div>
  
            {/* 3. LUAS & 5. NJOP */}
            <div className="grid grid-cols-2 gap-3 border-y border-slate-800/50 py-3">
              <div className="flex flex-col gap-0.5">
                <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">3. Luas Tanah</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm text-white font-black">{land?.luas_seluruhnya || land?.luas_dimohon || '0'}</span>
                  <span className="text-[9px] text-slate-400 uppercase font-bold">m²</span>
                </div>
              </div>
              <div className="flex flex-col gap-0.5 text-right">
                <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">5. Estimasi NJOP</p>
                <div className="flex items-baseline gap-1 justify-end">
                  <span className="text-[9px] text-blue-400 font-bold">Rp</span>
                  <span className="text-sm text-white font-black">
                    {land?.pajak_grand_total ? Number(land.pajak_grand_total).toLocaleString('id-ID') : '0'}
                  </span>
                </div>
              </div>
            </div>
  
            {/* Action Link */}
            {/* Ganti bagian tag <a> di berkasMarkers menjadi seperti ini */}
            <a 
              href={`#/lands?edit=${land.id}`} 
              className="group flex items-center justify-between w-full bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-2xl transition-all duration-300 no-underline shadow-lg active:scale-95"
            >
              <div className="flex flex-col">
                <span className="text-[7px] font-black uppercase tracking-[0.2em] text-blue-200/60">Sistem Arsip</span>
                <span className="text-xs font-black uppercase tracking-tighter">Buka Mode Edit</span>
              </div>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </Popup>
    </Marker>
  )), [lands]);

  // --- RENDER: MARKER PBB (EMERALD/CYAN THEME) ---
  const pbbMarkers = useMemo(() => pbbRecords.map((pbb) => (
    <Marker key={`p-${pbb.id}`} position={[pbb.latitude, pbb.longitude]} icon={createDotIcon('#10b981')}>
      <Popup className="schema-popup">
        <div className="w-80 bg-slate-950 rounded-[1.5rem] overflow-hidden border border-slate-700 shadow-2xl">
          {/* Top Header */}
          <div className="bg-emerald-950/40 p-5 border-b border-emerald-500/20">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[7px] font-black text-emerald-400 tracking-[0.4em] uppercase">Tax Object Profile</span>
                <h4 className="text-white font-bold text-base mt-1 uppercase tracking-tight leading-tight">
                  {pbb.nama_wp}
                </h4>
              </div>
              <div className="bg-emerald-500/20 p-2 rounded-lg border border-emerald-500/40">
                <ShieldCheck size={18} className="text-emerald-400" />
              </div>
            </div>
          </div>
  
          {/* Technical Data Grid */}
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Row 1: NOP & ZNT */}
              <div className="space-y-1">
                <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Index NOP</p>
                <p className="text-xs text-slate-200 font-mono font-bold bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                  {pbb.nop}
                </p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Zone (ZNT)</p>
                <p className="text-xs text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20 inline-block min-w-[40px]">
                  {pbb.znt || '-'}
                </p>
              </div>
  
              {/* Row 2: Luas Bumi & Luas Bangunan */}
              <div className="space-y-1">
                <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Land Area</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm text-white font-black">{pbb.luas_bumi}</span>
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">m²</span>
                </div>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Building</p>
                <div className="flex items-baseline gap-1 justify-end">
                  <span className="text-sm text-white font-black">{pbb.luas_bng || '0'}</span>
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">m²</span>
                </div>
              </div>
            </div>
  
            {/* Master Action Button */}
            <a 
              href={`#/pbb?edit=${pbb.id}`} 
              className="group mt-2 flex items-center justify-between w-full bg-white hover:bg-emerald-500 text-slate-950 hover:text-white p-4 rounded-2xl transition-all duration-500 no-underline shadow-xl shadow-black/40"
            >
              <div className="flex flex-col items-start">
                <span className="text-[7px] font-black uppercase tracking-[0.3em] opacity-60 group-hover:text-white/80">Authorized Command</span>
                <span className="text-xs font-black uppercase tracking-tighter">Enter Edit Mode</span>
              </div>
              <div className="bg-slate-950/10 p-2 rounded-xl group-hover:bg-white/20 transition-colors">
                <Activity size={18} className="animate-pulse" />
              </div>
            </a>
          </div>
        </div>
      </Popup>
    </Marker>
  )), [pbbRecords]);

  return (
    <>
      <div className="h-[calc(100vh-20px)] lg:h-[calc(100vh-60px)] w-full flex flex-col animate-in fade-in duration-700 overflow-hidden relative z-0 font-sans">
        
        {/* HEADER & LEGEND SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 px-4 shrink-0 gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
              <MapIcon className="text-blue-600" size={28} /> MASTER <span className="text-blue-600 underline decoration-4 underline-offset-4">MAP</span>
            </h2>
            <div className="flex gap-5 mt-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-[9px] font-black text-blue-700 uppercase tracking-widest">Berkas (AKTA/PTSL)</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">SPPT (PBB)</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700">
            <Database size={16} className="text-emerald-400" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase">{lands.length + pbbRecords.length} Active Nodes</span>
          </div>
        </div>

        {/* MAP CONTAINER AREA */}
        <div className="flex-1 w-full relative min-h-0 pb-4 px-4 group">
          <div className="w-full h-full bg-white rounded-[2.5rem] lg:rounded-[3.5rem] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.25)] border-8 border-white relative">
            
            {loading && (
              <div className="absolute inset-0 z-[2000] bg-slate-950/80 backdrop-blur-xl flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] animate-pulse">Initializing Data Stream</p>
              </div>
            )}
            
            <MapContainer center={[-7.6448, 112.9061]} zoom={13} maxZoom={21} zoomControl={false} style={{ height: '100%', width: '100%', zIndex: 1 }}>
              <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="Mode Satelit (HD)">
                  <TileLayer url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}" maxZoom={21} maxNativeZoom={20}/>
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Mode Jalan">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={21} maxNativeZoom={19}/>
                </LayersControl.BaseLayer>
              </LayersControl>
              <ZoomControl position="bottomright" />
              
              {berkasMarkers}
              {pbbMarkers}
            </MapContainer>
          </div>
        </div>
      </div>

      <style>{`
        /* Reset Popup agar menyatu dengan desain */
        .leaflet-popup-content-wrapper { background: transparent !important; box-shadow: none !important; padding: 0 !important; }
        .leaflet-popup-tip-container { display: none !important; }
        .leaflet-popup-content { margin: 0 !important; width: auto !important; }

        /* Animasi Ring Pulse */
        @keyframes pulse-ring {
          0% { transform: scale(0.33); }
          80%, 100% { opacity: 0; }
        }

        .schema-popup {
          filter: drop-shadow(0 25px 50px -12px rgb(0 0 0 / 0.5));
          animation: popup-enter 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes popup-enter {
          from { opacity: 0; transform: translateY(20px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
};