import { createClient } from '@supabase/supabase-js';
import { Identity, LandData, FileRecord, Relation, PtslVillage, PbbRecord } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfigured = !!supabaseUrl && !!supabaseAnonKey;

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co', 
  supabaseAnonKey || 'placeholder'
);

const handleError = (error: any, context: string) => {
  if (!isConfigured) {
    throw new Error(`Konfigurasi Supabase belum lengkap. Atur VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env.`);
  }
  const message = error?.message || JSON.stringify(error);
  console.error(`[Supabase Error - ${context}]:`, error);
  throw new Error(`${context}: ${message}`);
};

export const db = {
  // ==========================================
  // 1. PTSL VILLAGES (FITUR BARU)
  // ==========================================
  ptslVillages: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('ptsl_villages')
        .select('*')
        .order('nama_desa', { ascending: true });
      if (error) handleError(error, "Gagal memuat daftar desa");
      return (data || []) as PtslVillage[];
    },
    get: async (id: string) => {
      const { data, error } = await supabase.from('ptsl_villages').select('*').eq('id', id).single();
      if (error) handleError(error, "Gagal mengambil data desa");
      return data as PtslVillage;
    },
    add: async (item: PtslVillage) => {
      const { error } = await supabase.from('ptsl_villages').insert([item]);
      if (error) handleError(error, "Gagal menambah desa");
    },
    update: async (id: string, updates: Partial<PtslVillage>) => {
      const { error } = await supabase.from('ptsl_villages').update(updates).eq('id', id);
      if (error) handleError(error, "Gagal memperbarui data desa");
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('ptsl_villages').delete().eq('id', id);
      if (error) handleError(error, "Gagal menghapus desa");
    }
  },

  // ==========================================
  // 2. IDENTITIES
  // ==========================================
  identities: {
    getAll: async () => {
      const { data, error } = await supabase.from('identities').select('*').order('created_at', { ascending: false });
      if (error) handleError(error, "Gagal memuat identitas");
      return (data || []) as Identity[];
    },
    get: async (id: string) => {
      const { data, error } = await supabase.from('identities').select('*').eq('id', id).single();
      if (error) handleError(error, "Gagal mengambil data identitas");
      return data as Identity;
    },
    add: async (item: Identity) => {
      // LOGIKA PENYELAMAT:
      // Kita buang properti 'id' jika isinya kosong agar Supabase pakai gen_random_uuid()
      const { id, ...dataToSend } = item;
      const cleanData = (id && id.trim() !== "") ? item : dataToSend;

      const { error } = await supabase.from('identities').insert([cleanData]);
      if (error) handleError(error, "Gagal menambah identitas");
    },

    update: async (id: string, updates: Partial<Identity>) => {
      // Saat update, kita juga harus pastikan tidak mencoba mengupdate kolom 'id' 
      // menjadi string kosong atau tipe yang salah
      const { id: _, ...dataToUpdate } = updates;

      const { error } = await supabase.from('identities').update(dataToUpdate).eq('id', id);
      if (error) handleError(error, "Gagal memperbarui identitas");
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('identities').delete().eq('id', id);
      if (error) handleError(error, "Gagal menghapus identitas");
    }
  },

  // ==========================================
  // 3. LANDS
  // ==========================================
  lands: {
    getAll: async () => {
      const { data, error } = await supabase.from('lands').select('*').order('created_at', { ascending: false });
      if (error) handleError(error, "Gagal memuat data tanah");
      return (data || []) as LandData[];
    },
    get: async (id: string) => {
      const { data, error } = await supabase.from('lands').select('*').eq('id', id).single();
      if (error) handleError(error, "Gagal mengambil data tanah");
      return data as LandData;
    },
    getByNop: async (nop: string) => {
      const { data } = await supabase
        .from('lands')
        .select('*')
        .eq('nop', nop)
        .maybeSingle();
      return data;
    },
    add: async (item: LandData) => {
      const { error } = await supabase.from('lands').insert([item]);
      if (error) handleError(error, "Gagal menambah data tanah");
    },
    update: async (id: string, updates: Partial<LandData>) => {
      const { error } = await supabase.from('lands').update(updates).eq('id', id);
      if (error) handleError(error, "Gagal memperbarui data tanah");
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('lands').delete().eq('id', id);
      if (error) handleError(error, "Gagal menghapus data tanah");
    }
  },

  // ==========================================
  // 4. FILES
  // ==========================================
  files: {
  getAll: async () => {
    const { data, error } = await supabase.from('files').select('*').order('created_at', { ascending: false });
    if (error) handleError(error, "Gagal memuat berkas");
    return (data || []) as FileRecord[];
  },
  get: async (id: string) => {
    const { data, error } = await supabase.from('files').select('*').eq('id', id).single();
    if (error) handleError(error, "Gagal mengambil berkas");
    return data as FileRecord;
  },
  add: async (item: FileRecord) => {
    // === LOGIKA PEMBERSIHAN ===
    const cleanItem: any = { ...item };

    // 1. Buang ID jika kosong agar dibuat otomatis oleh DB
    if (!cleanItem.id || cleanItem.id === "") {
      delete cleanItem.id;
    }

    // 2. KRUSIAL: Buang village_id jika kosong agar tidak error format UUID
    if (!cleanItem.village_id || cleanItem.village_id === "") {
      delete cleanItem.village_id;
    }

    const { error } = await supabase.from('files').insert([cleanItem]);
    if (error) handleError(error, "Gagal menambah berkas");
  },
  update: async (id: string, updates: Partial<FileRecord>) => {
    const cleanUpdates: any = { ...updates };

    // Jangan pernah update kolom ID
    delete cleanUpdates.id;

    // Jika village_id di-update jadi kosong, set ke null
    if (cleanUpdates.hasOwnProperty('village_id') && (!cleanUpdates.village_id || cleanUpdates.village_id === "")) {
      cleanUpdates.village_id = null;
    }

    const { error } = await supabase.from('files').update(cleanUpdates).eq('id', id);
    if (error) handleError(error, "Gagal memperbarui berkas");
  },
  delete: async (id: string) => {
    const { error } = await supabase.from('files').delete().eq('id', id);
    if (error) handleError(error, "Gagal menghapus berkas");
  }
},

  // ==========================================
  // 5. RELATIONS
  // ==========================================
  relations: {
    getAll: async () => {
      const { data, error } = await supabase.from('relations').select('*');
      if (error) handleError(error, "Gagal memuat relasi");
      return (data || []) as Relation[];
    },
    getByFileId: async (fileId: string) => {
      // Kita bersihkan string ID untuk memastikan tidak ada spasi/newline
      const cleanId = fileId.trim(); 
      
      const { data, error } = await supabase
        .from('relations')
        .select('*')
        .eq('berkas_id', cleanId);
        
      if (error) {
        console.error("Gagal memuat relasi berkas untuk ID:", cleanId, error);
        return [];
      }
      return (data || []) as Relation[];
    },
    add: async (item: Relation) => {
      const { error } = await supabase.from('relations').insert([item]);
      if (error) handleError(error, "Gagal menambah relasi");
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('relations').delete().eq('id', id);
      if (error) handleError(error, "Gagal menghapus relasi");
    }
  },

  // Ganti bagian pbb di db.ts menjadi seperti ini:
pbb_records: {
  getAll: async () => {
    const { data, error } = await supabase
      .from('pbb_records')
      .select(`*, lands!data_tanah_id(nop, alamat), identities(nama, nik)`)
      .order('tgl_rekam', { ascending: false });
    
    if (error) {
      console.error("Gagal memuat PBB:", error);
      return [];
    }
    return data || [];
  },
  
getByNop: async (nop: string) => {
  const { data, error } = await supabase
    .from('pbb_records')
    .select(`
      *,
      lands!inner (*),
      identities (*)
    `)
    .eq('lands.nop', nop) // Filter NOP yang ada di dalam tabel lands
    .order('tgl_rekam', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Gagal cari relasi PBB:", error);
    return null;
  }
  
  // Kita kembalikan strukturnya supaya land & identity ada di level atas 
  // agar setLinkedOP dan setLinkedWP Bapak tidak error
  if (data) {
    return {
      ...data.lands,       // Data Tanah
      identities: data.identities, // Data Pemilik
      last_pbb: data       // Data PBB terakhirnya
    };
  }
  
  return null;
},
  getRelationByNop: async (nop: string) => {
    // Kita cari di pbb_records yang punya NOP spesifik di tabel lands
    const { data, error } = await supabase
      .from('pbb_records')
      .select(`
        *,
        lands!data_tanah_id!inner (*), 
        identities (*)
      `)
      .eq('lands.nop', nop) // Kunci di NOP yang diinput
      .order('tgl_rekam', { ascending: false }) // Ambil rekam terbaru
      .limit(1)
      .maybeSingle();

    if (error) return null;
    return data;
  },

  add: async (item: Partial<PbbRecord>) => { 
      const { error } = await supabase.from('pbb_records').insert([item]);
      return !error;
    },

  update: async (id: string, item: any) => {
    const { error } = await supabase.from('pbb_records').update(item).eq('id', id);
    if (error) console.error("Gagal update PBB:", error);
    return !error;
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('pbb_records').delete().eq('id', id);
    if (error) console.error("Gagal hapus PBB:", error);
    return !error;
  }
},
};
