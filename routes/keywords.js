import express from 'express';
import { supabase } from '../utils/supabase.js';

const router = express.Router();

export function createKeywordsRouter() {
  router.get('/', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('keywords')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.json({
        success: true,
        data: data || [],
        total: data?.length || 0
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取关键词列表失败',
        error: error.message
      });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const { keyword, category } = req.body;

      if (!keyword) {
        return res.status(400).json({
          success: false,
          message: '关键词不能为空'
        });
      }

      const { data: existing } = await supabase
        .from('keywords')
        .select('id')
        .eq('keyword', keyword)
        .maybeSingle();

      if (existing) {
        return res.status(400).json({
          success: false,
          message: '关键词已存在'
        });
      }

      const { data, error } = await supabase
        .from('keywords')
        .insert({
          keyword,
          category: category || '未分类',
          enabled: true
        })
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        message: '关键词添加成功',
        data
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '添加关键词失败',
        error: error.message
      });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('keywords')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.json({
        success: true,
        message: '关键词删除成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '删除关键词失败',
        error: error.message
      });
    }
  });

  return router;
}
