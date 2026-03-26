// supabase/functions/convert-dwg/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { fileUrl, desaId } = await req.json();
    
    // Gunakan layanan konversi DWG ke PNG
    // Karena Deno tidak support DWG native, kita pakai API eksternal
    // Atau simpan sebagai file saja, buat placeholder
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );
    
    // Buat placeholder karena tidak bisa konversi DWG di server
    const placeholderUrl = 'https://placehold.co/800x600/1e293b/ffffff?text=DWG+File+Uploaded';
    
    // Update desa dengan preview
    await supabase
      .from('desa')
      .update({ 
        dwg_preview_url: placeholderUrl,
        peta_width: 800,
        peta_height: 600
      })
      .eq('id', desaId);
    
    return new Response(
      JSON.stringify({ success: true, previewUrl: placeholderUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});