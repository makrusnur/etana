import { useEffect } from 'react'; 
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { LatLngTuple, LeafletMouseEvent } from 'leaflet';
import L from 'leaflet';

// Fix Icon agar muncul dengan benar
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface LandMapProps {
  latitude: number;
  longitude: number;
  onChange?: (lat: number, lng: number) => void;
}

// Handler klik peta (untuk ganti posisi pin)
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
    setTimeout(() => { map.invalidateSize(); }, 400);
  }, [coords, map]);
  return null;
}

export default function LandMap({ latitude, longitude, onChange }: LandMapProps) {
  // Posisi default ke Pasuruan jika latitude/longitude kosong
  const position: LatLngTuple = [latitude || -7.6448, longitude || 112.9061];

  return (
    /* Ukuran tetap mengikuti container modal Bapak */
    <div className="w-full h-full min-h-[500px] rounded-[2rem] overflow-hidden border border-slate-300 shadow-inner relative">
      
      <MapContainer 
        center={position} 
        zoom={18} 
        maxZoom={21} 
        style={{ height: "100%", width: "100%" }}
      >
        {/* Google Maps Satelit HD */}
        <TileLayer 
            url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
            maxZoom={21}
            maxNativeZoom={20}
            attribution="&copy; Google Maps"
        />
        
        {/* Layer Label Jalan (Hybrid) */}
        <TileLayer 
            url="https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}"
            maxZoom={21}
            maxNativeZoom={20}
        />
        
        <Marker position={position}>
          <Popup minWidth={200}>
            <div className="font-sans p-1 text-center">
              <p className="font-black text-blue-600 uppercase text-[10px]">Lokasi Terpilih</p>
              <code className="block bg-slate-100 p-1 rounded mt-1 text-[9px] font-bold text-slate-700">
                {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </code>
            </div>
          </Popup>
        </Marker>
        
        <MapClickHandler onChange={onChange} />
        <RecenterMap coords={position} />
      </MapContainer>
    </div>
  );
}