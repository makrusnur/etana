// src/pages/TemplatesPage.tsx
// ============================================
// TEMPLATES PAGE - GENERATE DOKUMEN PERTANAHAN
// Sporadik: khusus Letter C (dengan riwayat & BAK)
// Akta: semua jenis (Jual Beli, Hibah, Waris, IJB, KJ, dll)
// Data tanah SATU VERSI (tidak dibedakan prefix)
// Jika data tidak ada, hasilnya string kosong ""
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
  BookOpen, Layers, Repeat, Activity, FileSignature, ScrollText
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
  // DATA PEMOHON (untuk Sporadik) - dari Identity (PIHAK_1 pertama)
  // ========================================
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
  pemohon_provinsi?: string;
  pemohon_tempat_lahir?: string;
  pemohon_tanggal_lahir?: string;
  pemohon_ejaan_lahir?: string;
  pemohon_status_kawin?: string;
  pemohon_nama_ibu?: string;
  pemohon_nama_bapak?: string;
  
  // ========================================
  // DATA TANAH - SATU VERSI UNTUK SEMUA
  // ========================================
  
  // LOKASI (dari LandData)
  tanah_alamat?: string;
  tanah_rt?: string;
  tanah_rw?: string;
  tanah_desa?: string;
  tanah_kecamatan?: string;
  tanah_kabupaten?: string;
  tanah_provinsi?: string;
  tanah_tipe_wilayah?: string;
  
  // LETTER C (dari LandData)
  nomor_c?: string;
  persil?: string;
  klas?: string;
  atas_nama_c?: string;
  berasal_dari?: string;
  tahun_perolehan_alas_hak?: string;
  
  // SHM ANALOG (untuk Akta)
  no_shm?: string;
  atas_nama_shm?: string;
  nib?: string;
  no_su?: string;
  tanggal_su?: string;
  ejaan_tanggal_su?: string;
  tanggal_shm?: string;
  ejaan_tanggal_shm?: string;
  
  // SHM ELEKTRONIK (untuk Akta)
  atas_nama_shm_el?: string;
  kode_sertifikat?: string;
  nibel?: string;
  
  // NOP & PAJAK
  nop?: string;
  sppt_tahun?: string;
  pajak_bumi_total?: number;
  pajak_bangunan_total?: number;
  pajak_grand_total?: number;
  
  // BATAS (seluruhnya)
  batas_utara?: string;
  batas_timur?: string;
  batas_selatan?: string;
  batas_barat?: string;
  
  // LUAS
  luas_seluruhnya?: number;
  ejaan_luas_seluruhnya?: string;
  luas_dimohon?: number;
  ejaan_luas_dimohon?: string;
  
  // HARGA TRANSAKSI
  harga_transaksi?: string;        // sudah diformat Rp
  ejaan_harga_transaksi?: string;
  
  // RIWAYAT TANAH (array untuk loop)
  riwayat_tanah?: LandHistory[];
  
  // BAK (array of strings)
  bak_list?: string[];
  bak_0?: string;
  bak_1?: string;
  bak_2?: string;
  bak_3?: string;
  bak_4?: string;
  
  // ========================================
  // DATA SAKSI (untuk Sporadik) - dari Identity dengan peran SAKSI
  // ========================================
  saksi_0_nama?: string;
  saksi_0_nik?: string;
  saksi_0_umur?: number;
  saksi_0_pekerjaan?: string;
  saksi_0_alamat?: string;
  saksi_0_agama?: string;

  saksi_1_nama?: string;
  saksi_1_nik?: string;
  saksi_1_umur?: number;
  saksi_1_pekerjaan?: string;
  saksi_1_alamat?: string;
  saksi_1_agama?: string;
  
  saksi_2_nama?: string;
  saksi_2_nik?: string;
  saksi_2_umur?: number;
  saksi_2_pekerjaan?: string;
  saksi_2_alamat?: string;
  saksi_2_agama?: string;
  
  // ========================================
  // DATA UNTUK AKTA (LOOP)
  // ========================================
  penjual?: any[];        // PIHAK_1
  pembeli?: any[];        // PIHAK_2
  saksi_akta?: any[];     // SAKSI
  persetujuan?: any[];    // PERSETUJUAN (dari relasi khusus)
  
  // ========================================
  // DATA BERKAS / ADMINISTRASI (dari FileRecord)
  // ========================================
  No_Berkas?: string;
  No_Reg?: string;
  Hari?: string;
  Tgl_Surat?: string;          // format Indonesia
  Tgl_Ejaan?: string;
  Cakupan_Tanah?: string;
  Pihak_Penanggung?: string;
  Jumlah_Saksi?: number;
  
  // KHUSUS WARIS
  isWaris?: boolean;
  nama_almarhum?: string;
  desa_waris?: string;
  kecamatan_waris?: string;
  register_waris_desa?: string;
  register_waris_kecamatan?: string;
  tanggal_waris?: string;
  ejaan_tanggal_waris?: string;
  
  // KHUSUS AKTA KUASA
  nomor_akta_kuasa?: string;
  tanggal_akta_kuasa?: string;
  ejaan_tanggal_akta?: string;
  nama_notaris_kuasa?: string;
  kedudukan_notaris?: string;
  
  // KETERANGAN PERSETUJUAN
  keterangan_persetujuan?: string;
  alamat_persetujuan?: string;
  
  // ========================================
  // DATA KEPALA DESA / LURAH (dari LandData)
  // ========================================
  kepala_desa?: string;
  jenis_kades?: string;   // "Kepala Desa" atau "Lurah"
  
  // ========================================
  // CONDITIONAL FLAGS
  // ========================================
  
  // Jenis perolehan (dari FileRecord)
  isJualBeli?: boolean;
  isHibah?: boolean;
  isWarisFlag?: boolean;
  isTukarMenukar?: boolean;
  
  // Jenis tanah (dari LandData)
  isLetterC?: boolean;
  isSHM?: boolean;
  isSHMElektronik?: boolean;
  
  // Ada persetujuan?
  isPersetujuan?: boolean;
  isIstri?: boolean;
  isSuami?: boolean;
  
  // ========================================
  // DATA COUNTER
  // ========================================
  _countP1?: number;
  _countP2?: number;
  _countS?: number;
  _countSetuju?: number;
  _countRiwayat?: number;
  _countBak?: number;
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
// HELPER: KONVERSI NILAI KE STRING KOSONG JIKA TIDAK ADA
// ============================================
const toEmptyString = (value: any): string => {
  if (value === null || value === undefined || value === '________________' || value === '____') {
    return '';
  }
  return String(value);
};

const toEmptyNumber = (value: any): number => {
  if (value === null || value === undefined || value === 0) {
    return 0;
  }
  return Number(value);
};

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
      return parts.join(', ') || '';
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
      Provinsi: p.provinsi || "",
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
      Provinsi: p.provinsi || "",
    }));

    // ========================================
    // DATA UTAMA
    // ========================================
    
    // Data Pemohon (Pihak 1 pertama) untuk Sporadik
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
      bakList = [land.bak];
    }

    // Buat akses langsung bak_0, bak_1, dll (string kosong jika tidak ada)
    const bakAccess: Record<string, string> = {};
    bakList.forEach((item, index) => {
      bakAccess[`bak_${index}`] = item || '';
    });

    // ========================================
    // TENTUKAN JENIS PEROLEHAN DAN FLAGS
    // ========================================
    const jenisPerolehan = (file.jenis_perolehan || '').toUpperCase();
    const isJualBeli = jenisPerolehan === 'JUAL_BELI' || file.sebab_perolehan === 'JUAL BELI';
    const isHibah = jenisPerolehan === 'HIBAH' || file.sebab_perolehan === 'HIBAH';
    const isWaris = jenisPerolehan === 'WARIS' || file.sebab_perolehan === 'WARIS';
    const isTukarMenukar = jenisPerolehan === 'TUKAR_MENUKAR' || file.sebab_perolehan === 'TUKAR MENUKAR';
    
    // Tentukan jenis tanah
    const isLetterC = land?.jenis_dasar_surat === 'LETTER_C';
    const isSHM = land?.jenis_dasar_surat === 'SHM_ANALOG';
    const isSHMElektronik = land?.jenis_dasar_surat === 'SHM_ELEKTRONIK';

    // ========================================
    // RETURN DATA LENGKAP - SEMUA STRING KOSONG JIKA TIDAK ADA DATA
    // ========================================
    
    return {
      // Data mentah
      fileRecord: file,
      identities,
      landData: land || undefined,
      relations,
      
      // ========================================
      // DATA PEMOHON - string kosong jika tidak ada
      // ========================================
      pemohon_nama: pemohon?.nama || '',
      pemohon_nik: formatNIK(pemohon?.nik || ''),
      pemohon_agama: pemohon?.agama || '',
      pemohon_umur: pemohon ? calculateAge(pemohon.tanggal_lahir) : 0,
      pemohon_pekerjaan: pemohon?.pekerjaan || '',
      pemohon_alamat: pemohon ? formatAlamat(pemohon) : '',
      pemohon_rt: pemohon?.rt || '',
      pemohon_rw: pemohon?.rw || '',
      pemohon_desa: pemohon?.desa || '',
      pemohon_kecamatan: pemohon?.kecamatan || '',
      pemohon_kota: pemohon?.kota_kabupaten || '',
      pemohon_provinsi: pemohon?.provinsi || '',
      pemohon_tempat_lahir: pemohon?.tempat_lahir || '',
      pemohon_tanggal_lahir: pemohon?.tanggal_lahir ? formatDateIndo(pemohon.tanggal_lahir) : '',
      pemohon_ejaan_lahir: pemohon?.ejaan_tanggal_lahir || '',
      pemohon_status_kawin: pemohon?.status_perkawinan || '',
      pemohon_nama_ibu: pemohon?.nama_ibuk_kandung || '',
      pemohon_nama_bapak: pemohon?.nama_bapak_kandung || '',
      
      // ========================================
      // DATA TANAH - LOKASI
      // ========================================
      tanah_alamat: land?.alamat || '',
      tanah_rt: land?.rt || '',
      tanah_rw: land?.rw || '',
      tanah_desa: land?.desa || '',
      tanah_kecamatan: land?.kecamatan || '',
      tanah_kabupaten: land?.kabupaten_kota || 'Pasuruan',
      tanah_provinsi: 'Jawa Timur',
      tanah_tipe_wilayah: land?.tipe_wilayah || '',
      
      // ========================================
      // DATA TANAH - LETTER C
      // ========================================
      nomor_c: land?.kohir || '',
      persil: land?.persil || '',
      klas: land?.klas || '',
      atas_nama_c: land?.atas_nama_letter_c || '',
      berasal_dari: land?.berasal_dari_an || '',
      tahun_perolehan_alas_hak: land?.tahun_perolehan_alas_hak || '',
      
      // ========================================
      // DATA TANAH - SHM ANALOG (untuk Akta)
      // ========================================
      no_shm: land?.no_shm || '',
      atas_nama_shm: land?.atas_nama_shm || '',
      nib: land?.nib || '',
      no_su: land?.no_su || '',
      tanggal_su: land?.tanggal_su ? formatDateIndo(land.tanggal_su) : '',
      ejaan_tanggal_su: land?.ejaan_tanggal_su || '',
      tanggal_shm: land?.tanggal_shm ? formatDateIndo(land.tanggal_shm) : '',
      ejaan_tanggal_shm: land?.ejaan_tanggal_shm || '',
      
      // ========================================
      // DATA TANAH - SHM ELEKTRONIK (untuk Akta)
      // ========================================
      atas_nama_shm_el: land?.atas_nama_shm_el || '',
      kode_sertifikat: land?.kode_sertifikat || '',
      nibel: land?.nibel || '',
      
      // ========================================
      // DATA NOP & PAJAK
      // ========================================
      nop: land?.nop || file.nop || '',
      sppt_tahun: land?.sppt_tahun || '',
      pajak_bumi_total: land?.pajak_bumi_total || 0,
      pajak_bangunan_total: land?.pajak_bangunan_total || 0,
      pajak_grand_total: land?.pajak_grand_total || 0,
      
      // ========================================
      // BATAS TANAH
      // ========================================
      batas_utara: land?.batas_utara_seluruhnya || '',
      batas_timur: land?.batas_timur_seluruhnya || '',
      batas_selatan: land?.batas_selatan_seluruhnya || '',
      batas_barat: land?.batas_barat_seluruhnya || '',
      
      // ========================================
      // LUAS
      // ========================================
      luas_seluruhnya: land?.luas_seluruhnya || 0,
      ejaan_luas_seluruhnya: land?.ejaan_luas_seluruhnya || '',
      luas_dimohon: land?.luas_dimohon || 0,
      ejaan_luas_dimohon: land?.ejaan_luas_dimohon || '',
      
      // ========================================
      // HARGA TRANSAKSI
      // ========================================
      harga_transaksi: (land?.harga_transaksi || 0).toLocaleString('id-ID'),
      ejaan_harga_transaksi: land?.ejaan_harga_transaksi || '',
      
      // ========================================
      // RIWAYAT TANAH
      // ========================================
      riwayat_tanah: land?.riwayat_tanah || [],
      
      // ========================================
      // BAK
      // ========================================
      bak_list: bakList,
      ...bakAccess,
      
      // ========================================
      // DATA SAKSI (untuk Sporadik)
      // ========================================
      saksi_0_nama: saksiList[0]?.nama || '',
      saksi_0_nik: formatNIK(saksiList[0]?.nik || ''),
      saksi_0_umur: saksiList[0] ? calculateAge(saksiList[0].tanggal_lahir) : 0,
      saksi_0_pekerjaan: saksiList[0]?.pekerjaan || '',
      saksi_0_alamat: saksiList[0] ? formatAlamat(saksiList[0]) : '',
      saksi_0_agama: saksiList[0]?.agama || '',
            
      saksi_1_nama: saksiList[1]?.nama || '',
      saksi_1_nik: formatNIK(saksiList[1]?.nik || ''),
      saksi_1_umur: saksiList[1] ? calculateAge(saksiList[1].tanggal_lahir) : 0,
      saksi_1_pekerjaan: saksiList[1]?.pekerjaan || '',
      saksi_1_alamat: saksiList[1] ? formatAlamat(saksiList[1]) : '',
      saksi_1_agama: saksiList[1]?.agama || '',
      
      saksi_2_nama: saksiList[2]?.nama || '',
      saksi_2_nik: formatNIK(saksiList[2]?.nik || ''),
      saksi_2_umur: saksiList[2] ? calculateAge(saksiList[2].tanggal_lahir) : 0,
      saksi_2_pekerjaan: saksiList[2]?.pekerjaan || '',
      saksi_2_alamat: saksiList[2] ? formatAlamat(saksiList[2]) : '',
      saksi_2_agama: saksiList[2]?.agama || '',
      
      // ========================================
      // DATA AKTA (LOOP)
      // ========================================
      penjual: mapToArray(p1Raw),
      pembeli: mapToArray(p2Raw),
      saksi_akta: mapToArray(saksiRaw),
      persetujuan: mapSetuju(setujuRaw),
      
      // ========================================
      // DATA BERKAS
      // ========================================
      No_Berkas: file.nomor_berkas || '',
      No_Reg: file.nomor_register || '',
      Hari: file.hari || '',
      Tgl_Surat: file.tanggal ? formatDateIndo(file.tanggal) : '',
      Tgl_Ejaan: file.ejaan_tanggal || '',
      Cakupan_Tanah: file.cakupan_tanah || '',
      Pihak_Penanggung: file.pihak_penanggung || '',
      Jumlah_Saksi: parseInt(file.jumlah_saksi || '0') || saksiRaw.length,
      
      // KHUSUS WARIS
      isWaris,
      nama_almarhum: file.nama_almarhum || '',
      desa_waris: file.desa_waris || '',
      kecamatan_waris: file.kecamatan_waris || '',
      register_waris_desa: file.register_waris_desa || '',
      register_waris_kecamatan: file.register_waris_kecamatan || '',
      tanggal_waris: file.tanggal_waris ? formatDateIndo(file.tanggal_waris) : '',
      ejaan_tanggal_waris: file.ejaan_tanggal_waris || '',
      
      // KHUSUS AKTA KUASA
      nomor_akta_kuasa: file.nomor_akta_kuasa || '',
      tanggal_akta_kuasa: file.tanggal_akta_kuasa ? formatDateIndo(file.tanggal_akta_kuasa) : '',
      ejaan_tanggal_akta: file.ejaan_tanggal_akta || '',
      nama_notaris_kuasa: file.nama_notaris_kuasa || '',
      kedudukan_notaris: file.kedudukan_notaris || '',
      
      // KETERANGAN PERSETUJUAN
      keterangan_persetujuan: file.keterangan_persetujuan || '',
      alamat_persetujuan: file.alamat_persetujuan || '',
      
      // ========================================
      // DATA KEPALA DESA
      // ========================================
      kepala_desa: land?.nama_kepala_desa || '',
      jenis_kades: land?.jenis_kades || '',
      
      // ========================================
      // CONDITIONAL FLAGS
      // ========================================
      isJualBeli,
      isHibah,
      isWarisFlag: isWaris,
      isTukarMenukar,
      
      isLetterC,
      isSHM,
      isSHMElektronik,
      
      isPersetujuan: setujuRaw.length > 0,
      isIstri: file.keterangan_persetujuan === "ISTRI",
      isSuami: file.keterangan_persetujuan === "SUAMI",
      
      // ========================================
      // COUNTER
      // ========================================
      _countP1: p1Raw.length,
      _countP2: p2Raw.length,
      _countS: saksiRaw.length,
      _countSetuju: setujuRaw.length,
      _countRiwayat: land?.riwayat_tanah?.length || 0,
      _countBak: bakList.length,
    };
  };

  // ========================================
  // COPY TO CLIPBOARD
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
      
      // Siapkan data final - untuk kedua jenis, kita kirim semua data yang ada
      // Template word akan memilih sendiri menggunakan conditional
      const finalData = { ...data };

      // Tambahkan input manual tetangga batas untuk Sporadik
      if (jenis === 'sporadik') {
        finalData.tetangga_utara_nama = tetanggaBatas.utara.nama || data.batas_utara || '';
        finalData.tetangga_utara_ttd = tetanggaBatas.utara.ttd || '';
        finalData.tetangga_timur_nama = tetanggaBatas.timur.nama || data.batas_timur || '';
        finalData.tetangga_timur_ttd = tetanggaBatas.timur.ttd || '';
        finalData.tetangga_selatan_nama = tetanggaBatas.selatan.nama || data.batas_selatan || '';
        finalData.tetangga_selatan_ttd = tetanggaBatas.selatan.ttd || '';
        finalData.tetangga_barat_nama = tetanggaBatas.barat.nama || data.batas_barat || '';
        finalData.tetangga_barat_ttd = tetanggaBatas.barat.ttd || '';
        finalData.materai = '[MATERAI 10.000]';
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
          // Jika data tidak ada, kembalikan string kosong
          return '';
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
            Etana Logic v2.5 • Sporadik | Akta (PPAT & Notaris)
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
                  label="PIHAK 1" 
                  val={previewData._countP1 || 0} 
                  icon={<UserCheck size={14}/>} 
                  color="emerald" 
                />
                <SummaryWidget 
                  label="PIHAK 2" 
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
                  <ScrollText size={14} className="mx-auto mb-1" />
                  AKTA
                  <span className="block text-[8px] font-normal mt-1">(PPAT/Notaris)</span>
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
                    SATU VERSI UNTUK SEMUA JENIS DOKUMEN
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
            
            {/* Tab Navigation */}
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
                  📄 SPORADIK
                </button>
                <button
                  className={`px-6 py-3 text-xs font-black uppercase rounded-xl transition-all ${
                    jenisDokumen === 'akta' 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-slate-100 text-slate-400'
                  }`}
                  onClick={() => setJenisDokumen('akta')}
                >
                  📜 AKTA
                </button>
              </div>
            </div>
            
            {/* Content - KAMUS TAG */}
            <div className="p-10 overflow-y-auto flex-1 bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* KATEGORI: LOOP UNTUK AKTA */}
                <TagCategory title="LOOP (AKTA)" icon={<Repeat size={16}/>} color="blue">
                  <TagRow tag="{#penjual}" val="Mulai loop penjual" desc="Loop untuk PIHAK_1" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="{_index}" val="Nomor urut" desc="Nomor urut dalam loop" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="{Nama}" val={previewData.penjual?.[0]?.Nama} desc="Nama" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="{NIK}" val={previewData.penjual?.[0]?.NIK} desc="NIK" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="{/penjual}" val="Akhir loop penjual" desc="Penutup loop" onCopy={copyToClipboard} copied={copiedTag} />
                  
                  <TagRow tag="{#pembeli}" val="Mulai loop pembeli" desc="Loop untuk PIHAK_2" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="{/pembeli}" val="Akhir loop pembeli" desc="Penutup loop" onCopy={copyToClipboard} copied={copiedTag} />
                  
                  <TagRow tag="{#saksi_akta}" val="Mulai loop saksi" desc="Loop untuk saksi" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="{/saksi_akta}" val="Akhir loop saksi" desc="Penutup loop" onCopy={copyToClipboard} copied={copiedTag} />
                  
                  <TagRow tag="{#riwayat_tanah}" val="Mulai loop riwayat" desc="Loop riwayat tanah" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="{/riwayat_tanah}" val="Akhir loop riwayat" desc="Penutup loop" onCopy={copyToClipboard} copied={copiedTag} />
                </TagCategory>

                {/* KATEGORI: CONDITIONAL FLAGS */}
                <TagCategory title="KONDISI" icon={<ShieldCheck size={16}/>} color="yellow">
                  <TagRow tag="isJualBeli" val={String(previewData.isJualBeli)} desc="Boolean: true jika Jual Beli" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="isWaris" val={String(previewData.isWarisFlag)} desc="Boolean: true jika Waris" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="isHibah" val={String(previewData.isHibah)} desc="Boolean: true jika Hibah" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="isLetterC" val={String(previewData.isLetterC)} desc="Boolean: true jika Letter C" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="isSHM" val={String(previewData.isSHM)} desc="Boolean: true jika SHM" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="isSHMElektronik" val={String(previewData.isSHMElektronik)} desc="Boolean: true jika SHM Elektronik" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="isPersetujuan" val={String(previewData.isPersetujuan)} desc="Boolean: ada persetujuan" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="isIstri" val={String(previewData.isIstri)} desc="Boolean: persetujuan istri" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="isSuami" val={String(previewData.isSuami)} desc="Boolean: persetujuan suami" onCopy={copyToClipboard} copied={copiedTag} />
                </TagCategory>

                {/* KATEGORI: DATA TANAH - LETTER C */}
                <TagCategory title="LETTER C" icon={<Layers size={16}/>} color="purple">
                  <TagRow tag="nomor_c" val={previewData.nomor_c} desc="Nomor Kohir (C)" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="persil" val={previewData.persil} desc="Nomor Persil" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="klas" val={previewData.klas} desc="Klasifikasi Tanah" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="atas_nama_c" val={previewData.atas_nama_c} desc="Atas Nama di Letter C" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="berasal_dari" val={previewData.berasal_dari} desc="Berasal dari (asal-usul)" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="tahun_perolehan_alas_hak" val={previewData.tahun_perolehan_alas_hak} desc="Tahun perolehan alas hak" onCopy={copyToClipboard} copied={copiedTag} />
                </TagCategory>

                {/* KATEGORI: DATA TANAH - SHM ANALOG */}
                <TagCategory title="SHM ANALOG" icon={<BookOpen size={16}/>} color="green">
                  <TagRow tag="no_shm" val={previewData.no_shm} desc="Nomor SHM" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="atas_nama_shm" val={previewData.atas_nama_shm} desc="Atas Nama di SHM" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="nib" val={previewData.nib} desc="NIB (Nomor Identifikasi Bidang)" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="no_su" val={previewData.no_su} desc="Nomor SU (Surat Ukur)" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="tanggal_su" val={previewData.tanggal_su} desc="Tanggal SU" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="tanggal_shm" val={previewData.tanggal_shm} desc="Tanggal SHM" onCopy={copyToClipboard} copied={copiedTag} />
                </TagCategory>

                {/* KATEGORI: DATA TANAH - SHM ELEKTRONIK */}
                <TagCategory title="SHM ELEKTRONIK" icon={<FileText size={16}/>} color="cyan">
                  <TagRow tag="atas_nama_shm_el" val={previewData.atas_nama_shm_el} desc="Atas Nama SHM Elektronik" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="kode_sertifikat" val={previewData.kode_sertifikat} desc="Kode Sertifikat Elektronik" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="nibel" val={previewData.nibel} desc="NIBEL (Nomor Identifikasi Elektronik)" onCopy={copyToClipboard} copied={copiedTag} />
                </TagCategory>

                {/* KATEGORI: BATAS & LUAS TANAH */}
                <TagCategory title="BATAS & LUAS" icon={<MapPin size={16}/>} color="orange">
                  <TagRow tag="batas_utara" val={previewData.batas_utara} desc="Batas Utara" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="batas_timur" val={previewData.batas_timur} desc="Batas Timur" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="batas_selatan" val={previewData.batas_selatan} desc="Batas Selatan" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="batas_barat" val={previewData.batas_barat} desc="Batas Barat" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="luas_seluruhnya" val={previewData.luas_seluruhnya} desc="Luas tanah seluruhnya (m²)" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="ejaan_luas_seluruhnya" val={previewData.ejaan_luas_seluruhnya} desc="Luas (terbilang)" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="luas_dimohon" val={previewData.luas_dimohon} desc="Luas dimohon (m²)" onCopy={copyToClipboard} copied={copiedTag} />
                </TagCategory>

                {/* KATEGORI: NOP & PAJAK */}
                <TagCategory title="NOP & PAJAK" icon={<FileSpreadsheet size={16}/>} color="lime">
                  <TagRow tag="nop" val={previewData.nop} desc="NOP (Nomor Objek Pajak)" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="sppt_tahun" val={previewData.sppt_tahun} desc="Tahun SPPT" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="pajak_grand_total" val={previewData.pajak_grand_total} desc="Total Pajak" onCopy={copyToClipboard} copied={copiedTag} />
                </TagCategory>

                {/* KATEGORI: DATA PEMOHON */}
                <TagCategory title="PEMOHON" icon={<UserCheck size={16}/>} color="emerald">
                  <TagRow tag="pemohon_nama" val={previewData.pemohon_nama} desc="Nama pemohon" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="pemohon_nik" val={previewData.pemohon_nik} desc="NIK pemohon" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="pemohon_umur" val={previewData.pemohon_umur} desc="Umur pemohon" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="pemohon_pekerjaan" val={previewData.pemohon_pekerjaan} desc="Pekerjaan pemohon" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="pemohon_alamat" val={previewData.pemohon_alamat} desc="Alamat pemohon" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="pemohon_tempat_lahir" val={previewData.pemohon_tempat_lahir} desc="Tempat lahir" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="pemohon_tanggal_lahir" val={previewData.pemohon_tanggal_lahir} desc="Tanggal lahir" onCopy={copyToClipboard} copied={copiedTag} />
                </TagCategory>

                {/* KATEGORI: LOKASI TANAH */}
                <TagCategory title="LOKASI TANAH" icon={<MapPin size={16}/>} color="blue">
                  <TagRow tag="tanah_alamat" val={previewData.tanah_alamat} desc="Alamat tanah" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="tanah_desa" val={previewData.tanah_desa} desc="Desa/Kelurahan" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="tanah_kecamatan" val={previewData.tanah_kecamatan} desc="Kecamatan" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="tanah_kabupaten" val={previewData.tanah_kabupaten} desc="Kabupaten/Kota" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="tanah_rt" val={previewData.tanah_rt} desc="RT" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="tanah_rw" val={previewData.tanah_rw} desc="RW" onCopy={copyToClipboard} copied={copiedTag} />
                </TagCategory>

                {/* KATEGORI: SAKSI (SPORADIK) */}
                <TagCategory title="SAKSI (SPORADIK)" icon={<Users size={16}/>} color="pink">
                  <TagRow tag="saksi_0_nama" val={previewData.saksi_0_nama} desc="Nama saksi 1" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="saksi_1_nama" val={previewData.saksi_1_nama} desc="Nama saksi 2" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="saksi_2_nama" val={previewData.saksi_2_nama} desc="Nama saksi 3" onCopy={copyToClipboard} copied={copiedTag} />
                </TagCategory>

                {/* KATEGORI: BAK (ARRAY OF STRINGS) */}
                <TagCategory title="BAK" icon={<FileText size={16}/>} color="amber">
                  <TagRow tag="bak_0" val={previewData.bak_0} desc="Baris pertama BAK" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="bak_1" val={previewData.bak_1} desc="Baris kedua BAK" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="bak_2" val={previewData.bak_2} desc="Baris ketiga BAK" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="bak_3" val={previewData.bak_3} desc="Baris keempat BAK" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="_countBak" val={previewData._countBak} desc="Jumlah baris BAK" onCopy={copyToClipboard} copied={copiedTag} />
                </TagCategory>

                {/* KATEGORI: ADMINISTRASI */}
                <TagCategory title="ADMINISTRASI" icon={<FileText size={16}/>} color="gray">
                  <TagRow tag="No_Berkas" val={previewData.No_Berkas} desc="Nomor Berkas" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="No_Reg" val={previewData.No_Reg} desc="Nomor Register" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="Hari" val={previewData.Hari} desc="Hari" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="Tgl_Surat" val={previewData.Tgl_Surat} desc="Tanggal Surat" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="Tgl_Ejaan" val={previewData.Tgl_Ejaan} desc="Tanggal (terbilang)" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="kepala_desa" val={previewData.kepala_desa} desc="Nama Kepala Desa" onCopy={copyToClipboard} copied={copiedTag} />
                </TagCategory>

                {/* KATEGORI: KHUSUS WARIS */}
                <TagCategory title="WARIS" icon={<History size={16}/>} color="red">
                  <TagRow tag="nama_almarhum" val={previewData.nama_almarhum} desc="Nama almarhum" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="desa_waris" val={previewData.desa_waris} desc="Desa waris" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="register_waris_desa" val={previewData.register_waris_desa} desc="Register waris desa" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="tanggal_waris" val={previewData.tanggal_waris} desc="Tanggal waris" onCopy={copyToClipboard} copied={copiedTag} />
                </TagCategory>

                {/* KATEGORI: KHUSUS AKTA KUASA */}
                <TagCategory title="AKTA KUASA" icon={<FileSignature size={16}/>} color="indigo">
                  <TagRow tag="nomor_akta_kuasa" val={previewData.nomor_akta_kuasa} desc="Nomor akta kuasa" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="nama_notaris_kuasa" val={previewData.nama_notaris_kuasa} desc="Nama notaris" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="kedudukan_notaris" val={previewData.kedudukan_notaris} desc="Kedudukan notaris" onCopy={copyToClipboard} copied={copiedTag} />
                </TagCategory>

                {/* KATEGORI: TETANGGA BATAS (INPUT MANUAL) */}
                <TagCategory title="TETANGGA BATAS" icon={<Users size={16}/>} color="yellow">
                  <TagRow tag="tetangga_utara_nama" val="[Input Manual]" desc="Nama tetangga utara" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="tetangga_utara_ttd" val="[Input Manual]" desc="Tanda tangan tetangga utara" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="tetangga_timur_nama" val="[Input Manual]" desc="Nama tetangga timur" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="tetangga_timur_ttd" val="[Input Manual]" desc="Tanda tangan tetangga timur" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="tetangga_selatan_nama" val="[Input Manual]" desc="Nama tetangga selatan" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="tetangga_selatan_ttd" val="[Input Manual]" desc="Tanda tangan tetangga selatan" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="tetangga_barat_nama" val="[Input Manual]" desc="Nama tetangga barat" onCopy={copyToClipboard} copied={copiedTag} />
                  <TagRow tag="tetangga_barat_ttd" val="[Input Manual]" desc="Tanda tangan tetangga barat" onCopy={copyToClipboard} copied={copiedTag} />
                </TagCategory>

                {/* KATEGORI: UMUM */}
                <TagCategory title="UMUM" icon={<FileText size={16}/>} color="slate">
                  <TagRow tag="materai" val="[MATERAI 10.000]" desc="Tempat materai" onCopy={copyToClipboard} copied={copiedTag} />
                </TagCategory>
              </div>
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
                  PREVIEW {jenisDokumen === 'sporadik' ? 'SPORADIK' : 'AKTA'}
                </h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Berkas: {previewData.No_Berkas || ''}
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
                      {previewData.batas_utara || ''}
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
                      {previewData.batas_timur || ''}
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
                      {previewData.batas_selatan || ''}
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
                      {previewData.batas_barat || ''}
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

            {/* Kolom Kanan: Preview Data */}
            <div className={`flex-1 bg-slate-100 p-8 overflow-y-auto ${jenisDokumen !== 'sporadik' ? 'w-full' : ''}`}>
              <div className="bg-white w-full max-w-[850px] mx-auto shadow-[0_50px_100px_rgba(0,0,0,0.15)] p-[30mm] text-slate-800 font-serif relative border border-slate-200">
                
                <div className="text-center mb-8">
                  <h1 className="text-xl font-black underline tracking-tight uppercase">
                    PREVIEW DATA
                  </h1>
                  <p className="text-xs mt-2">Nomor: {previewData.No_Berkas || ''}</p>
                </div>

                {/* Preview sederhana */}
                <div className="space-y-4">
                  <p><span className="font-bold">Jenis Dokumen:</span> {jenisDokumen === 'sporadik' ? 'Sporadik' : 'Akta'}</p>
                  <p><span className="font-bold">Jenis Perolehan:</span> {
                    previewData.isJualBeli ? 'Jual Beli' : 
                    previewData.isWarisFlag ? 'Waris' : 
                    previewData.isHibah ? 'Hibah' : ''
                  }</p>
                  <p><span className="font-bold">Jenis Tanah:</span> {
                    previewData.isLetterC ? 'Letter C' : 
                    previewData.isSHM ? 'SHM' : 
                    previewData.isSHMElektronik ? 'SHM Elektronik' : ''
                  }</p>
                  <p><span className="font-bold">Pemohon/Penjual:</span> {previewData.pemohon_nama || (previewData.penjual?.[0]?.Nama) || ''}</p>
                  <p><span className="font-bold">Lokasi Tanah:</span> {previewData.tanah_desa}, {previewData.tanah_kecamatan}</p>
                  <p><span className="font-bold">Luas:</span> {previewData.luas_seluruhnya} m²</p>
                  <p><span className="font-bold">Nomor C/SHM:</span> {previewData.nomor_c || previewData.no_shm || ''}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// SUB COMPONENTS
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
    indigo: 'border-indigo-200 text-indigo-700 bg-indigo-50',
    cyan: 'border-cyan-200 text-cyan-700 bg-cyan-50',
    lime: 'border-lime-200 text-lime-700 bg-lime-50',
    amber: 'border-amber-200 text-amber-700 bg-amber-50',
    slate: 'border-slate-200 text-slate-700 bg-slate-50'
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
      {val && val !== 0 && (
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