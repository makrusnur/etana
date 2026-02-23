import { useEffect } from 'react'; 
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { LatLngTuple, LeafletMouseEvent } from 'leaflet';
import L from 'leaflet';

// 1. Icon Default (Biru Standar) untuk Mode Input/Entri Data
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// 2. Fungsi Membuat Icon Bulat Custom (Untuk Monitoring)
const createDotIcon = (color: string) => L.divIcon({
  className: 'custom-dot-marker',
  html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.4);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

interface LandMapProps {
  latitude: number;
  longitude: number;
  onChange?: (lat: number, lng: number) => void;
  allRecords?: any[];    
  berkasRecords?: any[]; 
}

function MapClickHandler({ onChange }: { onChange?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      if (onChange) onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterMap({ coords }: { coords: LatLngTuple }) {
  const map = useMap();
  useEffect(() => {
    map.setView(coords, map.getZoom());
    setTimeout(() => { map.invalidateSize(); }, 400);
  }, [coords, map]);
  return null;
}

export default function LandMap({ latitude, longitude, onChange, allRecords, berkasRecords }: LandMapProps) {
  
  // Logic agar koordinat selalu valid (Fallback ke Pasuruan)
  const position: LatLngTuple = [
    latitude && !isNaN(Number(latitude)) ? Number(latitude) : -7.6448, 
    longitude && !isNaN(Number(longitude)) ? Number(longitude) : 112.9061
  ];

  return (
    <div className="w-full h-full min-h-[350px] rounded-[2rem] overflow-hidden border border-slate-300 shadow-inner relative z-0">
      <MapContainer 
        center={position} 
        zoom={18} 
        maxZoom={21} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer 
          url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}" 
          maxZoom={21} 
          maxNativeZoom={20} 
        />
        <TileLayer 
          url="https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}" 
          maxZoom={21} 
          maxNativeZoom={20} 
        />
        
        {/* Render Marker PBB (Hijau) */}
        {allRecords && allRecords.map((r) => r.latitude && r.longitude && (
          <Marker key={`pbb-${r.id}`} position={[r.latitude, r.longitude]} icon={createDotIcon('#10b981')}>
            <Popup minWidth={200}>
              <div className="font-sans text-[11px] leading-tight p-1">
                <span className="bg-emerald-100 text-emerald-700 font-black px-2 py-0.5 rounded-full text-[9px]">SPPT PBB</span>
                <p className="font-bold text-sm text-slate-900 mt-2 uppercase">{r.nama_wp}</p>
                <p className="text-slate-500 mb-1 font-mono">{r.nop}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Render Marker Berkas (Biru) */}
        {berkasRecords && berkasRecords.map((b) => b.latitude && b.longitude && (
          <Marker key={`berkas-${b.id}`} position={[b.latitude, b.longitude]} icon={createDotIcon('#3b82f6')}>
            <Popup minWidth={200}>
              <div className="font-sans text-[11px] p-1">
                <span className="bg-blue-100 text-blue-700 font-black px-2 py-0.5 rounded-full text-[9px]">BERKAS DESA</span>
                <p className="font-bold text-sm text-slate-900 mt-2 uppercase">{b.atas_nama_nop || b.nama_pemohon}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Marker untuk Mode Input (Pin Besar) */}
        {!allRecords && !berkasRecords && (
          <Marker position={position}>
            <Popup>
              <div className="text-center font-sans p-1">
                <p className="font-black text-blue-600 text-[10px] uppercase">Lokasi Terpilih</p>
                <div className="mt-2 py-1 px-2 bg-slate-100 rounded text-[9px] font-mono text-slate-600">
                  {position[0].toFixed(6)}, {position[1].toFixed(6)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}
        
        <MapClickHandler onChange={onChange} />
        <RecenterMap coords={position} />
      </MapContainer> {/* <-- SUDAH DIPERBAIKI DI SINI */}
    </div>
  );
}