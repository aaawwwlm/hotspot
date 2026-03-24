import express from 'express';
import { supabase } from '../utils/supabase.js';

const router = express.Router();

export function createHotspotsRouter() {
  router.get('/raw', async (req, res) => {
    try {
      const { platform = 'all', limit = 50 } = req.query;

      let query = supabase
        .from('hotspot_raw')
        .select('*')
        .order('collected_at', { ascending: false });

      if (platform !== 'all') {
        query = query.eq('platform', platform);
      }

      const limitNum = parseInt(limit);
      query = query.limit(limitNum);

      const { data, error, count } = await query;

      if (error) throw error;

      res.json({
        success: true,
        data: data || [],
        total: count || data?.length || 0,
        filtered: data?.length || 0
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取原始热搜数据失败',
        error: error.message
      });
    }
  });

  router.get('/food', async (req, res) => {
    try {
      const {
        platform = 'all',
        stage = 'all',
        category = 'all',
        sort = 'heat',
        limit = 20
      } = req.query;

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

      const limitNum = parseInt(limit);
      query = query.limit(limitNum);

      const { data, error } = await query;

      if (error) throw error;

      res.json({
        success: true,
        data: data || [],
        total: data?.length || 0,
        filtered: data?.length || 0
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取美食热点数据失败',
        error: error.message
      });
    }
  });

  return router;
}
