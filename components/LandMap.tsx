import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Maximize, Minimize } from 'lucide-react'; // Gunakan ikon dari Lucide

// ... (kode interface Anda)

const MapSection = () => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  return (
    <div className={`relative transition-all duration-300 ease-in-out ${
      isFullScreen 
        ? "fixed inset-0 z-[9999] bg-white w-screen h-screen" 
        : "shadcn-card overflow-hidden border border-slate-300 rounded-xl shadow-lg w-full h-[550px]"
    }`}>
      
      {/* Tombol Full Screen di Pojok Kanan Atas */}
      <button 
        onClick={toggleFullScreen}
        className="absolute top-4 right-4 z-[1000] bg-white p-2 rounded-md shadow-md hover:bg-slate-100 flex items-center gap-2 font-medium text-sm"
      >
        {isFullScreen ? <><Minimize size={18}/> Keluar</> : <><Maximize size={18}/> Full Screen</>}
      </button>

      <MapContainer 
        center={[-6.2000, 106.8166]} 
        zoom={18} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; Esri'
        />
        <TileLayer url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" />

        <Marker position={[-6.2000, 106.8166]}>
          {/* PERUBAHAN: Properti minWidth dan maxWidth untuk memperlebar Pop-up */}
          <Popup minWidth={350} maxWidth={500}>
            <div className="p-2">
              <h3 className="text-lg font-bold text-blue-700 border-b pb-2 mb-2">Detail Lokasi Berkas</h3>
              <div className="space-y-2 text-sm text-slate-700">
                <div className="flex justify-between border-b border-slate-100 py-1">
                  <span className="font-semibold text-slate-500 uppercase text-[10px]">Nama Klien</span>
                  <span className="font-medium">Budi Santoso</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 py-1">
                  <span className="font-semibold text-slate-500 uppercase text-[10px]">No. Sertifikat</span>
                  <span className="font-medium">10.15.01.05.1.00234</span>
                </div>
                <div className="py-1">
                  <span className="font-semibold text-slate-500 uppercase text-[10px]">Keterangan</span>
                  <p className="mt-1 leading-relaxed">
                    Lokasi ini adalah bidang tanah perumahan yang sedang dalam proses Akta Jual Beli (AJB). 
                    Pastikan batas koordinat sudah sesuai dengan plot BPN.
                  </p>
                </div>
              </div>
              <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors">
                Lihat Berkas Lengkap
              </button>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};