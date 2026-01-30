
import { GoogleGenAI, Type } from "@google/genai";
import { Identity } from "../types";
import { spellDateIndo } from "../utils";

export const processOCR = async (imageFile: File): Promise<Partial<Identity>> => {
  // GANTI BARIS INI:
  const toTitleCase = (str: string) => {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  };
  const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("API Key Gemini belum dipasang di Environment Variables.");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey }); 
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: imageFile.type } },
          { text: "Ekstrak data dari gambar KTP Indonesia. Pastikan NIK dan Nama 100% akurat. Format output harus JSON valid. Field: nik (16 digit), nama, tempat_lahir, tanggal_lahir (YYYY-MM-DD), alamat, rt, rw, desa, kecamatan, kota_kabupaten, provinsi, pekerjaan, ktp_berlaku (YYYY-MM-DD atau 'SEUMUR HIDUP'), agama." }
        ]
      },
      config: {
        thinkingConfig: { thinkingBudget: 1000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nik: { type: Type.STRING },
            nama: { type: Type.STRING },
            tempat_lahir: { type: Type.STRING },
            tanggal_lahir: { type: Type.STRING },
            jenis_kelamin: { type: Type.STRING }, // Field Baru
            alamat: { type: Type.STRING },
            rt: { type: Type.STRING },
            rw: { type: Type.STRING },
            desa: { type: Type.STRING },
            kecamatan: { type: Type.STRING },
            kota_kabupaten: { type: Type.STRING },
            provinsi: { type: Type.STRING },
            pekerjaan: { type: Type.STRING },
            kewarganegaraan: { type: Type.STRING }, // Field Baru
            status_perkawinan: { type: Type.STRING }, // Field Baru
            ktp_berlaku: { type: Type.STRING },
            agama: { type: Type.STRING }
          },
          required: ["nik", "nama"]
        }
      }
    });

    const text = response.text; // Aturan: gunakan properti .text langsung
    if (!text) throw new Error("AI tidak mengembalikan data teks.");
    
    const result = JSON.parse(text);
    
    // Pembersihan NIK
    if (result.nik) {
      result.nik = result.nik.replace(/\D/g, '').substring(0, 16);
    }
    
    return {
      ...result,
      nama: toTitleCase(result.nama || ""),
      tempat_lahir: toTitleCase(result.tempat_lahir || ""),
      alamat: toTitleCase(result.alamat || ""),
      desa: toTitleCase(result.desa || ""),
      kecamatan: toTitleCase(result.kecamatan || ""),
      kota_kabupaten: toTitleCase(result.kota_kabupaten || ""),
      provinsi: toTitleCase(result.provinsi || ""),
      pekerjaan: toTitleCase(result.pekerjaan || ""),
      agama: toTitleCase(result.agama || ""),
      
      // Penyesuaian Field Baru
      jenis_kelamin: toTitleCase(result.jenis_kelamin || ""),
      kewarganegaraan: result.kewarganegaraan?.toUpperCase() || "WNI",
      status_perkawinan: toTitleCase(result.status_perkawinan || ""),
      
      ejaan_tanggal_lahir: result.tanggal_lahir ? spellDateIndo(result.tanggal_lahir) : '',
      ejaan_tanggal_ktp_berlaku: result.ktp_berlaku === 'SEUMUR HIDUP' ? 'SEUMUR HIDUP' : (result.ktp_berlaku ? spellDateIndo(result.ktp_berlaku) : ''),
      status: 'active'
    };
  } catch (error: any) {
    console.error("OCR AI Error:", error);
    throw new Error(error?.message || "Gagal mengekstraksi data KTP. Pastikan API Key valid.");
  }
  
};
export const processLetterC = async (imageFile: File): Promise<any> => {
  const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;

  if (!apiKey) throw new Error("API Key Gemini belum dipasang.");

  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Gunakan versi terbaru
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: imageFile.type } },
          { text: `Ekstrak data dari dokumen Letter C (Buku Pendaftaran Tanah) berikut. 
            Ambil informasi identitas pemilik dan rincian persil dalam tabel.
            Format harus JSON valid.` 
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nomor_c: { type: Type.STRING },
            nama_pemilik: { type: Type.STRING },
            alamat_pemilik: { type: Type.STRING },
            persils: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  nomor_persil: { type: Type.STRING },
                  jenis_tanah: { type: Type.STRING, description: "Tanah Kering atau Sawah" },
                  klas_desa: { type: Type.STRING },
                  luas_meter: { type: Type.NUMBER },
                  asal_usul: { type: Type.STRING }
                }
              }
            }
          },
          required: ["nomor_c", "nama_pemilik"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("AI tidak mengembalikan data.");
    
    const result = JSON.parse(text);

    // Pembersihan data sederhana
    return {
      nomor_c: result.nomor_c?.toUpperCase() || '',
      nama_pemilik: result.nama_pemilik?.toUpperCase() || '',
      alamat_pemilik: result.alamat_pemilik || '',
      persils: result.persils?.map((p: any) => ({
        ...p,
        jenis_tanah: p.jenis_tanah?.includes('Sawah') ? 'Sawah' : 'Tanah Kering',
        nomor_persil: p.nomor_persil || ''
      })) || []
    };
  } catch (error: any) {
    console.error("Letter C OCR Error:", error);
    throw error;
  }
};