import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.99.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const foodKeywords = [
  '美食', '火锅', '烧烤', '奶茶', '咖啡', '甜品', '小吃', '餐厅', '菜谱', '做菜',
  '烘焙', '蛋糕', '面包', '寿司', '拉面', '披萨', '汉堡', '炸鸡', '串串', '麻辣烫',
  '煎饼', '包子', '饺子', '粥', '炒饭', '炒面', '海鲜', '牛排', '自助餐', '探店',
  '米其林', '网红店', '打卡', '美味', '好吃', '食谱', '下午茶', '宵夜', '早餐', '午餐',
  '厨房', '厨师', '吃播', '美食家', '味道', '口感', '料理', '食材', '特色菜', '招牌菜'
];

const foodCategories: Record<string, string[]> = {
  '中餐': ['炒菜', '川菜', '粤菜', '湘菜', '东北菜', '家常菜', '中式'],
  '西餐': ['牛排', '披萨', '意面', '沙拉', '西式', '法餐', '意餐'],
  '日料': ['寿司', '拉面', '刺身', '日式', '天妇罗', '乌冬面'],
  '韩料': ['烤肉', '泡菜', '石锅拌饭', '韩式', '部队锅', '炸鸡'],
  '东南亚菜': ['泰餐', '越南菜', '冬阴功', '咖喱', '东南亚'],
  '火锅烧烤': ['火锅', '烧烤', '串串', '麻辣烫', '涮锅', '烤肉'],
  '小吃快餐': ['汉堡', '炸鸡', '煎饼', '包子', '饺子', '小吃', '快餐'],
  '甜品饮品': ['奶茶', '咖啡', '蛋糕', '甜品', '冰淇淋', '下午茶', '饮品'],
  '烘焙': ['面包', '蛋糕', '烘焙', '西点', '糕点'],
  '探店测评': ['探店', '测评', '打卡', '网红店', '推荐']
};

function analyzeRelevance(text: string): number {
  if (!text) return 0;

  const lowerText = text.toLowerCase();
  let score = 0;

  foodKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      score += 15;
    }
  });

  return Math.min(100, score);
}

function categorizeFood(text: string): string {
  if (!text) return '未分类';

  const lowerText = text.toLowerCase();

  for (const [category, keywords] of Object.entries(foodCategories)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return category;
      }
    }
  }

  return '未分类';
}

function determineStage(heat: number, growth: number): string {
  if (heat < 100000) {
    return '萌芽期';
  } else if (heat < 1000000 && growth > 50) {
    return '爆发期';
  } else if (heat >= 1000000) {
    return '成熟期';
  } else if (growth < -20) {
    return '衰退期';
  }
  return '成熟期';
}

function extractKeywords(text: string): string[] {
  const matched: string[] = [];
  const lowerText = text.toLowerCase();

  foodKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      matched.push(keyword);
    }
  });

  return matched.slice(0, 5);
}

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
    const pathname = url.pathname.replace('/analysis', '');

    if (pathname === '/run' && req.method === 'POST') {
      const { data: rawData, error } = await supabase
        .from('hotspot_raw')
        .select('*')
        .order('collected_at', { ascending: false });

      if (error) throw error;

      if (!rawData || rawData.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          message: '没有原始数据可供分析，请先抓取数据'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const foodData = rawData
        .map((item: any) => ({
          ...item,
          relevanceScore: analyzeRelevance(item.topic),
          category: categorizeFood(item.topic),
          stage: determineStage(item.heat, 0),
          keywords: extractKeywords(item.topic)
        }))
        .filter((item: any) => item.relevanceScore >= 60);

      const dataToInsert = foodData.map((item: any) => ({
        platform: item.platform,
        topic: item.topic,
        heat: item.heat,
        category: item.category,
        stage: item.stage,
        keywords: item.keywords,
        collected_at: new Date().toISOString()
      }));

      const { data: insertedData, error: insertError } = await supabase
        .from('hotspot_food')
        .insert(dataToInsert)
        .select();

      if (insertError) throw insertError;

      return new Response(JSON.stringify({
        success: true,
        message: `分析完成，识别出 ${insertedData.length} 条美食相关热点`,
        rawCount: rawData.length,
        foodCount: insertedData.length,
        filterRate: ((insertedData.length / rawData.length) * 100).toFixed(2) + '%'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (pathname === '/stats' && req.method === 'GET') {
      const { data: foodData, error } = await supabase
        .from('hotspot_food')
        .select('*');

      if (error) throw error;

      const stats = {
        total: foodData?.length || 0,
        byPlatform: {} as Record<string, number>,
        byCategory: {} as Record<string, number>,
        byStage: {} as Record<string, number>,
        avgHeat: 0,
        avgGrowth: 0
      };

      (foodData || []).forEach((item: any) => {
        const platformName = {
          douyin: '抖音',
          weibo: '微博',
          baidu: '百度',
          toutiao: '今日头条'
        }[item.platform] || item.platform;

        stats.byPlatform[platformName] = (stats.byPlatform[platformName] || 0) + 1;
        stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1;
        stats.byStage[item.stage] = (stats.byStage[item.stage] || 0) + 1;
        stats.avgHeat += item.heat;
      });

      if (foodData && foodData.length > 0) {
        stats.avgHeat = Math.round(stats.avgHeat / foodData.length);
      }

      return new Response(JSON.stringify({
        success: true,
        data: stats
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
