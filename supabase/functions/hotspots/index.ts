import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.99.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const pathname = url.pathname.replace('/hotspots', '');
    const params = url.searchParams;

    if (pathname === '/raw' && req.method === 'GET') {
      const platform = params.get('platform') || 'all';
      const limit = parseInt(params.get('limit') || '50');

      let query = supabase
        .from('hotspot_raw')
        .select('*')
        .order('collected_at', { ascending: false });

      if (platform !== 'all') {
        query = query.eq('platform', platform);
      }

      query = query.limit(limit);

      const { data, error, count } = await query;

      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        data: data || [],
        total: count || data?.length || 0,
        filtered: data?.length || 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (pathname === '/food' && req.method === 'GET') {
      const platform = params.get('platform') || 'all';
      const stage = params.get('stage') || 'all';
      const category = params.get('category') || 'all';
      const sort = params.get('sort') || 'heat';
      const limit = parseInt(params.get('limit') || '20');

      let query = supabase
        .from('hotspot_food')
        .select('*');

      if (platform !== 'all') {
        query = query.eq('platform', platform);
      }

      if (stage !== 'all') {
        query = query.eq('stage', stage);
      }

      if (category !== 'all') {
        query = query.eq('category', category);
      }

      if (sort === 'heat') {
        query = query.order('heat', { ascending: false });
      }

      query = query.limit(limit);

      const { data, error } = await query;

      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        data: data || [],
        total: data?.length || 0,
        filtered: data?.length || 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      message: 'Not found'
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
