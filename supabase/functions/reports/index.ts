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
    const pathname = url.pathname.replace('/reports', '');
    const params = url.searchParams;

    if (req.method === 'GET' && pathname === '') {
      const startDate = params.get('startDate');
      const endDate = params.get('endDate');

      let query = supabase
        .from('daily_reports')
        .select('*')
        .order('report_date', { ascending: false });

      if (startDate) {
        query = query.gte('report_date', startDate);
      }

      if (endDate) {
        query = query.lte('report_date', endDate);
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

    if (pathname === '/generate' && req.method === 'POST') {
      const { data: foodData, error } = await supabase
        .from('hotspot_food')
        .select('*')
        .order('heat', { ascending: false });

      if (error) throw error;

      if (!foodData || foodData.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          message: '没有美食热点数据，请先进行分析'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const today = new Date().toISOString().split('T')[0];

      const topHotspots = foodData.slice(0, 10);

      const categoryStats: Record<string, number> = {};
      const stageStats: Record<string, number> = {};

      foodData.forEach((item: any) => {
        categoryStats[item.category] = (categoryStats[item.category] || 0) + 1;
        stageStats[item.stage] = (stageStats[item.stage] || 0) + 1;
      });

      const recommendations = foodData
        .filter((item: any) => item.stage === '爆发期' || item.stage === '萌芽期')
        .slice(0, 5)
        .map((item: any) => ({
          title: item.topic,
          reason: `${item.stage}热点，当前热度 ${item.heat}`,
          priority: item.stage === '爆发期' ? '高' : '中'
        }));

      const summary = {
        totalHotspots: foodData.length,
        categoryStats,
        stageStats
      };

      const { data: report, error: insertError } = await supabase
        .from('daily_reports')
        .upsert({
          report_date: today,
          summary,
          top_hotspots: topHotspots,
          trend_analysis: {
            recommendations,
            summary: `今日共监控到 ${foodData.length} 个美食相关热点，其中爆发期内容 ${stageStats['爆发期'] || 0} 个，建议优先关注高增长话题`
          }
        }, {
          onConflict: 'report_date'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return new Response(JSON.stringify({
        success: true,
        message: '报告生成成功',
        data: report
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'GET' && pathname.startsWith('/')) {
      const id = pathname.substring(1);

      const { data, error } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        return new Response(JSON.stringify({
          success: false,
          message: '报告不存在'
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        data
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
