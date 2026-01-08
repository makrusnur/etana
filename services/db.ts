import { createClient } from '@supabase/supabase-js';
import { Identity, LandData, FileRecord, Relation } from '../types';

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
      const { id, ...dataToInsert } = item; 
      const { error } = await supabase.from('identities').insert([dataToInsert]);
      if (error) handleError(error, "Gagal menambah identitas");
    },
    update: async (id: string, updates: Partial<Identity>) => {
      const { id: _, ...dataToUpdate } = updates;
      const { error } = await supabase.from('identities').update(dataToUpdate).eq('id', id);
      if (error) handleError(error, "Gagal memperbarui identitas");
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('identities').delete().eq('id', id);
      if (error) handleError(error, "Gagal menghapus identitas");
    }
  },

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
    add: async (item: LandData) => {
      const { id, ...dataToInsert } = item;
      const { error } = await supabase.from('lands').insert([dataToInsert]);
      if (error) handleError(error, "Gagal menambah data tanah");
    },
    update: async (id: string, updates: Partial<LandData>) => {
      const { id: _, ...dataToUpdate } = updates;
      const { error } = await supabase.from('lands').update(dataToUpdate).eq('id', id);
      if (error) handleError(error, "Gagal memperbarui data tanah");
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('lands').delete().eq('id', id);
      if (error) handleError(error, "Gagal menghapus data tanah");
    }
  },

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
      const { id, ...dataToInsert } = item;
      const { error } = await supabase.from('files').insert([dataToInsert]);
      if (error) handleError(error, "Gagal menambah berkas");
    },
    update: async (id: string, updates: Partial<FileRecord>) => {
      const { id: _, ...dataToUpdate } = updates;
      const { error } = await supabase.from('files').update(dataToUpdate).eq('id', id);
      if (error) handleError(error, "Gagal memperbarui berkas");
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('files').delete().eq('id', id);
      if (error) handleError(error, "Gagal menghapus berkas");
    }
  },

  relations: {
    getAll: async () => {
      const { data, error } = await supabase.from('relations').select('*');
      if (error) handleError(error, "Gagal memuat relasi");
      return (data || []) as Relation[];
    },
    getByFileId: async (fileId: string) => {
      const { data, error } = await supabase.from('relations').select('*').eq('berkas_id', fileId);
      if (error) handleError(error, "Gagal memuat relasi berkas");
      return (data || []) as Relation[];
    },
    add: async (item: Relation) => {
      const { id, ...dataToInsert } = item;
      const { error } = await supabase.from('relations').insert([dataToInsert]);
      if (error) handleError(error, "Gagal menambah relasi");
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('relations').delete().eq('id', id);
      if (error) handleError(error, "Gagal menghapus relasi");
    }
  }
};