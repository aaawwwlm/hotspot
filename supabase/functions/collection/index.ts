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
    const pathname = url.pathname.replace('/collection', '');

    if (req.method === 'GET' && pathname === '') {
      const platform = url.searchParams.get('platform') || null;
      const type = url.searchParams.get('type') || 'all';
      const limit = parseInt(url.searchParams.get('limit') || '50');

      let query = supabase
        .from('video_collection')
        .select('*')
        .order('collected_at', { ascending: false })
        .limit(limit);

      if (platform) {
        query = query.eq('platform', platform);
      }

      if (type === 'hot' && platform === 'xiaohongshu') {
        query = query.eq('is_hot', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        data: data || [],
        total: data?.length || 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'GET' && pathname === '/xiaohongshu') {
      const type = url.searchParams.get('type') || 'all';
      const limit = parseInt(url.searchParams.get('limit') || '20');

      let query = supabase
        .from('video_collection')
        .select('*')
        .eq('platform', 'xiaohongshu')
        .order('heat_score', { ascending: false })
        .limit(limit);

      if (type === 'hot') {
        query = query.eq('is_hot', true);
      } else if (type === 'trending') {
        query = query.gte('engagement_rate', 10);
      }

      const { data, error } = await query;

      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        count: data?.length || 0,
        data: data || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'POST' && pathname === '') {
      const { title, description, video_url, platform, author, tags } = await req.json();

      if (!title || !video_url) {
        return new Response(JSON.stringify({
          success: false,
          message: '标题和视频URL不能为空'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data, error } = await supabase
        .from('video_collection')
        .insert({
          title,
          description: description || '',
          video_url,
          platform: platform || '',
          author: author || '',
          tags: tags || [],
          collected_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        message: '收藏成功',
        data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'PUT' && pathname.startsWith('/')) {
      const id = pathname.substring(1);
      const updates = await req.json();

      const { data, error } = await supabase
        .from('video_collection')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        message: '更新成功',
        data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'DELETE' && pathname.startsWith('/')) {
      const id = pathname.substring(1);

      const { error } = await supabase
        .from('video_collection')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        message: '删除成功'
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
