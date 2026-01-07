
import { GoogleGenAI, Type } from "@google/genai";
import { Identity } from "../types";
import { spellDateIndo } from "../utils";

export const processOCR = async (imageFile: File): Promise<Partial<Identity>> => {
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "") {
    throw new Error("API Key Gemini belum dipasang. Silakan tambahkan API_KEY di Environment Variables Vercel atau file .env lokal.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
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
      contents: [
        {
          parts: [
            { inlineData: { data: base64Data, mimeType: imageFile.type } },
            { text: "Ekstrak data dari gambar KTP ini dengan sangat teliti. Pastikan NIK dan Nama 100% akurat. Format output harus JSON. Field: nik (16 digit), nama, tempat_lahir, tanggal_lahir (YYYY-MM-DD), alamat, rt, rw, desa, kecamatan, kota_kabupaten, provinsi, pekerjaan, ktp_berlaku (YYYY-MM-DD atau 'SEUMUR HIDUP'), agama." }
          ]
        }
      ],
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
            alamat: { type: Type.STRING },
            rt: { type: Type.STRING },
            rw: { type: Type.STRING },
            desa: { type: Type.STRING },
            kecamatan: { type: Type.STRING },
            kota_kabupaten: { type: Type.STRING },
            provinsi: { type: Type.STRING },
            pekerjaan: { type: Type.STRING },
            ktp_berlaku: { type: Type.STRING },
            agama: { type: Type.STRING }
          },
          required: ["nik", "nama"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("AI tidak mengembalikan data.");
    
    const result = JSON.parse(text);
    
    if (result.nik) result.nik = result.nik.replace(/\D/g, '').substring(0, 16);
    
    return {
      ...result,
      nama: result.nama?.toUpperCase(),
      pekerjaan: result.pekerjaan?.toUpperCase(),
      ejaan_tanggal_lahir: result.tanggal_lahir ? spellDateIndo(result.tanggal_lahir) : '',
      ejaan_tanggal_ktp_berlaku: result.ktp_berlaku === 'SEUMUR HIDUP' ? 'SEUMUR HIDUP' : (result.ktp_berlaku ? spellDateIndo(result.ktp_berlaku) : ''),
      status: 'active'
    };
  } catch (error) {
    console.error("OCR AI Error:", error);
    throw new Error("Gagal mengekstraksi data KTP. Pastikan API Key valid dan gambar KTP terlihat jelas.");
  }
};
