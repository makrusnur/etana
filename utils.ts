export const terbilang = (nilai: number): string => {
  const angka = Math.abs(Math.floor(nilai));
  const huruf = [
    "", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"
  ];
  let temp = "";
  
  if (angka < 12) {
    temp = " " + huruf[angka];
  } else if (angka < 20) {
    temp = terbilang(angka - 10) + " belas ";
  } else if (angka < 100) {
    temp = terbilang(Math.floor(angka / 10)) + " puluh " + terbilang(angka % 10);
  } else if (angka < 200) {
    temp = " seratus " + terbilang(angka - 100);
  } else if (angka < 1000) {
    temp = terbilang(Math.floor(angka / 100)) + " ratus " + terbilang(angka % 100);
  } else if (angka < 2000) {
    temp = " seribu " + terbilang(angka - 1000);
  } else if (angka < 1000000) {
    temp = terbilang(Math.floor(angka / 1000)) + " ribu " + terbilang(angka % 1000);
  } else if (angka < 1000000000) {
    temp = terbilang(Math.floor(angka / 1000000)) + " juta " + terbilang(angka % 1000000);
  } else if (angka < 1000000000000) {
    temp = terbilang(Math.floor(angka / 1000000000)) + " miliar " + terbilang(angka % 1000000000);
  } else if (angka < 1000000000000000) {
    temp = terbilang(Math.floor(angka / 1000000000000)) + " triliun " + terbilang(angka % 1000000000000);
  }
  
  return temp.trim().toLowerCase();
};

// --- FUNGSI INI TETAP ADA UNTUK NAMA & ALAMAT ---
export const toTitleCase = (str: string): string => {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .filter((s) => s !== "")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const spellDateIndo = (dateStr: string): string => {
  if (!dateStr || dateStr === 'SEUMUR HIDUP') return dateStr;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  // Nama bulan Manual dengan Kapital di awal
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const day = terbilang(date.getDate());   
  const month = months[date.getMonth()];   
  const year = terbilang(date.getFullYear()); 

  // Di sini kita gabung manual, TIDAK pakai toTitleCase 
  // supaya "Januari" tetap Besar dan "sebelas" tetap kecil.
  return `${day} ${month} ${year}`.trim();
};

export const calculateAge = (dateStr: string): string => {
  if (!dateStr || dateStr === 'SEUMUR HIDUP') return "";
  const birthDate = new Date(dateStr);
  if (isNaN(birthDate.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age.toString();
};

export const getDayNameIndo = (dateStr: string): string => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  return days[date.getDay()];
};

export const formatDateIndo = (dateStr: string): string => {
  if (!dateStr || dateStr === 'SEUMUR HIDUP') return dateStr;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

export const formatDateStrip = (dateStr: string): string => {
  if (!dateStr || dateStr === 'SEUMUR HIDUP') return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Ditambah 1 karena bulan mulai dari 0
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};


export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const formatBatasTanah = (val: string): string => {
  if (!val) return '';

  // Daftar kata kunci Fasum (tidak ditambah "Tanah Milik")
  const fasumKeywords: string[] = [
    'JALAN', 'GANG', 'SUNGAI', 'SOLOKAN', 'PARIT', 'DRAINASE', 
    'TANAH NEGARA', 'MAKAM', 'KALI', 'EMBUNG', 'SALI', 'IRIGASI', 'JALAN DESA',
    'SALURAN'
  ];

  const upperVal: string = val.toUpperCase().trim();

  // Cek apakah input mengandung salah satu kata kunci Fasum
  const isFasum: boolean = fasumKeywords.some(keyword => upperVal.includes(keyword));

  if (isFasum) {
    return upperVal;
  } else {
    // Pastikan tidak double jika user sudah ngetik manual
    return upperVal.startsWith('TANAH MILIK') ? upperVal : `TANAH MILIK ${upperVal}`;
  }
};

export const formatNOP = (val: string | number): string => {
  if (!val) return '';
  
  // Pastikan input adalah string dan ambil hanya angkanya saja
  const clean = String(val).replace(/\D/g, ''); 
  
  // Format: 2.2.3.3.3.4.1
  const match = clean.match(/^(\d{2})(\d{2})(\d{3})(\d{3})(\d{3})(\d{4})(\d{1})$/);
  
  if (match) {
    return `${match[1]}.${match[2]}.${match[3]}.${match[4]}.${match[5]}.${match[6]}.${match[7]}`;
  }
  
  // Jika angka belum lengkap (sedang diketik), tetap tampilkan angka bersihnya
  return clean;
};