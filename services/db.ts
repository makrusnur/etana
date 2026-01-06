
import { createClient } from '@supabase/supabase-js';
import { Identity, LandData, FileRecord, Relation } from '../types';

// Ambil dari process.env (didukung oleh shim di index.html)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

// Jika URL kosong, kita buat dummy agar tidak crash saat inisialisasi
const finalUrl = supabaseUrl.startsWith('http') ? supabaseUrl : 'https://placeholder.supabase.co';
const finalKey = supabaseAnonKey || 'placeholder';

export const supabase = createClient(finalUrl, finalKey);

export const db = {
  identities: {
    getAll: async () => {
      const { data, error } = await supabase.from('identities').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Identity[];
    },
    get: async (id: string) => {
      const { data, error } = await supabase.from('identities').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Identity;
    },
    add: async (item: Identity) => {
      const { error } = await supabase.from('identities').insert([item]);
      if (error) throw error;
    },
    update: async (id: string, updates: Partial<Identity>) => {
      const { error } = await supabase.from('identities').update(updates).eq('id', id);
      if (error) throw error;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('identities').delete().eq('id', id);
      if (error) throw error;
    }
  },
  lands: {
    getAll: async () => {
      const { data, error } = await supabase.from('lands').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as LandData[];
    },
    get: async (id: string) => {
      const { data, error } = await supabase.from('lands').select('*').eq('id', id).single();
      if (error) throw error;
      return data as LandData;
    },
    add: async (item: LandData) => {
      const { error } = await supabase.from('lands').insert([item]);
      if (error) throw error;
    },
    update: async (id: string, updates: Partial<LandData>) => {
      const { error } = await supabase.from('lands').update(updates).eq('id', id);
      if (error) throw error;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('lands').delete().eq('id', id);
      if (error) throw error;
    }
  },
  files: {
    getAll: async () => {
      const { data, error } = await supabase.from('files').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as FileRecord[];
    },
    get: async (id: string) => {
      const { data, error } = await supabase.from('files').select('*').eq('id', id).single();
      if (error) throw error;
      return data as FileRecord;
    },
    add: async (item: FileRecord) => {
      const { error } = await supabase.from('files').insert([item]);
      if (error) throw error;
    },
    update: async (id: string, updates: Partial<FileRecord>) => {
      const { error } = await supabase.from('files').update(updates).eq('id', id);
      if (error) throw error;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('files').delete().eq('id', id);
      if (error) throw error;
    }
  },
  relations: {
    getAll: async () => {
      const { data, error } = await supabase.from('relations').select('*');
      if (error) throw error;
      return data as Relation[];
    },
    getByFileId: async (fileId: string) => {
      const { data, error } = await supabase.from('relations').select('*').eq('berkas_id', fileId);
      if (error) throw error;
      return data as Relation[];
    },
    add: async (item: Relation) => {
      const { error } = await supabase.from('relations').insert([item]);
      if (error) throw error;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('relations').delete().eq('id', id);
      if (error) throw error;
    }
  }
};
