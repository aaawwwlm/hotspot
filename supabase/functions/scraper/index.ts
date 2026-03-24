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
  '米其林', '网红店', '打卡', '美味', '好吃', '食谱', '下午茶', '宵夜', '早餐', '午餐'
];

const contentStages = ['萌芽期', '爆发期', '成熟期', '衰退期'];

const xiaohongshuTopics = [
  '美食探店', '网红餐厅', '美食教程', '甜品制作', '烘焙日记',
  '早餐日记', '减脂餐', '快手菜', '家常菜', '美食测评',
  '火锅攻略', '咖啡日常', '下午茶', '烧烤指南', '美食vlog'
];

const authors = [
  '美食博主小王', '探店达人', '烘焙师傅', '美食测评家', '厨艺教学',
  '网红吃货', '料理研究所', '甜品工作室', '美食记录者', '探店小分队'
];

function randomItem(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMockData(platform: string, count: number) {
  const data = [];
  for (let i = 0; i < count; i++) {
    const keyword = randomItem(foodKeywords);
    const heat = randomNumber(50000, 10000000);
    const growth = randomNumber(-50, 300);

    const titles = [
      `${keyword}的10种创新做法`,
      `探店｜这家${keyword}太绝了`,
      `3分钟学会${keyword}`,
      `${keyword}测评｜到底值不值得买`,
      `${keyword}大赏`,
      `网红${keyword}翻车现场`,
      `${keyword}合集｜吃货必看`,
      `自制${keyword}教程`,
      `${keyword}｜你不知道的秘密`,
      `${keyword}挑战`
    ];

    data.push({
      platform,
      title: randomItem(titles),
      heat,
      trend: growth > 0 ? 'up' : growth < 0 ? 'down' : 'stable',
      rank: i + 1
    });
  }
  return data;
}

function generateXiaohongshuVideos(count: number) {
  const videos = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const topic = randomItem(xiaohongshuTopics);
    const keyword = randomItem(foodKeywords);
    const author = randomItem(authors);

    const likeCount = randomNumber(10000, 500000);
    const commentCount = randomNumber(500, 20000);
    const shareCount = randomNumber(200, 10000);
    const collectCount = randomNumber(1000, 50000);
    const viewCount = randomNumber(50000, 2000000);

    const totalEngagement = likeCount + commentCount + shareCount + collectCount;
    const engagementRate = Number(((totalEngagement / viewCount) * 100).toFixed(2));

    const heatScore = Number((
      likeCount * 1.0 +
      commentCount * 2.0 +
      shareCount * 3.0 +
      collectCount * 1.5 +
      viewCount * 0.1
    ).toFixed(2));

    const isHot = heatScore > 100000 && engagementRate > 15;

    const daysAgo = randomNumber(1, 30);
    const publishedAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    const topicTags = [topic, keyword];
    if (Math.random() > 0.5) {
      topicTags.push(randomItem(['探店', '教程', '测评', 'vlog', '日常']));
    }

    const titles = [
      `${topic}｜${keyword}这样做真的绝了！`,
      `探店实录｜${keyword}爱好者必看`,
      `${keyword}教程｜新手也能学会`,
      `测评｜这家${keyword}值得打卡吗？`,
      `${topic}合集｜${keyword}爱好者福利`,
      `${keyword}｜吃过的人都说好`,
      `跟着我做${keyword}，零失败！`,
      `${keyword}探店｜人均不到100`,
      `${topic}日记｜${keyword}制作全过程`
    ];

    const videoId = `${randomNumber(100000000000000000000, 999999999999999999999).toString(16)}`;

    videos.push({
      video_id: `xhs_${Date.now()}_${i}`,
      title: randomItem(titles),
      description: `分享${topic}相关的${keyword}内容，记录美食生活。\n\n这是一个${topic}视频，主要讲解${keyword}的制作方法和技巧。视频中详细介绍了食材选择、制作步骤和注意事项，适合美食爱好者观看学习。\n\n#${topic} #${keyword} #美食教程`,
      video_url: `https://www.xiaohongshu.com/explore/${videoId}`,
      cover_url: `https://picsum.photos/seed/${videoId}/720/960`,
      platform: 'xiaohongshu',
      author,
      tags: JSON.stringify(topicTags),
      topic_tags: JSON.stringify(topicTags),
      like_count: likeCount,
      comment_count: commentCount,
      share_count: shareCount,
      collect_count: collectCount,
      view_count: viewCount,
      engagement_rate: engagementRate,
      heat_score: heatScore,
      is_hot: isHot,
      published_at: publishedAt.toISOString(),
      collected_at: new Date().toISOString()
    });
  }

  return videos.sort((a, b) => b.heat_score - a.heat_score);
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
    const pathname = url.pathname.replace('/scraper', '');

    if (pathname === '/trigger' && req.method === 'POST') {
      const { platform } = await req.json();

      if (!platform || !['douyin', 'weibo', 'baidu', 'toutiao'].includes(platform)) {
        return new Response(JSON.stringify({
          success: false,
          message: '平台参数无效，支持: douyin, weibo, baidu, toutiao'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const mockData = generateMockData(platform, 20);

      const dataToInsert = mockData.map(item => ({
        platform: item.platform,
        topic: item.title,
        heat: item.heat,
        trend: item.trend,
        rank: item.rank,
        collected_at: new Date().toISOString()
      }));

      const { data: insertedData, error: insertError } = await supabase
        .from('hotspot_raw')
        .insert(dataToInsert)
        .select();

      if (insertError) throw insertError;

      const { error: upsertError } = await supabase
        .from('scraper_status')
        .upsert({
          platform,
          status: 'completed',
          last_run: new Date().toISOString(),
          last_success: new Date().toISOString(),
          error_message: null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'platform'
        });

      if (upsertError) throw upsertError;

      return new Response(JSON.stringify({
        success: true,
        count: insertedData.length,
        message: `成功抓取 ${platform} 平台 ${insertedData.length} 条数据`,
        data: insertedData
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (pathname === '/xiaohongshu/videos' && req.method === 'POST') {
      const body = await req.json();
      const { type = 'hot', count = 20 } = body;

      const videos = generateXiaohongshuVideos(count);

      let filteredVideos = videos;
      if (type === 'hot') {
        filteredVideos = videos.filter(v => v.is_hot);
      } else if (type === 'trending') {
        filteredVideos = videos.filter(v => v.engagement_rate > 10);
      }

      const { data: insertedData, error: insertError } = await supabase
        .from('video_collection')
        .insert(filteredVideos)
        .select();

      if (insertError) throw insertError;

      const { error: statusError } = await supabase
        .from('scraper_status')
        .upsert({
          platform: 'xiaohongshu',
          status: 'completed',
          last_run: new Date().toISOString(),
          last_success: new Date().toISOString(),
          error_message: null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'platform'
        });

      if (statusError) throw statusError;

      const stats = {
        totalVideos: insertedData.length,
        hotVideos: insertedData.filter((v: any) => v.is_hot).length,
        avgLikes: Math.floor(insertedData.reduce((sum: number, v: any) => sum + (v.like_count || 0), 0) / insertedData.length),
        avgEngagement: (insertedData.reduce((sum: number, v: any) => sum + parseFloat(v.engagement_rate || 0), 0) / insertedData.length).toFixed(2)
      };

      return new Response(JSON.stringify({
        success: true,
        count: insertedData.length,
        message: `成功抓取小红书视频 ${insertedData.length} 条`,
        stats,
        data: insertedData.slice(0, 10).map((v: any) => ({
          id: v.id,
          video_id: v.video_id,
          title: v.title,
          author: v.author,
          like_count: v.like_count,
          comment_count: v.comment_count,
          collect_count: v.collect_count,
          view_count: v.view_count,
          engagement_rate: v.engagement_rate,
          heat_score: v.heat_score,
          is_hot: v.is_hot
        }))
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (pathname === '/xiaohongshu/videos' && req.method === 'GET') {
      const url = new URL(req.url);
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
        count: data.length,
        data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (pathname === '/status' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('scraper_status')
        .select('*');

      if (error) throw error;

      const platforms = ['douyin', 'weibo', 'baidu', 'toutiao'];
      const statusMap: any = {};

      (data || []).forEach((item: any) => {
        statusMap[item.platform] = item;
      });

      const result = platforms.map(platform => ({
        platform,
        platformName: {
          douyin: '抖音',
          weibo: '微博',
          baidu: '百度',
          toutiao: '今日头条'
        }[platform],
        lastUpdate: statusMap[platform]?.last_run || null,
        count: 0,
        status: statusMap[platform]?.status || 'not_started'
      }));

      return new Response(JSON.stringify({
        success: true,
        data: result
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
