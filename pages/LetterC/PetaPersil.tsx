import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MapPin, Loader2, Layers, AlertCircle, CheckCircle2, Navigation, Plus, Search, X, Info
} from 'lucide-react';
import { supabase } from '../../services/db';
import { Desa } from '../../types';
import { MapContainer, TileLayer, FeatureGroup, Polygon, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import * as turf from '@turf/turf'; 
import 'leaflet/dist/leaflet.css';

// Fix Icon Marker Leaflet
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

const PASURUAN_CENTER: [number, number] = [-7.7307, 112.8365];

// Komponen untuk menggerakkan peta (FlyTo)
const MapController = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => { 
    if (map && center) {
      map.flyTo(center, 18, { duration: 1.5 });
      setTimeout(() => map.invalidateSize(), 500);
    }
  }, [map, center]);
  return null;
};

// Komponen Alat Gambar Persil/Kohir
const DrawTool = ({ onCreated, isActive, color }: any) => {
  const map = useMap();
  const drawerRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !isActive) {
      if (drawerRef.current) drawerRef.current.disable();
      return;
    }

    const LGlobal = (window as any).L;
    if (!LGlobal?.Draw?.Polygon) return;

    // Inisialisasi Mode Gambar Polygon
    drawerRef.current = new LGlobal.Draw.Polygon(map, {
      shapeOptions: { color, weight: 3, fillOpacity: 0.4 },
      allowIntersection: false,
      showArea: true
    });

    drawerRef.current.enable();

    const handleCreated = (e: any) => {
      onCreated(e.layer);
      if (drawerRef.current) drawerRef.current.disable();
    };

    map.on('draw:created', handleCreated);

    return () => {
      if (drawerRef.current) drawerRef.current.disable();
      map.off('draw:created', handleCreated);
    };
  }, [map, isActive, color, onCreated]);

  return null;
};

export const PetaPersil = () => {
  const [loading, setLoading] = useState(false);
  const [desas, setDesas] = useState<Desa[]>([]);
  const [selectedDesaId, setSelectedDesaId] = useState<string | null>(localStorage.getItem('last_selected_desa_id'));
  const [selectedDesa, setSelectedDesa] = useState<Desa | null>(null);
  
  const [polygons, setPolygons] = useState<any[]>([]);
  const [drawMode, setDrawMode] = useState<'persil' | 'kohir' | null>(null);
  const [activeListTab, setActiveListTab] = useState<'persil' | 'kohir'>('persil');
  const [mapCenter, setMapCenter] = useState<[number, number]>(PASURUAN_CENTER);
  
  const [showDesaModal, setShowDesaModal] = useState(false);
  const [showRefModal, setShowRefModal] = useState(false);
  const [refList, setRefList] = useState<any[]>([]);
  const [selectedRefId, setSelectedRefId] = useState<string>('');
  const [tempPolygon, setTempPolygon] = useState<any>(null);
  const [msg, setMsg] = useState<{type: 'error' | 'success', text: string} | null>(null);

  // Load Daftar Desa
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.from('desa').select('*').order('nama');
      if (data) {
        setDesas(data);
        if (selectedDesaId) setSelectedDesa(data.find(d => d.id === selectedDesaId) || null);
      }
    };
    init();
  }, [selectedDesaId]);

  // Ambil Data Polygon dari Database (JSONB)
  const fetchData = useCallback(async () => {
    if (!selectedDesaId) return;
    setLoading(true);
    try {
      const [resP, resK] = await Promise.all([
        supabase.from('polygon_persil').select('id, geometry, letter_c_persil(nomor_persil, letter_c(nama_pemilik))').eq('desa_id', selectedDesaId),
        supabase.from('polygon_kohir').select('id, geometry, letter_c(nomor_c, nama_pemilik)').eq('desa_id', selectedDesaId)
      ]);

      const list: any[] = [];
      resP.data?.forEach(p => {
        if (p.geometry) list.push({
          id: p.id, type: 'persil', label: p.letter_c_persil?.nomor_persil, nama: p.letter_c_persil?.letter_c?.nama_pemilik,
          coords: p.geometry.coordinates[0].map((c: any) => [c[1], c[0]]), color: '#3b82f6'
        });
      });
      resK.data?.forEach(k => {
        if (k.geometry) list.push({
          id: k.id, type: 'kohir', label: k.letter_c?.nomor_c, nama: k.letter_c?.nama_pemilik,
          coords: k.geometry.coordinates[0].map((c: any) => [c[1], c[0]]), color: '#10b981'
        });
      });
      setPolygons(list);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [selectedDesaId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Saat selesai menggambar di peta
  const onDrawCreated = async (layer: any) => {
    const latlngs = layer.getLatLngs()[0];
    const coords = latlngs.map((l: any) => [l.lat, l.lng]);
    setTempPolygon(coords);
    
    // Ambil data referensi untuk dihubungkan ke gambar
    const table = drawMode === 'persil' ? 'letter_c_persil' : 'letter_c';
    const query = drawMode === 'persil' ? 'id, nomor_persil, letter_c(nama_pemilik)' : 'id, nomor_c, nama_pemilik';
    const { data } = await supabase.from(table).select(query).eq('desa_id', selectedDesaId);
    
    setRefList(data || []);
    setShowRefModal(true);
  };

  // Simpan ke Database
  const handleSave = async () => {
    if (!selectedRefId || !tempPolygon) return;
    setLoading(true);
    try {
      const geojson = {
        type: "Polygon",
        coordinates: [[...tempPolygon.map((p: any) => [p[1], p[0]]), [tempPolygon[0][1], tempPolygon[0][0]]]]
      };
      const isP = drawMode === 'persil';
      const { error } = await supabase.from(isP ? 'polygon_persil' : 'polygon_kohir').insert({
        desa_id: selectedDesaId, 
        [isP ? 'persil_polygon_id' : 'kohir_id']: selectedRefId, // Sesuaikan dengan kolom DB Anda
        geometry: geojson
      });
      if (error) throw error;
      setMsg({ type: 'success', text: 'Peta Bidang Tersimpan!' });
      setShowRefModal(false); setDrawMode(null); fetchData();
    } catch (e: any) { setMsg({ type: 'error', text: e.message }); }
    finally { setLoading(false); setTimeout(() => setMsg(null), 3000); }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[100dvh] lg:h-full bg-slate-50 overflow-hidden relative">
      
      {/* SIDEBAR KIRI */}
      <div className="w-full lg:w-[380px] bg-white border-r shadow-xl z-[1001] flex flex-col h-1/2 lg:h-full">
        <div className="p-5 border-b bg-slate-900 text-white">
          <div className="flex justify-between items-center mb-4">
            <h1 className="font-black text-sm tracking-widest flex items-center gap-2">
              <Layers size={18} className="text-blue-400"/> ETANA MAPS
            </h1>
            <button onClick={() => setShowDesaModal(true)} className="p-2 hover:bg-white/10 rounded-lg transition-all"><Search size={18}/></button>
          </div>
          <div className="bg-white/10 rounded-xl p-3 border border-white/10">
            <p className="text-[10px] font-bold text-blue-300 uppercase">Wilayah Aktif</p>
            <p className="text-sm font-black truncate">{selectedDesa?.nama || 'Pilih Desa...'}</p>
          </div>
        </div>

        <div className="flex border-b text-[10px] font-black tracking-widest">
          <button onClick={() => setActiveListTab('persil')} className={`flex-1 py-4 ${activeListTab === 'persil' ? 'border-b-4 border-blue-600 text-blue-600' : 'text-slate-400'}`}>PERSIL</button>
          <button onClick={() => setActiveListTab('kohir')} className={`flex-1 py-4 ${activeListTab === 'kohir' ? 'border-b-4 border-emerald-600 text-emerald-600' : 'text-slate-400'}`}>KOHIR</button>
        </div>

        <div className="p-4 bg-slate-50 flex justify-between items-center border-b">
          <span className="text-[10px] font-bold text-slate-400">TERPETAKAN: {polygons.filter(p => p.type === activeListTab).length}</span>
          <button onClick={() => setDrawMode(activeListTab)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-white font-bold text-[10px] shadow-lg ${activeListTab === 'persil' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
            <Plus size={14}/> TAMBAH
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {polygons.filter(p => p.type === activeListTab).map(p => (
            <div key={p.id} onClick={() => setMapCenter(p.coords[0])} className="p-4 bg-white border rounded-2xl hover:border-blue-500 cursor-pointer transition-all shadow-sm group">
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${p.type === 'persil' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  {p.type === 'persil' ? `P.${p.label}` : `C.${p.label}`}
                </span>
                <Navigation size={12} className="text-slate-300 group-hover:text-blue-500"/>
              </div>
              <p className="text-xs font-bold text-slate-800 uppercase">{p.nama}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AREA PETA KANAN */}
      <div className="flex-1 relative overflow-hidden h-1/2 lg:h-full">
        {drawMode && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
            <div className="bg-red-600 text-white px-6 py-2 rounded-full font-black text-[10px] flex items-center gap-3 animate-pulse shadow-2xl pointer-events-auto">
              MODE GAMBAR {drawMode.toUpperCase()} AKTIF - KLIK PETA UNTUK MEMBUAT SUDUT
              <button onClick={() => setDrawMode(null)} className="bg-white/20 p-1 rounded-full"><X size={14}/></button>
            </div>
          </div>
        )}

        <MapContainer center={PASURUAN_CENTER} zoom={18} maxZoom={21} zoomControl={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}" maxZoom={21} />
          <TileLayer url="https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}" maxZoom={21} />
          
          <MapController center={mapCenter} />
          <DrawTool isActive={!!drawMode} color={drawMode === 'persil' ? '#3b82f6' : '#10b981'} onCreated={onDrawCreated} />
          
          <FeatureGroup>
            {polygons.map(p => {
              // Hitung Luas Otomatis
              const turfPoly = turf.polygon([[...p.coords.map((c: any) => [c[1], c[0]]), [p.coords[0][1], p.coords[0][0]]]]);
              const luas = turf.area(turfPoly).toFixed(1);

              return (
                <Polygon 
                  key={p.id} 
                  positions={p.coords} 
                  pathOptions={{ color: p.color, fillColor: p.color, fillOpacity: 0.3, weight: 2 }}
                  eventHandlers={{
                    mouseover: (e) => { e.target.setStyle({ fillOpacity: 0.6, weight: 4, color: '#fff' }); },
                    mouseout: (e) => { e.target.setStyle({ fillOpacity: 0.3, weight: 2, color: p.color }); }
                  }}
                >
                  <Tooltip sticky direction="top" opacity={1}>
                    <div className="p-1 min-w-[120px] font-sans">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{p.type === 'persil' ? 'Data Persil' : 'Data Kohir'}</p>
                      <p className="text-xs font-black text-slate-800 uppercase mb-2">{p.nama}</p>
                      <div className="flex gap-1">
                        <span className="bg-slate-800 text-white px-1.5 py-0.5 rounded text-[9px] font-bold">{p.type === 'persil' ? 'P.' : 'C.'}{p.label}</span>
                        <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-[9px] font-bold italic">{luas} m²</span>
                      </div>
                    </div>
                  </Tooltip>
                </Polygon>
              );
            })}
          </FeatureGroup>
        </MapContainer>
      </div>

      {/* MODAL DESA & MODAL LINK DATA (Sama seperti sebelumnya dengan styling diperketat) */}
      {showRefModal && (
        <div className="fixed inset-0 bg-black/60 z-[2000] flex items-end lg:items-center justify-center backdrop-blur-sm">
          <div className="bg-white w-full lg:max-w-md rounded-t-[2rem] lg:rounded-[2rem] p-8 animate-in slide-in-from-bottom duration-300">
            <h3 className="font-black text-lg mb-1">HUBUNGKAN BIDANG</h3>
            <p className="text-[10px] font-bold text-slate-400 mb-6 uppercase tracking-widest">Pilih pemilik dari buku Letter C</p>
            <select className="w-full p-4 bg-slate-100 rounded-2xl mb-8 text-sm font-bold border-none outline-none focus:ring-2 ring-blue-500" onChange={(e) => setSelectedRefId(e.target.value)}>
              <option value="">-- PILIH NAMA --</option>
              {refList.map(r => (
                <option key={r.id} value={r.id}>
                  {drawMode === 'persil' ? `P.${r.nomor_persil} - ${r.letter_c?.nama_pemilik}` : `C.${r.nomor_c} - ${r.nama_pemilik}`}
                </option>
              ))}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setShowRefModal(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-xs uppercase text-slate-500">Batal</button>
              <button onClick={handleSave} disabled={!selectedRefId} className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-50">SIMPAN DATABASE</button>
            </div>
          </div>
        </div>
      )}

      {showDesaModal && (
        <div className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 animate-in zoom-in duration-200">
            <h3 className="font-black text-center mb-6 italic tracking-tighter">PILIH DESA</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {desas.map(d => (
                <button key={d.id} onClick={() => { setSelectedDesaId(d.id); setSelectedDesa(d); localStorage.setItem('last_selected_desa_id', d.id); setShowDesaModal(false); }}
                  className={`w-full text-left p-4 rounded-xl text-xs font-bold border ${selectedDesaId === d.id ? 'bg-blue-600 text-white' : 'bg-slate-50 border-slate-100'}`}>
                  {d.nama}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {msg && (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 rounded-full shadow-2xl z-[3000] text-white flex items-center gap-3 font-black text-[10px] tracking-widest animate-in slide-in-from-bottom duration-300 ${msg.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {msg.type === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>} {msg.text.toUpperCase()}
        </div>
      )}
    </div>
  );
};