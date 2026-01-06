
import React, { useState, useEffect } from 'react';
import { exportToExcel, generateWordDocument } from '../services/export';
import { db } from '../services/db';
import { Card, Button, Select } from '../components/UI';
import { Printer, X, Eye, Database, Info, Copy, ClipboardCheck, UserCheck, FileSpreadsheet, MapPin, FileText, Layout, Ruler, Navigation, History, Hourglass } from 'lucide-react';
import { formatDateIndo, spellDateIndo } from '../utils';
import { FileRecord, Identity, LandData, Relation } from '../types';

export const TemplatesPage: React.FC = () => {
  const [selectedFileId, setSelectedFileId] = useState('');
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [showDataPreview, setShowDataPreview] = useState(false);
  const [copiedTag, setCopiedTag] = useState('');
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [previewData, setPreviewData] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    const loadInitial = async () => {
      const allFiles = await db.files.getAll();
      setFiles(allFiles || []);
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
    const fileData = await db.files.get(fileId);
    if (!fileData) return null;

    const relations = await db.relations.getByFileId(fileId);
    const identities = await db.identities.getAll();
    const lands = await db.lands.getAll();

    const p1: any[] = [];
    const p2: any[] = [];
    const saksi: any[] = [];
    const setuju: any[] = [];
    let landObj: any = null;

    relations.forEach(rel => {
      const person = identities.find(i => i.id === rel.identitas_id);
      if (person) {
        const enriched = { 
          ...person, 
          umur: calculateAge(person.tanggal_lahir),
          tgl_lahir_indo: formatDateIndo(person.tanggal_lahir),
          ktp_berlaku_indo: person.ktp_berlaku === 'SEUMUR HIDUP' ? 'SEUMUR HIDUP' : formatDateIndo(person.ktp_berlaku),
          ejaan_lahir: spellDateIndo(person.tanggal_lahir),
          ejaan_berlaku: person.ktp_berlaku === 'SEUMUR HIDUP' ? 'SEUMUR HIDUP' : spellDateIndo(person.ktp_berlaku)
        };
        if (rel.peran === 'PIHAK_1') p1.push(enriched);
        if (rel.peran === 'PIHAK_2') p2.push(enriched);
        if (rel.peran === 'SAKSI') saksi.push(enriched);
        if (rel.peran === 'PERSETUJUAN_PIHAK_1') setuju.push(enriched);
      }
      if (rel.data_tanah_id && !landObj) {
        landObj = lands.find(l => l.id === rel.data_tanah_id);
      }
    });

    const result: Record<string, any> = {
      // BERKAS
      No_Berkas: fileData.nomor_berkas,
      No_Register: fileData.nomor_register || "",
      Hari_Berkas: fileData.hari || "",
      Jenis_Surat: fileData.jenis_berkas,
      Tgl_Surat: formatDateIndo(fileData.tanggal),
      Tgl_Ejaan: spellDateIndo(fileData.tanggal),
      Ket_Berkas: fileData.keterangan || "",
      Jenis_Perolehan: fileData.jenis_perolehan || "",
      Thn_Perolehan: fileData.tahun_perolehan || "",
      Harga_Angka: fileData.harga ? fileData.harga.toLocaleString('id-ID') : "0",
      Harga_Ejaan: fileData.ejaan_harga || "nol rupiah",        

      // TANAH UMUM
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
      T_Pajak: landObj?.kewajiban_pajak || "",
      
      // ALAS HAK - LETTER C
      T_Jenis_Alas: landObj?.jenis_dasar_surat || "",
      T_C_AtasNama: landObj?.atas_nama_letter_c || "",
      T_C_Kohir: landObj?.kohir || "",
      T_C_Persil: landObj?.persil || "",
      T_C_Klas: landObj?.klas || "",
      T_C_Asal: landObj?.berasal_dari_an || "", 
      T_C_Tahun: landObj?.tahun_perolehan_alas_hak || "", 
      
      // ALAS HAK - SHM ANALOG
      T_SHM_AN: landObj?.atas_nama_shm || "",
      T_SHM_No: landObj?.no_shm || "",
      T_SHM_NIB: landObj?.nib || "",
      T_SHM_SU: landObj?.no_su || "",
      T_SHM_TglSU: formatDateIndo(landObj?.tanggal_su || ""),
      T_SHM_EjaanSU: landObj?.ejaan_tanggal_su || "",
      T_SHM_TglBuku: formatDateIndo(landObj?.tanggal_shm || ""),
      T_SHM_EjaanBuku: landObj?.ejaan_tanggal_shm || "",

      // ALAS HAK - SHM ELEKTRONIK
      T_EL_AN: landObj?.atas_nama_shm_el || "",
      T_EL_Kode: landObj?.kode_sertifikat || "",
      T_EL_Nibel: landObj?.nibel || "",

      // UKUR DIMOHON
      T_Luas_M: landObj?.luas_dimohon || "",
      T_Luas_E: landObj?.ejaan_luas_dimohon || "",
      T_Batas_U: landObj?.batas_utara_dimohon || "",
      T_Batas_T: landObj?.batas_timur_dimohon || "",
      T_Batas_S: landObj?.batas_selatan_dimohon || "",
      T_Batas_B: landObj?.batas_barat_dimohon || "",

      // UKUR SELURUHNYA
      T_Total_M: landObj?.luas_seluruhnya || "",
      T_Total_E: landObj?.ejaan_luas_seluruhnya || "",
      T_Total_U: landObj?.batas_utara_seluruhnya || "",
      T_Total_T: landObj?.batas_timur_seluruhnya || "",
      T_Total_S: landObj?.batas_selatan_seluruhnya || "",
      T_Total_B: landObj?.batas_barat_seluruhnya || "",
    };

    // Mapping BAK Dinamis
    if (landObj?.bak_list) {
      landObj.bak_list.forEach((val: string, i: number) => {
        result[`T_Bak${i + 1}`] = val || "";
      });
    }

    for (let i = 0; i < 5; i++) {
      const entry = landObj?.riwayat_tanah?.[i];
      result[`T_Riw${i + 1}_Nama`] = entry?.atas_nama || "";
      result[`T_Riw${i + 1}_C`] = entry?.c_no || "";
      result[`T_Riw${i + 1}_P`] = entry?.persil_no || "";
      result[`T_Riw${i + 1}_K`] = entry?.klas || "";
      result[`T_Riw${i + 1}_L`] = entry?.luas || "";
      result[`T_Riw${i + 1}_D`] = entry?.dasar_dialihkan || "";
    }

    const mapP = (prefix: string, p: any) => {
      result[`${prefix}_Sebutan`] = p?.sebutan || "";
      result[`${prefix}_Nama`] = p?.nama || "";
      result[`${prefix}_NIK`] = p?.nik || "";
      result[`${prefix}_Agama`] = p?.agama || "";
      result[`${prefix}_Pekerjaan`] = p?.pekerjaan || "";
      result[`${prefix}_TTL`] = p ? `${p.tempat_lahir}, ${p.tgl_lahir_indo}` : "";
      result[`${prefix}_Lahir_Tgl`] = p?.tgl_lahir_indo || "";
      result[`${prefix}_Lahir_Ejaan`] = p?.ejaan_lahir || "";
      result[`${prefix}_Umur`] = p?.umur ? p.umur + " Tahun" : "";
      result[`${prefix}_Alamat`] = p?.alamat || "";
      result[`${prefix}_RT`] = p?.rt || "";
      result[`${prefix}_RW`] = p?.rw || "";
      result[`${prefix}_Desa`] = p?.desa || "";
      result[`${prefix}_Kec`] = p?.kecamatan || "";
      result[`${prefix}_Kota`] = p?.kota_kabupaten || "";
      result[`${prefix}_Prov`] = p?.provinsi || "";
      result[`${prefix}_KTP_Berlaku`] = p?.ktp_berlaku_indo || "";
      result[`${prefix}_KTP_Ejaan`] = p?.ejaan_berlaku || "";
    };

    // Pihak 1 (Maks 3)
    mapP("P1_1", p1[0]); mapP("P1_2", p1[1]); mapP("P1_3", p1[2]);
    // Pihak 2 (Maks 2)
    mapP("P2_1", p2[0]); mapP("P2_2", p2[1]);
    // Saksi (Maks 2)
    mapP("Saksi1", saksi[0]); mapP("Saksi2", saksi[1]);
    // Persetujuan (Maks 1)
    mapP("Setuju1", setuju[0]);

    result._countP1 = p1.length;
    result._countP2 = p2.length;
    result._countS = saksi.length;
    result._hasLand = !!landObj;

    return result;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex justify-between items-end">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Cetak & Kamus Tag</h2>
            <p className="text-slate-500 text-sm">Sistem <b>Otomasi Dokumen</b> menggunakan Database Sinkron real-time.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={exportToExcel} size="sm"><FileSpreadsheet size={16} className="mr-2 inline" /> Backup Database (JSON)</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="1. Pilih Berkas Aktif" className="lg:col-span-2 shadow-sm border-slate-200">
            <div className="space-y-4">
                <Select label="Daftar Berkas Terdaftar" value={selectedFileId} onChange={e => setSelectedFileId(e.target.value)}>
                    <option value="">-- Pilih Berkas untuk Diproses --</option>
                    {files.map(f => <option key={f.id} value={f.id}>{f.nomor_berkas} - {f.jenis_berkas}</option>)}
                </Select>
                {previewData && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner">
                      <SummaryItem label="Pihak 1" val={previewData._countP1} color="emerald" />
                      <SummaryItem label="Pihak 2" val={previewData._countP2} color="blue" />
                      <SummaryItem label="Saksi" val={previewData._countS} color="purple" />
                      <SummaryItem label="Objek" val={previewData._hasLand ? 1 : 0} color="orange" />
                    </div>
                )}
                {!selectedFileId && <div className="p-10 border-2 border-dashed rounded-xl text-center text-slate-300 text-xs font-bold uppercase tracking-widest">Pilih Berkas untuk melihat statistik data</div>}
            </div>
        </Card>

        <Card title="2. Generate Dokumen" className="shadow-sm border-slate-200">
            <div className="space-y-4 text-center">
                <div className="p-4 border-2 border-dashed rounded-2xl bg-slate-50 border-slate-300 relative h-36 flex flex-col items-center justify-center group hover:bg-white hover:border-blue-400 transition-all">
                    <input type="file" accept=".docx" onChange={e => setTemplateFile(e.target.files ? e.target.files[0] : null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <Printer size={32} className="text-slate-400 mb-2 group-hover:text-blue-500 transition-colors" />
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-2 truncate w-full">{templateFile ? templateFile.name : "Klik / Seret Template .docx"}</p>
                </div>
                <Button 
                  onClick={() => generateWordDocument(templateFile!, previewData)} 
                  className="w-full h-12 font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-transform" 
                  disabled={!templateFile || !selectedFileId}
                >
                  Proses Dokumen
                </Button>
                <Button variant="outline" className="w-full text-[10px] font-black" onClick={() => setShowDataPreview(true)} disabled={!selectedFileId}><Eye size={14} className="mr-2 inline" /> Buka Panel Kamus Tag</Button>
            </div>
        </Card>
      </div>

      {showDataPreview && previewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md overflow-hidden">
            <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-7xl h-[92vh] flex flex-col border border-white/20 animate-in zoom-in-95 duration-300">
                <div className="p-6 bg-slate-800 text-white flex justify-between items-center px-10">
                    <div className="flex items-center gap-6">
                        <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-500/30"><Database size={28} className="text-blue-400"/></div>
                        <div>
                            <h3 className="font-black tracking-[0.2em] text-sm uppercase">Kamus Tag Database Real-Time</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gunakan tag ini untuk diletakkan di dalam file Microsoft Word Anda</p>
                        </div>
                    </div>
                    <button onClick={() => setShowDataPreview(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-2xl transition-all"><X size={28} /></button>
                </div>
                
                <div className="p-8 overflow-y-auto bg-slate-100/50 flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* KOLOM 1: ADMINISTRASI & TANAH */}
                    <div className="space-y-8">
                        <TagCategory title="ADMINISTRASI BERKAS" icon={<FileText size={16}/>} color="emerald">
                            <TagRow tag="{No_Berkas}" val={previewData.No_Berkas} onCopy={copyToClipboard} copied={copiedTag} />
                            <TagRow tag="{No_Register}" val={previewData.No_Register} onCopy={copyToClipboard} copied={copiedTag} />
                            <TagRow tag="{Hari_Berkas}" val={previewData.Hari_Berkas} onCopy={copyToClipboard} copied={copiedTag} />
                            <TagRow tag="{Tgl_Surat}" val={previewData.Tgl_Surat} onCopy={copyToClipboard} copied={copiedTag} />
                            <TagRow tag="{Jenis_Perolehan}" val={previewData.Jenis_Perolehan} onCopy={copyToClipboard} copied={copiedTag} />
                        </TagCategory>
                        
                        <TagCategory title="OBJEK TANAH (UMUM)" icon={<MapPin size={16}/>} color="blue">
                            <TagRow tag="{T_NOP}" val={previewData.T_NOP} onCopy={copyToClipboard} copied={copiedTag} />
                            <TagRow tag="{T_AtasNama_NOP}" val={previewData.T_AtasNama_NOP} onCopy={copyToClipboard} copied={copiedTag} />
                            <TagRow tag="{T_Desa}" val={previewData.T_Desa} onCopy={copyToClipboard} copied={copiedTag} />
                            <TagRow tag="{T_Alamat}" val={previewData.T_Alamat} onCopy={copyToClipboard} copied={copiedTag} />
                        </TagCategory>
                    </div>

                    {/* KOLOM 2: UKUR & BAK */}
                    <div className="space-y-8">
                        <TagCategory title="UKUR DIMOHON" icon={<Ruler size={16}/>} color="orange">
                            <TagRow tag="{T_Luas_M}" val={previewData.T_Luas_M} onCopy={copyToClipboard} copied={copiedTag} />
                            <TagRow tag="{T_Luas_E}" val={previewData.T_Luas_E} onCopy={copyToClipboard} copied={copiedTag} />
                            <TagRow tag="{T_Batas_U}" val={previewData.T_Batas_U} onCopy={copyToClipboard} copied={copiedTag} />
                        </TagCategory>
                        <TagCategory title="NARASI BAK / KETERANGAN" icon={<FileText size={16}/>} color="slate">
                            <TagRow tag="{T_Bak1}" val={previewData.T_Bak1} onCopy={copyToClipboard} copied={copiedTag} />
                            <TagRow tag="{T_Bak2}" val={previewData.T_Bak2} onCopy={copyToClipboard} copied={copiedTag} />
                            <TagRow tag="{Ket_Berkas}" val={previewData.Ket_Berkas} onCopy={copyToClipboard} copied={copiedTag} />
                        </TagCategory>
                    </div>

                    {/* KOLOM 3: PIHAK 1 & 2 */}
                    <div className="space-y-8">
                        <TagCategory title="PIHAK 1 (ORANG 1)" icon={<UserCheck size={16}/>} color="emerald">
                            <TagRow tag="{P1_1_Nama}" val={previewData.P1_1_Nama} onCopy={copyToClipboard} copied={copiedTag} />
                            <TagRow tag="{P1_1_NIK}" val={previewData.P1_1_NIK} onCopy={copyToClipboard} copied={copiedTag} />
                            <TagRow tag="{P1_1_TTL}" val={previewData.P1_1_TTL} onCopy={copyToClipboard} copied={copiedTag} />
                            <TagRow tag="{P1_1_Umur}" val={previewData.P1_1_Umur} onCopy={copyToClipboard} copied={copiedTag} />
                        </TagCategory>
                        <TagCategory title="PIHAK 2 (ORANG 1)" icon={<UserCheck size={16}/>} color="blue">
                            <TagRow tag="{P2_1_Nama}" val={previewData.P2_1_Nama} onCopy={copyToClipboard} copied={copiedTag} />
                            <TagRow tag="{P2_1_NIK}" val={previewData.P2_1_NIK} onCopy={copyToClipboard} copied={copiedTag} />
                         </TagCategory>
                    </div>

                    {/* KOLOM 4: SAKSI & TIPS */}
                    <div className="space-y-8">
                        <TagCategory title="SAKSI-SAKSI" icon={<Navigation size={16}/>} color="purple">
                            <TagRow tag="{Saksi1_Nama}" val={previewData.Saksi1_Nama} onCopy={copyToClipboard} copied={copiedTag} />
                            <TagRow tag="{Saksi1_Pekerjaan}" val={previewData.Saksi1_Pekerjaan} onCopy={copyToClipboard} copied={copiedTag} />
                            <TagRow tag="{Saksi2_Nama}" val={previewData.Saksi2_Nama} onCopy={copyToClipboard} copied={copiedTag} />
                        </TagCategory>
                        <div className="p-6 bg-slate-800 rounded-3xl text-white shadow-xl border border-slate-700">
                            <h4 className="text-[11px] font-black uppercase mb-3 text-blue-400 flex items-center gap-2 tracking-widest"><Info size={16}/> Panduan Cepat</h4>
                            <p className="text-[10px] leading-relaxed opacity-70 font-medium">
                                Gunakan kurung kurawal tunggal <code className="text-blue-300 font-bold">{`{No_Berkas}`}</code> di Word. Pastikan ketik manual untuk menghindari kerusakan metadata.
                            </p>
                        </div>
                    </div>
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
            <div className="p-3 space-y-1">{children}</div>
        </div>
    );
};

const TagRow = ({ tag, val, onCopy, copied }: any) => (
    <div className="group flex flex-col p-2 hover:bg-slate-50 rounded-xl transition-colors border-b border-slate-50 last:border-0">
        <div className="flex justify-between items-center gap-2">
            <code className="text-[10px] font-bold text-blue-700 truncate bg-blue-50/50 px-2 py-0.5 rounded-lg border border-blue-100/30 font-mono tracking-tighter">{tag}</code>
            <button onClick={() => onCopy(tag)} className={`p-1.5 rounded-xl transition-all shrink-0 ${copied === tag ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-500'}`}>
                {copied === tag ? <ClipboardCheck size={14}/> : <Copy size={14}/>}
            </button>
        </div>
        <div className="text-[9px] text-slate-400 italic truncate mt-1 px-1 font-medium">{val !== '' && val !== "" ? val : ""}</div>
    </div>
);

const SummaryItem = ({ label, val, color }: any) => (
    <div className={`p-3 rounded-2xl border text-center bg-${color}-50 border-${color}-100 transition-all`}>
        <div className={`text-[9px] font-black uppercase text-${color}-600 tracking-widest`}>{label}</div>
        <div className={`text-xl font-black text-${color}-700`}>{val}</div>
    </div>
);
