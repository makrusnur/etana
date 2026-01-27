import React, { useState, useEffect } from 'react';
import { exportToExcel, generateWordDocument } from '../services/export';
import { db } from '../services/db';
import { Card, Button, Select } from '../components/UI';
import { Printer, X, Database, Copy, ClipboardCheck, UserCheck, FileSpreadsheet, MapPin, FileText, Ruler, Coins, History, Search, Users } from 'lucide-react';
import { formatDateIndo, spellDateIndo, terbilang } from '../utils';
import { FileRecord, LandData } from '../types';

export const TemplatesPage: React.FC = () => {
  const [selectedFileId, setSelectedFileId] = useState('');
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [showDataPreview, setShowDataPreview] = useState(false);
  const [copiedTag, setCopiedTag] = useState('');
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [previewData, setPreviewData] = useState<Record<string, any> | null>(null);
  const [tagSearch, setTagSearch] = useState('');

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

  const calculateAge = (dateString: string) => {
    if (!dateString || dateString === 'SEUMUR HIDUP' || dateString === '') return "";
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

      // Ambil data pendukung secara paralel
      const [relations, identities, lands] = await Promise.all([
        db.relations.getByFileId(fileId),
        db.identities.getAll(),
        db.lands.getAll()
      ]);

      const p1: any[] = [];
      const p2: any[] = [];
      const saksi: any[] = [];
      const setuju: any[] = [];
      
      // Sinkronisasi ID Tanah (UUID Fix)
      const landRel = relations.find(r => r.data_tanah_id);
      const landObj: LandData | undefined = landRel 
        ? lands.find(l => String(l.id).trim() === String(landRel.data_tanah_id).trim()) 
        : undefined;

      relations.forEach(rel => {
        // Sinkronisasi ID Orang (UUID Fix)
        const person = identities.find(i => String(i.id).trim() === String(rel.identitas_id).trim());
        
        if (person) {
          const enriched = { 
            ...person, 
            umur: calculateAge(person.tanggal_lahir),
            tgl_lahir_indo: formatDateIndo(person.tanggal_lahir),
            ktp_berlaku_indo: person.ktp_berlaku === 'SEUMUR HIDUP' ? 'SEUMUR HIDUP' : formatDateIndo(person.ktp_berlaku),
            ejaan_lahir: spellDateIndo(person.tanggal_lahir),
            ejaan_berlaku: person.ktp_berlaku === 'SEUMUR HIDUP' ? 'SEUMUR HIDUP' : spellDateIndo(person.ktp_berlaku)
          };
          
          const cleanRole = (rel.peran || "").toUpperCase().trim();
          // Normalisasi string peran agar case-insensi

          if (cleanRole === 'PIHAK_1') p1.push(enriched);
          else if (cleanRole === 'PIHAK_2') p2.push(enriched);
          else if (cleanRole === 'SAKSI') saksi.push(enriched);
          else if (cleanRole === 'PERSETUJUAN_PIHAK_1' || cleanRole === 'SETUJU') setuju.push(enriched);
        }
      });

      const result: Record<string, any> = {
        // 1. BERKAS (FileRecord)
        No_Berkas: fileData.nomor_berkas,
        No_Register: fileData.nomor_register,
        Hari_Berkas: fileData.hari,
        Tgl_Surat: formatDateIndo(fileData.tanggal),
        Tgl_Ejaan: spellDateIndo(fileData.tanggal),
        Ket_Berkas: fileData.keterangan,
        Jenis_Perolehan: fileData.jenis_perolehan,
        Thn_Perolehan: fileData.tahun_perolehan,
        F_Waris_Desa: fileData.register_waris_desa || "",
        F_Waris_Kec: fileData.register_waris_kecamatan || "",
        F_Waris_Tgl: fileData.tanggal_waris ? formatDateIndo(fileData.tanggal_waris) : "",

        // 2. TANAH (LandData)
        T_NOP: landObj?.nop || "",
        T_AtasNama_NOP: landObj?.atas_nama_nop || "",
        T_Kades: landObj?.nama_kepala_desa || "",
        T_Guna: landObj?.penggunaan_tanah || "",
        T_Alamat: landObj?.alamat || "",
        T_RT: landObj?.rt || "",
        T_RW: landObj?.rw || "",
        T_Desa: landObj?.desa || "",
        T_Kec: landObj?.kecamatan || "",
        T_Kota: landObj?.kabupaten_kota || "",
        T_Pajak_Stat: landObj?.kewajiban_pajak || "",
        T_Jenis_Alas: landObj?.jenis_dasar_surat || "",
        
        T_C_Kohir: landObj?.kohir || "",
        T_C_Persil: landObj?.persil || "",
        T_C_Klas: landObj?.klas || "",
        T_C_AN: landObj?.atas_nama_letter_c || "",
        T_C_Asal: landObj?.berasal_dari_an || "",
        T_C_Thn: landObj?.tahun_perolehan_alas_hak || "",

        T_SHM_AN: landObj?.atas_nama_shm || "",
        T_SHM_No: landObj?.no_shm || "",
        T_SHM_NIB: landObj?.nib || "",
        T_SHM_SU: landObj?.no_su || "",
        T_SHM_TglSU: formatDateIndo(landObj?.tanggal_su || ""),
        T_SHM_EjaanSU: landObj?.ejaan_tanggal_su || "",
        T_SHM_TglBuku: formatDateIndo(landObj?.tanggal_shm || ""),
        T_SHM_EjaanBuku: landObj?.ejaan_tanggal_shm || "",

        T_EL_AN: landObj?.atas_nama_shm_el || "",
        T_EL_Kode: landObj?.kode_sertifikat || "",
        T_EL_Nibel: landObj?.nibel || "",

        T_Luas_M: landObj?.luas_dimohon || 0,
        T_Luas_E: landObj?.ejaan_luas_dimohon || "",
        T_Batas_U: landObj?.batas_utara_dimohon || "",
        T_Batas_T: landObj?.batas_timur_dimohon || "",
        T_Batas_S: landObj?.batas_selatan_dimohon || "",
        T_Batas_B: landObj?.batas_barat_dimohon || "",

        T_Total_M: landObj?.luas_seluruhnya || 0,
        T_Total_E: landObj?.ejaan_luas_seluruhnya || "",
        T_Total_U: landObj?.batas_utara_seluruhnya || "",
        T_Total_T: landObj?.batas_timur_seluruhnya || "",
        T_Total_S: landObj?.batas_selatan_seluruhnya || "",
        T_Total_B: landObj?.batas_barat_seluruhnya || "",

        T_Sppt_Thn: landObj?.sppt_tahun || "",
        T_Bumi_Luas: landObj?.pajak_bumi_luas || 0,
        T_Bumi_NJOP: (landObj?.pajak_bumi_njop || 0).toLocaleString('id-ID'),
        T_Bumi_Total: (landObj?.pajak_bumi_total || 0).toLocaleString('id-ID'),
        T_Bang_Jml: landObj?.jumlah_bangunan || 0,
        T_Bang_Luas: landObj?.pajak_bangunan_luas || 0,
        T_Bang_NJOP: (landObj?.pajak_bangunan_njop || 0).toLocaleString('id-ID'),
        T_Bang_Total: (landObj?.pajak_bangunan_total || 0).toLocaleString('id-ID'),
        T_Grand_Total_NJOP: (landObj?.pajak_grand_total || 0).toLocaleString('id-ID'),
        T_Grand_Ejaan: landObj?.pajak_grand_total ? terbilang(landObj.pajak_grand_total) : "nol",
        
        T_Harga: (landObj?.harga_transaksi || 0).toLocaleString('id-ID'),
        T_Harga_E: landObj?.ejaan_harga_transaksi || "nol rupiah",
      };

      for (let i = 0; i < 10; i++) {
        result[`T_Koor${i+1}`] = landObj?.koordinat_list?.[i] || "";
        result[`T_Bak${i+1}`] = landObj?.bak_list?.[i] || "";
      }

      for (let i = 0; i < 5; i++) {
        const rw = landObj?.riwayat_tanah?.[i];
        result[`T_Riw${i+1}_Nama`] = rw?.atas_nama || "";
        result[`T_Riw${i+1}_C`] = rw?.c_no || "";
        result[`T_Riw${i+1}_P`] = rw?.persil_no || "";
        result[`T_Riw${i+1}_K`] = rw?.klas || "";
        result[`T_Riw${i+1}_L`] = rw?.luas || "";
        result[`T_Riw${i+1}_D`] = rw?.dasar_dialihkan || "";
      }

      const mapPerson = (prefix: string, p: any) => {
        const fields = ["Sebutan", "Nama", "NIK", "Lahir_Tempat", "Lahir_Tgl", "Lahir_Ejaan", "Agama", "Alamat", "RT", "RW", "Desa", "Kec", "Kota", "Prov", "Pekerjaan", "Umur", "Ibu", "Bapak", "Pendidikan", "KTP_Exp", "Kawin", "Darah", "Telp", "NPWP", "Email"];
        if (!p) {
          fields.forEach(f => result[`${prefix}_${f}`] = "");
          return;
        }
        result[`${prefix}_Sebutan`] = p.sebutan || "";
        result[`${prefix}_Nama`] = p.nama || "";
        result[`${prefix}_NIK`] = p.nik || "";
        result[`${prefix}_Lahir_Tempat`] = p.tempat_lahir || "";
        result[`${prefix}_Lahir_Tgl`] = p.tgl_lahir_indo || "";
        result[`${prefix}_Lahir_Ejaan`] = p.ejaan_lahir || "";
        result[`${prefix}_Agama`] = p.agama || "";
        result[`${prefix}_Kawin`] = p.status_perkawinan || "";
        result[`${prefix}_Darah`] = p.golongan_darah || "";
        result[`${prefix}_Alamat`] = p.alamat || "";
        result[`${prefix}_RT`] = p.rt || "";
        result[`${prefix}_RW`] = p.rw || "";
        result[`${prefix}_Des/Kel`] = p.daerah_type || "";
        result[`${prefix}_Desa`] = p.desa || "";
        result[`${prefix}_Kec`] = p.kecamatan || "";
        result[`${prefix}_Kec`] = p.wilayah_type || "";
        result[`${prefix}_Kota`] = p.kota_kabupaten || "";
        result[`${prefix}_Prov`] = p.provinsi || "";
        result[`${prefix}_Pekerjaan`] = p.pekerjaan || "";
        result[`${prefix}_Umur`] = p.umur || "";
        result[`${prefix}_Ibu`] = p.nama_ibuk_kandung || "";
        result[`${prefix}_Bapak`] = p.nama_bapak_kandung || "";
        result[`${prefix}_Pendidikan`] = p.pendidikan_terakhir || "";
        result[`${prefix}_KTP_Exp`] = p.ktp_berlaku_indo || "";
        result[`${prefix}_Telp`] = p.telepon || "";
        result[`${prefix}_NPWP`] = p.npwp || "";
        result[`${prefix}_Email`] = p.email || "";
        result[`${prefix}_Berlaku`] = p.ejaan_ktp_berlaku || "";
      };

      mapPerson("P1_1", p1[0]); mapPerson("P1_2", p1[1]); mapPerson("P1_3", p1[2]);
      mapPerson("P2_1", p2[0]); mapPerson("P2_2", p2[1]);
      mapPerson("Saksi1", saksi[0]); mapPerson("Saksi2", saksi[1]); mapPerson("Saksi3", saksi[2]); mapPerson("Saksi4", saksi[3]);
      mapPerson("Setuju1", setuju[0]);

      result._countP1 = p1.length;
      result._countP2 = p2.length;
      result._countS = saksi.length;
      result._hasLand = !!landObj;

      return result;
    } catch (err) {
      console.error("Gagal memproses kamus tag:", err);
      return null;
    }
  };

  const filteredTags = previewData 
    ? Object.keys(previewData).filter(tag => 
        tag.toLowerCase().includes(tagSearch.toLowerCase()) || 
        String(previewData[tag]).toLowerCase().includes(tagSearch.toLowerCase())
      )
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex justify-between items-end">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Otomasi & Kamus Dokumen</h2>
            <p className="text-slate-500 text-sm">Integrasi <b>Docxtemplater Engine</b> untuk efisiensi pembuatan Akta.</p>
        </div>
        <Button variant="outline" onClick={exportToExcel} size="sm"><FileSpreadsheet size={16} className="mr-2 inline" /> Full Backup</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Pilih Berkas Aktif" className="lg:col-span-2 shadow-sm border-slate-200">
            <div className="space-y-4">
                <Select label="Basis Data Berkas" value={selectedFileId} onChange={e => setSelectedFileId(e.target.value)}>
                    <option value="">-- Hubungkan dengan Berkas --</option>
                    {files.map(f => <option key={f.id} value={f.id}>{f.nomor_berkas} </option>)}
                </Select>
                {previewData && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-inner">
                      <SummaryWidget label="Pihak Pertama" val={previewData._countP1} icon={<UserCheck size={14}/>} color="emerald" />
                      <SummaryWidget label="Pihak Kedua" val={previewData._countP2} icon={<UserCheck size={14}/>} color="blue" />
                      <SummaryWidget label="Saksi-Saksi" val={previewData._countS} icon={<Users size={14}/>} color="purple" />
                      <SummaryWidget label="Objek Tanah" val={previewData._hasLand ? 1 : 0} icon={<MapPin size={14}/>} color="orange" />
                    </div>
                )}
            </div>
        </Card>

        <Card title="Cetak Ke Word" className="shadow-sm border-slate-200">
            <div className="space-y-4 text-center">
                <div className="p-4 border-2 border-dashed rounded-3xl bg-slate-50 border-slate-200 relative h-36 flex flex-col items-center justify-center group hover:border-blue-400 hover:bg-white transition-all">
                    <input type="file" accept=".docx" onChange={e => setTemplateFile(e.target.files ? e.target.files[0] : null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <Printer size={32} className="text-slate-400 mb-2 group-hover:text-blue-500 transition-colors" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 truncate w-full">{templateFile ? templateFile.name : "Lampirkan Template .docx"}</p>
                </div>
                <Button 
                  onClick={() => generateWordDocument(templateFile!, previewData)} 
                  className="w-full font-black uppercase tracking-widest h-14" 
                  disabled={!templateFile || !selectedFileId}
                >
                  DOWNLOAD DOKUMEN
                </Button>
                <Button variant="outline" className="w-full text-[10px] font-black" onClick={() => setShowDataPreview(true)} disabled={!selectedFileId}><Database size={14} className="mr-2 inline" /> PANEL KAMUS TAG</Button>
            </div>
        </Card>
      </div>

      {showDataPreview && previewData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-7xl h-[94vh] flex flex-col border border-white/20 animate-in zoom-in-95 duration-300 overflow-hidden">
                <div className="p-8 bg-slate-800 text-white flex justify-between items-center px-12 border-b border-slate-700">
                    <div className="flex items-center gap-5">
                        <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-500/30"><Database size={32} className="text-blue-400"/></div>
                        <div>
                            <h3 className="font-black tracking-[0.3em] text-xs uppercase text-blue-400">Tag Dictionary Explorer</h3>
                            <h2 className="text-xl font-black text-white">Etana Engine v2.5</h2>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <div className="relative group w-72 hidden md:block">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input 
                              type="text" 
                              placeholder="Cari Tag / Isi Data..." 
                              className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                              value={tagSearch}
                              onChange={e => setTagSearch(e.target.value)}
                            />
                        </div>
                        <button onClick={() => setShowDataPreview(false)} className="bg-white/5 hover:bg-white/10 p-3 rounded-2xl transition-all"><X size={28} /></button>
                    </div>
                </div>
                
                <div className="p-10 overflow-y-auto flex-1 bg-slate-50/50 space-y-10 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <TagCategory title="ADMIN BERKAS" icon={<FileText size={16}/>} color="emerald">
                            {filteredTags.filter(t => ["No_Berkas", "No_Register", "Hari_Berkas", "Tgl_Surat", "Tgl_Ejaan", "Jenis_Perolehan", "Thn_Perolehan", "F_Harga", "F_Waris_Desa"].includes(t)).map(t => (
                              <TagRow key={t} tag={`{${t}}`} val={previewData[t]} onCopy={copyToClipboard} copied={copiedTag} />
                            ))}
                        </TagCategory>

                        <TagCategory title="TANAH & LOKASI" icon={<MapPin size={16}/>} color="blue">
                            {filteredTags.filter(t => t.startsWith("T_") && !t.includes("NJOP") && !t.includes("Harga") && !t.includes("Koor") && !t.includes("Bak") && !t.includes("Riw") && !t.includes("Luas") && !t.includes("Total") && !t.includes("Batas")).map(t => (
                              <TagRow key={t} tag={`{${t}}`} val={previewData[t]} onCopy={copyToClipboard} copied={copiedTag} />
                            ))}
                        </TagCategory>

                        <TagCategory title="PAJAK & HARGA" icon={<Coins size={16}/>} color="orange">
                            {filteredTags.filter(t => t.includes("NJOP") || t.includes("Harga") || t.includes("Pajak") || t.includes("Bumi") || t.includes("Bang")).map(t => (
                              <TagRow key={t} tag={`{${t}}`} val={previewData[t]} onCopy={copyToClipboard} copied={copiedTag} />
                            ))}
                        </TagCategory>

                        <TagCategory title="BATAS & LUAS" icon={<Ruler size={16}/>} color="pink">
                            {filteredTags.filter(t => t.startsWith("T_Luas") || t.startsWith("T_Total") || t.startsWith("T_Batas")).map(t => (
                              <TagRow key={t} tag={`{${t}}`} val={previewData[t]} onCopy={copyToClipboard} copied={copiedTag} />
                            ))}
                        </TagCategory>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <TagCategory title="PIHAK PERTAMA" icon={<UserCheck size={16}/>} color="emerald">
                            {filteredTags.filter(t => t.startsWith("P1_1")).slice(0, 10).map(t => (
                              <TagRow key={t} tag={`{${t}}`} val={previewData[t]} onCopy={copyToClipboard} copied={copiedTag} />
                            ))}
                        </TagCategory>
                        <TagCategory title="PIHAK KEDUA" icon={<UserCheck size={16}/>} color="blue">
                            {filteredTags.filter(t => t.startsWith("P2_1")).slice(0, 10).map(t => (
                              <TagRow key={t} tag={`{${t}}`} val={previewData[t]} onCopy={copyToClipboard} copied={copiedTag} />
                            ))}
                        </TagCategory>
                        <TagCategory title="SAKSI & LAINNYA" icon={<Users size={16}/>} color="purple">
                            {filteredTags.filter(t => t.startsWith("Saksi") || t.startsWith("Setuju")).slice(0, 10).map(t => (
                              <TagRow key={t} tag={`{${t}}`} val={previewData[t]} onCopy={copyToClipboard} copied={copiedTag} />
                            ))}
                        </TagCategory>
                        <TagCategory title="RIWAYAT & KOORDINAT" icon={<History size={16}/>} color="orange">
                            <TagRow tag="{T_Koor1}" val={previewData.T_Koor1} onCopy={copyToClipboard} copied={copiedTag} />
                            <TagRow tag="{T_Riw1_Nama}" val={previewData.T_Riw1_Nama} onCopy={copyToClipboard} copied={copiedTag} />
                            <TagRow tag="{T_Bak1}" val={previewData.T_Bak1} onCopy={copyToClipboard} copied={copiedTag} />
                        </TagCategory>
                    </div>
                </div>
                
                <div className="p-6 bg-slate-50 border-t border-slate-200 px-12 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">
                    <div>ETANA DOCS ENGINE v2.5.0</div>
                    <div className="text-blue-500 font-black">ACTIVE SESSION: {selectedFileId}</div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

const TagCategory = ({ title, icon, children, color }: any) => {
    const colors: Record<string, string> = {
        emerald: 'border-emerald-200 text-emerald-700 bg-emerald-50',
        blue: 'border-blue-200 text-blue-700 bg-blue-50',
        purple: 'border-purple-200 text-purple-700 bg-purple-50',
        pink: 'border-pink-200 text-pink-700 bg-pink-50',
        orange: 'border-orange-200 text-orange-700 bg-orange-50',
        slate: 'border-slate-200 text-slate-700 bg-slate-50',
    };
    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-fit transition-transform hover:scale-[1.02]">
            <div className={`px-5 py-3 border-b flex items-center gap-3 text-[11px] font-black uppercase tracking-widest ${colors[color] || 'bg-slate-50'}`}>{icon} {title}</div>
            <div className="p-4 space-y-1">{children}</div>
        </div>
    );
};

const TagRow = ({ tag, val, onCopy, copied }: any) => {
    const isNotEmpty = val !== undefined && val !== null && val !== "" && val !== 0;
    return (
        <div className="group flex flex-col p-2.5 hover:bg-slate-50 rounded-2xl transition-all border-b border-slate-50 last:border-0 relative">
            <div className="flex justify-between items-center gap-2">
                <code className="text-[10px] font-bold text-blue-700 truncate bg-blue-50/50 px-2 py-0.5 rounded-lg border border-blue-100/30 font-mono tracking-tighter cursor-pointer" onClick={() => onCopy(tag)}>{tag}</code>
                <button onClick={() => onCopy(tag)} className={`p-2 rounded-xl transition-all shrink-0 ${copied === tag ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-500'}`}>
                    {copied === tag ? <ClipboardCheck size={14}/> : <Copy size={14}/>}
                </button>
            </div>
            {isNotEmpty && <div className="text-[9px] text-slate-400 italic truncate mt-1 px-1 font-medium">{String(val)}</div>}
        </div>
    );
};

const SummaryWidget = ({ label, val, icon, color }: any) => {
  // Mapping warna untuk memastikan Tailwind mendeteksi class-nya
  const colors: Record<string, string> = {
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-600 text-emerald-700",
    blue: "bg-blue-50 border-blue-100 text-blue-600 text-blue-700",
    purple: "bg-purple-50 border-purple-100 text-purple-600 text-purple-700",
    orange: "bg-orange-50 border-orange-100 text-orange-600 text-orange-700"
  };

  const selectedColor = colors[color] || colors.blue;
  const colorParts = selectedColor.split(' '); // [bg, border, textIcon, textVal]

  return (
    <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center ${colorParts[0]} ${colorParts[1]}`}>
        <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest mb-1 ${colorParts[2]}`}>
          {icon} {label}
        </div>
        <div className={`text-2xl font-black tracking-tighter ${colorParts[3]}`}>
          {val || 0}
        </div>
    </div>
  );
};