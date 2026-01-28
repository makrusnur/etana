// 1. Identitas Klien / Subjek Hak
export interface Identity {
  id: string;
  status: 'active' | 'archived';
  sebutan: 'Tuan' | 'Nyonya' | 'Nona' | 'Duda' | 'Janda' | '';
  nik: string;
  nama: string;
  alias?: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  ejaan_tanggal_lahir: string;
  jenis_kelamin: 'Laki-laki' | 'Perempuan' | '';
  agama: string;
  status_perkawinan?: string;
  golongan_darah?: string;
  alamat: string;
  rt: string;
  rw: string;
  wilayah_type?: string;
  desa: string;
  kecamatan: string;
  daerah_type?: string;
  kota_kabupaten: string;
  provinsi: string;
  kode_pos?: string;
  pekerjaan: string;
  kewarganegaraan?: string;
  ktp_berlaku: string;
  is_seumur_hidup?: boolean;
  ejaan_tanggal_ktp_berlaku: string;
  nama_bapak_kandung: string;
  nama_ibuk_kandung: string;
  pendidikan_terakhir: string;
  foto_ktp: string;
  foto_verifikasi?: string;
  ttd_digital?: string;
  sidik_jari?: string;
  created_at: string;
  telepon?: string;
  npwp?: string; 
  email?: string;
}

// 2. Master Desa Pelaksana PTSL (Pilihan A)
export interface PtslVillage {
  id: string;
  nama_desa: string;
  kecamatan: string;
  tahun_anggaran: string;
  target_kuota?: number;
  keterangan?: string;
  created_at: string;
}

// 3. Data Tanah & Bangunan
export type LandType = 'LETTER_C' | 'SHM_ANALOG' | 'SHM_ELEKTRONIK';

export interface BuildingDetail {
  id: string;
  bangunan_ke: number;
  jenis_penggunaan: string;
  luas: number;
  jumlah_lantai: number;
  tahun_dibangun: string;
  tahun_direnovasi?: string;
  daya_listrik: string;
  kondisi: string;
  konstruksi: string;
  atap: string;
  dinding: string;
  lantai: string;
  langit_langit: string;
}

export interface LandHistory {
  atas_nama: string;
  c_no: string;
  persil_no: string;
  klas: string;
  luas: string;
  dasar_dialihkan: string;
}

export interface LandData {
  id: string;
  nop: string;
  atas_nama_nop: string;
  jenis_kades: 'Kepala Desa' | 'Lurah' | '';
  nama_kepala_desa?: string;
  penggunaan_tanah?: string;
  alamat: string;
  rt: string;
  rw: string;
  tipe_wilayah: 'Desa' | 'Kelurahan' | '';
  desa: string;
  kecamatan: string;
  kabupaten_kota: string;
  kewajiban_pajak: string;
  surat_hak_sebelumnya: SuratHak[] ;
  jenis_dasar_surat: LandType;
  
  kohir?: string;
  persil?: string;
  klas?: string;
  atas_nama_letter_c?: string;
  berasal_dari_an?: string; 
  tahun_perolehan_alas_hak?: string; 
  
  atas_nama_shm?: string;
  no_shm?: string;
  nib?: string;
  no_su?: string;
  tanggal_su?: string;
  ejaan_tanggal_su?: string;
  tanggal_shm?: string; 
  ejaan_tanggal_shm?: string;
  
  atas_nama_shm_el?: string;
  kode_sertifikat?: string;
  nibel?: string;

  riwayat_tanah?: LandHistory[];
  bak_list?: string[];
  bak?: string; 

  luas_dimohon: number;
  ejaan_luas_dimohon: string;
  batas_utara_dimohon: string;
  batas_timur_dimohon: string;
  batas_selatan_dimohon: string;
  batas_barat_dimohon: string;

  luas_seluruhnya: number;
  ejaan_luas_seluruhnya: string;
  batas_utara_seluruhnya: string;
  batas_timur_seluruhnya: string;
  batas_selatan_seluruhnya: string;
  batas_barat_seluruhnya: string;
  
  sppt_tahun?: string;
  pajak_bumi_luas?: number;
  pajak_bumi_njop?: number;
  pajak_bumi_total?: number;

  jumlah_bangunan?: number;
  pajak_bangunan_luas?: number;
  pajak_bangunan_njop?: number;
  pajak_bangunan_total?: number;
  detail_bangunan?: BuildingDetail[];
  
  pajak_grand_total?: number;
  harga_transaksi?: number;
  ejaan_harga_transaksi?: string;

  koordinat_list?: string[];
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface SuratHak {
  jenis: string;
  tanggal: string;
  nomor: string;
  nama_ppat: string;
}

// 4. Berkas (Induk Relasi)
export interface FileRecord {
  // === FIELD ASLI (JANGAN DIHAPUS/DIUBAH) ===
  id: string;
  kategori: 'PPAT_NOTARIS' | 'PTSL';
  village_id?: string; // Menghubungkan ke PtslVillage (Untuk PTSL)
  nomor_berkas: string; // NUB
  nomor_register: string; 
  hari: string; 
  tanggal: string;
  keterangan: string;
  jenis_perolehan: string;
  tahun_perolehan: string;
  created_at: string;
  register_waris_desa?: string;
  register_waris_kecamatan?: string;
  tanggal_waris?: string;
  ejaan_tanggal_waris: string;


  latitude?: number;  // Tambahkan ini
  longitude?: number; // Tambahkan ini

  // === TAMBAHAN BARU (UNTUK 12 POIN PTSL) ===
  kasun?: string;                               // Poin 3
  jenis_tanah?: string;                         // Poin 4
  nama_pemohon?: string;                        // Poin 5 (Nama)
  nop: string;
  asal_perolehan?: string;                      // Poin 6
  tahun_pemohon?: string;                       // Poin 7
  tahun_penjual?: string;                       // Poin 8
  sebab_perolehan?: string;                     // Poin 9 (Jual beli, hibah, waris)
  bukti_perolehan?: string;                     // Poin 10 (Segel, akta, kwitansi)
  
  // Poin 11: Batas-batas
  batas_utara?: string;
  batas_timur?: string;
  batas_selatan?: string;
  batas_barat?: string;
  
  // Poin 12: Ceklis Kelengkapan (Boolean)
  cek_ktp?: boolean;
  cek_kk?: boolean;
  cek_sppt?: boolean;
  cek_bukti?: boolean;
}

// 5. Relasi (Menghubungkan Orang, Tanah, dan Berkas)
export type RelationRole = 'PIHAK_1' | 'PIHAK_2' | 'SAKSI' | 'PERSETUJUAN_PIHAK_1';

export interface Relation {
  id: string;
  berkas_id: string;
  identitas_id: string;
  data_tanah_id?: string;
  peran: RelationRole;
  persetujuan?: string;
}

export interface PbbRecord {
  id?: string;
  created_at?: string;
  desa_id: string;
  identitas_id: string;
  data_tanah_id: string;
  tipe_layanan: string;
  nop_asal: string;
  status_subjek: string;
  jenis_subjek: string;
}

// Isi file src/types.ts
export interface Kecamatan {
  id: string;
  nama: string;
}

export interface Desa {
  id: string;
  nama: string;
  kecamatan_id: string;
}

export interface LetterC {
  id: string;
  desa_id: string;
  nomor_c: string;
  nama_pemilik: string;
  alamat_pemilik?: string;
  created_at?: string;
}

export interface LetterCPersil {
  id: string;
  letter_c_id: string;
  nomor_persil: string;
  jenis_tanah: string; // <-- Tambahkan ini Om
  klas_desa: string;
  luas_meter: number;
  asal_usul?: string;
  created_at?: string;
}

export interface Mutasi {
  id: string;
  c_asal: string;
  c_tujuan: string;
  nama_pihak_asal: string;
  nama_pihak_tujuan: string;
  luas_mutasi: number;
  jenis_mutasi: string;
  tanggal_mutasi: string;
}