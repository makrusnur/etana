// src/pages/TemplatesPage.tsx
// ============================================
// TEMPLATES PAGE - GENERATE DOKUMEN PERTANAHAN
// Sporadik: khusus Letter C (dengan riwayat & BAK sebagai array)
// Akta: Jual Beli (Letter C atau SHM) dengan loop penjual/pembeli/saksi
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import { saveAs } from 'file-saver';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

// Icons
import { 
  Printer, X, Database, Copy, ClipboardCheck, UserCheck, 
  FileSpreadsheet, MapPin, FileText, Search, Users, ShieldCheck, Landmark,
  AlertCircle, CheckCircle2, Loader2, Download, Eye, Upload, History,
  BookOpen, Layers, Repeat, Activity
} from 'lucide-react';

// Components & Services
import { Card, Button, Select } from '../components/UI';
import { supabase } from '../services/db';

// Utils
import { formatDateIndo, spellDateIndo, formatNIK, toTitleCase } from '../utils';

// Types
import { 
  FileRecord, Identity, LandData, Relation, LandHistory
} from '../types';

// ============================================
// INTERFACES
// ============================================

interface TemplateData {
  // Data mentah
  fileRecord?: FileRecord;
  identities: Identity[];
  landData?: LandData;
  relations: Relation[];
  
  // ========================================
  // DATA UNTUK SPORADIK (flat dengan underscore)
  // ========================================
  
  // PEMOHON
  pemohon_nama?: string;
  pemohon_nik?: string;
  pemohon_agama?: string;
  pemohon_umur?: number;
  pemohon_pekerjaan?: string;
  pemohon_alamat?: string;
  pemohon_rt?: string;
  pemohon_rw?: string;
  pemohon_desa?: string;
  pemohon_kecamatan?: string;
  pemohon_kota?: string;
  
  // TANAH - LOKASI
  tanah_alamat?: string;
  tanah_rt?: string;
  tanah_rw?: string;
  tanah_desa?: string;
  tanah_kecamatan?: string;
  tanah_kabupaten?: string;
  tanah_provinsi?: string;
  tanah_nib?: string;
  
  // TANAH - LETTER C
  tanah_nomor_c?: string;
  tanah_persil?: string;
  tanah_klas?: string;
  tanah_atas_nama_c?: string;
  tanah_berasal_dari?: string;
  
  // TANAH - BATAS
  batas_utara?: string;
  batas_timur?: string;
  batas_selatan?: string;
  batas_barat?: string;
  
  // TANAH - LUAS
  tanah_luas?: number;
  tanah_luas_text?: string;
  
  // TANAH - PEROLEHAN
  tanah_tahun_kuasai?: string;
  perolehan_dari?: string;
  perolehan_tahun?: string;
  perolehan_sebab?: string;
  
  // TANAH - PAJAK
  tanah_nop?: string;
  tanah_sppt_tahun?: string;
  
  // SAKSI UNTUK SPORADIK (umum)
  saksi_0_nama?: string;
  saksi_0_nik?: string;
  saksi_0_umur?: number;
  saksi_0_pekerjaan?: string;
  saksi_0_alamat?: string;
  
  saksi_1_nama?: string;
  saksi_1_nik?: string;
  saksi_1_umur?: number;
  saksi_1_pekerjaan?: string;
  saksi_1_alamat?: string;
  
  saksi_2_nama?: string;
  saksi_2_nik?: string;
  saksi_2_umur?: number;
  saksi_2_pekerjaan?: string;
  saksi_2_alamat?: string;
  
  // ========================================
  // DATA UNTUK BAK (ARRAY OF STRINGS) - bagian dari SPORADIK
  // ========================================
  bak?: string;                    // Single string BAK
  bak_list?: string[];             // Array of strings BAK
  bak_0?: string;                   // Baris pertama BAK (akses langsung)
  bak_1?: string;                   // Baris kedua BAK
  bak_2?: string;                   // Baris ketiga BAK
  bak_3?: string;                   // Baris keempat BAK
  bak_4?: string;                   // Baris kelima BAK
  
  // ========================================
  // DATA UNTUK RIWAYAT TANAH (LOOP) - bagian dari SPORADIK
  // ========================================
  riwayat_tanah?: LandHistory[];
  
  // ========================================
  // DATA UNTUK AKTA (dengan prefix T_)
  // ========================================
  penjual?: any[];
  pembeli?: any[];
  saksi_akta?: any[];
  persetujuan?: any[];
  
  T_Jenis?: string;                    // "Letter C" atau "SHM"
  T_C_No?: string;
  T_C_Persil?: string;
  T_C_Klas?: string;
  T_C_AN?: string;
  T_SHM_No?: string;
  T_SHM_AN?: string;
  T_Luas_M?: number;
  T_Luas_E?: string;
  T_Batas_U?: string;
  T_Batas_T?: string;
  T_Batas_S?: string;
  T_Batas_B?: string;
  T_NOP?: string;
  T_Sppt_Thn?: string;
  T_Kec?: string;
  T_Desa?: string;
  T_Alamat?: string;
  T_RT?: string;
  T_RW?: string;
  T_Harga?: string;
  T_Harga_E?: string;
  
  // ========================================
  // DATA BERKAS / ADMINISTRASI
  // ========================================
  No_Berkas?: string;
  No_Reg?: string;
  Hari?: string;
  Tgl_Surat?: string;
  Tgl_Surat_Indo?: string;
  Tgl_Ejaan?: string;
  Cak_Tanah?: string;
  Pihak_Penanggung?: string;
  Jum_Saksi?: number;
  
  // ========================================
  // DATA KEPALA DESA / LURAH
  // ========================================
  kepala_desa?: string;
  kepala_desa_tipe?: string;         // "Kepala Desa" atau "Lurah"
  
  // ========================================
  // DATA COUNTER
  // ========================================
  _countP1?: number;
  _countP2?: number;
  _countS?: number;
  _countSetuju?: number;
  _countRiwayat?: number;
  _countBak?: number;
  
  // ========================================
  // CONDITIONAL FLAGS
  // ========================================
  isWaris?: boolean;
  isJualBeli?: boolean;
  isHibah?: boolean;
  isSertifikat?: boolean;
  isLetterC?: boolean;
  isPersetujuan?: boolean;
  Ket_Setuju?: string;
  Setuju1?: any;
}

interface GenerateOptions {
  debug?: boolean;
}

interface GenerateResult {
  success: boolean;
  fileName?: string;
  error?: string;
  blob?: Blob;
}

// ============================================
// MAIN COMPONENT
// ============================================

export const TemplatesPage: React.FC = () => {
  // ========================================
  // STATE MANAGEMENT
  // ========================================
  
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<TemplateData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showDataPreview, setShowDataPreview] = useState(false);
  const [showFinalPreview, setShowFinalPreview] = useState(false);
  const [copiedTag, setCopiedTag] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [debug, setDebug] = useState(false);
  
  // HANYA 2 PILIHAN: Sporadik atau Akta
  const [jenisDokumen, setJenisDokumen] = useState<'sporadik' | 'akta'>('sporadik');
  
  // Refs
  const templateFileRef = useRef<File | null>(null);
  
  // Manual input untuk tetangga batas (hanya untuk Sporadik)
  const [tetanggaBatas, setTetanggaBatas] = useState({
    utara: { nama: '', ttd: '' },
    timur: { nama: '', ttd: '' },
    selatan: { nama: '', ttd: '' },
    barat: { nama: '', ttd: '' }
  });

  // ========================================
  // LOAD INITIAL DATA
  // ========================================
  
  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setFiles(data || []);
    } catch (err) {
      console.error('Gagal memuat berkas:', err);
    }
  };

  // Update ref ketika template file berubah
  useEffect(() => {
    templateFileRef.current = templateFile;
  }, [templateFile]);

  // ========================================
  // PREPARE DATA FOR TEMPLATE
  // ========================================
  
  useEffect(() => {
    const prepareData = async () => {
      if (!selectedFileId) {
        setPreviewData(null);
        return;
      }

      setLoading(true);
      try {
        // 1. Ambil FileRecord
        const { data: fileData, error: fileError } = await supabase
          .from('files')
          .select('*')
          .eq('id', selectedFileId)
          .single();

        if (fileError) throw fileError;
        if (!fileData) throw new Error('File tidak ditemukan');

        // 2. Ambil semua relasi
        const { data: relations, error: relError } = await supabase
          .from('relations')
          .select('*')
          .eq('berkas_id', selectedFileId);

        if (relError) throw relError;

        // 3. Ambil semua identitas
        const identityIds = relations?.map(r => r.identitas_id) || [];
        const { data: identities, error: idError } = await supabase
          .from('identities')
          .select('*')
          .in('id', identityIds);

        if (idError) throw idError;

        // 4. Ambil data tanah (jika ada)
        let landData = null;
        const landRelation = relations?.find(r => r.data_tanah_id);
        if (landRelation) {
          const { data: land, error: landError } = await supabase
            .from('lands')
            .select('*')
            .eq('id', landRelation.data_tanah_id)
            .single();

          if (!landError && land) {
            landData = land;
          }
        }

        // 5. Proses data untuk template
        const processed = processDataForTemplate(
          fileData,
          identities || [],
          landData,
          relations || []
        );

        setPreviewData(processed);

      } catch (err) {
        console.error('Error preparing data:', err);
        alert('Gagal memuat data: ' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    prepareData();
  }, [selectedFileId]);

  // ========================================
  // PROCESS DATA FOR TEMPLATE
  // ========================================
  
  const processDataForTemplate = (
    file: FileRecord,
    identities: Identity[],
    land: LandData | null,
    relations: Relation[]
  ): TemplateData => {
    
    // ========================================
    // HELPER FUNCTIONS
    // ========================================
    
    const calculateAge = (birthDate: string): number => {
      if (!birthDate) return 0;
      const today = new Date();
      const birth = new Date(birthDate);
      if (isNaN(birth.getTime())) return 0;
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      return age;
    };

    const formatAlamat = (p: Identity): string => {
      const parts = [];
      if (p.alamat) parts.push(p.alamat);
      if (p.rt || p.rw) {
        const rt = p.rt ? `RT ${p.rt}` : '';
        const rw = p.rw ? `RW ${p.rw}` : '';
        parts.push([rt, rw].filter(Boolean).join(' '));
      }
      if (p.desa) parts.push(`Desa ${p.desa}`);
      if (p.kecamatan) parts.push(`Kec. ${p.kecamatan}`);
      if (p.kota_kabupaten) parts.push(p.kota_kabupaten);
      return parts.join(', ') || '-';
    };

    const formatDateStrip = (dateString: string): string => {
      if (!dateString) return "";
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return "";
      return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
    };

    // ========================================
    // PISAHKAN DATA BERDASARKAN PERAN
    // ========================================
    
    const p1Raw: any[] = [];
    const p2Raw: any[] = [];
    const saksiRaw: any[] = [];
    const setujuRaw: any[] = [];

    relations.forEach((rel) => {
      const person = identities.find((i) => String(i.id).trim() === String(rel.identitas_id).trim());
      if (person) {
        const enriched = {
          ...person,
          peran_detail: (rel as any).hubungan,
          umur: calculateAge(person.tanggal_lahir),
          tgl_lahir_indo: formatDateIndo(person.tanggal_lahir),
          lahir_tgl_strip: formatDateStrip(person.tanggal_lahir),
          ktp_berlaku_indo: person.ktp_berlaku === "SEUMUR HIDUP" ? "SEUMUR HIDUP" : formatDateIndo(person.ktp_berlaku),
          ejaan_lahir: person.ejaan_tanggal_lahir || spellDateIndo(person.tanggal_lahir),
          ejaan_berlaku: person.ejaan_tanggal_ktp_berlaku || (person.ktp_berlaku === "SEUMUR HIDUP" ? "SEUMUR HIDUP" : spellDateIndo(person.ktp_berlaku)),
          is_seumur_hidup: person.is_seumur_hidup || person.ktp_berlaku === "SEUMUR HIDUP"
        };
        
        const cleanRole = (rel.peran || "").toUpperCase().trim();
        if (cleanRole === "PIHAK_1") p1Raw.push(enriched);
        else if (cleanRole === "PIHAK_2") p2Raw.push(enriched);
        else if (cleanRole === "SAKSI") saksiRaw.push(enriched);
        else if (["SETUJU", "PERSETUJUAN", "PERSETUJUAN_PIHAK_1"].includes(cleanRole)) {
          setujuRaw.push(enriched);
        }
      }
    });

    // ========================================
    // FORMAT DATA UNTUK AKTA (LOOP)
    // ========================================
    
    const mapToArray = (arr: any[]) => arr.map((p) => ({
      Sebutan: p.sebutan || "",
      Nama: p.nama || "",
      Nama_Upper: (p.nama || "").toUpperCase(),
      Nama_Alias: toTitleCase(p.alias) || null,
      NIK: formatNIK(p.nik) || "",
      Lahir_Tempat: p.tempat_lahir || "",
      Lahir_Tgl: p.lahir_tgl_strip || "",
      Lahir_Indo: p.tgl_lahir_indo || "",
      Lahir_Ejaan: p.ejaan_lahir || "",
      Umur: p.umur || "",
      Agama: p.agama || "",
      Pekerjaan: p.pekerjaan || "",
      Alamat: p.alamat || "",
      RT: p.rt || "",
      RW: p.rw || "",
      Desa: p.desa || "",
      Kec: p.kecamatan || "",
      Kota: p.kota_kabupaten || "",
      Ktp_Masa_Berlaku: p.ktp_berlaku_indo || "",
      Ktp_Masa_Ejaan: p.ejaan_berlaku || "",
    }));

    // ========================================
    // FORMAT DATA PERSETUJUAN
    // ========================================
    
    const mapSetuju = (arr: any[]) => arr.map((p) => ({
      Sebutan: p.sebutan || "",
      Nama: p.nama || "",
      NIK: formatNIK(p.nik) || "",
      Lahir_Tempat: p.tempat_lahir || "",
      Lahir_Tgl: p.lahir_tgl_strip || "",
      Lahir_Ejaan: p.ejaan_lahir || "",
      Pekerjaan: p.pekerjaan || "",
      Alamat: p.alamat || "",
      RT: p.rt || "",
      RW: p.rw || "",
      Desa: p.desa || "",
      Kec: p.kecamatan || "",
      Kota: p.kota_kabupaten || "",
    }));

    // ========================================
    // DATA UTAMA
    // ========================================
    
    // Data Pemohon (Pihak 1 pertama)
    const pemohon = p1Raw.length > 0 ? p1Raw[0] : null;
    
    // Data Saksi (ambil 3 saksi pertama untuk sporadik)
    const saksiList = saksiRaw.slice(0, 3);
    
    // ========================================
    // PROSES BAK (array of strings)
    // ========================================
    let bakList: string[] = [];
    if (land?.bak_list && Array.isArray(land.bak_list)) {
      bakList = land.bak_list;
    } else if (land?.bak) {
      // Jika bak adalah string, jadikan array dengan 1 elemen
      bakList = [land.bak];
    }

    // Buat akses langsung bak_0, bak_1, dll
    const bakAccess: Record<string, string> = {};
    bakList.forEach((item, index) => {
      bakAccess[`bak_${index}`] = item || '________________';
    });

    // ========================================
    // RETURN DATA LENGKAP
    // ========================================
    
    return {
      // Data mentah
      fileRecord: file,
      identities,
      landData: land || undefined,
      relations,
      
      // ========================================
      // DATA PEMOHON (untuk Sporadik)
      // ========================================
      pemohon_nama: pemohon?.nama || '________________',
      pemohon_nik: formatNIK(pemohon?.nik || '________________'),
      pemohon_agama: pemohon?.agama || '________________',
      pemohon_umur: pemohon ? calculateAge(pemohon.tanggal_lahir) : 0,
      pemohon_pekerjaan: pemohon?.pekerjaan || '________________',
      pemohon_alamat: pemohon ? formatAlamat(pemohon) : '________________',
      pemohon_rt: pemohon?.rt || '____',
      pemohon_rw: pemohon?.rw || '____',
      pemohon_desa: pemohon?.desa || '________________',
      pemohon_kecamatan: pemohon?.kecamatan || '________________',
      pemohon_kota: pemohon?.kota_kabupaten || '________________',
      
      // ========================================
      // DATA TANAH - LOKASI
      // ========================================
      tanah_alamat: land?.alamat || '________________',
      tanah_rt: land?.rt || '____',
      tanah_rw: land?.rw || '____',
      tanah_desa: land?.desa || '________________',
      tanah_kecamatan: land?.kecamatan || '________________',
      tanah_kabupaten: land?.kabupaten_kota || 'Pasuruan',
      tanah_provinsi: 'Jawa Timur',
      tanah_nib: land?.nib || '________________',
      
      // ========================================
      // DATA TANAH - LETTER C
      // ========================================
      tanah_nomor_c: land?.kohir || '________________',
      tanah_persil: land?.persil || '________________',
      tanah_klas: land?.klas || '________________',
      tanah_atas_nama_c: land?.atas_nama_letter_c || '________________',
      tanah_berasal_dari: land?.berasal_dari_an || '________________',
      
      // ========================================
      // DATA TANAH - BATAS
      // ========================================
      batas_utara: land?.batas_utara_seluruhnya || '________________',
      batas_timur: land?.batas_timur_seluruhnya || '________________',
      batas_selatan: land?.batas_selatan_seluruhnya || '________________',
      batas_barat: land?.batas_barat_seluruhnya || '________________',
      
      // ========================================
      // DATA TANAH - LUAS
      // ========================================
      tanah_luas: land?.luas_seluruhnya || 0,
      tanah_luas_text: land?.ejaan_luas_seluruhnya || '________________',
      
      // ========================================
      // DATA TANAH - PEROLEHAN
      // ========================================
      tanah_tahun_kuasai: file.tahun_pemohon || '____',
      perolehan_dari: file.asal_perolehan || '________________',
      perolehan_tahun: file.tahun_perolehan || '____',
      perolehan_sebab: file.sebab_perolehan || '________________',
      
      // ========================================
      // DATA TANAH - PAJAK
      // ========================================
      tanah_nop: land?.nop || '________________',
      tanah_sppt_tahun: land?.sppt_tahun || '____',
      
      // ========================================
      // DATA SAKSI UNTUK SPORADIK (umum)
      // ========================================
      saksi_0_nama: saksiList[0]?.nama || '________________',
      saksi_0_nik: formatNIK(saksiList[0]?.nik || '________________'),
      saksi_0_umur: saksiList[0] ? calculateAge(saksiList[0].tanggal_lahir) : 0,
      saksi_0_pekerjaan: saksiList[0]?.pekerjaan || '________________',
      saksi_0_alamat: saksiList[0] ? formatAlamat(saksiList[0]) : '________________',
      saksi_0_agama: saksiList[0]?.agama ||'________________',

      saksi_1_nama: saksiList[1]?.nama || '________________',
      saksi_1_nik: formatNIK(saksiList[1]?.nik || '________________'),
      saksi_1_umur: saksiList[1] ? calculateAge(saksiList[1].tanggal_lahir) : 0,
      saksi_1_pekerjaan: saksiList[1]?.pekerjaan || '________________',
      saksi_1_alamat: saksiList[1] ? formatAlamat(saksiList[1]) : '________________',
      saksi_1_agama: saksiList[1]?.agama ||'________________',
      
      saksi_2_nama: saksiList[2]?.nama || '________________',
      saksi_2_nik: formatNIK(saksiList[2]?.nik || '________________'),
      saksi_2_umur: saksiList[2] ? calculateAge(saksiList[2].tanggal_lahir) : 0,
      saksi_2_pekerjaan: saksiList[2]?.pekerjaan || '________________',
      saksi_2_alamat: saksiList[2] ? formatAlamat(saksiList[2]) : '________________',
      saksi_2_agama: saksiList[2]?.agama ||'________________',

      // ========================================
      // DATA UNTUK BAK (ARRAY OF STRINGS) - bagian dari SPORADIK
      // ========================================
      bak: land?.bak || '________________',
      bak_list: bakList,
      ...bakAccess,  // Spread bak_0, bak_1, dll
      
      // ========================================
      // DATA UNTUK RIWAYAT TANAH (LOOP) - bagian dari SPORADIK
      // ========================================
      riwayat_tanah: land?.riwayat_tanah || [],
      
      // ========================================
      // DATA UNTUK AKTA (LOOP)
      // ========================================
      penjual: mapToArray(p1Raw),
      pembeli: mapToArray(p2Raw),
      saksi_akta: mapToArray(saksiRaw),
      persetujuan: mapSetuju(setujuRaw),
      
      isPersetujuan: setujuRaw.length > 0,
      Ket_Setuju: file.keterangan_persetujuan === "ISTRI" ? "dengan persetujuan isterinya" :
                  file.keterangan_persetujuan === "SUAMI" ? "dengan persetujuan suaminya" :
                  file.keterangan_persetujuan || "dengan persetujuan",
      
      Setuju1: setujuRaw.length > 0 ? mapSetuju([setujuRaw[0]])[0] : null,
      
      // ========================================
      // DATA TANAH UNTUK AKTA (prefix T_)
      // ========================================
      T_Jenis: land?.jenis_dasar_surat === 'LETTER_C' ? 'Letter C' : 'SHM',
      T_C_No: land?.kohir || '________________',
      T_C_Persil: land?.persil || '________________',
      T_C_Klas: land?.klas || '________________',
      T_C_AN: land?.atas_nama_letter_c || '________________',
      T_SHM_No: land?.no_shm || '________________',
      T_SHM_AN: land?.atas_nama_shm || '________________',
      T_Luas_M: land?.luas_seluruhnya || 0,
      T_Luas_E: land?.ejaan_luas_seluruhnya || '________________',
      T_Batas_U: land?.batas_utara_seluruhnya || '________________',
      T_Batas_T: land?.batas_timur_seluruhnya || '________________',
      T_Batas_S: land?.batas_selatan_seluruhnya || '________________',
      T_Batas_B: land?.batas_barat_seluruhnya || '________________',
      T_NOP: land?.nop || '________________',
      T_Sppt_Thn: land?.sppt_tahun || '____',
      T_Kec: land?.kecamatan || '________________',
      T_Desa: land?.desa || '________________',
      T_Alamat: land?.alamat || '________________',
      T_RT: land?.rt || '____',
      T_RW: land?.rw || '____',
      T_Harga: (land?.harga_transaksi || 0).toLocaleString("id-ID"),
      T_Harga_E: land?.ejaan_harga_transaksi || '________________',
      
      // ========================================
      // DATA BERKAS
      // ========================================
      No_Berkas: file.nomor_berkas || '________________',
      No_Reg: file.nomor_register || '________________',
      Hari: file.hari || '________________',
      Tgl_Surat: file.tanggal ? formatDateIndo(file.tanggal) : '________________',
      Tgl_Surat_Indo: file.tanggal ? formatDateIndo(file.tanggal) : '________________',
      Tgl_Ejaan: file.ejaan_tanggal || '________________',
      Cak_Tanah: file.cakupan_tanah || '',
      Pihak_Penanggung: file.pihak_penanggung || 'Pihak Kedua',
      Jum_Saksi: saksiRaw.length,
      
      // ========================================
      // DATA KEPALA DESA
      // ========================================
      kepala_desa: land?.nama_kepala_desa || '________________',
      kepala_desa_tipe: land?.jenis_kades || 'Kepala Desa',
      
      // ========================================
      // DATA COUNTER
      // ========================================
      _countP1: p1Raw.length,
      _countP2: p2Raw.length,
      _countS: saksiRaw.length,
      _countSetuju: setujuRaw.length,
      _countRiwayat: land?.riwayat_tanah?.length || 0,
      _countBak: bakList.length,
      
      // ========================================
      // CONDITIONAL FLAGS
      // ========================================
      isWaris: file.jenis_perolehan === 'WARIS' || file.sebab_perolehan === 'WARIS',
      isJualBeli: file.jenis_perolehan === 'JUAL_BELI' || file.sebab_perolehan === 'JUAL BELI',
      isHibah: file.jenis_perolehan === 'HIBAH' || file.sebab_perolehan === 'HIBAH',
      isSertifikat: land?.jenis_dasar_surat === 'SHM_ANALOG' || land?.jenis_dasar_surat === 'SHM_ELEKTRONIK',
      isLetterC: land?.jenis_dasar_surat === 'LETTER_C'
    };
  };

  // ========================================
  // COPY TO CLIPBOARD (FIXED)
  // ========================================
  
  const copyToClipboard = (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
          .then(() => {
            setCopiedTag(text);
            setTimeout(() => setCopiedTag(''), 2000);
          })
          .catch(() => {
            prompt('Salin manual:', text);
          });
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopiedTag(text);
        setTimeout(() => setCopiedTag(''), 2000);
      }
    } catch (err) {
      prompt('Salin manual:', text);
    }
  };

  // ========================================
  // GENERATE WORD DOCUMENT
  // ========================================
  
  const generateWordDocument = async (
    templateFile: File,
    data: TemplateData,
    jenis: 'sporadik' | 'akta',
    options: GenerateOptions = {}
  ): Promise<GenerateResult> => {
    
    const { debug = false } = options;

    try {
      if (!templateFile) throw new Error('Template file tidak boleh kosong');
      if (!data) throw new Error('Data tidak boleh kosong');

      console.log(`🚀 Generating ${jenis} document...`);

      // Buat copy file
      const fileCopy = new File([templateFile], templateFile.name, { type: templateFile.type });
      const arrayBuffer = await fileCopy.arrayBuffer();
      const zip = new PizZip(arrayBuffer);
      
      // Siapkan data final berdasarkan jenis
      let finalData: any = {};

      if (jenis === 'sporadik') {
        finalData = {
          // PEMOHON
          pemohon_nama: data.pemohon_nama,
          pemohon_nik: data.pemohon_nik,
          pemohon_agama: data.pemohon_agama,
          pemohon_umur: data.pemohon_umur,
          pemohon_pekerjaan: data.pemohon_pekerjaan,
          pemohon_alamat: data.pemohon_alamat,
          pemohon_rt: data.pemohon_rt,
          pemohon_rw: data.pemohon_rw,
          pemohon_desa: data.pemohon_desa,
          pemohon_kecamatan: data.pemohon_kecamatan,
          pemohon_kota: data.pemohon_kota,
          
          // TANAH - LOKASI
          tanah_alamat: data.tanah_alamat,
          tanah_rt: data.tanah_rt,
          tanah_rw: data.tanah_rw,
          tanah_desa: data.tanah_desa,
          tanah_kecamatan: data.tanah_kecamatan,
          tanah_kabupaten: data.tanah_kabupaten,
          tanah_provinsi: data.tanah_provinsi,
          tanah_nib: data.tanah_nib,
          
          // TANAH - LETTER C
          tanah_nomor_c: data.tanah_nomor_c,
          tanah_persil: data.tanah_persil,
          tanah_klas: data.tanah_klas,
          tanah_atas_nama_c: data.tanah_atas_nama_c,
          tanah_berasal_dari: data.tanah_berasal_dari,
          
          // TANAH - BATAS
          batas_utara: data.batas_utara,
          batas_timur: data.batas_timur,
          batas_selatan: data.batas_selatan,
          batas_barat: data.batas_barat,
          
          // TANAH - LUAS
          tanah_luas: data.tanah_luas,
          tanah_luas_text: data.tanah_luas_text,
          
          // TANAH - PEROLEHAN
          tanah_tahun_kuasai: data.tanah_tahun_kuasai,
          perolehan_dari: data.perolehan_dari,
          perolehan_tahun: data.perolehan_tahun,
          perolehan_sebab: data.perolehan_sebab,
          
          // TANAH - PAJAK
          tanah_nop: data.tanah_nop,
          tanah_sppt_tahun: data.tanah_sppt_tahun,
          
          // SAKSI
          saksi_0_nama: data.saksi_0_nama,
          saksi_0_nik: data.saksi_0_nik,
          saksi_0_umur: data.saksi_0_umur,
          saksi_0_pekerjaan: data.saksi_0_pekerjaan,
          saksi_0_alamat: data.saksi_0_alamat,
          saksi_0_agama: data.saksi_0_agama,
          
          saksi_1_nama: data.saksi_1_nama,
          saksi_1_nik: data.saksi_1_nik,
          saksi_1_umur: data.saksi_1_umur,
          saksi_1_pekerjaan: data.saksi_1_pekerjaan,
          saksi_1_alamat: data.saksi_1_alamat,
          saksi_1_agama: data.saksi_1_agama,
          
          saksi_2_nama: data.saksi_2_nama,
          saksi_2_nik: data.saksi_2_nik,
          saksi_2_umur: data.saksi_2_umur,
          saksi_2_pekerjaan: data.saksi_2_pekerjaan,
          saksi_2_alamat: data.saksi_2_alamat,
          saksi_2_agama: data.saksi_2_agama,
          // BAK - ARRAY OF STRINGS (akses langsung)
          bak: data.bak,
          bak_0: data.bak_0,
          bak_1: data.bak_1,
          bak_2: data.bak_2,
          bak_3: data.bak_3,
          bak_4: data.bak_4,
          
          // LOOP RIWAYAT TANAH
          riwayat_tanah: data.riwayat_tanah || [],
          
          // ADMINISTRASI
          No_Berkas: data.No_Berkas,
          Tgl_Surat: data.Tgl_Surat,
          Tgl_Ejaan: data.Tgl_Ejaan,
          Hari: data.Hari,
          
          // KEPALA DESA
          kepala_desa: data.kepala_desa,
          kepala_desa_tipe: data.kepala_desa_tipe,
          
          // CONDITIONAL
          isWaris: data.isWaris,
          isJualBeli: data.isJualBeli,
          isHibah: data.isHibah,
          isSertifikat: data.isSertifikat,
          isLetterC: data.isLetterC,
          
          // TETANGGA BATAS (INPUT MANUAL)
          tetangga_utara_nama: tetanggaBatas.utara.nama || data.batas_utara,
          tetangga_utara_ttd: tetanggaBatas.utara.ttd || '________________',
          tetangga_timur_nama: tetanggaBatas.timur.nama || data.batas_timur,
          tetangga_timur_ttd: tetanggaBatas.timur.ttd || '________________',
          tetangga_selatan_nama: tetanggaBatas.selatan.nama || data.batas_selatan,
          tetangga_selatan_ttd: tetanggaBatas.selatan.ttd || '________________',
          tetangga_barat_nama: tetanggaBatas.barat.nama || data.batas_barat,
          tetangga_barat_ttd: tetanggaBatas.barat.ttd || '________________',
          
          // COUNTER
          _countRiwayat: data._countRiwayat,
          _countBak: data._countBak,
          
          // UMUM
          materai: '[MATERAI 10.000]'
        };
      } 
      else { // AKTA
        finalData = {
          // LOOP PENJUAL
          penjual: data.penjual || [],
          
          // LOOP PEMBELI
          pembeli: data.pembeli || [],
          
          // LOOP SAKSI
          saksi_akta: data.saksi_akta || [],
          
          // LOOP PERSETUJUAN
          persetujuan: data.persetujuan || [],
          isPersetujuan: data.isPersetujuan,
          Ket_Setuju: data.Ket_Setuju,
          Setuju1: data.Setuju1,
          
          // DATA TANAH
          T_Jenis: data.T_Jenis,
          T_C_No: data.T_C_No,
          T_C_Persil: data.T_C_Persil,
          T_C_Klas: data.T_C_Klas,
          T_C_AN: data.T_C_AN,
          T_SHM_No: data.T_SHM_No,
          T_SHM_AN: data.T_SHM_AN,
          T_Luas_M: data.T_Luas_M,
          T_Luas_E: data.T_Luas_E,
          T_Batas_U: data.T_Batas_U,
          T_Batas_T: data.T_Batas_T,
          T_Batas_S: data.T_Batas_S,
          T_Batas_B: data.T_Batas_B,
          T_NOP: data.T_NOP,
          T_Kec: data.T_Kec,
          T_Desa: data.T_Desa,
          T_Alamat: data.T_Alamat,
          T_Harga: data.T_Harga,
          T_Harga_E: data.T_Harga_E,
          
          // ADMINISTRASI
          No_Berkas: data.No_Berkas,
          No_Reg: data.No_Reg,
          Hari: data.Hari,
          Tgl_Surat: data.Tgl_Surat,
          Cak_Tanah: data.Cak_Tanah,
          Pihak_Penanggung: data.Pihak_Penanggung,
          Jum_Saksi: data.Jum_Saksi,
          
          // COUNTER
          _countP1: data._countP1,
          _countP2: data._countP2,
          _countS: data._countS
        };
      }

      if (debug) {
        console.log('📊 Final Data:', finalData);
      }

      // Inisialisasi Docxtemplater
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: '{', end: '}' },
        nullGetter: (part) => {
          return `[${part.value}]`;
        }
      });

      // Render
      doc.render(finalData);

      // Generate blob
      const generatedBlob = doc.getZip().generate({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 }
      });

      const prefix = jenis === 'sporadik' ? 'SPORADIK' : 'AKTA';
      const fileName = `${prefix}_${finalData.No_Berkas || 'GENERATED'}_${new Date().getTime()}.docx`;

      console.log(`✅ ${prefix} document generated:`, fileName);

      return {
        success: true,
        fileName,
        blob: generatedBlob as Blob
      };

    } catch (error) {
      console.error('❌ Error generating document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  // ========================================
  // HANDLE GENERATE
  // ========================================
  
  const handleGenerate = async () => {
    if (!templateFileRef.current) {
      alert('Silahkan upload template .docx terlebih dahulu!');
      return;
    }

    if (!previewData) {
      alert('Silahkan pilih berkas terlebih dahulu!');
      return;
    }

    setGenerating(true);
    try {
      const result = await generateWordDocument(
        templateFileRef.current,
        previewData,
        jenisDokumen,
        { debug }
      );

      if (result.success && result.blob) {
        saveAs(result.blob, result.fileName);
        setShowFinalPreview(false);
        alert(`✅ Dokumen ${jenisDokumen} berhasil digenerate!`);
      } else {
        alert(`❌ Gagal: ${result.error}`);
      }
    } catch (err) {
      alert('Error: ' + (err as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  // ========================================
  // RENDER UI
  // ========================================
  
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 p-4">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">
            GENERATOR DOKUMEN PERTANAHAN
          </h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
            Etana Logic v2.5 • Sporadik (Letter C) | Akta Jual Beli
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => {}} 
          size="sm" 
          className="rounded-xl border-2 font-black text-[10px] uppercase"
        >
          <FileSpreadsheet size={14} className="mr-2" /> Export Data
        </Button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card Pilih Berkas */}
        <Card title="PILIH BERKAS" className="lg:col-span-2 shadow-xl border-t-4 border-t-slate-900 rounded-[32px]">
          <div className="space-y-6 p-2">
            <Select 
              label="Database Berkas" 
              value={selectedFileId} 
              onChange={e => setSelectedFileId(e.target.value)} 
              className="font-bold"
            >
              <option value="">-- Pilih Berkas --</option>
              {files.map(f => (
                <option key={f.id} value={f.id}>
                  {f.nomor_berkas} - {f.keterangan || 'Tanpa Keterangan'}
                </option>
              ))}
            </Select>

            {loading && (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="animate-spin text-slate-400" size={32} />
                <span className="ml-3 text-sm font-bold text-slate-400">Memuat data...</span>
              </div>
            )}

            {previewData && !loading && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryWidget 
                  label="PENJUAL" 
                  val={previewData._countP1 || 0} 
                  icon={<UserCheck size={14}/>} 
                  color="emerald" 
                />
                <SummaryWidget 
                  label="PEMBELI" 
                  val={previewData._countP2 || 0} 
                  icon={<UserCheck size={14}/>} 
                  color="blue" 
                />
                <SummaryWidget 
                  label="SAKSI" 
                  val={previewData._countS || 0} 
                  icon={<Users size={14}/>} 
                  color="purple" 
                />
                <SummaryWidget 
                  label="RIWAYAT" 
                  val={previewData._countRiwayat || 0} 
                  icon={<History size={14}/>} 
                  color="orange" 
                />
              </div>
            )}
          </div>
        </Card>

        {/* Card Upload Template */}
        <Card title="UPLOAD TEMPLATE" className="shadow-xl border-t-4 border-t-blue-600 rounded-[32px]">
          <div className="space-y-4">
            {/* Pilihan Jenis Dokumen - HANYA 2 PILIHAN */}
            <div className="mb-4">
              <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">
                Pilih Jenis Dokumen
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setJenisDokumen('sporadik')}
                  className={`py-3 text-[10px] font-black uppercase rounded-xl transition-all ${
                    jenisDokumen === 'sporadik' 
                      ? 'bg-slate-900 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  <FileText size={14} className="mx-auto mb-1" />
                  SPORADIK
                  <span className="block text-[8px] font-normal mt-1">(Letter C)</span>
                </button>
                <button
                  onClick={() => setJenisDokumen('akta')}
                  className={`py-3 text-[10px] font-black uppercase rounded-xl transition-all ${
                    jenisDokumen === 'akta' 
                      ? 'bg-slate-900 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  <BookOpen size={14} className="mx-auto mb-1" />
                  AKTA
                  <span className="block text-[8px] font-normal mt-1">(Jual Beli)</span>
                </button>
              </div>
            </div>

            {/* Upload Area */}
            <div className="p-6 border-2 border-dashed rounded-[24px] bg-slate-50 border-slate-200 relative group hover:border-blue-400 transition-all text-center">
              <input 
                type="file" 
                accept=".docx" 
                onChange={e => setTemplateFile(e.target.files ? e.target.files[0] : null)} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              />
              <Upload size={40} className="mx-auto text-slate-300 mb-3 group-hover:text-blue-500 transition-colors" />
              <p className="text-[10px] font-black text-slate-500 uppercase px-2 truncate">
                {templateFile ? templateFile.name : `Upload Template ${jenisDokumen}.docx`}
              </p>
            </div>
            
            {/* Action Buttons */}
            <Button 
              onClick={() => setShowFinalPreview(true)} 
              className="w-full font-black h-16 rounded-[20px] shadow-lg shadow-slate-200 uppercase tracking-widest text-xs" 
              disabled={!selectedFileId || !templateFile || loading}
            >
              <Eye size={18} className="mr-2" /> PREVIEW & GENERATE
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full text-[10px] font-black h-12 rounded-[20px] border-2 uppercase" 
              onClick={() => setShowDataPreview(true)} 
              disabled={!selectedFileId || loading}
            >
              <Database size={14} className="mr-2" /> LIHAT KAMUS TAG
            </Button>
          </div>
        </Card>
      </div>

      {/* ======================================== */}
      {/* MODAL KAMUS TAG */}
      {/* ======================================== */}
      
      {showDataPreview && previewData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden">
            
            {/* Header Modal */}
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Database size={32} className="text-blue-400"/>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tighter">
                    KAMUS TAG - {previewData.No_Berkas || 'BERKAS'}
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Klik tag untuk menyalin | Pilih tab sesuai jenis dokumen
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input 
                    type="text" 
                    placeholder="Cari Tag..." 
                    className="bg-white/10 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:ring-2 ring-blue-500 outline-none" 
                    value={tagSearch} 
                    onChange={e => setTagSearch(e.target.value)} 
                  />
                </div>
                <button 
                  onClick={() => setShowDataPreview(false)} 
                  className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            {/* Tab Navigation - HANYA 2 TAB */}
            <div className="border-b border-slate-200 bg-white">
              <div className="flex gap-2 p-4">
                <button
                  className={`px-6 py-3 text-xs font-black uppercase rounded-xl transition-all ${
                    jenisDokumen === 'sporadik' 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-slate-100 text-slate-400'
                  }`}
                  onClick={() => setJenisDokumen('sporadik')}
                >
                  📄 SPORADIK (Letter C)
                </button>
                <button
                  className={`px-6 py-3 text-xs font-black uppercase rounded-xl transition-all ${
                    jenisDokumen === 'akta' 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-slate-100 text-slate-400'
                  }`}
                  onClick={() => setJenisDokumen('akta')}
                >
                  📜 AKTA JUAL BELI
                </button>
              </div>
            </div>
            
            {/* Content - Kamus Tag per Jenis Dokumen */}
            <div className="p-10 overflow-y-auto flex-1 bg-slate-50">
              {jenisDokumen === 'sporadik' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  {/* KATEGORI: PEMOHON */}
                  <TagCategory title="PEMOHON" icon={<UserCheck size={16}/>} color="emerald">
                    <TagRow tag="pemohon_nama" val={previewData.pemohon_nama} desc="Nama lengkap pemohon" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="pemohon_nik" val={previewData.pemohon_nik} desc="NIK pemohon" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="pemohon_agama" val={previewData.pemohon_agama} desc="Agama pemohon" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="pemohon_umur" val={previewData.pemohon_umur} desc="Umur pemohon (tahun)" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="pemohon_pekerjaan" val={previewData.pemohon_pekerjaan} desc="Pekerjaan pemohon" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="pemohon_alamat" val={previewData.pemohon_alamat} desc="Alamat lengkap pemohon" onCopy={copyToClipboard} copied={copiedTag} />
                  </TagCategory>

                  {/* KATEGORI: TANAH - LOKASI */}
                  <TagCategory title="LOKASI TANAH" icon={<MapPin size={16}/>} color="blue">
                    <TagRow tag="tanah_alamat" val={previewData.tanah_alamat} desc="Alamat / jalan tanah" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="tanah_rt" val={previewData.tanah_rt} desc="RT lokasi tanah" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="tanah_rw" val={previewData.tanah_rw} desc="RW lokasi tanah" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="tanah_desa" val={previewData.tanah_desa} desc="Desa/Kelurahan" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="tanah_kecamatan" val={previewData.tanah_kecamatan} desc="Kecamatan" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="tanah_kabupaten" val={previewData.tanah_kabupaten} desc="Kabupaten/Kota" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="tanah_nib" val={previewData.tanah_nib} desc="NIB (Nomor Identifikasi Bidang)" onCopy={copyToClipboard} copied={copiedTag} />
                  </TagCategory>

                  {/* KATEGORI: LETTER C */}
                  <TagCategory title="LETTER C" icon={<Layers size={16}/>} color="purple">
                    <TagRow tag="tanah_nomor_c" val={previewData.tanah_nomor_c} desc="Nomor Kohir (C)" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="tanah_persil" val={previewData.tanah_persil} desc="Nomor Persil" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="tanah_klas" val={previewData.tanah_klas} desc="Klasifikasi Tanah" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="tanah_atas_nama_c" val={previewData.tanah_atas_nama_c} desc="Atas Nama di Letter C" onCopy={copyToClipboard} copied={copiedTag} />
                  </TagCategory>

                  {/* KATEGORI: BATAS TANAH */}
                  <TagCategory title="BATAS TANAH" icon={<MapPin size={16}/>} color="orange">
                    <TagRow tag="batas_utara" val={previewData.batas_utara} desc="Batas Utara (nama pemilik)" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="batas_timur" val={previewData.batas_timur} desc="Batas Timur (nama pemilik)" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="batas_selatan" val={previewData.batas_selatan} desc="Batas Selatan (nama pemilik)" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="batas_barat" val={previewData.batas_barat} desc="Batas Barat (nama pemilik)" onCopy={copyToClipboard} copied={copiedTag} />
                  </TagCategory>

                  {/* KATEGORI: LUAS & PEROLEHAN */}
                  <TagCategory title="LUAS & PEROLEHAN" icon={<History size={16}/>} color="amber">
                    <TagRow tag="tanah_luas" val={previewData.tanah_luas} desc="Luas tanah (m²)" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="tanah_luas_text" val={previewData.tanah_luas_text} desc="Luas (terbilang)" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="tanah_tahun_kuasai" val={previewData.tanah_tahun_kuasai} desc="Tahun mulai dikuasai" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="perolehan_dari" val={previewData.perolehan_dari} desc="Diperoleh dari siapa" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="perolehan_tahun" val={previewData.perolehan_tahun} desc="Tahun perolehan" onCopy={copyToClipboard} copied={copiedTag} />
                  </TagCategory>

                  {/* KATEGORI: SAKSI */}
                  <TagCategory title="SAKSI" icon={<Users size={16}/>} color="pink">
                    <TagRow tag="saksi_0_nama" val={previewData.saksi_0_nama} desc="Nama saksi 1" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="saksi_1_nama" val={previewData.saksi_1_nama} desc="Nama saksi 2" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="saksi_2_nama" val={previewData.saksi_2_nama} desc="Nama saksi 3" onCopy={copyToClipboard} copied={copiedTag} />
                  </TagCategory>

                  {/* KATEGORI: BAK - ARRAY OF STRINGS */}
                  <TagCategory title="BAK (Berita Acara Kesaksian)" icon={<FileText size={16}/>} color="yellow">
                    <TagRow tag="bak_0" val={previewData.bak_0} desc="Baris pertama BAK" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="bak_1" val={previewData.bak_1} desc="Baris kedua BAK" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="bak_2" val={previewData.bak_2} desc="Baris ketiga BAK" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="bak_3" val={previewData.bak_3} desc="Baris keempat BAK" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="bak_4" val={previewData.bak_4} desc="Baris kelima BAK" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="_countBak" val={previewData._countBak} desc="Jumlah baris BAK" onCopy={copyToClipboard} copied={copiedTag} />
                  </TagCategory>

                  {/* KATEGORI: LOOP RIWAYAT TANAH */}
                  <TagCategory title="RIWAYAT TANAH (LOOP)" icon={<History size={16}/>} color="teal">
                    <TagRow tag="{#riwayat_tanah}" val="Mulai loop riwayat" desc="Loop untuk setiap riwayat kepemilikan" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="{_index}" val="Nomor urut" desc="Nomor urut dalam loop" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="{atas_nama}" val={previewData.riwayat_tanah?.[0]?.atas_nama} desc="Nama pemilik terdahulu" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="{c_no}" val={previewData.riwayat_tanah?.[0]?.c_no} desc="Nomor C terdahulu" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="{persil_no}" val={previewData.riwayat_tanah?.[0]?.persil_no} desc="Nomor Persil terdahulu" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="{klas}" val={previewData.riwayat_tanah?.[0]?.klas} desc="Klas tanah terdahulu" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="{luas}" val={previewData.riwayat_tanah?.[0]?.luas} desc="Luas tanah (m²)" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="{dasar_dialihkan}" val={previewData.riwayat_tanah?.[0]?.dasar_dialihkan} desc="Dasar pengalihan" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="{/riwayat_tanah}" val="Akhir loop riwayat" desc="Penutup loop" onCopy={copyToClipboard} copied={copiedTag} />
                  </TagCategory>

                  {/* KATEGORI: ADMINISTRASI */}
                  <TagCategory title="ADMINISTRASI" icon={<FileText size={16}/>} color="gray">
                    <TagRow tag="No_Berkas" val={previewData.No_Berkas} desc="Nomor Berkas" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="Tgl_Surat" val={previewData.Tgl_Surat} desc="Tanggal Surat" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="Hari" val={previewData.Hari} desc="Hari" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="kepala_desa" val={previewData.kepala_desa} desc="Nama Kepala Desa" onCopy={copyToClipboard} copied={copiedTag} />
                  </TagCategory>

                  {/* KATEGORI: TETANGGA BATAS (INPUT MANUAL) */}
                  <TagCategory title="TETANGGA BATAS" icon={<Users size={16}/>} color="red">
                    <TagRow tag="tetangga_utara_nama" val="[Input Manual]" desc="Nama tetangga utara" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="tetangga_utara_ttd" val="[Input Manual]" desc="Tanda tangan tetangga utara" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="tetangga_timur_nama" val="[Input Manual]" desc="Nama tetangga timur" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="tetangga_timur_ttd" val="[Input Manual]" desc="Tanda tangan tetangga timur" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="tetangga_selatan_nama" val="[Input Manual]" desc="Nama tetangga selatan" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="tetangga_selatan_ttd" val="[Input Manual]" desc="Tanda tangan tetangga selatan" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="tetangga_barat_nama" val="[Input Manual]" desc="Nama tetangga barat" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="tetangga_barat_ttd" val="[Input Manual]" desc="Tanda tangan tetangga barat" onCopy={copyToClipboard} copied={copiedTag} />
                  </TagCategory>
                </div>
              )}

              {jenisDokumen === 'akta' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  {/* KATEGORI: LOOP PENJUAL */}
                  <TagCategory title="LOOP PENJUAL" icon={<UserCheck size={16}/>} color="emerald">
                    <TagRow tag="{#penjual}" val="Mulai loop penjual" desc="Loop untuk setiap penjual" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="{_index}" val="Nomor urut" desc="Nomor urut dalam loop" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="{Nama}" val={previewData.penjual?.[0]?.Nama} desc="Nama penjual" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="{NIK}" val={previewData.penjual?.[0]?.NIK} desc="NIK penjual" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="{Pekerjaan}" val={previewData.penjual?.[0]?.Pekerjaan} desc="Pekerjaan penjual" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="{Alamat}" val={previewData.penjual?.[0]?.Alamat} desc="Alamat penjual" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="{/penjual}" val="Akhir loop penjual" desc="Penutup loop" onCopy={copyToClipboard} copied={copiedTag} />
                  </TagCategory>

                  {/* KATEGORI: LOOP PEMBELI */}
                  <TagCategory title="LOOP PEMBELI" icon={<UserCheck size={16}/>} color="blue">
                    <TagRow tag="{#pembeli}" val="Mulai loop pembeli" desc="Loop untuk setiap pembeli" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="{Nama}" val={previewData.pembeli?.[0]?.Nama} desc="Nama pembeli" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="{NIK}" val={previewData.pembeli?.[0]?.NIK} desc="NIK pembeli" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="{/pembeli}" val="Akhir loop pembeli" desc="Penutup loop" onCopy={copyToClipboard} copied={copiedTag} />
                  </TagCategory>

                  {/* KATEGORI: LOOP SAKSI */}
                  <TagCategory title="LOOP SAKSI" icon={<Users size={16}/>} color="purple">
                    <TagRow tag="{#saksi_akta}" val="Mulai loop saksi" desc="Loop untuk setiap saksi" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="{Nama}" val={previewData.saksi_akta?.[0]?.Nama} desc="Nama saksi" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="{NIK}" val={previewData.saksi_akta?.[0]?.NIK} desc="NIK saksi" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="{/saksi_akta}" val="Akhir loop saksi" desc="Penutup loop" onCopy={copyToClipboard} copied={copiedTag} />
                  </TagCategory>

                  {/* KATEGORI: LOOP PERSETUJUAN */}
                  <TagCategory title="PERSETUJUAN" icon={<ShieldCheck size={16}/>} color="yellow">
                    <TagRow tag="isPersetujuan" val={String(previewData.isPersetujuan)} desc="Ada persetujuan?" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="Ket_Setuju" val={previewData.Ket_Setuju} desc="Keterangan persetujuan" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="Setuju1_Nama" val={previewData.Setuju1?.Nama} desc="Nama yang menyetujui" onCopy={copyToClipboard} copied={copiedTag} />
                  </TagCategory>

                  {/* KATEGORI: DATA TANAH */}
                  <TagCategory title="DATA TANAH" icon={<MapPin size={16}/>} color="orange">
                    <TagRow tag="T_Jenis" val={previewData.T_Jenis} desc="Jenis tanah (Letter C/SHM)" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="T_C_No" val={previewData.T_C_No} desc="Nomor C (jika Letter C)" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="T_C_Persil" val={previewData.T_C_Persil} desc="Nomor Persil" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="T_C_Klas" val={previewData.T_C_Klas} desc="Klas" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="T_SHM_No" val={previewData.T_SHM_No} desc="Nomor SHM (jika SHM)" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="T_Luas_M" val={previewData.T_Luas_M} desc="Luas (m²)" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="T_Luas_E" val={previewData.T_Luas_E} desc="Luas (terbilang)" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="T_Batas_U" val={previewData.T_Batas_U} desc="Batas Utara" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="T_Batas_T" val={previewData.T_Batas_T} desc="Batas Timur" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="T_Batas_S" val={previewData.T_Batas_S} desc="Batas Selatan" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="T_Batas_B" val={previewData.T_Batas_B} desc="Batas Barat" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="T_Desa" val={previewData.T_Desa} desc="Desa" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="T_Kec" val={previewData.T_Kec} desc="Kecamatan" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="T_Harga" val={previewData.T_Harga} desc="Harga (Rp)" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="T_Harga_E" val={previewData.T_Harga_E} desc="Harga (terbilang)" onCopy={copyToClipboard} copied={copiedTag} />
                  </TagCategory>

                  {/* KATEGORI: ADMINISTRASI */}
                  <TagCategory title="ADMINISTRASI" icon={<FileText size={16}/>} color="gray">
                    <TagRow tag="No_Berkas" val={previewData.No_Berkas} desc="Nomor Berkas" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="No_Reg" val={previewData.No_Reg} desc="Nomor Register" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="Hari" val={previewData.Hari} desc="Hari" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="Tgl_Surat" val={previewData.Tgl_Surat} desc="Tanggal Surat" onCopy={copyToClipboard} copied={copiedTag} />
                    <TagRow tag="Pihak_Penanggung" val={previewData.Pihak_Penanggung} desc="Pihak penanggung biaya" onCopy={copyToClipboard} copied={copiedTag} />
                  </TagCategory>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================== */}
      {/* MODAL FINAL PREVIEW */}
      {/* ======================================== */}
      
      {showFinalPreview && previewData && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex flex-col items-center overflow-hidden">
          
          {/* Header */}
          <div className="w-full h-20 bg-white border-b flex justify-between items-center px-12 shrink-0 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <Printer size={24} />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-tighter text-slate-900">
                  PREVIEW {jenisDokumen === 'sporadik' ? 'SPORADIK' : 'AKTA JUAL BELI'}
                </h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Berkas: {previewData.No_Berkas || '________________'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowFinalPreview(false)} 
                className="px-6 py-3 text-[10px] font-black uppercase text-slate-400 hover:text-rose-600 transition-colors"
              >
                TUTUP
              </button>
              <Button 
                onClick={handleGenerate}
                disabled={generating}
                className="h-14 bg-slate-900 hover:bg-black text-white px-10 rounded-2xl font-black text-xs shadow-2xl tracking-widest flex items-center gap-2"
              >
                {generating ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Download size={18} />
                )}
                {generating ? 'GENERATING...' : 'DOWNLOAD .DOCX'}
              </Button>
            </div>
          </div>

          {/* Konten 2 Kolom (khusus Sporadik dengan input tetangga) */}
          <div className="w-full flex-1 flex overflow-hidden">
            {jenisDokumen === 'sporadik' && (
              <div className="w-96 bg-white border-r p-6 overflow-y-auto">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">
                  INPUT TANDA TANGAN TETANGGA BATAS
                </h3>
                
                <div className="space-y-8">
                  {/* Utara */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-3">
                      SEBELAH UTARA
                    </label>
                    <p className="text-sm font-bold text-slate-900 mb-3">
                      {previewData.batas_utara || '________________'}
                    </p>
                    <input
                      type="text"
                      placeholder="Nama (sesuai KTP)"
                      className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl mb-2"
                      value={tetanggaBatas.utara.nama}
                      onChange={(e) => setTetanggaBatas({
                        ...tetanggaBatas,
                        utara: { ...tetanggaBatas.utara, nama: e.target.value }
                      })}
                    />
                    <input
                      type="text"
                      placeholder="Tanda Tangan (ketik nama)"
                      className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl font-signature"
                      value={tetanggaBatas.utara.ttd}
                      onChange={(e) => setTetanggaBatas({
                        ...tetanggaBatas,
                        utara: { ...tetanggaBatas.utara, ttd: e.target.value }
                      })}
                    />
                  </div>

                  {/* Timur */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-3">
                      SEBELAH TIMUR
                    </label>
                    <p className="text-sm font-bold text-slate-900 mb-3">
                      {previewData.batas_timur || '________________'}
                    </p>
                    <input
                      type="text"
                      placeholder="Nama (sesuai KTP)"
                      className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl mb-2"
                      value={tetanggaBatas.timur.nama}
                      onChange={(e) => setTetanggaBatas({
                        ...tetanggaBatas,
                        timur: { ...tetanggaBatas.timur, nama: e.target.value }
                      })}
                    />
                    <input
                      type="text"
                      placeholder="Tanda Tangan (ketik nama)"
                      className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl font-signature"
                      value={tetanggaBatas.timur.ttd}
                      onChange={(e) => setTetanggaBatas({
                        ...tetanggaBatas,
                        timur: { ...tetanggaBatas.timur, ttd: e.target.value }
                      })}
                    />
                  </div>

                  {/* Selatan */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-3">
                      SEBELAH SELATAN
                    </label>
                    <p className="text-sm font-bold text-slate-900 mb-3">
                      {previewData.batas_selatan || '________________'}
                    </p>
                    <input
                      type="text"
                      placeholder="Nama (sesuai KTP)"
                      className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl mb-2"
                      value={tetanggaBatas.selatan.nama}
                      onChange={(e) => setTetanggaBatas({
                        ...tetanggaBatas,
                        selatan: { ...tetanggaBatas.selatan, nama: e.target.value }
                      })}
                    />
                    <input
                      type="text"
                      placeholder="Tanda Tangan (ketik nama)"
                      className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl font-signature"
                      value={tetanggaBatas.selatan.ttd}
                      onChange={(e) => setTetanggaBatas({
                        ...tetanggaBatas,
                        selatan: { ...tetanggaBatas.selatan, ttd: e.target.value }
                      })}
                    />
                  </div>

                  {/* Barat */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-3">
                      SEBELAH BARAT
                    </label>
                    <p className="text-sm font-bold text-slate-900 mb-3">
                      {previewData.batas_barat || '________________'}
                    </p>
                    <input
                      type="text"
                      placeholder="Nama (sesuai KTP)"
                      className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl mb-2"
                      value={tetanggaBatas.barat.nama}
                      onChange={(e) => setTetanggaBatas({
                        ...tetanggaBatas,
                        barat: { ...tetanggaBatas.barat, nama: e.target.value }
                      })}
                    />
                    <input
                      type="text"
                      placeholder="Tanda Tangan (ketik nama)"
                      className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl font-signature"
                      value={tetanggaBatas.barat.ttd}
                      onChange={(e) => setTetanggaBatas({
                        ...tetanggaBatas,
                        barat: { ...tetanggaBatas.barat, ttd: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Preview Dokumen (sederhana) */}
            <div className={`flex-1 bg-slate-100 p-8 overflow-y-auto ${jenisDokumen !== 'sporadik' ? 'w-full' : ''}`}>
              <div className="bg-white w-full max-w-[850px] mx-auto shadow-[0_50px_100px_rgba(0,0,0,0.15)] p-[30mm] text-slate-800 font-serif relative border border-slate-200">
                
                <div className="text-center mb-8">
                  <h1 className="text-xl font-black underline tracking-tight uppercase">
                    PREVIEW {jenisDokumen === 'sporadik' ? 'SPORADIK' : 'AKTA JUAL BELI'}
                  </h1>
                  <p className="text-xs mt-2">Nomor: {previewData.No_Berkas || '________________'}</p>
                </div>

                {/* Preview Sporadik */}
                {jenisDokumen === 'sporadik' && (
                  <div className="space-y-4">
                    <p><span className="font-bold">Pemohon:</span> {previewData.pemohon_nama}</p>
                    <p><span className="font-bold">NIK:</span> {previewData.pemohon_nik}</p>
                    <p><span className="font-bold">Alamat:</span> {previewData.pemohon_alamat}</p>
                    <p><span className="font-bold">Tanah:</span> C.{previewData.tanah_nomor_c} Persil {previewData.tanah_persil} Klas {previewData.tanah_klas}</p>
                    <p><span className="font-bold">Lokasi:</span> {previewData.tanah_desa}, {previewData.tanah_kecamatan}</p>
                    <p><span className="font-bold">Luas:</span> {previewData.tanah_luas} m²</p>
                    <p><span className="font-bold">Batas:</span> U:{previewData.batas_utara}, T:{previewData.batas_timur}, S:{previewData.batas_selatan}, B:{previewData.batas_barat}</p>
                    <p><span className="font-bold">Dikuasai sejak:</span> {previewData.tanah_tahun_kuasai}</p>
                    <p><span className="font-bold">BAK:</span> {previewData.bak_0}</p>
                    <p><span className="font-bold">Jumlah Riwayat:</span> {previewData._countRiwayat}</p>
                  </div>
                )}

                {/* Preview Akta */}
                {jenisDokumen === 'akta' && (
                  <div className="space-y-4">
                    <p><span className="font-bold">Penjual:</span> {previewData._countP1} orang</p>
                    <p><span className="font-bold">Pembeli:</span> {previewData._countP2} orang</p>
                    <p><span className="font-bold">Saksi:</span> {previewData._countS} orang</p>
                    <p><span className="font-bold">Jenis Tanah:</span> {previewData.T_Jenis}</p>
                    <p><span className="font-bold">Nomor:</span> {previewData.T_C_No || previewData.T_SHM_No}</p>
                    <p><span className="font-bold">Lokasi:</span> {previewData.T_Desa}, {previewData.T_Kec}</p>
                    <p><span className="font-bold">Luas:</span> {previewData.T_Luas_M} m²</p>
                    <p><span className="font-bold">Harga:</span> Rp {previewData.T_Harga}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// SUB COMPONENTS (TANPA DEKLARASI ULANG CARD, BUTTON, SELECT)
// ============================================

interface TagCategoryProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  color: string;
}

const TagCategory: React.FC<TagCategoryProps> = ({ title, icon, children, color }) => {
  const colors: Record<string, string> = {
    emerald: 'border-emerald-200 text-emerald-700 bg-emerald-50',
    blue: 'border-blue-200 text-blue-700 bg-blue-50',
    purple: 'border-purple-200 text-purple-700 bg-purple-50',
    pink: 'border-pink-200 text-pink-700 bg-pink-50',
    orange: 'border-orange-200 text-orange-700 bg-orange-50',
    yellow: 'border-yellow-200 text-yellow-700 bg-yellow-50',
    red: 'border-red-200 text-red-700 bg-red-50',
    green: 'border-green-200 text-green-700 bg-green-50',
    teal: 'border-teal-200 text-teal-700 bg-teal-50',
    gray: 'border-gray-200 text-gray-700 bg-gray-50',
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-fit">
      <div className={`px-5 py-4 border-b flex items-center gap-3 text-[10px] font-black uppercase tracking-widest ${colors[color]}`}>
        {icon} {title}
      </div>
      <div className="p-4 space-y-1">{children}</div>
    </div>
  );
};

interface TagRowProps {
  tag: string;
  val?: string | number | null;
  desc: string;
  onCopy: (text: string) => void;
  copied: string;
}

const TagRow: React.FC<TagRowProps> = ({ tag, val, desc, onCopy, copied }) => {
  const fullTag = `{${tag}}`;
  
  return (
    <div className="group flex flex-col p-3 hover:bg-slate-50 rounded-2xl transition-all relative border border-transparent hover:border-slate-100">
      <div className="flex justify-between items-center gap-2">
        <div className="flex-1">
          <code 
            className="text-[10px] font-black text-blue-600 cursor-pointer bg-blue-50 px-2 py-1 rounded-md inline-block"
            onClick={() => onCopy(fullTag)}
          >
            {fullTag}
          </code>
          <p className="text-[8px] text-slate-400 mt-1 italic">{desc}</p>
        </div>
        <button 
          onClick={() => onCopy(fullTag)} 
          className={`p-2 rounded-xl transition-all ${
            copied === fullTag 
              ? 'bg-green-500 text-white shadow-lg shadow-green-200' 
              : 'bg-white shadow-sm text-slate-400 hover:text-blue-500 border border-slate-100'
          }`}
        >
          {copied === fullTag ? <ClipboardCheck size={14}/> : <Copy size={14}/>}
        </button>
      </div>
      {val && val !== '________________' && val !== 0 && (
        <div className="text-[9px] font-bold text-slate-400 truncate mt-1 px-1 italic">
          Contoh: {String(val)}
        </div>
      )}
    </div>
  );
};

interface SummaryWidgetProps {
  label: string;
  val: string | number | undefined;
  icon: React.ReactNode;
  color: string;
}

const SummaryWidget: React.FC<SummaryWidgetProps> = ({ label, val, icon, color }) => {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100"
  };

  return (
    <div className={`p-4 rounded-[24px] border-2 flex flex-col items-center justify-center text-center ${colors[color]}`}>
      <div className="flex items-center gap-1 text-[8px] font-black uppercase mb-1 opacity-60 tracking-tighter">
        {icon} {label}
      </div>
      <div className="text-xl font-black tracking-tight truncate max-w-full">
        {val || 0}
      </div>
    </div>
  );
};

export default TemplatesPage;