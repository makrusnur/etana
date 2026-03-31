// pages/LetterC/PetaPersil.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MapPin, Loader2, Search, Layers, Trash2, AlertCircle,
  ZoomIn, ZoomOut, Navigation, X, Eye, EyeOff
} from 'lucide-react';
import { supabase } from '../../services/db';
import { Kecamatan, Desa, LetterC, LetterCPersil } from '../../types';
import { MapContainer, TileLayer, FeatureGroup, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Koordinat Kabupaten Pasuruan
const DEFAULT_CENTER: [number, number] = [-7.7307, 112.8365];
const DEFAULT_ZOOM = 10;

// Interface untuk polygon
interface PolygonData {
  id: string;
  jenis: 'persil' | 'kohir';
  refId: string;
  refNomor: string;
  refNama: string;
  coordinates: [number, number][][];
  color: string;
  fillColor: string;
}

// Komponen untuk mengontrol peta dari luar
const MapController = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      map.setView(center, zoom);
    }
  }, [map, center, zoom]);
  
  return null;
};

// Komponen untuk inisialisasi Leaflet Draw (menggunakan global L dari CDN)
const DrawControl = ({ 
  onCreated, 
  drawMode,
  isActive 
}: { 
  onCreated: (layer: any) => void;
  drawMode: 'persil' | 'kohir' | null;
  isActive: boolean;
}) => {
  const map = useMap();
  const drawControlRef = useRef<any>(null);
  const [isDrawReady, setIsDrawReady] = useState(false);

  // Cek apakah Leaflet Draw sudah tersedia dari window
  useEffect(() => {
    const checkDraw = () => {
      // Leaflet Draw akan menambahkan L.Control.Draw ke global L
      const LGlobal = (window as any).L;
      if (LGlobal && LGlobal.Control && LGlobal.Control.Draw) {
        setIsDrawReady(true);
      } else {
        setTimeout(checkDraw, 100);
      }
    };
    checkDraw();
  }, []);

  useEffect(() => {
    if (!map || !isDrawReady) return;

    // Hapus draw control yang lama jika ada
    if (drawControlRef.current) {
      map.removeControl(drawControlRef.current);
      drawControlRef.current = null;
    }

    // Hanya aktifkan draw control jika isActive true dan drawMode dipilih
    if (!isActive || !drawMode) return;

    // Warna berdasarkan mode
    const color = drawMode === 'persil' ? '#3b82f6' : '#10b981';
    const fillColor = drawMode === 'persil' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)';

    // Ambil Draw dari window.L
    const LGlobal = (window as any).L;
    const DrawControlClass = LGlobal.Control.Draw;

    const drawControl = new DrawControlClass({
      position: 'topright',
      draw: {
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: false,
        polyline: false,
        polygon: {
          allowIntersection: false,
          showArea: true,
          shapeOptions: {
            color: color,
            fillColor: fillColor,
            fillOpacity: 0.3,
            weight: 3
          }
        }
      },
      edit: {
        featureGroup: null,
        edit: false,
        remove: false
      }
    });

    drawControlRef.current = drawControl;
    map.addControl(drawControl);

    return () => {
      if (drawControlRef.current) {
        map.removeControl(drawControlRef.current);
        drawControlRef.current = null;
      }
    };
  }, [map, drawMode, isActive, isDrawReady]);

  // Event listener untuk polygon yang dibuat
  useEffect(() => {
    if (!map || !isActive || !isDrawReady) return;

    const handleCreated = (e: any) => {
      onCreated(e.layer);
    };

    map.on('draw:created', handleCreated);

    return () => {
      map.off('draw:created', handleCreated);
    };
  }, [map, isActive, isDrawReady, onCreated]);

  return null;
};

export const PetaPersil = () => {
  // States
  const [loading, setLoading] = useState(false);
  const [kecamatans, setKecamatans] = useState<Kecamatan[]>([]);
  const [desas, setDesas] = useState<Desa[]>([]);
  const [selectedDesaId, setSelectedDesaId] = useState<string | null>(
    localStorage.getItem('last_selected_desa_id') || null
  );
  const [selectedDesa, setSelectedDesa] = useState<Desa | null>(null);
  const [selectedKecamatan, setSelectedKecamatan] = useState<Kecamatan | null>(null);
  const [showDesaModal, setShowDesaModal] = useState(false);
  const [searchDesa, setSearchDesa] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // State untuk peta
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  
  // State untuk data
  const [kohirList, setKohirList] = useState<LetterC[]>([]);
  const [persilList, setPersilList] = useState<LetterCPersil[]>([]);
  const [polygons, setPolygons] = useState<PolygonData[]>([]);
  
  // State untuk mode menggambar
  const [drawMode, setDrawMode] = useState<'persil' | 'kohir' | null>(null);
  const [tempPolygon, setTempPolygon] = useState<[number, number][][] | null>(null);
  const [showRefModal, setShowRefModal] = useState(false);
  const [selectedRefId, setSelectedRefId] = useState<string>('');
  
  // State untuk layer visibility
  const [showKohirLayer, setShowKohirLayer] = useState(true);
  const [showPersilLayer, setShowPersilLayer] = useState(true);
  
  // Ref untuk FeatureGroup
  const featureGroupRef = useRef<L.FeatureGroup>(null);

  // Fetch wilayah
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const { data: kec } = await supabase.from('kecamatan').select('*').order('nama');
        const { data: des } = await supabase.from('desa').select('*').order('nama');
        if (kec) setKecamatans(kec);
        if (des) setDesas(des);
      } catch (err: any) {
        console.error("Error fetching regions:", err.message);
        setError("Gagal memuat data wilayah");
      }
    };
    fetchRegions();
  }, []);

  // Fetch data kohir dan persil berdasarkan desa
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedDesaId) return;
      
      try {
        // Fetch kohir
        const { data: kohirData } = await supabase
          .from('letter_c')
          .select('*')
          .eq('desa_id', selectedDesaId)
          .order('nomor_c');
        
        if (kohirData) setKohirList(kohirData);
        
        // Fetch persil
        const { data: persilData } = await supabase
          .from('letter_c_persil')
          .select('*, letter_c(nomor_c, nama_pemilik)')
          .eq('letter_c_id', selectedDesaId);
        
        if (persilData) setPersilList(persilData);
        
        // Fetch polygon yang sudah tersimpan
        await fetchPolygons();
        
      } catch (err: any) {
        console.error("Error fetching data:", err);
      }
    };
    
    fetchData();
  }, [selectedDesaId]);

  // Fetch polygon dari database
  const fetchPolygons = async () => {
    if (!selectedDesaId) return;
    
    try {
      const loadedPolygons: PolygonData[] = [];
      
      // Fetch polygon persil
      const { data: persilPolygons } = await supabase
        .from('polygon_persil')
        .select('*')
        .eq('desa_id', selectedDesaId);
      
      if (persilPolygons) {
        for (const p of persilPolygons) {
          const persil = persilList.find(ps => ps.id === p.persil_id);
          let coordinates: [number, number][][] = [];
          try {
            if (p.geometry && p.geometry.coordinates) {
              coordinates = p.geometry.coordinates.map((ring: number[][]) =>
                ring.map((coord: number[]) => [coord[1], coord[0]] as [number, number])
              );
            }
          } catch (err) {
            console.error("Error parsing coordinates:", err);
          }
          
          loadedPolygons.push({
            id: p.id,
            jenis: 'persil',
            refId: p.persil_id,
            refNomor: persil?.nomor_persil || '-',
            refNama: persil?.letter_c?.nama_pemilik || '-',
            coordinates,
            color: '#3b82f6',
            fillColor: 'rgba(59, 130, 246, 0.2)'
          });
        }
      }
      
      // Fetch polygon kohir
      const { data: kohirPolygons } = await supabase
        .from('polygon_kohir')
        .select('*')
        .eq('desa_id', selectedDesaId);
      
      if (kohirPolygons) {
        for (const k of kohirPolygons) {
          const kohir = kohirList.find(kh => kh.id === k.kohir_id);
          let coordinates: [number, number][][] = [];
          try {
            if (k.geometry && k.geometry.coordinates) {
              coordinates = k.geometry.coordinates.map((ring: number[][]) =>
                ring.map((coord: number[]) => [coord[1], coord[0]] as [number, number])
              );
            }
          } catch (err) {
            console.error("Error parsing coordinates:", err);
          }
          
          loadedPolygons.push({
            id: k.id,
            jenis: 'kohir',
            refId: k.kohir_id,
            refNomor: kohir?.nomor_c || '-',
            refNama: kohir?.nama_pemilik || '-',
            coordinates,
            color: '#10b981',
            fillColor: 'rgba(16, 185, 129, 0.2)'
          });
        }
      }
      
      setPolygons(loadedPolygons);
      
    } catch (err: any) {
      console.error("Error fetching polygons:", err);
    }
  };

  // Handle polygon created
  const handleCreated = useCallback((layer: any) => {
    const latLngs = layer.getLatLngs()[0];
    const coordinates = latLngs.map((ll: L.LatLng) => [ll.lat, ll.lng] as [number, number]);
    coordinates.push(coordinates[0]);
    
    setTempPolygon([coordinates]);
    
    if (featureGroupRef.current) {
      featureGroupRef.current.clearLayers();
    }
    
    setDrawMode(null);
    setShowRefModal(true);
  }, []);

  // Simpan polygon ke database
  const savePolygon = async () => {
    if (!selectedDesaId || !selectedRefId || !tempPolygon) {
      setError('Lengkapi data terlebih dahulu');
      return;
    }
    
    setLoading(true);
    
    try {
      const coordinates = tempPolygon[0].map(point => [point[1], point[0]]);
      coordinates.push(coordinates[0]);
      
      const geometry = {
        type: "Polygon",
        coordinates: [coordinates]
      };
      
      if (drawMode === 'persil') {
        const { data, error } = await supabase
          .from('polygon_persil')
          .insert({
            desa_id: selectedDesaId,
            persil_id: selectedRefId,
            geometry: geometry
          })
          .select()
          .single();
        
        if (error) throw error;
        
        const persil = persilList.find(p => p.id === selectedRefId);
        const newPolygon: PolygonData = {
          id: data.id,
          jenis: 'persil',
          refId: selectedRefId,
          refNomor: persil?.nomor_persil || '-',
          refNama: persil?.letter_c?.nama_pemilik || '-',
          coordinates: tempPolygon,
          color: '#3b82f6',
          fillColor: 'rgba(59, 130, 246, 0.2)'
        };
        
        setPolygons([...polygons, newPolygon]);
        
      } else if (drawMode === 'kohir') {
        const { data, error } = await supabase
          .from('polygon_kohir')
          .insert({
            desa_id: selectedDesaId,
            kohir_id: selectedRefId,
            geometry: geometry
          })
          .select()
          .single();
        
        if (error) throw error;
        
        const kohir = kohirList.find(k => k.id === selectedRefId);
        const newPolygon: PolygonData = {
          id: data.id,
          jenis: 'kohir',
          refId: selectedRefId,
          refNomor: kohir?.nomor_c || '-',
          refNama: kohir?.nama_pemilik || '-',
          coordinates: tempPolygon,
          color: '#10b981',
          fillColor: 'rgba(16, 185, 129, 0.2)'
        };
        
        setPolygons([...polygons, newPolygon]);
      }
      
      setSuccess('Polygon berhasil disimpan');
      setTimeout(() => setSuccess(null), 3000);
      
      setShowRefModal(false);
      setTempPolygon(null);
      setSelectedRefId('');
      
    } catch (err: any) {
      console.error("Error saving polygon:", err);
      setError('Gagal menyimpan: ' + err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Hapus polygon
  const deletePolygon = async (id: string, jenis: 'persil' | 'kohir') => {
    if (!confirm('Yakin ingin menghapus polygon ini?')) return;
    
    setLoading(true);
    
    try {
      const table = jenis === 'persil' ? 'polygon_persil' : 'polygon_kohir';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setPolygons(polygons.filter(p => p.id !== id));
      setSuccess('Polygon berhasil dihapus');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err: any) {
      console.error("Error deleting polygon:", err);
      setError('Gagal menghapus: ' + err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const visiblePolygons = polygons.filter(p => {
    if (p.jenis === 'persil') return showPersilLayer;
    if (p.jenis === 'kohir') return showKohirLayer;
    return true;
  });

  const filteredKecamatans = kecamatans
    .map(kec => ({
      ...kec,
      desas: desas.filter(d => 
        d.kecamatan_id === kec.id && 
        d.nama.toLowerCase().includes(searchDesa.toLowerCase())
      )
    }))
    .filter(kec => kec.desas.length > 0);

  const DesaModal = () => (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-end lg:items-center justify-center" onClick={() => setShowDesaModal(false)}>
      <div className="bg-white w-full max-w-lg rounded-t-2xl lg:rounded-2xl max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center bg-white sticky top-0">
          <h3 className="font-bold text-lg">Pilih Desa</h3>
          <button onClick={() => setShowDesaModal(false)} className="p-2 hover:bg-zinc-100 rounded-full">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18}/>
            <input 
              className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm" 
              placeholder="Cari desa..."
              value={searchDesa}
              onChange={(e) => setSearchDesa(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        
        <div className="overflow-y-auto p-4 max-h-[60vh]">
          {filteredKecamatans.length === 0 ? (
            <div className="p-4 text-center text-zinc-400 text-sm">Tidak ada kecamatan</div>
          ) : (
            filteredKecamatans.map(k => (
              <div key={k.id} className="mb-6">
                <h4 className="text-xs font-bold text-zinc-500 mb-2 px-2">{k.nama}</h4>
                <div className="space-y-1">
                  {k.desas.map(d => (
                    <button
                      key={d.id}
                      onClick={() => {
                        setSelectedDesaId(d.id);
                        localStorage.setItem('last_selected_desa_id', d.id);
                        setSelectedDesa(d);
                        setSelectedKecamatan(k);
                        setShowDesaModal(false);
                        setSearchDesa('');
                        setMapCenter(DEFAULT_CENTER);
                        setMapZoom(DEFAULT_ZOOM);
                        setPolygons([]);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center justify-between ${
                        selectedDesaId === d.id 
                          ? 'bg-zinc-900 text-white' 
                          : 'hover:bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <MapPin size={16} className={selectedDesaId === d.id ? 'text-white' : 'text-zinc-400'} />
                        {d.nama}
                      </span>
                      {selectedDesaId === d.id && (
                        <span className="text-xs bg-white text-zinc-900 px-2 py-1 rounded-full">Dipilih</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const RefModal = () => (
    <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center" onClick={() => setShowRefModal(false)}>
      <div className="bg-white w-full max-w-md rounded-2xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">
            Pilih {drawMode === 'persil' ? 'Persil' : 'Kohir'}
          </h3>
          <button onClick={() => setShowRefModal(false)} className="p-1 hover:bg-zinc-100 rounded-full">
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {drawMode === 'persil' ? (
            persilList.length === 0 ? (
              <p className="text-center text-zinc-500 py-4">Belum ada data persil. Silakan tambahkan persil terlebih dahulu.</p>
            ) : (
              persilList.map(p => {
                const kohir = kohirList.find(k => k.id === p.letter_c_id);
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedRefId(p.id);
                      savePolygon();
                    }}
                    className="w-full text-left p-3 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all"
                  >
                    <div className="font-medium">Persil No. {p.nomor_persil}</div>
                    <div className="text-sm text-zinc-500">{p.jenis_tanah} • {p.luas_meter}m²</div>
                    {kohir && (
                      <div className="text-xs text-zinc-400 mt-1">Kohir: {kohir.nomor_c} - {kohir.nama_pemilik}</div>
                    )}
                  </button>
                );
              })
            )
          ) : (
            kohirList.length === 0 ? (
              <p className="text-center text-zinc-500 py-4">Belum ada data kohir. Silakan tambahkan kohir terlebih dahulu.</p>
            ) : (
              kohirList.map(k => (
                <button
                  key={k.id}
                  onClick={() => {
                    setSelectedRefId(k.id);
                    savePolygon();
                  }}
                  className="w-full text-left p-3 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-all"
                >
                  <div className="font-medium">Kohir No. {k.nomor_c}</div>
                  <div className="text-sm text-zinc-500">{k.nama_pemilik}</div>
                  <div className="text-xs text-zinc-400 mt-1">{k.alamat_pemilik || '-'}</div>
                </button>
              ))
            )
          )}
        </div>
        
        {loading && (
          <div className="mt-4 flex justify-center">
            <Loader2 className="animate-spin text-zinc-500" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA]">
      <div className="p-4 lg:p-6 border-b border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-2xl lg:text-3xl font-black tracking-tight">
              Peta {selectedDesa ? selectedDesa.nama : "Persil & Kohir"}
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              {selectedDesa ? `Kec. ${selectedKecamatan?.nama || '-'}` : "Pilih desa untuk mulai menggambar"}
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowDesaModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-all"
            >
              <MapPin size={16} />
              {selectedDesa ? selectedDesa.nama : "Pilih Desa"}
            </button>
          </div>
        </div>
        
        {success && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>

      {selectedDesaId && (
        <div className="p-4 bg-white border-b border-zinc-200 flex flex-wrap gap-3">
          <button
            onClick={() => setDrawMode(drawMode === 'persil' ? null : 'persil')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              drawMode === 'persil' ? 'bg-blue-600 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            <div className="w-4 h-4 rounded-sm bg-blue-500"></div>
            Gambar Persil
          </button>
          
          <button
            onClick={() => setDrawMode(drawMode === 'kohir' ? null : 'kohir')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              drawMode === 'kohir' ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            <div className="w-4 h-4 rounded-sm bg-emerald-500"></div>
            Gambar Kohir
          </button>
          
          {drawMode && (
            <div className="ml-2 px-3 py-2 bg-yellow-50 text-yellow-700 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              Mode menggambar aktif: {drawMode === 'persil' ? 'Persil (Biru)' : 'Kohir (Hijau)'}
            </div>
          )}
          
          <div className="flex-1"></div>
          
          <div className="flex gap-2">
            <button onClick={() => setMapZoom(z => Math.min(z + 1, 18))} className="p-2 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50">
              <ZoomIn size={18} />
            </button>
            <button onClick={() => setMapZoom(z => Math.max(z - 1, 5))} className="p-2 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50">
              <ZoomOut size={18} />
            </button>
            <button onClick={() => { setMapCenter(DEFAULT_CENTER); setMapZoom(DEFAULT_ZOOM); }} className="p-2 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50">
              <Navigation size={18} />
            </button>
          </div>
        </div>
      )}

      {selectedDesaId && polygons.length > 0 && (
        <div className="p-3 bg-white border-b border-zinc-200 flex gap-4 text-sm">
          <button onClick={() => setShowKohirLayer(!showKohirLayer)} className="flex items-center gap-2">
            {showKohirLayer ? <Eye size={16} /> : <EyeOff size={16} />}
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span>Kohir ({polygons.filter(p => p.jenis === 'kohir').length})</span>
          </button>
          <button onClick={() => setShowPersilLayer(!showPersilLayer)} className="flex items-center gap-2">
            {showPersilLayer ? <Eye size={16} /> : <EyeOff size={16} />}
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Persil ({polygons.filter(p => p.jenis === 'persil').length})</span>
          </button>
        </div>
      )}

      <div className="flex-1 relative bg-zinc-100" style={{ minHeight: 'calc(100vh - 280px)' }}>
        {!selectedDesaId ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Layers size={64} className="text-zinc-300" />
            <p className="mt-4 text-zinc-400 font-medium">Pilih desa untuk mulai menggambar peta</p>
            <button onClick={() => setShowDesaModal(true)} className="mt-4 bg-zinc-900 text-white px-6 py-3 rounded-xl text-sm font-black uppercase">
              Pilih Desa
            </button>
          </div>
        ) : (
          <MapContainer center={mapCenter} zoom={mapZoom} style={{ width: '100%', height: '100%' }} className="z-0">
            <MapController center={mapCenter} zoom={mapZoom} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              maxZoom={19}
            />
            <DrawControl onCreated={handleCreated} drawMode={drawMode} isActive={drawMode !== null} />
            <FeatureGroup ref={featureGroupRef}>
              {visiblePolygons.map(polygon => (
                <Polygon
                  key={polygon.id}
                  positions={polygon.coordinates}
                  pathOptions={{ color: polygon.color, fillColor: polygon.fillColor, fillOpacity: 0.3, weight: 3 }}
                  eventHandlers={{ click: () => alert(`${polygon.jenis === 'persil' ? '📦 Persil' : '👤 Kohir'}\nNo: ${polygon.refNomor}\nNama: ${polygon.refNama}`) }}
                />
              ))}
            </FeatureGroup>
          </MapContainer>
        )}
      </div>
      
      {selectedDesaId && polygons.length > 0 && (
        <div className="p-4 border-t border-zinc-200 bg-white max-h-[200px] overflow-y-auto">
          <h4 className="text-sm font-bold mb-3">Daftar Polygon</h4>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
            {polygons.map(polygon => (
              <div key={polygon.id} className={`flex items-center justify-between p-3 rounded-lg border-l-4 ${polygon.jenis === 'persil' ? 'border-blue-500 bg-blue-50/30' : 'border-emerald-500 bg-emerald-50/30'}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${polygon.jenis === 'persil' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                    <span className="text-sm font-medium">{polygon.jenis === 'persil' ? '📦 Persil' : '👤 Kohir'} No. {polygon.refNomor}</span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1 truncate">{polygon.refNama}</div>
                </div>
                <button onClick={() => deletePolygon(polygon.id, polygon.jenis)} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {showDesaModal && <DesaModal />}
      {showRefModal && <RefModal />}
    </div>
  );
};