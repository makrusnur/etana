
import { db } from "./db";
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

export const exportToExcel = async () => {
  try {
    const [identities, files, lands, relations] = await Promise.all([
      db.identities.getAll(),
      db.files.getAll(),
      db.lands.getAll(),
      db.relations.getAll()
    ]);

    const wbData = {
      Identitas: identities,
      Berkas: files,
      DataTanah: lands,
      Relasi: relations
    };

    const dataStr = JSON.stringify(wbData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `ethana_backup_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    alert("Backup data berhasil diunduh dalam format JSON (Dapat diimpor kembali nantinya).");
  } catch (error) {
    console.error("Export failed:", error);
    alert("Gagal melakukan export data.");
  }
};

export const generateWordDocument = async (templateFile: File, data: any) => {
  if (!templateFile || !data) {
    alert("Silakan pilih template (.docx) dan berkas data terlebih dahulu.");
    return;
  }

  try {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result;
        if (!content) throw new Error("File content is empty");

        const zip = new PizZip(content as string);
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
        });

        // Merender data ke dalam template
        doc.render(data);

        const out = doc.getZip().generate({
          type: "blob",
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        // Mengunduh hasil render
        const url = URL.createObjectURL(out);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Dokumen_Ethana_${data.No_Berkas || 'Hasil'}_${new Date().getTime()}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error: any) {
        console.error("Docxtemplater error:", error);
        alert("Terjadi kesalahan teknis saat memproses file Word. Pastikan template .docx valid dan tag {kurung_kurawal} sudah benar.");
      }
    };
    reader.readAsBinaryString(templateFile);
  } catch (err) {
    console.error("File reading error:", err);
    alert("Gagal membaca file template yang Anda pilih.");
  }
};
