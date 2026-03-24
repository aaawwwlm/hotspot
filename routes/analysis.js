import express from 'express';
import { supabase } from '../utils/supabase.js';
import { filterFoodContent } from '../utils/foodAnalyzer.js';

const router = express.Router();

export function createAnalysisRouter() {
  router.post('/run', async (req, res) => {
    try {
      const { data: rawData, error } = await supabase
        .from('hotspot_raw')
        .select('*')
        .order('collected_at', { ascending: false });

      if (error) throw error;

      if (!rawData || rawData.length === 0) {
        return res.status(400).json({
          success: false,
          message: '没有原始数据可供分析，请先抓取数据'
        });
      }

      const foodData = filterFoodContent(rawData, 60);

      const dataToInsert = foodData.map(item => ({
        platform: item.platform,
        topic: item.title,
        heat: item.heat,
        category: item.category,
        stage: item.stage,
        keywords: item.keywords || [],
        collected_at: new Date().toISOString()
      }));

      const { data: insertedData, error: insertError } = await supabase
        .from('hotspot_food')
        .insert(dataToInsert)
        .select();

      if (insertError) throw insertError;

      res.json({
        success: true,
        message: `分析完成，识别出 ${insertedData.length} 条美食相关热点`,
        rawCount: rawData.length,
        foodCount: insertedData.length,
        filterRate: ((insertedData.length / rawData.length) * 100).toFixed(2) + '%'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'AI分析失败',
        error: error.message
      });
    }
  });

  router.get('/stats', async (req, res) => {
    try {
      const { data: foodData, error } = await supabase
        .from('hotspot_food')
        .select('*');

      if (error) throw error;

      const stats = {
        total: foodData?.length || 0,
        byPlatform: {},
        byCategory: {},
        byStage: {},
        avgHeat: 0,
        avgGrowth: 0
      };

      (foodData || []).forEach(item => {
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

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取统计数据失败',
        error: error.message
      });
    }
  });

  return router;
}
