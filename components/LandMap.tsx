import { useState, useEffect } from 'react'; // Hapus 'React' jika tidak dipanggil langsung
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { Maximize, Minimize } from 'lucide-react';
import { LatLngTuple, LeafletMouseEvent } from 'leaflet';

interface LandMapProps {
  latitude: number;
  longitude: number;
  onChange?: (lat: number, lng: number) => void;
}

// Handler klik peta
function MapClickHandler({ onChange }: { onChange?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      if (onChange) onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Fungsi untuk update posisi kamera
function RecenterMap({ coords }: { coords: LatLngTuple }) {
  const map = useMap();
  useEffect(() => {
    map.setView(coords, map.getZoom());
    // Memastikan peta ter-render sempurna saat ukuran container berubah
    setTimeout(() => { map.invalidateSize(); }, 400);
  }, [coords, map]);
  return null;
}

// Gunakan export default agar pages/LandData.tsx tidak error
export default function LandMap({ latitude, longitude, onChange }: LandMapProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const position: LatLngTuple = [latitude || -6.2000, longitude || 106.8166];

  return (
    <div className={`relative transition-all duration-300 ease-in-out ${
      isFullScreen 
        ? "fixed inset-0 z-[9999] bg-white w-screen h-screen" 
        : "w-full h-[550px] rounded-xl overflow-hidden border border-slate-300 shadow-lg"
    }`}>
      
      <button 
        type="button"
        onClick={() => setIsFullScreen(!isFullScreen)}
        className="absolute top-4 right-4 z-[1000] bg-white p-2 rounded-md shadow-md hover:bg-slate-100 flex items-center gap-2 font-bold text-xs"
      >
        {isFullScreen ? <><Minimize size={16}/> Kecilkan</> : <><Maximize size={16}/> Fullscreen</>}
      </button>

      <MapContainer center={position} zoom={18} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; Esri'
        />
        <TileLayer 
          url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" 
        />
        
        <Marker position={position}>
          <Popup minWidth={300}>
            <div className="font-sans p-1">
              <strong className="text-blue-600">Lokasi Bidang Tanah</strong>
              <p className="text-xs text-slate-500 mt-1">Klik tempat lain di peta untuk mengubah posisi koordinat.</p>
            </div>
          </Popup>
        </Marker>
        
        <MapClickHandler onChange={onChange} />
        <RecenterMap coords={position} />
      </MapContainer>
    </div>
  );
}