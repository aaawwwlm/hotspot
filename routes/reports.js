import express from 'express';
import { supabase } from '../utils/supabase.js';

const router = express.Router();

export function createReportsRouter() {
  router.get('/', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

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

      res.json({
        success: true,
        data: data || [],
        total: data?.length || 0
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取报告列表失败',
        error: error.message
      });
    }
  });

  router.post('/generate', async (req, res) => {
    try {
      const { data: foodData, error } = await supabase
        .from('hotspot_food')
        .select('*')
        .order('heat', { ascending: false });

      if (error) throw error;

      if (!foodData || foodData.length === 0) {
        return res.status(400).json({
          success: false,
          message: '没有美食热点数据，请先进行分析'
        });
      }

      const today = new Date().toISOString().split('T')[0];

      const topHotspots = foodData.slice(0, 10);

      const categoryStats = {};
      const stageStats = {};

      foodData.forEach(item => {
        categoryStats[item.category] = (categoryStats[item.category] || 0) + 1;
        stageStats[item.stage] = (stageStats[item.stage] || 0) + 1;
      });

      const recommendations = foodData
        .filter(item => item.stage === '爆发期' || item.stage === '萌芽期')
        .slice(0, 5)
        .map(item => ({
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

      res.json({
        success: true,
        message: '报告生成成功',
        data: report
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '生成报告失败',
        error: error.message
      });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({
          success: false,
          message: '报告不存在'
        });
      }

      res.json({
        success: true,
        data
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取报告详情失败',
        error: error.message
      });
    }
  });

  return router;
}
