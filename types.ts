
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
  agama: string;
  status_perkawinan?: string; // Field baru
  golongan_darah?: string; // Field baru
  alamat: string;
  rt: string;
  rw: string;
  desa: string;
  kecamatan: string;
  kota_kabupaten: string;
  provinsi: string;
  kode_pos?: string;
  pekerjaan: string;
  ktp_berlaku: string;
  is_seumur_hidup?: boolean;
  ejaan_tanggal_ktp_berlaku: string;
  nama_bapak_kandung: string;
  nama_ibuk_kandung: string;
  pendidikan_terakhir: string;
  foto_ktp: string;
  foto_verifikasi?: string;
  ttd_digital?: string; // Field baru: Base64/URL
  sidik_jari?: string; // Field baru: Base64/URL
  created_at: string;
  nib_badan?: string;
  telepon?: string;
  npwp?: string;
  email?: string;
}

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
  nama_kepala_desa?: string;
  penggunaan_tanah?: string;
  alamat: string;
  rt: string;
  rw: string;
  desa: string;
  kecamatan: string;
  kabupaten_kota: string;
  kewajiban_pajak: string;
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


  // Riwayat & BAK
  riwayat_tanah?: LandHistory[];
  bak_list?: string[];
  bak?: string; // Legacy support

  // Measurements - Dimohon
  luas_dimohon: number;
  ejaan_luas_dimohon: string;
  batas_utara_dimohon: string;
  batas_timur_dimohon: string;
  batas_selatan_dimohon: string;
  batas_barat_dimohon: string;

  // Measurements - Seluruhnya
  luas_seluruhnya: number;
  ejaan_luas_seluruhnya: string;
  batas_utara_seluruhnya: string;
  batas_timur_seluruhnya: string;
  batas_selatan_seluruhnya: string;
  batas_barat_seluruhnya: string;
  
// Field Baru: SPPT Detail & Harga
  sppt_tahun?: string;
  pajak_bumi_luas?: number;
  pajak_bumi_njop?: number;
  pajak_bumi_total?: number;

  // Bangunan Section
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

export interface FileRecord {
  id: string;
  nomor_berkas: string;
  nomor_register: string;
  hari: string;
  tanggal: string;
  keterangan: string;
  jenis_perolehan: string;
  tahun_perolehan: string;
  harga?: number;
  ejaan_harga?: string;
  created_at: string;
  // khusus waris
  register_waris_desa?: string;
  register_waris_kecamatan?: string;
  tanggal_waris?: string;

}

export type RelationRole = 'PIHAK_1' | 'PIHAK_2' | 'SAKSI' | 'PERSETUJUAN_PIHAK_1';

export interface Relation {
  id: string;
  berkas_id: string;
  identitas_id: string;
  data_tanah_id?: string;
  peran: RelationRole;
}
