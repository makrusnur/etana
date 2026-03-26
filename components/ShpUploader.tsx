import React, { useState } from 'react';
import JSZip from 'jszip';
import { supabase } from '../services/db';

interface ShpUploaderProps {
  onSuccess?: () => void;
}

export const ShpUploader: React.FC<ShpUploaderProps> = ({ onSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState('');

  const processShapefile = async (zipFile: File): Promise<any> => {
    setProgress('Membaca file zip...');
    const zip = await JSZip.loadAsync(zipFile);
    
    const shpFile = Object.values(zip.files).find(f => f.name.endsWith('.shp'));
    const dbfFile = Object.values(zip.files).find(f => f.name.endsWith('.dbf'));
    
    if (!shpFile || !dbfFile) {
      throw new Error('File zip harus berisi .shp dan .dbf');
    }
    
    setProgress('Memproses shapefile...');
    const shpBuffer = await shpFile.async('arraybuffer');
    const dbfBuffer = await dbfFile.async('arraybuffer');
    
    const shapefile = await import('shapefile');
    const source = await shapefile.open(shpBuffer, dbfBuffer);
    
    const features: any[] = [];
    let feature;
    while (feature = await source.read()) {
      features.push(feature);
    }
    
    return {
      type: 'FeatureCollection',
      features: features
    };
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Pilih file .zip terlebih dahulu!');
      return;
    }
    if (!fileName.trim()) {
      alert('Masukkan nama layer!');
      return;
    }

    setUploading(true);
    setProgress('Memulai upload...');
    
    try {
      // 1. Proses shapefile ke GeoJSON
      const geojson = await processShapefile(file);
      setProgress(`Berhasil memproses ${geojson.features.length} fitur`);
      
      // 2. Simpan ke Supabase
      const { data: shapefileData, error: shapefileError } = await supabase
        .from('shapefiles')
        .insert({
          name: fileName,
          description: description,
          geojson: geojson
        })
        .select()
        .single();
      
      if (shapefileError) throw shapefileError;
      
      // 3. Buat layer untuk map
      const { error: layerError } = await supabase
        .from('map_layers')
        .insert({
          name: fileName,
          shapefile_id: shapefileData.id,
          visible: true,
          color: '#3b82f6'
        });
      
      if (layerError) throw layerError;
      
      alert(`✅ Berhasil! ${geojson.features.length} fitur ditambahkan ke peta.`);
      
      // Reset form
      setFile(null);
      setFileName('');
      setDescription('');
      
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error('Error:', error);
      alert('Gagal upload: ' + (error as Error).message);
    } finally {
      setUploading(false);
      setProgress('');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-2xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">📁 Upload Shapefile (SHP)</h2>
      <p className="text-sm text-slate-500 mb-6">
        Upload file .zip yang berisi .shp, .shx, .dbf
      </p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">
            Nama Layer
          </label>
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="Contoh: Batas Desa"
            className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">
            Deskripsi (opsional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Keterangan tentang data ini"
            className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
          />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">
            File SHP (.zip)
          </label>
          <input
            type="file"
            accept=".zip"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm"
          />
          {file && (
            <p className="text-xs text-green-600 mt-1">✓ {file.name}</p>
          )}
        </div>
        
        {progress && (
          <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-xl">
            ⏳ {progress}
          </div>
        )}
        
        <button
          onClick={handleUpload}
          disabled={uploading || !file || !fileName}
          className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold disabled:opacity-50"
        >
          {uploading ? '⏳ MEMPROSES...' : '🚀 UPLOAD KE PETA'}
        </button>
      </div>
    </div>
  );
};