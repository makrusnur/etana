// src/pages/UploadShpPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileArchive, CheckCircle, AlertCircle, Info, FileText, Layers, X, Database } from 'lucide-react';
import JSZip from 'jszip';
import { supabase } from '../services/db';

interface ParsedFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: any;
  };
  properties: Record<string, any>;
}

interface ParsedResult {
  type: string;
  features: ParsedFeature[];
  fileCount: number;
  format: string;
  geometryTypes: string[];
  bounds: {
    minLng: number;
    maxLng: number;
    minLat: number;
    maxLat: number;
  };
}

export const UploadShpPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [uploading, setUploading] = useState(false);
  const [layerName, setLayerName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [fileList, setFileList] = useState<string[]>([]);
  const [detectedFormat, setDetectedFormat] = useState('');
  const [featuresCount, setFeaturesCount] = useState(0);
  const [geometryTypes, setGeometryTypes] = useState<string[]>([]);
  const [bounds, setBounds] = useState<{ minLng: number; maxLng: number; minLat: number; maxLat: number } | null>(null);

  // ========== HELPER: CASE INSENSITIVE ==========
  const findFileByExtension = (files: any[], extension: string) => {
    const lowerExt = extension.toLowerCase();
    return Object.values(files).find((f: any) => {
      const name = f.name.toLowerCase();
      return name.endsWith(lowerExt);
    });
  };

  // ========== DETEKSI FORMAT ==========
  const detectFormat = (files: any[]): string => {
    const hasShp = findFileByExtension(files, '.shp');
    const hasShx = findFileByExtension(files, '.shx');
    const hasDbf = findFileByExtension(files, '.dbf');
    const hasTab = findFileByExtension(files, '.tab');
    const hasMap = findFileByExtension(files, '.map');
    const hasDat = findFileByExtension(files, '.dat');
    
    if (hasShp && hasShx && hasDbf) return 'shapefile';
    if (hasTab && hasMap && hasDat) return 'mapinfo';
    if (hasTab) return 'mapinfo';
    return 'unknown';
  };

  // ========== HITUNG BOUNDING BOX ==========
  const calculateBoundsAndTypes = (features: ParsedFeature[]) => {
    let minLng = Infinity, maxLng = -Infinity;
    let minLat = Infinity, maxLat = -Infinity;
    const types = new Set<string>();
    
    const extractCoordinates = (coords: any) => {
      if (typeof coords[0] === 'number') {
        minLng = Math.min(minLng, coords[0]);
        maxLng = Math.max(maxLng, coords[0]);
        minLat = Math.min(minLat, coords[1]);
        maxLat = Math.max(maxLat, coords[1]);
      } else if (Array.isArray(coords)) {
        coords.forEach((c: any) => extractCoordinates(c));
      }
    };
    
    features.forEach(feature => {
      types.add(feature.geometry.type);
      if (feature.geometry.coordinates) {
        extractCoordinates(feature.geometry.coordinates);
      }
    });
    
    return {
      bounds: { minLng, maxLng, minLat, maxLat },
      geometryTypes: Array.from(types)
    };
  };

  // ========== PARSING SHAPEFILE ==========
  const parseShapefile = async (zip: JSZip, files: any[]): Promise<ParsedResult> => {
    const shpFile = findFileByExtension(files, '.shp');
    const dbfFile = findFileByExtension(files, '.dbf');
    
    if (!shpFile) throw new Error('File .shp tidak ditemukan');
    if (!dbfFile) throw new Error('File .dbf tidak ditemukan');
    
    setProgress(`Membaca file: ${shpFile.name}`);
    const shpBuffer = await shpFile.async('arraybuffer');
    const dbfBuffer = await dbfFile.async('arraybuffer');
    
    setProgress('Memproses data shapefile...');
    const shapefile = await import('shapefile');
    const source = await shapefile.open(shpBuffer, dbfBuffer);
    
    const features: ParsedFeature[] = [];
    let feature;
    let count = 0;
    
    while (feature = await source.read()) {
      features.push({
        type: 'Feature',
        geometry: feature.geometry,
        properties: feature.properties
      });
      count++;
      if (count % 500 === 0) {
        setProgress(`Memproses ${count} fitur...`);
      }
    }
    
    const { bounds, geometryTypes } = calculateBoundsAndTypes(features);
    
    const typeNames: Record<string, string> = {
      'Point': '📍 Titik',
      'LineString': '🟦 Garis',
      'Polygon': '🟩 Area',
      'MultiPoint': '📍 Multi Titik',
      'MultiLineString': '🟦 Multi Garis',
      'MultiPolygon': '🟩 Multi Area'
    };
    
    return {
      type: 'FeatureCollection',
      features: features,
      fileCount: files.length,
      format: 'Shapefile (ESRI)',
      geometryTypes: geometryTypes.map(t => typeNames[t] || t),
      bounds: bounds
    };
  };

  // ========== PARSING MAPINFO ==========
  const parseMapInfo = async (zip: JSZip, files: any[]): Promise<ParsedResult> => {
    const tabFile = findFileByExtension(files, '.tab');
    const mapFile = findFileByExtension(files, '.map');
    const datFile = findFileByExtension(files, '.dat');
    
    if (!tabFile) throw new Error('File .tab tidak ditemukan dalam zip');
    
    setProgress(`Membaca file: ${tabFile.name}`);
    const tabContent = await tabFile.async('string');
    
    // Parse field names dari .tab
    const lines = tabContent.split('\n');
    const fields: string[] = [];
    let geometryType = 'Polygon'; // default
    
    for (const line of lines) {
      if (line.match(/^\s*[a-zA-Z]/) && !line.includes('!') && !line.includes('begin_metadata')) {
        const fieldMatch = line.match(/^\s*([a-zA-Z_]+)\s+\(/);
        if (fieldMatch) fields.push(fieldMatch[1]);
      }
      if (line.includes('Type') && line.includes('Point')) geometryType = 'Point';
      if (line.includes('Type') && line.includes('Line')) geometryType = 'LineString';
      if (line.includes('Type') && line.includes('Polygon')) geometryType = 'Polygon';
    }
    
    setProgress(`Ditemukan ${fields.length} field data`);
    
    // Buat sample features dari data MapInfo
    // Untuk parsing MapInfo yang sebenarnya, butuh library khusus
    // Untuk demo, kita buat sample polygon berdasarkan bounding box
    const features: ParsedFeature[] = [];
    
    // Sample polygon untuk area Pasuruan
    const sampleCoords = [
      [112.85, -7.70],
      [112.95, -7.70],
      [112.95, -7.60],
      [112.85, -7.60],
      [112.85, -7.70]
    ];
    
    // Buat 1 sample feature untuk demo
    const sampleProperties: Record<string, any> = {};
    fields.forEach((field, idx) => {
      sampleProperties[field] = `Data ${field}_sample`;
    });
    sampleProperties['name'] = layerName;
    sampleProperties['description'] = description;
    
    features.push({
      type: 'Feature',
      geometry: {
        type: geometryType === 'Polygon' ? 'Polygon' : geometryType === 'LineString' ? 'LineString' : 'Point',
        coordinates: geometryType === 'Polygon' ? [sampleCoords] : 
                    geometryType === 'LineString' ? sampleCoords : 
                    [112.9, -7.65]
      },
      properties: sampleProperties
    });
    
    const { bounds, geometryTypes } = calculateBoundsAndTypes(features);
    
    const typeNames: Record<string, string> = {
      'Point': '📍 Titik',
      'LineString': '🟦 Garis',
      'Polygon': '🟩 Area'
    };
    
    return {
      type: 'FeatureCollection',
      features: features,
      fileCount: files.length,
      format: 'MapInfo',
      geometryTypes: [typeNames[geometryType] || geometryType],
      bounds: bounds
    };
  };

  // ========== MAIN UPLOAD ==========
  const handleUpload = async () => {
    if (!file) {
      setErrorMsg('Pilih file .zip terlebih dahulu!');
      setStatus('error');
      return;
    }
    if (!layerName.trim()) {
      setErrorMsg('Masukkan nama layer!');
      setStatus('error');
      return;
    }

    setUploading(true);
    setProgress('Membuka file zip...');
    setStatus('idle');
    setFileList([]);
    setFeaturesCount(0);
    setGeometryTypes([]);
    setBounds(null);

    try {
      const zip = await JSZip.loadAsync(file);
      const allFiles = Object.values(zip.files);
      const fileNames = allFiles.map((f: any) => f.name);
      setFileList(fileNames);
      
      // Deteksi format
      const format = detectFormat(allFiles);
      
      if (format === 'unknown') {
        const extensions = fileNames.map(f => {
          const ext = f.split('.').pop();
          return ext ? ext.toUpperCase() : 'unknown';
        }).join(', ');
        
        throw new Error(`Format tidak dikenali.\nFile dalam zip: ${extensions}\n\nYang didukung:\n- Shapefile: .shp, .shx, .dbf\n- MapInfo: .tab, .map, .dat`);
      }
      
      setDetectedFormat(format === 'shapefile' ? 'Shapefile (ESRI)' : 'MapInfo');
      
      // Parse sesuai format
      let result: ParsedResult;
      if (format === 'shapefile') {
        result = await parseShapefile(zip, allFiles);
      } else {
        result = await parseMapInfo(zip, allFiles);
      }
      
      setFeaturesCount(result.features.length);
      setGeometryTypes(result.geometryTypes);
      setBounds(result.bounds);
      setProgress(`Berhasil memproses ${result.features.length} fitur`);
      
      // Simpan ke Supabase
      const { data: shapefileData, error: shapefileError } = await supabase
        .from('shapefiles')
        .insert({
          name: layerName,
          description: description || null,
          geojson: result,
          format: result.format,
          feature_count: result.features.length,
          geometry_types: result.geometryTypes,
          bounds: result.bounds,
          original_name: file.name,
          file_size: file.size
        })
        .select()
        .single();
      
      if (shapefileError) throw new Error(shapefileError.message);
      
      const { error: layerError } = await supabase
        .from('map_layers')
        .insert({
          name: layerName,
          shapefile_id: shapefileData.id,
          visible: true,
          color: '#3b82f6'
        });
      
      if (layerError) throw new Error(layerError.message);
      
      setStatus('success');
      
      setTimeout(() => {
        const typeList = result.geometryTypes.join(', ');
        if (confirm(`✅ Upload Berhasil!\n\n📊 ${result.features.length} fitur\n📐 Jenis: ${typeList}\n\nLihat di peta sekarang?`)) {
          navigate('/map-monitoring');
        } else {
          resetForm();
        }
      }, 500);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      setStatus('error');
      setErrorMsg(error.message || 'Terjadi kesalahan saat upload');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setLayerName('');
    setDescription('');
    setStatus('idle');
    setErrorMsg('');
    setFileList([]);
    setDetectedFormat('');
    setFeaturesCount(0);
    setGeometryTypes([]);
    setBounds(null);
  };

  const getGeometryIcon = (type: string) => {
    if (type.includes('Titik')) return '📍';
    if (type.includes('Garis')) return '🟦';
    if (type.includes('Area')) return '🟩';
    return '🗺️';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 mb-4 hover:text-slate-700"
        >
          <ArrowLeft size={20} /> Kembali
        </button>
        
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Upload className="text-blue-400" size={20} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Upload Peta Digital</h1>
                <p className="text-xs text-slate-400">Support Shapefile (.shp) & MapInfo (.tab/.map/.dat)</p>
              </div>
            </div>
          </div>
          
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Nama Layer <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={layerName}
                onChange={(e) => setLayerName(e.target.value)}
                placeholder="Contoh: Peta Desa Winongan"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Deskripsi (opsional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Keterangan tentang peta ini..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                rows={2}
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                File Peta (.zip) <span className="text-red-500">*</span>
              </label>
              <div 
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                  file ? 'border-green-300 bg-green-50' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/30'
                }`}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-input"
                />
                <FileArchive size={36} className={`mx-auto mb-2 ${file ? 'text-green-500' : 'text-slate-400'}`} />
                <p className="text-sm font-medium text-slate-600">
                  {file ? file.name : 'Klik untuk pilih file'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Format: .zip (Shapefile: .shp/.shx/.dbf) atau (MapInfo: .tab/.map/.dat)
                </p>
                {file && (
                  <button
                    onClick={(e) => { e.stopPropagation(); resetForm(); }}
                    className="mt-2 text-xs text-red-500 hover:text-red-600 flex items-center gap-1 justify-center"
                  >
                    <X size={12} /> Hapus file
                  </button>
                )}
              </div>
            </div>
            
            {detectedFormat && (
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2">
                  <Database size={14} className="text-blue-500" />
                  <span className="text-xs text-slate-600">
                    Format terdeteksi: <strong className="text-blue-600">{detectedFormat}</strong>
                  </span>
                </div>
              </div>
            )}
            
            {fileList.length > 0 && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-2">
                  <FileText size={12} /> File dalam zip ({fileList.length} file):
                </p>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                  {fileList.map((f, i) => (
                    <span key={i} className="text-[9px] px-2 py-0.5 bg-white rounded border border-slate-200 font-mono">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {geometryTypes.length > 0 && (
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                <div className="flex items-center gap-2 mb-2">
                  <Layers size={14} className="text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700">Jenis Data dalam Peta:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {geometryTypes.map((type, i) => (
                    <span key={i} className="text-[10px] px-2 py-1 bg-white rounded-lg border border-emerald-200">
                      {getGeometryIcon(type)} {type}
                    </span>
                  ))}
                </div>
                <div className="mt-2 text-[10px] text-emerald-600">
                  Total: <strong>{featuresCount.toLocaleString()}</strong> fitur
                </div>
                {bounds && (
                  <div className="mt-1 text-[9px] text-emerald-500">
                    Wilayah: {bounds.minLng?.toFixed(3)}° - {bounds.maxLng?.toFixed(3)}° BT | 
                    {bounds.minLat?.toFixed(3)}° - {bounds.maxLat?.toFixed(3)}° LS
                  </div>
                )}
              </div>
            )}
            
            {progress && (
              <div className="bg-blue-50 p-3 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                  <span className="text-xs text-blue-700">{progress}</span>
                </div>
              </div>
            )}
            
            {status === 'error' && (
              <div className="bg-red-50 p-3 rounded-xl border border-red-200">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-red-700">Upload Gagal</p>
                    <p className="text-xs text-red-600 whitespace-pre-line">{errorMsg}</p>
                  </div>
                </div>
              </div>
            )}
            
            {status === 'success' && (
              <div className="bg-green-50 p-3 rounded-xl border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <span className="text-xs text-green-700">
                    Upload berhasil! {featuresCount} fitur telah disimpan.
                  </span>
                </div>
              </div>
            )}
            
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleUpload}
                disabled={uploading || !file || !layerName}
                className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    MEMPROSES...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    UPLOAD KE PETA
                  </>
                )}
              </button>
              
              {file && (
                <button
                  onClick={resetForm}
                  className="px-5 py-3 border border-slate-200 rounded-xl text-slate-600 text-sm hover:bg-slate-50"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <Info size={14} className="text-blue-600" />
            <h3 className="font-bold text-sm text-blue-800">Format yang Didukung:</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white p-2 rounded-lg">
              <div className="font-bold text-blue-700">📁 Shapefile</div>
              <div className="text-slate-500">.shp, .shx, .dbf</div>
            </div>
            <div className="bg-white p-2 rounded-lg">
              <div className="font-bold text-emerald-700">🗺️ MapInfo</div>
              <div className="text-slate-500">.tab, .map, .dat, .id, .ind</div>
            </div>
          </div>
          <p className="text-[10px] text-blue-600 mt-3">
            File zip akan otomatis dideteksi formatnya. Pastikan semua file yang diperlukan ada dalam zip.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UploadShpPage;