
import { createClient } from '@supabase/supabase-js';
import { Identity, LandData, FileRecord, Relation } from '../types';

// Safely access process.env
const getEnv = (key: string) => {
  try {
    return process.env[key] || '';
  } catch {
    return '';
  }
};

const supabaseUrl = getEnv('https://xrtdbatsycdhbbkxcpjs.supabase.co');
const supabaseAnonKey = getEnv('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhydGRiYXRzeWNkaGJia3hjcGpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODIxMTYsImV4cCI6MjA4MzI1ODExNn0.H0HW88HYabCqTM3znO0r_2ju0BsLUrcF_ds41wCqZTo');

const isConfigured = supabaseUrl.startsWith('http') && supabaseAnonKey !== '';

const finalUrl = isConfigured ? supabaseUrl : 'https://xrtdbatsycdhbbkxcpjs.supabase.co';
const finalKey = isConfigured ? supabaseAnonKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhydGRiYXRzeWNkaGJia3hjcGpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODIxMTYsImV4cCI6MjA4MzI1ODExNn0.H0HW88HYabCqTM3znO0r_2ju0BsLUrcF_ds41wCqZTo';

export const supabase = createClient(finalUrl, finalKey);

const handleError = (error: any, context: string) => {
  if (!isConfigured) {
    throw new Error(`Konfigurasi Supabase belum lengkap. Atur SUPABASE_URL dan SUPABASE_ANON_KEY.`);
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
      const { error } = await supabase.from('identities').insert([item]);
      if (error) handleError(error, "Gagal menambah identitas");
    },
    update: async (id: string, updates: Partial<Identity>) => {
      const { error } = await supabase.from('identities').update(updates).eq('id', id);
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
      const { error } = await supabase.from('files').insert([item]);
      if (error) handleError(error, "Gagal menambah berkas");
    },
    update: async (id: string, updates: Partial<FileRecord>) => {
      const { error } = await supabase.from('files').update(updates).eq('id', id);
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
      const { error } = await supabase.from('relations').insert([item]);
      if (error) handleError(error, "Gagal menambah relasi");
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('relations').delete().eq('id', id);
      if (error) handleError(error, "Gagal menghapus relasi");
    }
  }
};
