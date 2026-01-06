
export const terbilang = (nilai: number): string => {
  const angka = Math.abs(Math.floor(nilai));
  const huruf = [
    "", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"
  ];
  let temp = "";
  
  if (angka < 12) {
    temp = " " + huruf[angka];
  } else if (angka < 20) {
    temp = terbilang(angka - 10) + " belas";
  } else if (angka < 100) {
    temp = terbilang(Math.floor(angka / 10)) + " puluh" + terbilang(angka % 10);
  } else if (angka < 200) {
    temp = " seratus" + terbilang(angka - 100);
  } else if (angka < 1000) {
    temp = terbilang(Math.floor(angka / 100)) + " ratus" + terbilang(angka % 100);
  } else if (angka < 2000) {
    temp = " seribu" + terbilang(angka - 1000);
  } else if (angka < 1000000) {
    temp = terbilang(Math.floor(angka / 1000)) + " ribu" + terbilang(angka % 1000);
  } else if (angka < 1000000000) {
    temp = terbilang(Math.floor(angka / 1000000)) + " juta" + terbilang(angka % 1000000);
  } else if (angka < 1000000000000) {
    temp = terbilang(Math.floor(angka / 1000000000)) + " miliar" + terbilang(angka % 1000000000);
  } else if (angka < 1000000000000000) {
    temp = terbilang(Math.floor(angka / 1000000000000)) + " triliun" + terbilang(angka % 1000000000000);
  }
  
  return temp.trim() || "nol";
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
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

export const spellDateIndo = (dateStr: string): string => {
  if (!dateStr || dateStr === 'SEUMUR HIDUP') return dateStr;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const months = [
    "januari", "februari", "maret", "april", "mei", "juni", 
    "juli", "agustus", "september", "oktober", "november", "desember"
  ];
  const day = terbilang(date.getDate());
  const month = months[date.getMonth()];
  const year = terbilang(date.getFullYear());
  return `${day} ${month} ${year}`;
};

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};
