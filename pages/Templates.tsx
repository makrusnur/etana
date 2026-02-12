import React, { useState, useEffect } from 'react';
import { exportToExcel, generateWordDocument } from '../services/export';
import { db } from '../services/db';
import { Card, Button, Select } from '../components/UI';
import { 
  Printer, X, Database, Copy, ClipboardCheck, UserCheck, 
  FileSpreadsheet, MapPin, FileText, Search, Users, ShieldCheck, Landmark
} from 'lucide-react';
import { formatDateIndo, formatNIK, spellDateIndo , toTitleCase} from '../utils';
import { FileRecord, LandData } from '../types';

export const TemplatesPage: React.FC = () => {
  const [selectedFileId, setSelectedFileId] = useState('');
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [showDataPreview, setShowDataPreview] = useState(false);
  const [copiedTag, setCopiedTag] = useState('');
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [previewData, setPreviewData] = useState<Record<string, any> | null>(null);
  const [tagSearch, setTagSearch] = useState('');
  const [showFinalPreview, setShowFinalPreview] = useState(false);

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const allFiles = await db.files.getAll();
        setFiles(allFiles || []);
      } catch (err) {
        console.error("Gagal memuat daftar berkas:", err);
      }
    };
    loadInitial();
  }, []);

  useEffect(() => {
    const updatePreview = async () => {
      if (selectedFileId) {
        const data = await prepareData(selectedFileId);
        setPreviewData(data);
      } else {
        setPreviewData(null);
      }
    };
    updatePreview();
  }, [selectedFileId]);

  const formatDateStrip = (dateString: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  };

  const rakitTeksPersetujuan = (listPersetujuan: any[]) => {
    if (!listPersetujuan || listPersetujuan.length === 0) return "";
    const teksArray = listPersetujuan.map((p) => {
      const tglIndo = formatDateIndo(p.tanggal_lahir);
      const ejaanTgl = spellDateIndo(p.tanggal_lahir);
      let frasaAlamat = "";
      const hubungan = (p.peran_detail || "").toUpperCase();
      if (hubungan === 'ISTRI' || hubungan === 'SUAMI') {
        const kaitan = hubungan === 'ISTRI' ? 'suaminya' : 'istrinya';
        frasaAlamat = `bertempat tinggal sama dengan ${kaitan} tersebut diatas`;
      } else {
        frasaAlamat = `bertempat tinggal di ${p.alamat || "-"}`;
      }
      return `${(p.nama || "").toUpperCase()}, Warga Negara Indonesia, lahir di ${p.tempat_lahir || "-"}, pada tanggal ${tglIndo} (${ejaanTgl}), ${p.pekerjaan || "-"}, ${frasaAlamat}, pemegang Kartu Tanda Penduduk NIK : ${p.nik || "-"}`;
    });
    return "-- " + teksArray.join("; \n-- ") + ".";
  };

  const calculateAge = (dateString: string) => {
    if (!dateString) return "";
    const today = new Date();
    const birthDate = new Date(dateString);
    if (isNaN(birthDate.getTime())) return "";
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age.toString();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTag(text);
    setTimeout(() => setCopiedTag(''), 2000);
  };

  const prepareData = async (fileId: string): Promise<Record<string, any> | null> => {
    try {
      const fileData = await db.files.get(fileId);
      if (!fileData) return null;

      const [relations, identities, lands] = await Promise.all([
        db.relations.getByFileId(fileId),
        db.identities.getAll(),
        db.lands.getAll(),
      ]);

      const p1Raw: any[] = [];
      const p2Raw: any[] = [];
      const saksiRaw: any[] = [];
      const setujuRaw: any[] = [];

      const landRel = relations.find((r) => r.data_tanah_id);
      const landObj: LandData | undefined = landRel
        ? lands.find((l) => String(l.id).trim() === String(landRel.data_tanah_id).trim())
        : undefined;

      relations.forEach((rel) => {
        const person = identities.find((i) => String(i.id).trim() === String(rel.identitas_id).trim());
        if (person) {
          const enriched = {
            ...person,
            peran_detail: (rel as any).hubungan, 
            umur: calculateAge(person.tanggal_lahir),
            tgl_lahir_indo: formatDateIndo(person.tanggal_lahir),
            ktp_berlaku_indo: person.ktp_berlaku === "SEUMUR HIDUP" ? "SEUMUR HIDUP" : formatDateIndo(person.ktp_berlaku),
            ejaan_lahir: person.ejaan_tanggal_lahir || spellDateIndo(person.tanggal_lahir),
            ejaan_berlaku: person.ejaan_tanggal_ktp_berlaku || (person.ktp_berlaku === "SEUMUR HIDUP" ? "SEUMUR HIDUP" : spellDateIndo(person.ktp_berlaku)),
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

      const mapToArray = (arr: any[]) => arr.map((p) => {

        const isSeumurHidup = p.is_seumur_hidup === true || p.ktp_berlaku === "SEUMUR HIDUP";
        const ket = p.menurut_keterangan;
        return {
          Sebutan: p.sebutan || "",
          Nama: p.nama || "",
          nama_alias: toTitleCase(p.alias) || null,
          NIK: formatNIK(p.nik) || "",
          Lahir_Tempat: p.tempat_lahir || "",
          Lahir_Tgl: formatDateStrip(p.tanggal_lahir) || "",
          Lahir_Ejaan: p.ejaan_lahir || "",
          Agama: p.agama || "",
          Pekerjaan: p.pekerjaan || "",
          Alamat: p.alamat || "",
          RT: p.rt || "",
          RW: p.rw || "",
          Des_Kel: p.wilayah_type || "",
          Desa: p.desa || "",
          Kec: p.kecamatan || "",
          Kab_Kot: p.daerah_type || "",
          Kota: p.kota_kabupaten || "",
          Ktp_Masa_Berlaku: isSeumurHidup ? "SEUMUR HIDUP" : formatDateIndo(p.ktp_berlaku),
          Ktp_Masa_Ejaan: isSeumurHidup ? "" : p.ejaan_tanggal_ktp_berlaku || spellDateIndo(p.ktp_berlaku),
          isKtpTerbatas: !isSeumurHidup,
          Juncto: p.juncto || "",
          Ejaan_Berlaku: p.ejaan_berlaku || "",
          Ibu: p.nama_ibuk_kandung || "",
          Bapak: p.nama_bapak_kandung || "",
          Umur: p.umur || "",
          Status_Kawin: p.status_perkawinan || "",
          Hubungan: p.peran_detail || "",
          isStandar: ket === 'STANDAR',
          isPersetujuan: ket === 'PERSETUJUAN',
          isAktaKuasa: ket === 'AKTA_KUASA',
          isAhliWaris: ket === 'AHLI_WARIS',


        };
      
      
      });

      const finalData: Record<string, any> = {
        isWaris: fileData.jenis_perolehan === "WARIS" || fileData.sebab_perolehan === "WARIS",
        isIstri: fileData.keterangan_persetujuan === "ISTRI",
        isSuami: fileData.keterangan_persetujuan === "SUAMI",
        isSertifikat: landObj?.jenis_dasar_surat === "SHM_ANALOG" || landObj?.jenis_dasar_surat === "SHM_ELEKTRONIK",
        isPetok: landObj?.jenis_dasar_surat === "LETTER_C",
        teks_persetujuan: rakitTeksPersetujuan(setujuRaw),
        penjual: mapToArray(p1Raw),
        pembeli: mapToArray(p2Raw),
        saksi_akta: mapToArray(saksiRaw),
        persetujuan: mapToArray(setujuRaw),
        No_Berkas: fileData.nomor_berkas,
        No_Reg: fileData.nomor_register,
        Tgl_Surat: formatDateIndo(fileData.tanggal),
        Tgl_Ejaan: spellDateIndo(fileData.tanggal),
        Hari: fileData.hari,
        Jenis_Perolehan: fileData.jenis_perolehan,
        Waris_Desa: fileData.register_waris_desa || "",
        Waris_Tgl: fileData.tanggal_waris ? formatDateIndo(fileData.tanggal_waris) : "",
        T_NOP: landObj?.nop || fileData.nop || "",
        T_AN_NOP: landObj?.atas_nama_nop || "",
        T_Kades: landObj?.nama_kepala_desa || "",
        T_Kades_Tipe: landObj?.jenis_kades || "Kepala Desa",
        T_Alamat: landObj?.alamat || "",
        T_Desa: landObj?.desa || "",
        T_Kec: landObj?.kecamatan || "",
        T_Kota: landObj?.kabupaten_kota || "",
        T_C_No: landObj?.kohir || "",
        T_C_Persil: landObj?.persil || "",
        T_C_Klas: landObj?.klas || "",
        T_C_AN: landObj?.atas_nama_letter_c || "",
        T_C_Asal: landObj?.berasal_dari_an || "",
        T_SHM_No: landObj?.no_shm || "",
        T_SHM_AN: landObj?.atas_nama_shm || "",
        T_SHM_SU: landObj?.no_su || "",
        T_SHM_TglSU: landObj?.tanggal_su ? formatDateIndo(landObj.tanggal_su) : "",
        T_Harga: (landObj?.harga_transaksi || 0).toLocaleString("id-ID"),
        T_Harga_E: landObj?.ejaan_harga_transaksi || "",
        T_Luas_M: landObj?.luas_dimohon || 0,
        T_Luas_E: landObj?.ejaan_luas_dimohon || "",
        T_NJOP_Total: (landObj?.pajak_grand_total || 0).toLocaleString("id-ID"),
        T_Batas_U: landObj?.batas_utara_seluruhnya || "",
        T_Batas_S: landObj?.batas_selatan_seluruhnya || "",
        T_Batas_T: landObj?.batas_timur_seluruhnya || "",
        T_Batas_B: landObj?.batas_barat_seluruhnya || "",
        _countP1: p1Raw.length,
        _countP2: p2Raw.length,
        _countS: saksiRaw.length,
        _hasLand: !!landObj,
      };

      if (landObj?.riwayat_tanah) {
        finalData.riwayat = landObj.riwayat_tanah.map((r) => ({
          Nama: r.atas_nama,
          C: r.c_no,
          P: r.persil_no,
          Klas: r.klas,
          Luas: r.luas,
          Dasar: r.dasar_dialihkan,
        }));
      }
      return finalData;
    } catch (err) {
      console.error("Gagal menyiapkan data:", err);
      return null;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 p-4">
      <div className="flex justify-between items-end">
        <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Generator Berkas</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Etana Logic v2.5 • Achmad Habib Hidayat, S.H., M.Kn.</p>
        </div>
        <Button variant="outline" onClick={exportToExcel} size="sm" className="rounded-xl border-2 font-black text-[10px] uppercase">
          <FileSpreadsheet size={14} className="mr-2" /> Backup Data
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Pilih Berkas Aktif" className="lg:col-span-2 shadow-xl border-t-4 border-t-slate-900 rounded-[32px]">
            <div className="space-y-6 p-2">
                <Select label="Database Berkas" value={selectedFileId} onChange={e => setSelectedFileId(e.target.value)} className="font-bold">
                    <option value="">-- Pilih Berkas Yang Akan Dicetak --</option>
                    {files.map(f => <option key={f.id} value={f.id}>{f.nomor_berkas} - {f.keterangan}</option>)}
                </Select>
                {previewData && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <SummaryWidget label="Penjual" val={previewData._countP1} icon={<UserCheck size={14}/>} color="emerald" />
                      <SummaryWidget label="Pembeli" val={previewData._countP2} icon={<UserCheck size={14}/>} color="blue" />
                      <SummaryWidget label="Saksi" val={previewData._countS} icon={<Users size={14}/>} color="purple" />
                      <SummaryWidget label="Tanah" val={previewData._hasLand ? "AKTIF" : "KOSONG"} icon={<MapPin size={14}/>} color="orange" />
                    </div>
                )}
            </div>
        </Card>

        <Card title="Proses Cetak" className="shadow-xl border-t-4 border-t-blue-600 rounded-[32px]">
            <div className="space-y-4">
                <div className="p-6 border-2 border-dashed rounded-[24px] bg-slate-50 border-slate-200 relative group hover:border-blue-400 transition-all text-center">
                    <input type="file" accept=".docx" onChange={e => setTemplateFile(e.target.files ? e.target.files[0] : null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <FileText size={40} className="mx-auto text-slate-300 mb-3 group-hover:text-blue-500 transition-colors" />
                    <p className="text-[10px] font-black text-slate-500 uppercase px-2 truncate">
                      {templateFile ? templateFile.name : "Upload Template .docx"}
                    </p>
                </div>
                <Button 
                  onClick={() => setShowFinalPreview(true)} 
                  className="w-full font-black h-16 rounded-[20px] shadow-lg shadow-slate-200 uppercase tracking-widest text-xs" 
                  disabled={!selectedFileId}
                >
                  <Printer size={18} className="mr-2" /> Lihat Preview Akta
                </Button>
                <Button variant="outline" className="w-full text-[10px] font-black h-12 rounded-[20px] border-2 uppercase" onClick={() => setShowDataPreview(true)} disabled={!selectedFileId}>
                  <Database size={14} className="mr-2" /> Buka Kamus Tag
                </Button>
            </div>
        </Card>
      </div>

      {/* ----------------- MODAL KAMUS TAG ----------------- */}
      {showDataPreview && previewData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl">
            <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden">
                <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Database size={32} className="text-blue-400"/>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tighter">Variabel Database</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Salin tag ini ke dalam Microsoft Word</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input type="text" placeholder="Cari Variabel..." className="bg-white/10 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:ring-2 ring-blue-500 outline-none" value={tagSearch} onChange={e => setTagSearch(e.target.value)} />
                      </div>
                      <button onClick={() => setShowDataPreview(false)} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-all"><X size={24} /></button>
                    </div>
                </div>
                
                <div className="p-10 overflow-y-auto flex-1 bg-slate-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <TagCategory title="Kontrol & Loop" icon={<ShieldCheck size={16}/>} color="pink">
                            <TagRow tag="{#penjual}" val="Mulai daftar penjual" onCopy={copyToClipboard} copied={copiedTag} />
                            <TagRow tag="{/penjual}" val="Selesai daftar penjual" onCopy={copyToClipboard} copied={copiedTag} />
                            <TagRow tag="{#pembeli}" val="Mulai daftar pembeli" onCopy={copyToClipboard} copied={copiedTag} />
                            <TagRow tag="{/pembeli}" val="Selesai daftar pembeli" onCopy={copyToClipboard} copied={copiedTag} />
                            <TagRow tag="{#isWaris}" val="Jika jenis perolehan Waris" onCopy={copyToClipboard} copied={copiedTag} />
                            <TagRow tag="{#isSertifikat}" val="Jika tanah bersertifikat" onCopy={copyToClipboard} copied={copiedTag} />
                        </TagCategory>

                        <TagCategory title="Identitas (P1/P2)" icon={<UserCheck size={16}/>} color="emerald">
                            <TagRow tag="{Nama}" val="Nama (di dalam loop)" onCopy={copyToClipboard} copied={copiedTag} />
                            <TagRow tag="{NIK}" val="NIK (di dalam loop)" onCopy={copyToClipboard} copied={copiedTag} />
                            <TagRow tag="{Alamat}" val="Alamat Lengkap" onCopy={copyToClipboard} copied={copiedTag} />
                            <TagRow tag="{Umur}" val="Umur (Angka)" onCopy={copyToClipboard} copied={copiedTag} />
                            <TagRow tag="{Status_Kawin}" val="Status Kawin" onCopy={copyToClipboard} copied={copiedTag} />
                        </TagCategory>

                        <TagCategory title="Data Tanah" icon={<MapPin size={16}/>} color="blue">
                            <TagRow tag="{T_NOP}" val={previewData.T_NOP} onCopy={copyToClipboard} copied={copiedTag} />
                            <TagRow tag="{T_SHM_No}" val={previewData.T_SHM_No} onCopy={copyToClipboard} copied={copiedTag} />
                            <TagRow tag="{T_Harga}" val={previewData.T_Harga} onCopy={copyToClipboard} copied={copiedTag} />
                            <TagRow tag="{T_Luas_M}" val={previewData.T_Luas_M} onCopy={copyToClipboard} copied={copiedTag} />
                        </TagCategory>

                        <TagCategory title="Administrasi" icon={<Landmark size={16}/>} color="orange">
                            <TagRow tag="{No_Reg}" val={previewData.No_Reg} onCopy={copyToClipboard} copied={copiedTag} />
                            <TagRow tag="{Tgl_Ejaan}" val={previewData.Tgl_Ejaan} onCopy={copyToClipboard} copied={copiedTag} />
                            <TagRow tag="{teks_persetujuan}" val="Klausul Otomatis" onCopy={copyToClipboard} copied={copiedTag} />
                        </TagCategory>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* ----------------- MODAL FINAL PREVIEW (KERTAS PANJANG) ----------------- */}
      {showFinalPreview && previewData && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex flex-col items-center overflow-hidden animate-in fade-in duration-500">
          
          <div className="w-full h-20 bg-white border-b flex justify-between items-center px-12 shrink-0 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <Printer size={24} />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-tighter text-slate-900">Preview Akta Jual Beli</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Nomor Berkas: {previewData.No_Berkas}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setShowFinalPreview(false)} className="px-6 py-3 text-[10px] font-black uppercase text-slate-400 hover:text-rose-600 transition-colors">Tutup</button>
              <Button 
                onClick={() => {
                  if(!templateFile) alert("Silahkan upload template .docx dulu Pak!");
                  else {
                    generateWordDocument(templateFile, previewData);
                    setShowFinalPreview(false);
                  }
                }}
                className="h-14 bg-slate-900 hover:bg-black text-white px-10 rounded-2xl font-black text-xs shadow-2xl tracking-widest"
              >
                DOWNLOAD .DOCX SEKARANG
              </Button>
            </div>
          </div>

          <div className="w-full flex-1 overflow-y-auto p-12 flex flex-col items-center bg-slate-100 custom-scrollbar">
            
            {/* SIMULASI KERTAS A4 PANJANG */}
            <div className="bg-white w-full max-w-[850px] shadow-[0_50px_100px_rgba(0,0,0,0.15)] p-[30mm] min-h-screen text-slate-800 font-serif relative border border-slate-200">
              
              <div className="text-center mb-16 space-y-2 border-b-4 border-double border-slate-900 pb-8">
                <h1 className="text-2xl font-black underline tracking-tight uppercase">AKTA JUAL BELI</h1>
                <p className="text-xs font-bold tracking-widest">Nomor: {previewData.No_Reg || '________________'}</p>
              </div>

              <div className="space-y-12 text-[11pt] leading-[1.8] text-justify">
                
                {/* 1. PEMBUKAAN */}
                <p>
                  Pada hari ini, <strong>{previewData.Hari || '..........'}</strong>, 
                  tanggal <strong>{previewData.Tgl_Surat}</strong> ({previewData.Tgl_Ejaan}), 
                  hadir di hadapan saya, <strong>ACHMAD HABIB HIDAYAT, S.H., M.Kn.</strong>, 
                  Pejabat Pembuat Akta Tanah (PPAT) Kabupaten Pasuruan.
                </p>

                {/* 2. PIHAK PERTAMA */}
                <section>
                  <h3 className="text-[9pt] font-black uppercase text-blue-600 mb-4 border-b tracking-widest">I. Pihak Pertama (Penjual)</h3>
                  <div className="space-y-6 italic pl-4 border-l-4 border-slate-100">
                    {previewData.penjual.map((p: any, i: number) => (
                      <div key={i} className="text-[10pt]">
                        {i+1}. <strong>{p.Nama}</strong>, NIK: {p.NIK}, Tempat/Tgl Lahir: {p.Lahir_Tempat}, {p.Lahir_Tgl} ({p.Lahir_Ejaan}), 
                        Agama: {p.Agama}, Pekerjaan: {p.Pekerjaan}, Alamat: {p.Alamat} RT {p.RT}/RW {p.RW}, {p.Des_Kel} {p.Desa}, Kec. {p.Kec}, {p.Kab_Kot} {p.Kota}.
                      </div>
                    ))}
                  </div>
                </section>

                {/* 3. PIHAK KEDUA */}
                <section>
                  <h3 className="text-[9pt] font-black uppercase text-blue-600 mb-4 border-b tracking-widest">II. Pihak Kedua (Pembeli)</h3>
                  <div className="space-y-6 italic pl-4 border-l-4 border-slate-100">
                    {previewData.pembeli.map((p: any, i: number) => (
                      <div key={i} className="text-[10pt]">
                        {i+1}. <strong>{p.Nama}</strong>, NIK: {p.NIK}, Pekerjaan: {p.Pekerjaan}, 
                        Alamat: {p.Alamat} RT {p.RT}/RW {p.RW}, {p.Des_Kel} {p.Desa}, Kec. {p.Kec}, {p.Kab_Kot} {p.Kota}.
                      </div>
                    ))}
                  </div>
                </section>

                {/* 4. PERSETUJUAN */}
                <section className="bg-slate-50 p-8 rounded-[32px] border-2 border-dashed border-slate-200">
                  <h3 className="text-[9pt] font-black uppercase text-slate-400 mb-4 tracking-widest">Klausul Persetujuan Khusus</h3>
                  <p className="italic leading-[1.8] text-slate-600 text-[10pt]">
                    {previewData.teks_persetujuan || "-- Tidak Ada Persetujuan Terdeteksi --"}
                  </p>
                </section>

                {/* 5. DATA TANAH (DETAIL LENGKAP) */}
                <section className="space-y-4">
                  <h3 className="text-[9pt] font-black uppercase text-blue-600 border-b tracking-widest">III. Objek Hak Atas Tanah</h3>
                  <div className="grid grid-cols-2 gap-x-10 gap-y-6 bg-slate-900 text-white p-10 rounded-[40px] shadow-2xl">
                    <div className="space-y-4">
                      <div>
                        <p className="text-[7px] text-slate-400 font-black uppercase mb-1">Status Dokumen</p>
                        <p className="text-sm font-bold">{previewData.isSertifikat ? 'SHM / Sertifikat' : 'Letter C / Petok'}</p>
                      </div>
                      <div>
                        <p className="text-[7px] text-slate-400 font-black uppercase mb-1">Nomor Kohir / SHM</p>
                        <p className="text-sm font-bold">{previewData.T_SHM_No || previewData.T_C_No}</p>
                        <p className="text-[9px] text-slate-500 italic">Atas Nama: {previewData.T_SHM_AN || previewData.T_C_AN}</p>
                      </div>
                      <div>
                        <p className="text-[7px] text-slate-400 font-black uppercase mb-1">Batas-Batas Tanah</p>
                        <div className="text-[10px] space-y-0.5 opacity-80 italic">
                          <p>Utara: {previewData.T_Batas_U || '-'}</p>
                          <p>Selatan: {previewData.T_Batas_S || '-'}</p>
                          <p>Timur: {previewData.T_Batas_T || '-'}</p>
                          <p>Barat: {previewData.T_Batas_B || '-'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4 text-right">
                      <div>
                        <p className="text-[7px] text-slate-400 font-black uppercase mb-1">Harga Transaksi</p>
                        <p className="text-xl font-black text-emerald-400">Rp {previewData.T_Harga}</p>
                        <p className="text-[8px] italic text-slate-500 uppercase">{previewData.T_Harga_E} Rupiah</p>
                      </div>
                      <div>
                        <p className="text-[7px] text-slate-400 font-black uppercase mb-1">Luas & NJOP</p>
                        <p className="text-sm font-bold">{previewData.T_Luas_M} m2 ({previewData.T_Luas_E})</p>
                        <p className="text-[9px] text-slate-500">NJOP: Rp {previewData.T_NJOP_Total}</p>
                      </div>
                      <div>
                        <p className="text-[7px] text-slate-400 font-black uppercase mb-1">Desa / Kades</p>
                        <p className="text-sm font-bold">{previewData.T_Desa}, Kec. {previewData.T_Kec}</p>
                        <p className="text-[9px] text-slate-500">{previewData.T_Kades_Tipe}: {previewData.T_Kades}</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 6. SAKSI-SAKSI */}
                <section>
                  <h3 className="text-[9pt] font-black uppercase text-blue-600 mb-4 border-b tracking-widest">IV. Saksi-Saksi</h3>
                  <div className="space-y-3 italic text-[10pt] pl-4 border-l-4 border-slate-100">
                    {previewData.saksi_akta.map((s: any, i: number) => (
                      <p key={i}>Saksi {i+1}: <strong>{s.Nama}</strong>, Pekerjaan {s.Pekerjaan}, Alamat: {s.Alamat}.</p>
                    ))}
                  </div>
                </section>
              </div>

              <div className="mt-24 pt-10 border-t border-slate-100 text-center opacity-20">
                <p className="text-[8px] font-black tracking-[1em] uppercase">ETANA DIGITAL v2.5 - PREVIEW SYSTEM</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* --- SUB COMPONENTS --- */

const TagCategory = ({ title, icon, children, color }: any) => {
  const colors: any = {
    emerald: 'border-emerald-200 text-emerald-700 bg-emerald-50',
    blue: 'border-blue-200 text-blue-700 bg-blue-50',
    purple: 'border-purple-200 text-purple-700 bg-purple-50',
    pink: 'border-pink-200 text-pink-700 bg-pink-50',
    orange: 'border-orange-200 text-orange-700 bg-orange-50',
  };
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-fit">
      <div className={`px-5 py-4 border-b flex items-center gap-3 text-[10px] font-black uppercase tracking-widest ${colors[color]}`}>{icon} {title}</div>
      <div className="p-4 space-y-1">{children}</div>
    </div>
  );
};

const TagRow = ({ tag, val, onCopy, copied }: any) => (
  <div className="group flex flex-col p-3 hover:bg-slate-50 rounded-2xl transition-all relative border border-transparent hover:border-slate-100">
    <div className="flex justify-between items-center gap-2">
      <code className="text-[10px] font-black text-blue-600 truncate cursor-pointer bg-blue-50 px-2 py-1 rounded-md" onClick={() => onCopy(tag)}>{tag}</code>
      <button onClick={() => onCopy(tag)} className={`p-2 rounded-xl transition-all ${copied === tag ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-white shadow-sm text-slate-400 hover:text-blue-500 border border-slate-100'}`}>
        {copied === tag ? <ClipboardCheck size={14}/> : <Copy size={14}/>}
      </button>
    </div>
    {val && <div className="text-[9px] font-bold text-slate-400 truncate mt-2 px-1 italic">{String(val)}</div>}
  </div>
);

const SummaryWidget = ({ label, val, icon, color }: any) => {
  const colors: any = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100"
  };
  return (
    <div className={`p-4 rounded-[24px] border-2 flex flex-col items-center justify-center text-center ${colors[color]}`}>
      <div className="flex items-center gap-1 text-[8px] font-black uppercase mb-1 opacity-60 tracking-tighter">{icon} {label}</div>
      <div className="text-xl font-black tracking-tight">{val || 0}</div>
    </div>
  );
};