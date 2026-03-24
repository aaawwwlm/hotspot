import express from 'express';
import { supabase } from '../utils/supabase.js';

const router = express.Router();

export function createCollectionRouter() {
  router.get('/', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('video_collection')
        .select('*')
        .order('collected_at', { ascending: false });

      if (error) throw error;

      res.json({
        success: true,
        data: data || [],
        total: data?.length || 0
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取收藏列表失败',
        error: error.message
      });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const { title, description, video_url, platform, author, tags } = req.body;

      if (!title || !video_url) {
        return res.status(400).json({
          success: false,
          message: '标题和视频URL不能为空'
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

      res.json({
        success: true,
        message: '收藏成功',
        data
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '收藏失败',
        error: error.message
      });
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const { data, error } = await supabase
        .from('video_collection')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        message: '更新成功',
        data
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '更新失败',
        error: error.message
      });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('video_collection')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.json({
        success: true,
        message: '删除成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '删除失败',
        error: error.message
      });
    }
  });

  return router;
}
